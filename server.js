import express from "express";
import { createRequestHandler } from "@remix-run/express";
import { installGlobals } from "@remix-run/node";

installGlobals();

const app = express();

const VERIFY_TOKEN = (process.env.WEBHOOK_VERIFY_TOKEN || "").trim();
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// GET - Webhook verification
app.get("/webhook/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  console.log("🔔 Webhook verify:", { mode, token, match: token === VERIFY_TOKEN });
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// POST - Incoming WhatsApp messages (raw body, no express.json() middleware)
app.post("/webhook/whatsapp", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const body = JSON.parse(req.body.toString());
    console.log("📨 Webhook POST received:", JSON.stringify(body));
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];
    if (!message) {
      console.log("⚠️ No message in payload");
      return res.json({ status: "no message" });
    }
    const from = message.from;
    const text = message.text?.body || "Hello";
    console.log(`📱 Message from ${from}: ${text}`);
    const reply = await getGeminiResponse(text);
    await sendWhatsAppMessage(from, reply);
    res.json({ status: "ok" });
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    res.status(500).json({ status: "error", error: err.message });
  }
});

app.get("/debug/token", (req, res) => {
  res.json({ WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN || "NOT SET" });
});

app.use(express.json());
const build = await import("./build/server/index.js");
app.all("*", createRequestHandler({ build }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🌱 REMOBU on port ${port}`));

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
