import { json } from "@remix-run/node";
import prisma from "../db.server";

// CORS headers for storefront access
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function loader({ request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return json({ error: "No batch code provided" }, { status: 400, headers: cors });
  const batch = await prisma.traceBatch.findUnique({ where: { batchCode: code } });
  if (!batch) return json({ error: "Batch not found" }, { status: 404, headers: cors });
  return json(batch, { headers: cors });
}

export async function action({ request }) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const body = await request.json();
  const batchCode = "RMB-" + Date.now();
  const batch = await prisma.traceBatch.create({
    data: {
      batchCode,
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
      qrUrl: null,
      whatsappSent: false,
    },
  });
  return json({ success: true, batchCode: batch.batchCode }, { headers: cors });
}
