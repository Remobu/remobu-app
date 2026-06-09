import { json } from "@remix-run/node";
import db from "../db.server";

const PHONE_NUMBER_ID = "1137832329406389";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const MPESA_API_URL = process.env.MPESA_API_URL || "https://openapi.m-pesa.com";
const MPESA_API_KEY = process.env.MPESA_API_KEY || "test_key";
const MPESA_PUBLIC_KEY = process.env.MPESA_PUBLIC_KEY || "test_public_key";

// Pending payments store (in-memory — replace with DB for production)
const pendingPayments = new Map();

async function sendWhatsAppMessage(to, body) {
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

async function sendWhatsAppImage(to, imageUrl) {
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

// Encrypt API key with RSA public key (Vodacom requirement)
async function getEncryptedApiKey() {
  // In production: use node-forge or crypto to RSA-encrypt MPESA_API_KEY
  // with MPESA_PUBLIC_KEY. For test mode, return raw key.
  return Buffer.from(MPESA_API_KEY).toString("base64");
}

// Initiate STK Push to farmer's handset
async function initiateStkPush(msisdn, amount, reference, batchData) {
  // TEST MODE: simulate successful payment
  if (!process.env.MPESA_API_KEY || process.env.MPESA_API_KEY === "test_key") {
    console.log(`[TEST MODE] Simulating M-Pesa STK Push to ${msisdn} for M${amount}`);
    pendingPayments.set(reference, batchData);
    return { success: true, test: true };
  }

  try {
    const encryptedKey = await getEncryptedApiKey();
    const payload = {
      Amount: amount,
      MSISDN: `266${msisdn}`, // Lesotho country code
      Reference: reference,
      ThirdPartyReference: reference,
      Description: "Remobu Africa Traceability Fee",
      ServiceProviderCode: process.env.MPESA_SERVICE_CODE || "171717",
    };

    const response = await fetch(`${MPESA_API_URL}/ipg/v2x/c2bPayment/singleStage/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${encryptedKey}`,
        "Content-Type": "application/json",
        Origin: "https://remobu.africa",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (result.output_ResponseCode === "INS-0") {
      pendingPayments.set(reference, batchData);
      return { success: true, conversationId: result.output_ConversationID };
    }
    return { success: false, error: result.output_ResponseDesc };
  } catch (err) {
    console.error("STK Push failed:", err.message);
    return { success: false, error: err.message };
  }
}

// Process confirmed payment — save batch + send QR
async function processConfirmedPayment(reference) {
  const batchData = pendingPayments.get(reference);
  if (!batchData) return;

  const batchCode = `${batchData.type === "CROPS" ? "TRACE-CROPS" : "TRACE-FLOCK"}-${Date.now()}`;
  const publicUrl = `https://app.remobu.africa/trace/${batchCode}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicUrl)}`;

  await db.traceBatch.create({
    data: {
      batchCode,
      type: batchData.type,
      farmerName: batchData.farmerName || "WhatsApp Farmer",
      village: batchData.village || batchData.plotOrShedId,
      plotOrShedId: batchData.plotOrShedId,
      animalOrCrop: batchData.animalOrCrop,
      quantity: batchData.quantity || null,
      dateProcessed: new Date(),
      inputs: batchData.inputs || null,
      certifications: null,
      notes: null,
      qrUrl: publicUrl,
      whatsappSent: true,
    },
  });

  if (batchData.farmerPhone) {
    await sendWhatsAppMessage(batchData.farmerPhone,
      `✅ *Payment Confirmed! M5.00 received.*\n\n` +
      `🌿 Your traceability pass is now live:\n` +
      `*Batch:* ${batchCode}\n` +
      `🔗 ${publicUrl}\n\n` +
      `Your QR Code is below. Print it or show it at delivery!`
    );
    await sendWhatsAppImage(batchData.farmerPhone, qrImageUrl);
  }

  pendingPayments.delete(reference);
  console.log(`✅ Batch ${batchCode} created and QR sent to ${batchData.farmerPhone}`);
}

// POST /api/mpesa — initiate STK push from admin or bot
export async function action({ request }) {
  const url = new URL(request.url);
  const callbackPath = url.searchParams.get("callback");

  // Handle Vodacom callback
  if (callbackPath === "true") {
    const body = await request.json();
    console.log("M-Pesa callback received:", JSON.stringify(body));

    const resultCode = body.ResultCode || body.output_ResultCode;
    const reference = body.ThirdPartyReference || body.output_ThirdPartyReference;

    if ((resultCode === 0 || resultCode === "0") && reference) {
      processConfirmedPayment(reference).catch((e) =>
        console.error("Payment processing error:", e.message)
      );
    }

    return json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  // Handle STK push initiation
  const data = await request.json();
  const { msisdn, amount, reference, batchData } = data;

  if (!msisdn || !reference || !batchData) {
    return json({ success: false, error: "Missing required fields" }, { status: 400 });
  }

  const result = await initiateStkPush(msisdn, amount || 5, reference, batchData);

  // TEST MODE: auto-confirm payment immediately
  if (result.test) {
    setTimeout(() => {
      processConfirmedPayment(reference).catch((e) =>
        console.error("Test payment processing error:", e.message)
      );
    }, 3000);
  }

  return json(result);
}

// GET /api/mpesa?test=true — test endpoint to simulate callback
export async function loader({ request }) {
  const url = new URL(request.url);
  const testRef = url.searchParams.get("test");

  if (testRef && pendingPayments.has(testRef)) {
    await processConfirmedPayment(testRef);
    return json({ success: true, message: `Test payment confirmed for ${testRef}` });
  }

  return json({ 
    status: "M-Pesa integration active",
    mode: process.env.MPESA_API_KEY ? "production" : "test",
    pendingCount: pendingPayments.size
  });
}
