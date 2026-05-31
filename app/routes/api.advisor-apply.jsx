import { json } from "@remix-run/node";
import prisma from "../db.server.js";

const SPECIALIZATION_MAP = {
  "Crops": "AGRONOMY",
  "Livestock (Vetenarian)": "VETERINARY",
  "Aquaculture": "GENERAL",
  "Soil Health": "SOIL_SCIENCE",
  "Agronomist": "AGRONOMY",
  "Integrated Pest Management (IPM)": "IPM",
  "Other": "GENERAL",
};

export async function action({ request }) {
  try {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, { status: 405 });
  const data = await request.json();
  const { name, phone, email, district, specialization, yearsOfExperience, credentials, motivation, billingAgreed, credentialFileUrl } = data;
  if (!phone) return json({ error: "Phone required" }, { status: 400 });
  const specKey = SPECIALIZATION_MAP[specialization?.trim()] || "GENERAL";
  const user = await prisma.user.upsert({
    where: { phone },
    update: { name, role: "ADVISOR" },
    create: { phone, name, role: "ADVISOR" }
  });
  await prisma.advisor.upsert({
    where: { userId: user.id },
    update: { district, yearsOfExperience, credentials, motivation, billingAgreed: !!billingAgreed, credentialFileUrl, specialization: specKey, applicationStatus: "PENDING", isVerified: false, isActive: false },
    create: { userId: user.id, district, yearsOfExperience, credentials, motivation, billingAgreed: !!billingAgreed, credentialFileUrl, specialization: specKey, applicationStatus: "PENDING", consultancyFee: 0, monthlyFee: 50, isVerified: false, isActive: false }
  });
  const waRes = await fetch(`https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
    body: JSON.stringify({ messaging_product: "whatsapp", to: process.env.ADMIN_PHONE || "26663475043", type: "text", text: { body: `New Advisor Application!\n\nName: ${name}\nPhone: ${phone}\nDistrict: ${district}\nSpecialisation: ${specialization}\nExperience: ${yearsOfExperience}\n\nReview: https://remobu-app-production.up.railway.app/public/admin-dashboard` } })
  });
  return json({ success: true });
  } catch(err) {
    console.error("ADVISOR_APPLY_ERROR:", err.message, err.stack);
    return json({ error: err.message }, { status: 500 });
  }
}

export async function loader() {
  return json({ status: "ok" });
}
