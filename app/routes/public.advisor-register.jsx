import { json, redirect } from "@remix-run/node";
import { useActionData, Form } from "@remix-run/react";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const MONTHLY_FEES = {
  LSL: { amount: 50.00,    symbol: "M",    label: "Lesotho Maloti" },
  ZAR: { amount: 50.00,    symbol: "R",    label: "South African Rand" },
  BWP: { amount: 37.00,    symbol: "P",    label: "Botswana Pula" },
  SZL: { amount: 50.00,    symbol: "E",    label: "Eswatini Lilangeni" },
  NAD: { amount: 50.00,    symbol: "N$",   label: "Namibian Dollar" },
  USD: { amount: 2.75,     symbol: "$",    label: "US Dollar (Zimbabwe)" },
  ZMW: { amount: 67.00,    symbol: "K",    label: "Zambian Kwacha" },
  MWK: { amount: 4750.00,  symbol: "MK",   label: "Malawian Kwacha" },
  MZN: { amount: 320.00,   symbol: "MT",   label: "Mozambican Metical" },
  TZS: { amount: 7200.00,  symbol: "TZS",  label: "Tanzanian Shilling" },
  AOA: { amount: 2500.00,  symbol: "Kz",   label: "Angolan Kwanza" },
  CDF: { amount: 7800.00,  symbol: "FC",   label: "Congolese Franc (DRC)" },
  MGA: { amount: 12500.00, symbol: "Ar",   label: "Malagasy Ariary" },
  MUR: { amount: 130.00,   symbol: "Rs",   label: "Mauritian Rupee" },
};

const COUNTRIES = [
  { name: "Lesotho",      currency: "LSL" },
  { name: "South Africa", currency: "ZAR" },
  { name: "Botswana",     currency: "BWP" },
  { name: "Eswatini",     currency: "SZL" },
  { name: "Namibia",      currency: "NAD" },
  { name: "Zimbabwe",     currency: "USD" },
  { name: "Zambia",       currency: "ZMW" },
  { name: "Malawi",       currency: "MWK" },
  { name: "Mozambique",   currency: "MZN" },
  { name: "Tanzania",     currency: "TZS" },
  { name: "Angola",       currency: "AOA" },
  { name: "DR Congo",     currency: "CDF" },
  { name: "Madagascar",   currency: "MGA" },
  { name: "Mauritius",    currency: "MUR" },
];

export async function action({ request }) {
  const form = await request.formData();
  const name        = form.get("name");
  const email       = form.get("email");
  const phone       = form.get("phone");
  const country     = form.get("country");
  const currency    = form.get("currency");
  const password    = form.get("password");
  const bio         = form.get("bio");
  const credentials = form.get("credentials");

  if (!name || !email || !phone || !country || !currency || !password) {
    return json({ error: "All required fields must be filled." });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return json({ error: "Email already registered. Please log in." });

  const hashedPassword = await bcrypt.hash(password, 10);
  const fee = MONTHLY_FEES[currency]?.amount || 50.00;

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: "ADVISOR",
    },
  });

  await prisma.advisor.create({
    data: {
      userId:          user.id,
      consultancyFee:  0,
      monthlyFee:      fee,
      bio:             bio || "",
      credentials:     credentials || "",
      isVerified:      false,
      isActive:        false,
    },
  });

  return json({ success: true, name });
}

export default function AdvisorRegister() {
  const actionData = useActionData();

  if (actionData?.success) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <h1 style={{ color: "#2d6a4f" }}>🌱 Remobu Advisor</h1>
          <div style={{ textAlign: "center", padding: 32 }}>
            <div style={{ fontSize: 64 }}>✅</div>
            <h2>Registration Submitted!</h2>
            <p>Thank you <strong>{actionData.name}</strong>!</p>
            <p>Your application is under review. Remobu will notify you via WhatsApp/email once approved.</p>
            <p style={{ color: "#888", fontSize: 13 }}>
              Platform fee applies upon approval. All billing via Remobu only.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ color: "#2d6a4f", textAlign: "center" }}>🌱 Remobu Advisor</h1>
        <h2 style={{ textAlign: "center", color: "#555", fontWeight: 400 }}>
          Independent Extension Advisor Registration
        </h2>

        {actionData?.error && (
          <p style={{ color: "red", background: "#fff0f0", padding: 12, borderRadius: 6 }}>
            {actionData.error}
          </p>
        )}

        <Form method="post" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={labelStyle}>Full Name *
            <input name="name" required style={inputStyle} placeholder="e.g. Thabo Mpharoane" />
          </label>
          <label style={labelStyle}>Email Address *
            <input name="email" type="email" required style={inputStyle} placeholder="you@example.com" />
          </label>
          <label style={labelStyle}>WhatsApp Number *
            <input name="phone" required style={inputStyle} placeholder="+266 59 338 794" />
          </label>
          <label style={labelStyle}>Country *
            <select name="country" required style={inputStyle}>
              <option value="">Select your country</option>
              {COUNTRIES.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name} — {MONTHLY_FEES[c.currency].symbol}{MONTHLY_FEES[c.currency].amount}/month
                </option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>Currency *
            <select name="currency" required style={inputStyle}>
              <option value="">Select currency</option>
              {Object.entries(MONTHLY_FEES).map(([code, info]) => (
                <option key={code} value={code}>{code} — {info.label}</option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>Professional Bio
            <textarea name="bio" rows={3} style={inputStyle}
              placeholder="Brief description of your agricultural expertise..." />
          </label>
          <label style={labelStyle}>Qualifications / Credentials
            <input name="credentials" style={inputStyle}
              placeholder="e.g. BSc Agriculture, 10 years extension work" />
          </label>
          <label style={labelStyle}>Create Password *
            <input name="password" type="password" required style={inputStyle}
              placeholder="Min 8 characters" />
          </label>

          <div style={{ background: "#f0faf4", padding: 12, borderRadius: 6, fontSize: 13, color: "#555" }}>
            <strong>Platform Terms:</strong><br />
            ✅ Monthly fee paid upfront per your country rate<br />
            ✅ 10% platform cut auto-deducted per transaction<br />
            ✅ All farmer billing via Remobu only — no off-platform payments<br />
            ✅ Account activated only after Remobu approval
          </div>

          <button type="submit" style={btnStyle}>
            Submit Registration →
          </button>
        </Form>

        <p style={{ textAlign: "center", fontSize: 13, color: "#888", marginTop: 16 }}>
          Already registered? Contact Remobu via WhatsApp: <strong>+266 59 338 794</strong>
        </p>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh", background: "#f0faf4",
  display: "flex", alignItems: "center", justifyContent: "center", padding: 16
};
const cardStyle = {
  background: "white", borderRadius: 12, padding: 32,
  maxWidth: 520, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)"
};
const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 6,
  border: "1px solid #ccc", fontSize: 14, marginTop: 4, boxSizing: "border-box"
};
const labelStyle = { display: "flex", flexDirection: "column", fontSize: 14, fontWeight: 500 };
const btnStyle = {
  padding: "12px 24px", background: "#2d6a4f", color: "white",
  border: "none", borderRadius: 8, cursor: "pointer", fontSize: 16, fontWeight: 600
};
