import { json } from "@remix-run/node";
import db from "../db.server";

function generateBatchCode(type) {
  const prefix = type === "CROPS" ? "TRACE-CROPS" : "TRACE-FLOCK";
  return `${prefix}-${Date.now()}`;
}

function generateQrUrl(batchCode) {
  const publicUrl = `https://remobu.africa/trace/${batchCode}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicUrl)}`;
  return { publicUrl, qrImageUrl };
}

async function sendWhatsAppQR(farmerPhone, publicUrl, qrImageUrl) {
  const PHONE_NUMBER_ID = "1137832329406389";
  const headers = {
    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
    "Content-Type": "application/json",
  };
  const base = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

  await fetch(base, {
    method: "POST", headers,
    body: JSON.stringify({
      messaging_product: "whatsapp", to: farmerPhone, type: "text",
      text: { body: `✅ Payment Received! Your traceability pass is live.\n\n🔗 ${publicUrl}\n\nYour QR Code follows. Print it or show it at delivery!` },
    }),
  });

  await fetch(base, {
    method: "POST", headers,
    body: JSON.stringify({
      messaging_product: "whatsapp", to: farmerPhone, type: "image",
      image: { link: qrImageUrl },
    }),
  });
}

export async function action({ request }) {
  const data = await request.json();
  const { type, farmerName, farmerPhone, village, plotOrShedId, animalOrCrop,
          quantity, dateProcessed, inputs, certifications, notes, skipWhatsApp } = data;

  const batchCode = generateBatchCode(type);
  const { publicUrl, qrImageUrl } = generateQrUrl(batchCode);

  const batch = await db.traceBatch.create({
    data: {
      batchCode, type, farmerName, village, plotOrShedId, animalOrCrop,
      quantity: quantity || null,
      dateProcessed: new Date(dateProcessed),
      inputs: inputs || null,
      certifications: certifications || null,
      notes: notes || null,
      qrUrl: publicUrl,
      whatsappSent: false,
    },
  });

  if (farmerPhone && !skipWhatsApp) {
    try {
      await sendWhatsAppQR(farmerPhone, publicUrl, qrImageUrl);
      await db.traceBatch.update({ where: { id: batch.id }, data: { whatsappSent: true } });
    } catch (err) {
      console.error("WhatsApp QR send failed:", err.message);
    }
  }

  return json({ success: true, batchCode, publicUrl, qrImageUrl, batch });
}

export async function loader({ request }) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const batches = await db.traceBatch.findMany({
    where: type ? { type } : {},
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return json({ batches });
}
