export const config = { unstable_middleware: false };

import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const conversationStore = new Map();
const processedMessages = new Set();

// RAG: Find most relevant agri Q&A pairs for a query
async function getRelevantContext(query, apiKey) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { parts: [{ text: query }] } }),
        signal: controller.signal
      }
    );
    clearTimeout(timeout);
    const data = await res.json();
    if (!data.embedding) return '';
    const vec = `[${data.embedding.values.join(',')}]`;
    const results = await prisma.$queryRawUnsafe(
      `SELECT question, answer FROM "AgriEmbedding" ORDER BY embedding <-> '${vec}'::vector LIMIT 5`
    );
    return results.map(r => `Q: ${r.question}\nA: ${r.answer}`).join('\n\n');
  } catch (e) {
    console.warn('⚠️ RAG failed:', e.message);
    return '';
  }
}


// RAG: Find most relevant agri Q&A pairs for a query

async function getGeminiResponse(userMessage, from = "unknown") {
  // Load history for this farmer
  if (!conversationStore.has(from)) conversationStore.set(from, []);
  let history = conversationStore.get(from);

  // Build contents array with history

  // Fetch conversation history (non-blocking, falls back to empty)
  let recentMessages = [];
  try {
    recentMessages = await Promise.race([
      prisma.conversation.findMany({
        where: { phone: from },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB timeout')), 2000))
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
  // Editor-in-Chief override: "editor: [instruction]"
  if (typeof incomingMsg === 'string' && incomingMsg.toLowerCase().startsWith('editor:')) {
    const instruction = incomingMsg.slice(7).trim();
    if (!global.editorInstructions) global.editorInstructions = [];
    global.editorInstructions.push(instruction);
    // Keep only last 10 instructions
    if (global.editorInstructions.length > 10) global.editorInstructions.shift();
    await sendWhatsAppMessage(from, `✅ Editor instruction saved: "${instruction}"
Active instructions: ${global.editorInstructions.length}`);
    return new Response('OK', { status: 200 });
  }

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

  const ragContext = await getRelevantContext(userMessage, GEMINI_API_KEY);
  const ragSection = ragContext ? `\n\nRELEVANT KNOWLEDGE BASE:\n${ragContext}` : '';

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
- NEVER use asterisks (*) or bullet symbols in responses. Use plain numbered lists only. No exceptions.
- Always start English responses with "Hello Fellow Farmer,"
- Always start Sesotho responses with "Khotso Sehoai-sa-haeso!"

TOPICS YOU MUST HANDLE:
- Livestock farming: rabbits, poultry, cattle, goats, pigs — including commercial breeding and husbandry
- Agro-processing and value-added products: biltong, dried meats, dairy, packaging, food safety
- Agricultural business models tailored for Lesotho and SADC markets
- Export opportunities: AfCFTA, AGOA, SADC trade protocols, South Africa as regional hub
- Market linkages, pricing strategy, and off-taker identification${overrideText}

${agriContext}${ragSection}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55000);
  let response;
  console.log("🤖 Calling Gemini API...");
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
    type: "sticker",
    sticker: {
      link: "https://cdn.shopify.com/s/files/1/0975/4057/1438/files/Remobu_Logo.jpg?v=1778694454",
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


// Download image from WhatsApp and analyse with Gemini Vision
async function analyseImageWithGemini(imageId, from) {
  try {
    // Step 1: Get media URL from WhatsApp Graph API
    const metaRes = await fetch(`https://graph.facebook.com/v19.0/${imageId}`, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'User-Agent': 'curl/7.68.0'
      }
    });
    const metaData = await metaRes.json();
    console.log("IMAGE_META:", JSON.stringify(metaData));
    const imageUrl = metaData?.url;
    if (!imageUrl) throw new Error("No image URL: " + JSON.stringify(metaData));

    // Step 2: Download image bytes using Graph API auth
    const imgRes = await fetch(imageUrl, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'User-Agent': 'curl/7.68.0'
      }
    });
    if (!imgRes.ok) throw new Error("Image download failed: " + imgRes.status);
    const imgBuffer = await imgRes.arrayBuffer();
    const base64Image = Buffer.from(imgBuffer).toString('base64');
    const mimeType = metaData?.mime_type || imgRes.headers.get('content-type') || 'image/jpeg';
    console.log("IMAGE_SIZE:", imgBuffer.byteLength, "MIME:", mimeType);

    // Step 3: Send to Gemini Vision
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              {
                inline_data: { mime_type: mimeType, data: base64Image }
              },
              {
                text: `You are Remobu Farm Advisor, an expert agricultural advisor for smallholder farmers in Lesotho and southern Africa. Analyse this image carefully and provide:
1. What you see (crop, plant, animal, soil, pest, disease, etc.)
2. Diagnosis — identify any disease, pest, deficiency, or problem visible
3. Severity — mild / moderate / severe
4. Recommended action — specific, practical steps the farmer can take immediately
5. Prevention — how to avoid this in future

Be concise, practical, and use simple language. If the image is not farm-related, politely say so and ask them to send a farm photo.`
              }
            ]
          }],
          generationConfig: { maxOutputTokens: 600 }
        })
      }
    );
    const geminiData = await geminiRes.json();
    return geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "I could not analyse the image. Please try sending a clearer photo.";
  } catch (e) {
    console.error("IMAGE_ANALYSIS_ERROR:", e.message);
    return "Sorry, I had trouble analysing your image. Please try again with a clearer photo.";
  }
}


// Download audio from WhatsApp and transcribe+respond with Gemini
async function analyseAudioWithGemini(audioId, from) {
  try {
    // Step 1: Get audio URL from WhatsApp
    const metaRes = await fetch(`https://graph.facebook.com/v19.0/${audioId}`, {
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, 'User-Agent': 'curl/7.68.0' }
    });
    const metaData = await metaRes.json();
    console.log("AUDIO_META:", JSON.stringify(metaData));
    const audioUrl = metaData?.url;
    if (!audioUrl) throw new Error("No audio URL: " + JSON.stringify(metaData));

    // Step 2: Download audio bytes
    const audioRes = await fetch(audioUrl, {
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, 'User-Agent': 'curl/7.68.0' }
    });
    if (!audioRes.ok) throw new Error("Audio download failed: " + audioRes.status);
    const audioBuffer = await audioRes.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const mimeType = metaData?.mime_type || 'audio/ogg';
    console.log("AUDIO_SIZE:", audioBuffer.byteLength, "MIME:", mimeType);

    // Step 3: Send to Gemini Audio for transcription + farm advice response
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { inline_data: { mime_type: mimeType, data: base64Audio } },
              { text: `You are Remobu Farm Advisor, a practical farming advisor for smallholder farmers in Lesotho. The farmer sent a voice message in Sesotho or English.

Listen carefully and respond ONLY with practical farming advice — no transcription, no headers, no numbering. Just answer their question directly and concisely in the same language they used (Sesotho or English). Maximum 3 short paragraphs.

If the audio is completely unclear, reply only: "Ke kopa u boele u botse potso ea hau ka mongolo." (in Sesotho) or "Please type your question and I will help you right away." (in English).` }
            ]
          }],
          generationConfig: { maxOutputTokens: 600 }
        })
      }
    );
    const geminiData = await geminiRes.json();
    console.log("AUDIO_GEMINI:", JSON.stringify(geminiData).slice(0, 200));
    return geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "I could not understand the voice message. Please type your question and I will assist you right away.";
  } catch (e) {
    console.error("AUDIO_ANALYSIS_ERROR:", e.message);
    return "Sorry, I had trouble processing your voice message. Please type your question and I will assist you immediately.";
  }
}





// Remix loader - handles GET (WhatsApp webhook verification)
export async function loader({ request }) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// Remix action - handles POST (incoming WhatsApp messages)
export async function action({ request }) {
  try {
    const body = await request.json();
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;
    if (!messages || messages.length === 0) {
      return json({ status: "no_message" }, { status: 200 });
    }
    const msg = messages[0];
    const from = msg.from;
    const msgId = msg.id;
    if (processedMessages.has(msgId)) {
      return json({ status: "duplicate" }, { status: 200 });
    }
    processedMessages.add(msgId);
    let userMessage = "";
    if (msg.type === "text") {
      userMessage = msg.text?.body || "";
      // Editor-in-Chief override
      if (userMessage.toLowerCase().startsWith('editor:')) {
        const instruction = userMessage.slice(7).trim();
        if (!global.editorInstructions) global.editorInstructions = [];
        global.editorInstructions.push(instruction);
        if (global.editorInstructions.length > 10) global.editorInstructions.shift();
        const hour = new Date().getHours();
        const greeting = hour < 12 ? "morning" : hour < 17 ? "day" : hour < 21 ? "evening" : "night";
        await sendWhatsAppMessage(from, `Good ${greeting}, Editor. Instruction received: "${instruction}". Active instructions: ${global.editorInstructions.length}`);
        return json({ status: "editor_instruction_saved" }, { status: 200 });
      }
      // --- FREE QUERY COUNTER & PAYWALL ---
      try {
        const userRec = await prisma.user.findUnique({ where: { phone: from }, include: { farmerProfile: true } });
        let farmerRec = userRec?.farmerProfile || null;
        const count = farmerRec?.queryCount || 0;
        const subscribed = farmerRec?.isSubscribed || false;

        if (!subscribed && count >= 50) {
          await sendWhatsAppMessage(from,
            "You have used all 50 free Remobu Advisor queries.\n\n" +
            "To continue, subscribe for M50/month via M-Pesa:\n\n" +
            "1. Open M-Pesa on your phone\n" +
            "2. Select Pay with M-Pesa - Buy Goods and Services\n" +
            "3. Enter Till Number: *50485*\n" +
            "4. Amount: M50\n" +
            "5. Reference: Your WhatsApp number\n\n" +
            "Once paid, send us your M-Pesa confirmation SMS and we will activate your subscription within minutes."
          );
          return json({ status: "paywall_blocked" }, { status: 200 });
        }

        if (!subscribed && count === 39) {
          await sendWhatsAppMessage(from,
            "Heads up: You have used 40 of your 50 free queries.\n\n" +
            "After 50 queries, a M50/month subscription via M-Pesa is required to continue. " +
            "You have 10 free queries remaining."
          );
        } else if (!subscribed && count >= 40 && count < 50) {
          await sendWhatsAppMessage(from,
            `Reminder: You have ${50 - count} free ${50 - count === 1 ? 'query' : 'queries'} remaining.\n\n` +
            "After that, subscribe for M50/month via M-Pesa to continue."
          );
        }

        // Increment counter (fire and forget)
        farmerRec && prisma.farmer.update({ where: { id: farmerRec.id }, data: { queryCount: { increment: 1 } } })
          .catch(e => console.warn('Counter increment failed:', e.message));

      } catch(e) { console.warn('Paywall check failed:', e.message); }
      // --- END PAYWALL ---
    } else if (msg.type === "image") {
      const imageId = msg.image?.id;
      if (!imageId) return json({ status: "no_image_id" }, { status: 200 });
      await sendWhatsAppMessage(from, "📸 Analysing your image... please wait a moment.");
      const diagnosis = await analyseImageWithGemini(imageId, from);
      const clean = diagnosis.replace(/\*+/g, '').trim();
      await sendWhatsAppMessage(from, clean);
      // Save to conversation history
      try {
        await prisma.conversation.createMany({
          data: [
            { phone: from, role: 'user', message: '[Image sent for analysis]' },
            { phone: from, role: 'assistant', message: clean }
          ]
        });
      } catch(e) { console.warn("Conv save skipped:", e.message); }
      return json({ status: "ok" }, { status: 200 });
    } else if (msg.type === "audio") {
      const audioId = msg.audio?.id;
      if (!audioId) return json({ status: "no_audio_id" }, { status: 200 });
      await sendWhatsAppMessage(from, "🎤 Listening to your voice message... please wait a moment.");
      const response = await analyseAudioWithGemini(audioId, from);
      const clean = response.replace(/\*+/g, '').trim();
      await sendWhatsAppMessage(from, clean);
      try {
        await prisma.conversation.createMany({
          data: [
            { phone: from, role: 'user', message: '[Voice message]' },
            { phone: from, role: 'assistant', message: clean }
          ]
        });
      } catch(e) { console.warn("Conv save skipped:", e.message); }
      return json({ status: "ok" }, { status: 200 });
    } else {
      await sendWhatsAppMessage(from, "I can read text messages and analyse photos. Please send a text question or a photo of your crop, plant, or soil.");
      return json({ status: "unsupported_type" }, { status: 200 });
    }
    // Respond immediately, process async
    // Paywall check
    const user = await prisma.user.findUnique({
      where: { phone: from },
      include: { farmerProfile: true }
    });
    const farmer = user?.farmerProfile;
    const isSubscribed = farmer?.isSubscribed && farmer?.subscriptionEnd && new Date() < new Date(farmer.subscriptionEnd);
    const queryCount = farmer?.queryCount ?? 0;
    const freeLimit = farmer?.freeQueryLimit ?? 50;

    if (!isSubscribed && queryCount >= freeLimit) {
      await sendWhatsAppMessage(from, "🔒 You have used all " + freeLimit + " free queries.\n\nTo continue getting farm advice, subscribe for M50/month via M-Pesa.\n\nReply PAY 50 to subscribe now.");
      return;
    }

    // Auto-create user + farmerProfile if first WhatsApp contact
    if (!user) {
      const newUser = await prisma.user.create({
        data: { phone: from, role: "FARMER" }
      });
      await prisma.farmer.create({
        data: { userId: newUser.id, queryCount: 1, freeQueryLimit: 50, walletBalance: 0 }
      });
    } else if (!user.farmerProfile) {
      await prisma.farmer.create({
        data: { userId: user.id, queryCount: 1, freeQueryLimit: 50, walletBalance: 0 }
      });
    } else {
      await prisma.farmer.update({
        where: { userId: user.id },
        data: { queryCount: { increment: 1 } }
      });
    }

    sendWhatsAppMessage(from, "🌱 Remobu Farm Advisor is thinking...").then(() => getGeminiResponse(userMessage, from))
      .then(async reply => {
        // M-Pesa payment trigger
        if (/^(pay|patala|payment|tefiso|lefa)/i.test(userMessage?.trim())) {
          await sendWhatsAppMessage(from, "💳 To make a payment, please reply with:\n\nPAY <amount>\nExample: PAY 50\n\nThis will send an M-Pesa prompt to your phone.");
          return;
        }
        if (/^PAY \d+/i.test(userMessage?.trim())) {
          const amount = parseFloat(userMessage.trim().split(" ")[1]);
          try {
            const res = await fetch(`${process.env.APP_URL}/mpesa`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                phone: from,
                amount,
                reference: "REMOBU-" + Date.now(),
                description: "Remobu Farm Advisor Payment"
              })
            });
            const result = await res.json();
            if (result.ResponseCode === "0") {
              await sendWhatsAppMessage(from, "✅ M-Pesa prompt sent to your phone!\n\nEnter your PIN to complete the payment of M" + amount + ".\n\nReply STATUS to check payment status.");
            } else {
              await sendWhatsAppMessage(from, "❌ Payment request failed. Please try again or contact support.");
            }
          } catch(e) {
            await sendWhatsAppMessage(from, "❌ Payment service unavailable. Please try again later.");
          }
          return;
        }
        if (/^STATUS$/i.test(userMessage?.trim())) {
          await sendWhatsAppMessage(from, "🔍 Checking your latest payment status...\n\nPlease wait a moment and reply STATUS again if needed.");
          return;
        }
        // Strip markdown asterisks for WhatsApp plain text
        const clean = reply.replace(/\*+/g, '').replace(/^[\s]*[-•]\s*/gm, '').trim();
        await sendLogoMessage(from, "Remobu Farm Advisor");
        await sendWhatsAppMessage(from, clean);
      })
      .catch(e => console.error("❌ Handler error:", e.message));
    return json({ status: "ok" }, { status: 200 });
  } catch (e) {
    console.error("❌ Webhook error:", e.message);
    return json({ status: "error" }, { status: 200 });
  }
}
