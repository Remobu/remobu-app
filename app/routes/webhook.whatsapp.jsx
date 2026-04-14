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
    const reply = await getGeminiResponse(text2);
    await sendWhatsAppMessage(from, reply);
    return json({ status: "ok" });
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    return json({ status: "error", error: err.message }, { status: 500 });
  }
}

async function getGeminiResponse(userMessage) {
  const systemPrompt = `You are REMOBU Farm Advisor, an expert agricultural assistant serving farmers in Lesotho and the SADC region. 
You specialize in horticulture, cannabis cultivation, animal husbandry, regenerative farming, and SACU trade.
Respond in the same language the farmer uses (Sesotho or English).
Keep responses concise and practical for smallholder farmers.
Always provide actionable advice.`;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\nFarmer: ${userMessage}` }] }],
      }),
    }
  );
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "I could not process your request. Please try again.";
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
