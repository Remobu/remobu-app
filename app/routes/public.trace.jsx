import { json } from "@remix-run/node";
import prisma from "../db.server";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

async function sendWhatsAppQR(phone, recordCode, farmerName) {
  if (!phone || !WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) return;
  const traceUrl = `https://remobu.africa/pages/trace?code=${recordCode}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(traceUrl)}`;
  const message = `Hello ${farmerName},\n\nYour Remobu Farm Record has been registered!\n\nFarm Record Code: *${recordCode}*\n\nYour unique QR code is attached. Print it and attach it to your produce packaging so consumers can verify the full origin and farming history of your product.\n\nVerify link: ${traceUrl}\n\nThank you for being part of the Remobu Farm-to-Flock network.`;
  await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: phone.replace(/\D/g, ""), type: "text", text: { body: message } })
  });
  await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: phone.replace(/\D/g, ""), type: "image", image: { link: qrUrl, caption: `Your Farm Record QR Code — ${recordCode}. Print and attach to your produce packaging.` } })
  });
}

export async function loader({ request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return json({ error: "No Farm Record code provided" }, { status: 400, headers: cors });
  const record = await prisma.traceBatch.findUnique({ where: { batchCode: code } });
  if (!record) return json({ error: "Farm Record not found" }, { status: 404, headers: cors });
  return json(record, { headers: cors });
}

export async function action({ request }) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const body = await request.json();
  const recordCode = "RMB-" + Date.now();
  const record = await prisma.traceBatch.create({
    data: {
      batchCode: recordCode,
      type: body.type || "CROPS",
      farmerName: body.farmerName,
      village: body.village,
      plotOrShedId: body.plotOrShedId,
      animalOrCrop: body.animalOrCrop,
      quantity: body.quantity || null,
      dateProcessed: new Date(body.dateProcessed),
      inputs: body.inputs || null,
      certifications: body.certifications || null,
      notes: body.notes || null,
      qrUrl: `https://remobu.africa/pages/trace?code=${recordCode}`,
      whatsappSent: false,
    },
  });
  if (body.farmerPhone) {
    sendWhatsAppQR(body.farmerPhone, recordCode, body.farmerName).catch(() => {});
    await prisma.traceBatch.update({ where: { id: record.id }, data: { whatsappSent: true } });
  }
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`https://remobu.africa/pages/trace?code=${recordCode}`)}`;
  return json({ success: true, recordCode, qrUrl }, { headers: cors });
}
