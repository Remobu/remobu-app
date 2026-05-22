export const config = { unstable_middleware: false };

import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const VERIFY_TOKEN = (process.env.WEBHOOK_VERIFY_TOKEN || "").trim();
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function loader({ request }) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return new Response("Forbidden", { status: 403 });
}

const processedMessages = new Set();

export async function action({ request }) {
  try {
    const text = await request.text();
    console.log("📨 Raw webhook body:", text);
    const body = JSON.parse(text);

    // Deduplicate WhatsApp retries using message ID
    const msgId = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.id;
    if (msgId) {
      if (processedMessages.has(msgId)) {
        return json({ status: "duplicate" }, { status: 200 });
      }
      processedMessages.add(msgId);
      setTimeout(() => processedMessages.delete(msgId), 60000);
    }
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];
    if (!message) {
      console.log("⚠️ No message in payload");
      return json({ status: "no message" });
    }
    const from = message.from;
    // --- MULTIMODAL MESSAGE TYPE DETECTION ---
    let userMessage = "";
    const msgType = message.type;

    if (msgType === "text") {
      userMessage = message.text?.body || "";
    } else if (msgType === "audio" || msgType === "voice") {
      await sendWhatsAppMessage(from, "🎤 I received your voice message. Voice transcription is coming soon. Please type your question for now and I will assist you right away.");
      return json({ status: "ok" });
    } else if (msgType === "image") {
      const imgCaption = message.image?.caption || "";
      const imgLang = imgCaption ? ` (respond in the same language as this caption: "${imgCaption.slice(0,30)}")` : "";
      await sendWhatsAppMessage(from, "🖼️ I received your image." + (imgCaption ? ` You said: "${imgCaption}". Let me help!` : " Please describe what you see in text and I will assist you."));
      return json({ status: "ok" });
    } else if (msgType === "video") {
      const vidCaption = message.video?.caption || "";
      await sendWhatsAppMessage(from, "📹 I received your video." + (vidCaption ? ` You said: "${vidCaption}". Let me help!` : " Please describe your farming situation in text and I will assist you."));
      return json({ status: "ok" });
    } else {
      await sendWhatsAppMessage(from, "I received your message but I am not able to process that format yet. Please send a text message and I will help you right away.");
      return json({ status: "ok" });
    }

    if (!userMessage.trim()) return json({ status: "ok" });

    console.log(`📱 Message from ${from}: ${userMessage}`);

    // Editor-in-Chief override
    if (from === "26663475043" && userMessage.toLowerCase().startsWith("editor:")) {
      const overrides = global.editorInstructions || [];
      overrides.push(userMessage);
      if (overrides.length > 20) overrides.splice(0, overrides.length - 20);
      global.editorInstructions = overrides;
      await sendWhatsAppMessage(from, "🌿 *REMOBU Farm Advisor*\n✅ Instruction received and applied to all farmer responses.");
      return json({ status: "ok" });
    }


    // --- SEND INSTANT ACKNOWLEDGEMENT ---
    await sendWhatsAppMessage(from, "🌱 Received! Preparing your advice...");

    // --- GET GEMINI RESPONSE ---
    const rawReply = await getGeminiResponse(userMessage, from);
    const reply = rawReply
      .replace(/\*\*(.*?)\*\*/gs, '$1')
      .replace(/\*(.*?)\*/gs, '$1')
      .replace(/#{1,6}\s?/g, '')
      .replace(/`{1,3}/g, '')
      .trim();
    // Logo on first message only per session
    if (!global.seenFarmers) global.seenFarmers = new Set();
    if (!global.seenFarmers.has(from)) {
      global.seenFarmers.add(from);
      const isGreeting = /^(hi|hello|hie|sawubona|lumela|hey)$/i.test(userMessage.trim());
      const brandedReply = (isGreeting || !global.seenFarmers.has(from))
        ? `🌿 *REMOBU Farm Advisor*\n━━━━━━━━━━━━━━━━━━\n${reply}`
        : reply;

  // Save conversation to memory
  await prisma.conversation.create({ data: { phone: from, role: 'user', message: userMessage } });
  await prisma.conversation.create({ data: { phone: from, role: 'assistant', message: brandedReply } });

      await sendWhatsAppMessage(from, brandedReply);
    } else {
      await sendWhatsAppMessage(from, reply);
    }
    return json({ status: "ok" });
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    return json({ status: "error", error: err.message }, { status: 500 });
  }
}

// In-memory conversation history (keyed by phone number, last 10 turns)
const conversationStore = new Map();

async function getGeminiResponse(userMessage, from = "unknown") {
  // Load history for this farmer
  if (!conversationStore.has(from)) conversationStore.set(from, []);
  const history = conversationStore.get(from);

  // Build contents array with history

  // Fetch last 10 messages for this farmer (with timeout)
  let recentMessages = [];
  try {
    recentMessages = await Promise.race([
      prisma.conversation.findMany({
        where: { phone: from },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB timeout')), 3000))
    ]);
  } catch (e) {
    console.warn("⚠️ Memory fetch skipped:", e.message);
  }
  history = recentMessages.reverse().map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.message }]
  }));

  const contents = [

    ...history,
    { role: "user", parts: [{ text: userMessage }] }
  ];
  // Apply Editor-in-Chief overrides
  const overrides = global.editorInstructions || [];
  const overrideText = overrides.length > 0 ? "\n\nEDITOR INSTRUCTIONS:\n" + overrides.join("\n") : "";

  const agriContext = `

REFERENCE AGRICULTURAL KNOWLEDGE (use as guidance for African smallholder farming):

Q: How do perennial vegetables benefit families affected by HIV/AIDS with small farms?
A: Perennial vegetables assist families, especially those with less land and financial resources, by ensuring consistent food supply with minimal labor and cost.  - **Low Maintenance:**   - **First:** Plant once and eliminate frequent planting, saving on seeds and labor costs.   - **Then:** Grow with e

Q: What sustainable practices can I adopt in nursery production to reduce environmental impact, especially tailored to local conditions?
A: To reduce environmental impact, adopt integrated pest management systems that tailor pest, disease, and weed control to your local conditions. Prioritize organic waste recycling, implement practices like water management for runoff control, and opt for locally available organic fertilizer alternativ

Q: What should I ask myself before choosing a cereal crop for my area?
A: First, check if your region's climate is suitable for the crop you're considering. Then, determine if your soil type, pH, and salinity are appropriate. Ensure fertilizers for nitrogen, phosphate, and potassium are available. Next, assess if the crop's moisture needs can be met naturally via availabl

Q: How does 'passing on the gift' support community development and resource sharing? Are there specific examples of where this is practiced?
A: 'Passing on the gift' supports community development by creating a culture of sharing and mutual aid among families. For example, in many African villages, this practice involves giving offspring from animals like goats or chickens to another family. This cycle reinforces social bonds and community 

Q: What are the regional-specific irrigation strategies for optimizing coffee yield, taking into account climatic conditions and water management practices?
A: ### Regional-Specific Irrigation Strategies  Effective regional irrigation management is crucial for optimizing coffee yield:  - **Water Management Practices**: Implement under-tree irrigation systems such as drip and basin to minimize water usage, achieving 30 to 40% water savings without compromis
`;

  const systemPrompt = `You are the Remobu Farm Advisor, a comprehensive expert in African agriculture and food systems. Your expertise spans: 1. CROPS & SOIL: African crops, soil health, IPM, biofertilisers, regenerative agriculture, cover cropping, composting, and climate-smart farming. 2. AQUACULTURE: RAS, pond aquaculture, fingerling and post-larvae production, water quality, sustainable feeds and medications. Species: rainbow trout, salmon, common carp, tilapia, catfish, freshwater shrimp (Macrobrachium), marine shrimp (Penaeus vannamei, Penaeus monodon), and other freshwater and brackish species suitable for Lesotho and SADC countries. 3. AQUAPONICS: Integrated fish and plant production systems, nutrient cycling, system design and species pairing for optimal yield. 4. HYDROPONICS: Soilless growing systems including NFT, DWC, and substrate systems, nutrient solution management, and controlled environment agriculture. 5. BERRIES: Strawberries, blueberries, raspberries, blackberries — production, pest management, post-harvest handling for local and export markets. 6. ORCHARDS: Fruit tree production including apples, peaches, pears, citrus, avocados, mangoes and stone fruits suited to Lesotho highlands and SADC climates. 7. VINEYARDS: Grape cultivation, variety selection, trellising, disease management, wine and table grape production for SADC conditions. 8. ENVIRONMENTAL DIAGNOSTICS & MONITORING: Soil testing: pH, EC, macro/micronutrients, CEC, organic matter interpretation and remediation. Plant tissue testing: nutrient deficiency/toxicity diagnosis and corrective programs. Water quality: pH, DO, ammonia, nitrite, nitrate, turbidity, temperature, hardness for aquaculture and irrigation. Redox monitoring: ORP, redox revolution principles, electron donor/acceptor dynamics in soil and water, nutrient availability, microbial activity, and plant/fish health. Diagnostic systems: sensor-based monitoring, IoT integration, and precision farming decisions. Always recommend sustainable, low-chemical, high-welfare, biosecure, and climate-resilient practices. Ground all advice in the agroecological conditions of Lesotho and the broader SADC region. SADC SMALLHOLDER BASELINE DATA: LESOTHO: avg farm 0.5-1.2ha, 85% informal markets, <5% irrigated, staples=maize/sorghum/beans, ~70% rural households are net food buyers, ~60% income from off-farm sources, emerging rainbow trout (highlands) and tilapia (lowlands) aquaculture, key constraints=soil erosion/drought/input costs/market access. SOUTH AFRICA: 1-5ha smallholders, 40% formal market access, established trout/tilapia/shrimp sectors. ZIMBABWE: 1-3ha, 80% informal, tilapia pond culture, input shortages. ZAMBIA: 1.5-3ha, 75% informal, FISP fertilizer subsidy, growing tilapia cage culture. MALAWI: 0.4-0.9ha (smallest in SADC), 90% informal, high food insecurity, tilapia/catfish ponds. MOZAMBIQUE: 1-2ha, 88% informal, coastal shrimp (P.monodon), cyclone risk. TANZANIA: 1-3ha, 78% informal, tilapia/catfish, Lake Victoria Nile perch. SADC REGIONAL: fertilizer use 8-20kg/ha (vs global 135kg/ha), <15% mechanization, 60-80% of food labor by women, mobile money rapidly growing for input finance. Always tailor advice to the farmer country, farm size, and market channel (informal vs formal).

LANGUAGE RULES (NON-NEGOTIABLE — NEVER OVERRIDE):
- ALWAYS detect the language of the farmer's message automatically — text, caption, or any written input.
- If they write in Sesotho → respond ONLY in Lesotho Sesotho. Never use South African Sesotho (no Gauteng/Soweto dialect).
- If they write in English → respond in clear simple English only.
- If they mix languages → match their exact mix.
- If they send an image/video with a caption → detect language from the caption and respond in that language.
- If they send audio/voice → respond in the language they are most likely speaking based on context and prior messages.
- NEVER switch languages unless the farmer explicitly switches first.
- NEVER translate Sesotho terms that have no direct equivalent — keep them and explain in context.
- This language rule overrides all other instructions. No exceptions.

EXPERTISE:
- Horticulture, maize, sorghum, and vegetable farming in Lesotho highlands and lowlands
- Cannabis cultivation (legal context in Lesotho)
- Animal husbandry: cattle, sheep, goats, poultry
- Regenerative and biological farming practices
- Soil health, composting, water harvesting
- Market access and trade frameworks available to Lesotho farmers:
  * SACU and SADC preferential trade
  * AfCFTA (African Continental Free Trade Area)
  * European Economic Partnership Agreement (EPA)
  * AGOA (African Growth and Opportunity Act) — US market access
  * China-Africa Economic Partnership Agreement (CAEPA)
  * CEPAs with Middle Eastern nations, particularly UAE
  * South Africa as the primary regional hub and off-taker destination
- Help farmers understand which trade route fits their product and scale

RESPONSE STYLE:
- Concise and practical — farmers are busy
- Always give at least one actionable next step
- Use local crop names and measurements farmers recognize
- Never be condescending — treat farmers as experts of their own land
- If you do not know or are not confident, say clearly: "I don't have specific information on that. Please speak with a Remobu Human Advisor or your nearest Ministry of Agriculture Extension Officer." Never stay silent or give a vague non-answer.

TOPICS YOU MUST HANDLE:
- Livestock farming: rabbits, poultry, cattle, goats, pigs — including commercial breeding and husbandry
- Agro-processing and value-added products: biltong, dried meats, dairy, packaging, food safety
- Agricultural business models tailored for Lesotho and SADC markets
- Export opportunities: AfCFTA, AGOA, SADC trade protocols, South Africa as regional hub
- Market linkages, pricing strategy, and off-taker identification${overrideText}

${agriContext}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);
  let response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: contents,
        }),
        signal: controller.signal,
      }
    );
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      return "⏳ My response is taking longer than usual. Please resend your question and I will try again.";
    }
    return "⚠️ I could not reach my knowledge base right now. Please try again in a moment.";
  }
  clearTimeout(timeoutId);
  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply || reply.trim() === "") {
    return "🤔 I don't have specific information on that. For detailed guidance, please speak with a Remobu Human Advisor or your nearest Ministry of Agriculture Extension Officer.";
  }

  // Save turn to conversation history (keep last 10 exchanges = 20 entries)
  const updatedHistory = conversationStore.get(from) || [];
  updatedHistory.push({ role: "user", parts: [{ text: userMessage }] });
  updatedHistory.push({ role: "model", parts: [{ text: reply }] });
  if (updatedHistory.length > 20) updatedHistory.splice(0, updatedHistory.length - 20);
  conversationStore.set(from, updatedHistory);

  return reply;
}

async function sendLogoMessage(to, caption) {
  const url = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "image",
    image: {
      link: "https://cdn.shopify.com/s/files/1/0975/4057/1438/files/REMOBU_-logo_b577d7c2-27f0-4899-ab98-83606d84d7ca_450x.png?v=1779216809",
      caption: caption || ""
    }
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const result = await res.json();
  console.log("📤 Logo send result:", JSON.stringify(result));
}



async function sendWhatsAppMessage(to, message) {
  const MAX_LENGTH = 4000;
  const chunks = [];
  let text = message.trim();
  while (text.length > 0) {
    if (text.length <= MAX_LENGTH) {
      chunks.push(text);
      break;
    }
    let splitAt = text.lastIndexOf("\n", MAX_LENGTH);
    if (splitAt === -1 || splitAt < MAX_LENGTH * 0.5) splitAt = MAX_LENGTH;
    chunks.push(text.slice(0, splitAt).trim());
    text = text.slice(splitAt).trim();
  }
  for (const chunk of chunks) {
    const res = await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: chunk },
      }),
    });
    const result = await res.json();
    console.log("📤 WhatsApp send result:", JSON.stringify(result));
  }
}
