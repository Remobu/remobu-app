import express from "express";

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ✅ WhatsApp webhook FIRST
app.get("/webhook/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  console.log("🔔 Verify:", { mode, token, challenge, VERIFY_TOKEN });
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Verified!");
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

app.post("/webhook/whatsapp", async (req, res) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return res.json({ status: "no message" });
    const from = message.from;
    const text = message.text?.body || "Hello";
    console.log(`📱 From ${from}: ${text}`);
    const reply = await getGeminiResponse(text);
    await sendWhatsAppMessage(from, reply);
    res.json({ status: "ok" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ status: "error" });
  }
});

// ✅ Remix loaded lazily AFTER webhook routes
const { createRequestHandler } = await import("@remix-run/express");
const build = await import("./build/server/index.js");
app.all("*", createRequestHandler({ build }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌱 REMOBU running on port ${PORT}`));

async function getGeminiResponse(userMessage) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `You are REMOBU Farm Advisor for Lesotho/SADC farmers. Be concise and practical. Respond in farmer's language.\n\nFarmer: ${userMessage}` }] }],
      }),
    }
  );
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Please try again.";
}

async function sendWhatsAppMessage(to, message) {
  await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${WHATSAPP_TOKEN}` },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: message } }),
  });
}
