import { json } from "@remix-run/node";
import db from "../db.server";

const PHONE_NUMBER_ID = "1137832329406389";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

// In-memory session store for multi-step conversation
const sessions = new Map();

async function sendMessage(to, body) {
  await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });
}

async function sendImage(to, imageUrl) {
  await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "image",
      image: { link: imageUrl },
    }),
  });
}

function generateBatchCode(type) {
  const prefix = type === "CROPS" ? "TRACE-CROPS" : "TRACE-FLOCK";
  return `${prefix}-${Date.now()}`;
}

async function saveBatchAndSendQR(phone, session) {
  const batchCode = generateBatchCode(session.type);
  const publicUrl = `https://app.remobu.africa/trace/${batchCode}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicUrl)}`;

  await db.traceBatch.create({
    data: {
      batchCode,
      type: session.type,
      farmerName: session.farmerName || "WhatsApp Farmer",
      village: session.village || "Unknown",
      plotOrShedId: session.plotOrShedId,
      animalOrCrop: session.animalOrCrop,
      quantity: session.quantity || null,
      dateProcessed: new Date(),
      inputs: session.inputs || null,
      certifications: null,
      notes: null,
      qrUrl: publicUrl,
      whatsappSent: true,
    },
  });

  await sendMessage(phone,
    `✅ Payment received! Your traceability pass is live.\n\n` +
    `🌿 Batch: *${batchCode}*\n` +
    `🔗 Public page: ${publicUrl}\n\n` +
    `Your QR Code is below. Print it or show it at delivery!`
  );

  await sendImage(phone, qrImageUrl);
  sessions.delete(phone);
}

async function handleMessage(phone, text) {
  const msg = text.trim().toLowerCase();
  let session = sessions.get(phone) || { step: "start" };

  // STAGE 1: Entry
  if (session.step === "start" || msg === "trace" || msg === "lumela" || msg === "hello" || msg === "hi") {
    sessions.set(phone, { step: "select_type" });
    await sendMessage(phone,
      `Lumela! 🌿 Welcome to *Remobu Trace*.\n\nLet's create your traceability pass. What are we tracking today?\n\n` +
      `Reply *1* for 🌱 Crops (Meroho/Lijo)\n` +
      `Reply *2* for 🐑 Livestock/Flock (Khomo/Nku/Poli)`
    );
    return;
  }

  // STAGE 2A: Crops flow
  if (session.step === "select_type") {
    if (msg === "1") {
      sessions.set(phone, { ...session, type: "CROPS", step: "crops_item" });
      await sendMessage(phone, `🌱 *Crop Tracking*\n\nWhat crop are you logging?\n(e.g. Cabbage, Potatoes, Beans)`);
    } else if (msg === "2") {
      sessions.set(phone, { ...session, type: "LIVESTOCK", step: "flock_type" });
      await sendMessage(phone,
        `🐑 *Livestock/Flock Tracking*\n\nWhat product are you registering?\n\n` +
        `Reply *1* for Wool/Mohair Bale\n` +
        `Reply *2* for Meat/Slaughter Batch`
      );
    } else {
      await sendMessage(phone, `Please reply *1* for Crops or *2* for Livestock/Flock.`);
    }
    return;
  }

  // Crops steps
  if (session.step === "crops_item") {
    sessions.set(phone, { ...session, animalOrCrop: text, step: "crops_plot" });
    await sendMessage(phone, `Which plot or village field did this harvest come from?\n(e.g. Ha Foso Co-op Plot 3)`);
    return;
  }
  if (session.step === "crops_plot") {
    sessions.set(phone, { ...session, plotOrShedId: text, village: text, step: "crops_inputs" });
    await sendMessage(phone, `Have any chemical sprays or fertilizers been applied within the last 30 days?\n(e.g. "No, organic manure only" or list what was used)`);
    return;
  }
  if (session.step === "crops_inputs") {
    sessions.set(phone, { ...session, inputs: text, step: "billing" });
    const s = sessions.get(phone);
    await sendMessage(phone,
      `✅ *Batch Summary*\n\n` +
      `🌱 Crop: ${s.animalOrCrop}\n` +
      `📍 Plot: ${s.plotOrShedId}\n` +
      `🌿 Inputs: ${s.inputs}\n\n` +
      `The traceability processing fee is *M5.00*.\n\n` +
      `Please enter your M-Pesa number to pay via secure prompt:\n(e.g. 58123456 or 62123456)`
    );
    return;
  }

  // Livestock steps
  if (session.step === "flock_type") {
    const flockType = msg === "1" ? "Wool/Mohair Bale" : "Meat/Slaughter Batch";
    sessions.set(phone, { ...session, animalOrCrop: flockType, step: "flock_shed" });
    await sendMessage(phone, `Please enter your Shearing Shed ID or Group ID:\n(e.g. SHED-Maseru-09)`);
    return;
  }
  if (session.step === "flock_shed") {
    sessions.set(phone, { ...session, plotOrShedId: text, village: text, step: "flock_grade" });
    await sendMessage(phone, `Enter the average micron grade or quality class of this bale:\n(e.g. A-Grade Mohair, or type *NA* if unknown)`);
    return;
  }
  if (session.step === "flock_grade") {
    sessions.set(phone, { ...session, quantity: text, step: "flock_health" });
    await sendMessage(phone, `Confirm animal health: Have the animals been cleared of veterinary withdrawal periods? *(Yes/No)*`);
    return;
  }
  if (session.step === "flock_health") {
    sessions.set(phone, { ...session, inputs: `Vet clearance: ${text}`, step: "billing" });
    const s = sessions.get(phone);
    await sendMessage(phone,
      `✅ *Batch Summary*\n\n` +
      `🐑 Product: ${s.animalOrCrop}\n` +
      `🏚 Shed: ${s.plotOrShedId}\n` +
      `💉 Health: ${s.inputs}\n\n` +
      `The traceability processing fee is *M5.00*.\n\n` +
      `Please enter your M-Pesa number to pay via secure prompt:\n(e.g. 58123456 or 62123456)`
    );
    return;
  }

  // STAGE 3: Billing — collect M-Pesa number
  if (session.step === "billing") {
    const mpesaPhone = text.replace(/\s/g, "");
    sessions.set(phone, { ...session, mpesaPhone, step: "awaiting_payment" });
    await sendMessage(phone,
      `📲 Sending M-Pesa payment prompt to *${mpesaPhone}*...\n\n` +
      `Please enter your PIN on the Vodacom popup to confirm *M5.00* to Remobu Africa.\n\n` +
      `_(For now in test mode, reply *PAID* to simulate payment confirmation)_`
    );
    return;
  }

  // STAGE 4: Payment confirmed (test mode — replace with real M-Pesa callback)
  if (session.step === "awaiting_payment" && msg === "paid") {
    await sendMessage(phone, `⏳ Processing your traceability pass...`);
    await saveBatchAndSendQR(phone, session);
    return;
  }

  // Fallback
  await sendMessage(phone,
    `I didn't understand that. Send *trace* to start registering a new batch, or continue your current registration.`
  );
}

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

export async function action({ request }) {
  const body = await request.json();
  try {
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];
    if (!message) return json({ ok: true });

    const phone = message.from;
    const text = message.text?.body || "";
    if (!text) return json({ ok: true });

    // Fire and forget — don't block response
    handleMessage(phone, text).catch((e) => console.error("Trace bot error:", e.message));
  } catch (e) {
    console.error("Trace webhook error:", e.message);
  }
  return json({ ok: true });
}
