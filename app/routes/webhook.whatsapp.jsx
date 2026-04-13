import { json } from "@remix-run/node";

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Webhook verification
export async function loader({ request }) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified!");
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// Receive messages
export async function action({ request }) {
  const body = await request.json();

  try {
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message) return json({ status: "no message" });

    const from = message.from;
    const text = message.text?.body || "Hello";

    console.log(`📱 Message from ${from}: ${text}`);

    // Get Gemini response
    const reply = await getGeminiResponse(text);

    // Send reply via WhatsApp
    await sendWhatsAppMessage(from, reply);

    return json({ status: "ok" });
  } catch (err) {
    console.error("Webhook error:", err);
    return json({ status: "error" }, { status: 500 });
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
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I could not process your request. Please try again.";
}

async function sendWhatsAppMessage(to, message) {
  await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
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
}
