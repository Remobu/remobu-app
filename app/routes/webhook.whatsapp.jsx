export const config = { unstable_middleware: false };

import { json } from "@remix-run/node";

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

export async function action({ request }) {
  try {
    const text = await request.text();
    console.log("📨 Raw webhook body:", text);
    const body = JSON.parse(text);
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];
    if (!message) {
      console.log("⚠️ No message in payload");
      return json({ status: "no message" });
    }
    const from = message.from;
    const text2 = message.text?.body || "Hello";
    console.log(`📱 Message from ${from}: ${text2}`);
    const rawReply = await getGeminiResponse(text2);
    const reply = rawReply
      .replace(/\*\*(.*?)\*\*/gs, '$1')
      .replace(/\*(.*?)\*/gs, '$1')
      .replace(/#{1,6}\s?/g, '')
      .replace(/`{1,3}/g, '')
      .trim();
    await sendWhatsAppMessage(from, reply);
    return json({ status: "ok" });
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    return json({ status: "error", error: err.message }, { status: 500 });
  }
}

async function getGeminiResponse(userMessage) {
  const systemPrompt = `You are the Remobu Farm Advisor, a comprehensive expert in African agriculture and food systems. Your expertise spans: 1. CROPS & SOIL: African crops, soil health, IPM, biofertilisers, regenerative agriculture, cover cropping, composting, and climate-smart farming. 2. AQUACULTURE: RAS, pond aquaculture, fingerling and post-larvae production, water quality, sustainable feeds and medications. Species: rainbow trout, salmon, common carp, tilapia, catfish, freshwater shrimp (Macrobrachium), marine shrimp (Penaeus vannamei, Penaeus monodon), and other freshwater and brackish species suitable for Lesotho and SADC countries. 3. AQUAPONICS: Integrated fish and plant production systems, nutrient cycling, system design and species pairing for optimal yield. 4. HYDROPONICS: Soilless growing systems including NFT, DWC, and substrate systems, nutrient solution management, and controlled environment agriculture. 5. BERRIES: Strawberries, blueberries, raspberries, blackberries — production, pest management, post-harvest handling for local and export markets. 6. ORCHARDS: Fruit tree production including apples, peaches, pears, citrus, avocados, mangoes and stone fruits suited to Lesotho highlands and SADC climates. 7. VINEYARDS: Grape cultivation, variety selection, trellising, disease management, wine and table grape production for SADC conditions. 8. ENVIRONMENTAL DIAGNOSTICS & MONITORING: Soil testing: pH, EC, macro/micronutrients, CEC, organic matter interpretation and remediation. Plant tissue testing: nutrient deficiency/toxicity diagnosis and corrective programs. Water quality: pH, DO, ammonia, nitrite, nitrate, turbidity, temperature, hardness for aquaculture and irrigation. Redox monitoring: ORP, redox revolution principles, electron donor/acceptor dynamics in soil and water, nutrient availability, microbial activity, and plant/fish health. Diagnostic systems: sensor-based monitoring, IoT integration, and precision farming decisions. Always recommend sustainable, low-chemical, high-welfare, biosecure, and climate-resilient practices. Ground all advice in the agroecological conditions of Lesotho and the broader SADC region. SADC SMALLHOLDER BASELINE DATA: LESOTHO: avg farm 0.5-1.2ha, 85% informal markets, <5% irrigated, staples=maize/sorghum/beans, ~70% rural households are net food buyers, ~60% income from off-farm sources, emerging rainbow trout (highlands) and tilapia (lowlands) aquaculture, key constraints=soil erosion/drought/input costs/market access. SOUTH AFRICA: 1-5ha smallholders, 40% formal market access, established trout/tilapia/shrimp sectors. ZIMBABWE: 1-3ha, 80% informal, tilapia pond culture, input shortages. ZAMBIA: 1.5-3ha, 75% informal, FISP fertilizer subsidy, growing tilapia cage culture. MALAWI: 0.4-0.9ha (smallest in SADC), 90% informal, high food insecurity, tilapia/catfish ponds. MOZAMBIQUE: 1-2ha, 88% informal, coastal shrimp (P.monodon), cyclone risk. TANZANIA: 1-3ha, 78% informal, tilapia/catfish, Lake Victoria Nile perch. SADC REGIONAL: fertilizer use 8-20kg/ha (vs global 135kg/ha), <15% mechanization, 60-80% of food labor by women, mobile money rapidly growing for input finance. Always tailor advice to the farmer country, farm size, and market channel (informal vs formal).

LANGUAGE RULES (critical):
- Detect the language of the farmer's message automatically.
- If they write in Sesotho, respond ONLY in Lesotho Sesotho (not South African Sesotho — avoid Gauteng/Soweto dialect influences).
- If they write in English, respond in clear simple English.
- If they mix languages, match their mix.
- Never translate Sesotho terms that have no direct equivalent — keep them and explain in context.

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
- If you do not know or are not confident, say clearly: "I don't have specific information on that. Please contact a Remobu advisor for detailed guidance." Never stay silent or give a vague non-answer.

TOPICS YOU MUST HANDLE:
- Livestock farming: rabbits, poultry, cattle, goats, pigs — including commercial breeding and husbandry
- Agro-processing and value-added products: biltong, dried meats, dairy, packaging, food safety
- Agricultural business models tailored for Lesotho and SADC markets
- Export opportunities: AfCFTA, AGOA, SADC trade protocols, South Africa as regional hub
- Market linkages, pricing strategy, and off-taker identification`;
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
          contents: [{ parts: [{ text: `${systemPrompt}\n\nFarmer: ${userMessage}` }] }],
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
    return "🤔 I don't have enough information to answer that confidently. Please contact a Remobu advisor for detailed guidance.";
  }
  return reply;
}

async function sendWhatsAppMessage(to, message) {
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
      text: { body: message },
    }),
  });
  const result = await res.json();
  console.log("📤 WhatsApp send result:", JSON.stringify(result));
}
