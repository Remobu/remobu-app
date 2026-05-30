import { json } from "@remix-run/node";
import prisma from "../db.server.js";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPWhatsApp(phone, otp) {
  const res = await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: `Your Remobu login code is: *${otp}*\n\nValid for 10 minutes. Do not share this code.` }
    })
  });
  return res.ok;
}

export async function action({ request }) {
  const body = await request.json();
  const { action, phone, otp } = body;

  if (!phone) return json({ error: "Phone number required" }, { status: 400 });

  // Normalize phone: ensure it starts with country code
  const normalizedPhone = phone.startsWith("+") ? phone : `+${phone}`;

  if (action === "request") {
    const code = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert user
    await prisma.user.upsert({
      where: { phone: normalizedPhone },
      update: { otpCode: code, otpExpiry: expiry },
      create: { phone: normalizedPhone, otpCode: code, otpExpiry: expiry, role: "FARMER" }
    });

    const sent = await sendOTPWhatsApp(normalizedPhone, code);
    if (!sent) return json({ error: "Failed to send OTP" }, { status: 500 });

    return json({ success: true, message: "OTP sent to your WhatsApp" });
  }

  if (action === "verify") {
    if (!otp) return json({ error: "OTP required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (!user) return json({ error: "User not found" }, { status: 404 });
    if (!user.otpCode || user.otpCode !== otp) return json({ error: "Invalid OTP" }, { status: 401 });
    if (!user.otpExpiry || new Date() > user.otpExpiry) return json({ error: "OTP expired" }, { status: 401 });

    // Clear OTP, update lastLogin
    await prisma.user.update({
      where: { phone: normalizedPhone },
      data: { otpCode: null, otpExpiry: null, lastLogin: new Date() }
    });

    // Ensure farmer profile exists
    if (user.role === "FARMER") {
      await prisma.farmer.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, walletBalance: 0, queryCount: 0, freeQueryLimit: 50 }
      });
    }

    return json({
      success: true,
      user: { id: user.id, phone: user.phone, role: user.role, name: user.name }
    });
  }

  return json({ error: "Invalid action" }, { status: 400 });
}
