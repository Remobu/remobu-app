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

    // Send WA notification to admin — number must be without +
    const adminPhone = (process.env.ADMIN_PHONE || "26663475043").replace(/^\+/, "");
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "1137832329406389";
    const token = process.env.WHATSAPP_TOKEN;

    const waRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: adminPhone,
        type: "text",
        text: { body: `🌱 New Advisor Application!\n\nName: ${name}\nPhone: ${phone}\nEmail: ${email || "N/A"}\nDistrict: ${district || "N/A"}\nSpecialisation: ${specialization}\nExperience: ${yearsOfExperience || "N/A"} years\n\nReview: https://remobu-advisor.myshopify.com/admin/apps/remobu-app/advisor-admin` }
      })
    });

    const waData = await waRes.json();
    console.log("WA_NOTIFY_RESULT:", JSON.stringify(waData));

    // Send confirmation WA to applicant
    const applicantPhone = phone.replace(/^\+/, "");
    await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: applicantPhone,
        type: "text",
        text: { body: `✅ Thank you ${name}!\n\nYour Remobu Advisor application has been received. Our team will review your application and contact you within 3 working days.\n\nFor queries: +266 59 338 794\n\n— Remobu Team` }
      })
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
