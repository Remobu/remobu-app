import { json, redirect } from "@remix-run/node";
import { useActionData, useNavigation, Form } from "@remix-run/react";
import { createCookieSessionStorage } from "@remix-run/node";
import prisma from "../db.server";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "remobu_farmer_session",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET || "remobu-secret-2026"],
    maxAge: 60 * 60 * 24 * 30,
  },
});

const otpStore = new Map();

async function sendWhatsApp(phone, message) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) return;
  await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone.replace(/\D/g, ""),
      type: "text",
      text: { body: message }
    })
  }).catch(() => {});
}

export async function action({ request }) {
  const form = await request.formData();
  const step = form.get("step");
  const phone = (form.get("phone") || "").replace(/\D/g, "");

  if (step === "request") {
    if (!phone || phone.length < 8) {
      return json({ error: "Please enter a valid WhatsApp number.", step: "request" });
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.set(phone, { otp, expires: Date.now() + 10 * 60 * 1000 });
    await sendWhatsApp(phone,
      `Your Remobu login code is: *${otp}*\n\nThis code expires in 10 minutes. Do not share it with anyone.`
    );
    return json({ step: "verify", phone, message: "A 6-digit code has been sent to your WhatsApp number." });
  }

  if (step === "verify") {
    const otp = form.get("otp");
    const stored = otpStore.get(phone);
    if (!stored || Date.now() > stored.expires) {
      return json({ error: "Your code has expired. Please request a new one.", step: "request" });
    }
    if (stored.otp !== otp) {
      return json({ error: "Incorrect code. Please try again.", step: "verify", phone });
    }
    otpStore.delete(phone);

    let user = await prisma.user.findFirst({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({ data: { phone, role: "FARMER" } });
      await prisma.farmer.create({ data: { userId: user.id } });
    }

    const session = await sessionStorage.getSession();
    session.set("farmerId", user.id);
    session.set("phone", phone);

    return redirect("/pages/farmer-dashboard", {
      headers: { "Set-Cookie": await sessionStorage.commitSession(session) }
    });
  }

  return json({ error: "Invalid request.", step: "request" });
}

export async function loader() {
  return json({});
}

export default function FarmerLogin() {
  const data = useActionData();
  const navigation = useNavigation();
  const loading = navigation.state === "submitting";
  const step = data?.step || "request";

  return (
    <div style={{ fontFamily: "Georgia, serif", maxWidth: 440, margin: "60px auto", padding: "0 20px", color: "#1a3c2e" }}>
      <div style={{ background: "linear-gradient(135deg,#0f2318,#1a3c2e)", borderRadius: 14, padding: "40px 36px", marginBottom: 24, border: "2px solid #C8A951", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "#C8A951", marginBottom: 10 }}>Remobu Farmer Portal</div>
        <h1 style={{ color: "white", fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>Sign In</h1>
        <p style={{ color: "#a8d5b5", fontSize: 13, margin: 0, lineHeight: 1.7 }}>
          {step === "request" ? "Enter your WhatsApp number to receive a login code." : data?.message}
        </p>
      </div>

      {data?.error && (
        <div style={{ background: "#fff0f0", border: "2px solid #c0392b", borderRadius: 10, padding: "14px 18px", color: "#c0392b", fontSize: 13, marginBottom: 16 }}>
          {data.error}
        </div>
      )}

      {step === "request" && (
        <Form method="post" style={{ background: "white", borderRadius: 14, border: "1px solid #e8e0cc", padding: "32px" }}>
          <input type="hidden" name="step" value="request" />
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#C8A951", marginBottom: 8 }}>
              WhatsApp Number
            </label>
            <input
              name="phone"
              type="tel"
              placeholder="e.g. 26659338794"
              style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "2px solid #e0d9c8", fontSize: 14, fontFamily: "Georgia, serif", color: "#1a3c2e", background: "#fdfaf0", boxSizing: "border-box" }}
            />
            <p style={{ fontSize: 12, color: "#5a7a6a", marginTop: 6, lineHeight: 1.5 }}>Include your country code, e.g. 266 for Lesotho.</p>
          </div>
          <button type="submit" disabled={loading} style={{ width: "100%", background: "#1a3c2e", color: "#C8A951", border: "none", padding: "14px", borderRadius: 8, fontSize: 15, fontWeight: 700, fontFamily: "Georgia, serif", cursor: "pointer" }}>
            {loading ? "Sending..." : "Send Login Code"}
          </button>
        </Form>
      )}

      {step === "verify" && (
        <Form method="post" style={{ background: "white", borderRadius: 14, border: "1px solid #e8e0cc", padding: "32px" }}>
          <input type="hidden" name="step" value="verify" />
          <input type="hidden" name="phone" value={data?.phone} />
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#C8A951", marginBottom: 8 }}>
              6-Digit Code
            </label>
            <input
              name="otp"
              type="text"
              maxLength={6}
              placeholder="Enter your code"
              autoFocus
              style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "2px solid #e0d9c8", fontSize: 20, fontFamily: "Georgia, serif", color: "#1a3c2e", background: "#fdfaf0", boxSizing: "border-box", letterSpacing: 6, textAlign: "center" }}
            />
          </div>
          <button type="submit" disabled={loading} style={{ width: "100%", background: "#1a3c2e", color: "#C8A951", border: "none", padding: "14px", borderRadius: 8, fontSize: 15, fontWeight: 700, fontFamily: "Georgia, serif", cursor: "pointer" }}>
            {loading ? "Verifying..." : "Verify and Sign In"}
          </button>
          <Form method="post" style={{ marginTop: 12, textAlign: "center" }}>
            <input type="hidden" name="step" value="request" />
            <input type="hidden" name="phone" value={data?.phone} />
            <button type="submit" style={{ background: "none", border: "none", color: "#5a7a6a", fontSize: 13, cursor: "pointer", fontFamily: "Georgia, serif", textDecoration: "underline" }}>
              Resend code
            </button>
          </Form>
        </Form>
      )}
    </div>
  );
}
