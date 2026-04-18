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


// ─── MARKETPLACE API ENDPOINTS ───────────────────────────────────────────────

// POST /advisor/register
app.post('/advisor/register', async (req, res) => {
  try {
    const { phone, name, specialization, bio, credentials, consultancyFee, platformFeeModel, monthlyFee, revenueSharePct, payoutMethod, payoutAccount, language } = req.body;
    const user = await prisma.user.upsert({
      where: { phone },
      update: { name, role: 'ADVISOR' },
      create: { phone, name, role: 'ADVISOR', language: language || 'ENGLISH' }
    });
    const advisor = await prisma.advisor.upsert({
      where: { userId: user.id },
      update: { specialization, bio, credentials, consultancyFee: parseFloat(consultancyFee), platformFeeModel: platformFeeModel || 'HYBRID', monthlyFee: monthlyFee ? parseFloat(monthlyFee) : null, revenueSharePct: revenueSharePct ? parseFloat(revenueSharePct) : null, payoutMethod, payoutAccount },
      create: { userId: user.id, specialization: specialization || 'GENERAL', bio, credentials, consultancyFee: parseFloat(consultancyFee), platformFeeModel: platformFeeModel || 'HYBRID', monthlyFee: monthlyFee ? parseFloat(monthlyFee) : null, revenueSharePct: revenueSharePct ? parseFloat(revenueSharePct) : null, payoutMethod, payoutAccount }
    });
    res.json({ success: true, userId: user.id, advisorId: advisor.id });
  } catch (err) {
    console.error('advisor/register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /farmer/register
app.post('/farmer/register', async (req, res) => {
  try {
    const { phone, name, location, cropTypes, advisorId, language } = req.body;
    const user = await prisma.user.upsert({
      where: { phone },
      update: { name, role: 'FARMER' },
      create: { phone, name, role: 'FARMER', language: language || 'ENGLISH' }
    });
    const farmer = await prisma.farmer.upsert({
      where: { userId: user.id },
      update: { location, cropTypes: cropTypes || [], advisorId: advisorId || null },
      create: { userId: user.id, location, cropTypes: cropTypes || [], advisorId: advisorId || null }
    });
    res.json({ success: true, userId: user.id, farmerId: farmer.id });
  } catch (err) {
    console.error('farmer/register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /query/ask
app.post('/query/ask', async (req, res) => {
  try {
    const { phone, question, language } = req.body;

    // Find or create user
    let user = await prisma.user.findUnique({ where: { phone } });
      user = await prisma.user.create({ data: { phone, role: 'FARMER', language: language || 'ENGLISH' } });
      await prisma.farmer.create({ data: { userId: user.id, cropTypes: [] } });
    }

    // Create query record
    const query = await prisma.query.create({
      data: { farmerId: user.id, question, status: 'PENDING', language: language || 'ENGLISH' }
    });

    // Get AI response from Gemini
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are a professional agricultural advisor for Lesotho farmers. Answer in ${language || 'English'}. Question: ${question}` }] }]
        })
      }
    );
    const geminiData = await geminiRes.json();
    const aiResponse = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

    // Update query with AI response
    await prisma.query.update({
      where: { id: query.id },
      data: { aiResponse, status: 'AI_HANDLED' }
    });

    res.json({ success: true, queryId: query.id, aiResponse, canEscalate: true });
  } catch (err) {
    console.error('query/ask error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /query/escalate
app.post('/query/escalate', async (req, res) => {
  try {
    const { queryId, advisorId } = req.body;
    const query = await prisma.query.update({
      where: { id: queryId },
      data: { status: 'ESCALATED', advisorId: advisorId || null }
    });
    res.json({ success: true, queryId: query.id, status: 'ESCALATED' });
  } catch (err) {
    console.error('query/escalate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /query/respond (advisor responds)
app.post('/query/respond', async (req, res) => {
  try {
    const { queryId, advisorResponse, feeCharged, revenueSharePct } = req.body;
    const fee = feeCharged ? parseFloat(feeCharged) : 0;
    const platformCut = fee * (revenueSharePct ? parseFloat(revenueSharePct) : 0.15);
    const advisorEarning = fee - platformCut;
    const query = await prisma.query.update({
      where: { id: queryId },
      data: { advisorResponse, status: 'ADVISOR_HANDLED', feeCharged: fee, platformCut, advisorEarning }
    });
    res.json({ success: true, queryId: query.id, feeCharged: fee, platformCut, advisorEarning });
  } catch (err) {
    console.error('query/respond error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /advisor/dashboard/:advisorId
app.get('/advisor/dashboard/:advisorId', async (req, res) => {
  try {
    const { advisorId } = req.params;
    const advisor = await prisma.advisor.findUnique({
      where: { id: advisorId },
      include: {
        user: true,
        farmers: { include: { user: true } },
        queries: { orderBy: { createdAt: 'desc' }, take: 20 }
      }
    });
    const totalEarnings = advisor.queries.reduce((sum, q) => sum + (q.advisorEarning || 0), 0);
    const pendingQueries = advisor.queries.filter(q => q.status === 'ESCALATED').length;
    res.json({
      success: true,
      advisor: { id: advisor.id, name: advisor.user.name, specialization: advisor.specialization, consultancyFee: advisor.consultancyFee },
      stats: { totalFarmers: advisor.farmers.length, totalQueries: advisor.queries.length, pendingQueries, totalEarnings },
      recentQueries: advisor.queries.slice(0, 10)
    });
  } catch (err) {
    console.error('advisor/dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => console.log(`🌱 REMOBU on port ${port}`));

async function getGeminiResponse(userMessage) {
  const systemPrompt = `You are REMOBU Farm Advisor, an expert agricultural assistant serving farmers in Lesotho and the SADC region. 
You specialize in horticulture, cannabis cultivation, animal husbandry, regenerative farming, and SACU trade.
Respond in the same language the farmer uses (Sesotho or English).
Keep responses concise and practical for smallholder farmers.
Always provide actionable advice.`;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
