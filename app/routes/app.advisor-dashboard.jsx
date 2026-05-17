import { json } from "@remix-run/node";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PLATFORM_FEE_PERCENT = 10;

const MONTHLY_FEES = {
  LSL: { amount: 50.00,   symbol: "M",    label: "Lesotho Maloti" },
  ZAR: { amount: 50.00,   symbol: "R",    label: "South African Rand" },
  BWP: { amount: 37.00,   symbol: "P",    label: "Botswana Pula" },
  SZL: { amount: 50.00,   symbol: "E",    label: "Eswatini Lilangeni" },
  NAD: { amount: 50.00,   symbol: "N$",   label: "Namibian Dollar" },
  USD: { amount: 2.75,    symbol: "$",    label: "US Dollar (Zimbabwe)" },
  ZMW: { amount: 67.00,   symbol: "K",    label: "Zambian Kwacha" },
  MWK: { amount: 4750.00, symbol: "MK",   label: "Malawian Kwacha" },
  MZN: { amount: 320.00,  symbol: "MT",   label: "Mozambican Metical" },
  TZS: { amount: 7200.00, symbol: "TZS",  label: "Tanzanian Shilling" },
  AOA: { amount: 2500.00, symbol: "Kz",   label: "Angolan Kwanza" },
  CDF: { amount: 7800.00, symbol: "FC",   label: "Congolese Franc (DRC)" },
  MGA: { amount: 12500.00,symbol: "Ar",   label: "Malagasy Ariary" },
  MUR: { amount: 130.00,  symbol: "Rs",   label: "Mauritian Rupee" },
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

export async function loader({ request }) {
  const url = new URL(request.url);
  const advisorId = url.searchParams.get("advisorId");
  if (!advisorId) return json({ advisor: null, cohorts: [], transactions: [] });

  const advisor = await prisma.advisor.findUnique({
    where: { id: advisorId },
    include: { cohorts: { include: { farmers: true } }, transactions: true },
  });

  return json({ advisor, cohorts: advisor?.cohorts || [], transactions: advisor?.transactions || [] });
}

export async function action({ request }) {
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "register") {
    const name = form.get("name");
    const email = form.get("email");
    const phone = form.get("phone");
    const country = form.get("country");
    const currency = form.get("currency");

    const existing = await prisma.advisor.findUnique({ where: { email } });
    if (existing) return json({ error: "Email already registered." });

    const fee = MONTHLY_FEES[currency]?.amount || 50.00;
    const advisor = await prisma.advisor.create({
      data: {
        name, email, phone, country, currency,
        status: "PENDING",
        monthlyFee: fee,
        platformFeePercent: PLATFORM_FEE_PERCENT,
      },
    });
    return json({ success: true, advisorId: advisor.id, message: "Registration submitted! Awaiting approval from Remobu." });
  }

  if (intent === "create_cohort") {
    const advisorId = form.get("advisorId");
    const cohortName = form.get("cohortName");
    const feePerFarmer = parseFloat(form.get("feePerFarmer"));
    const cohort = await prisma.cohort.create({
      data: { name: cohortName, advisorId, feePerFarmer },
    });
    return json({ success: true, cohortId: cohort.id });
  }

  if (intent === "add_farmer") {
    const cohortId = form.get("cohortId");
    const farmerName = form.get("farmerName");
    const farmerPhone = form.get("farmerPhone");

    const cohort = await prisma.cohort.findUnique({ where: { id: cohortId } });
    const grossFee = cohort.feePerFarmer;
    const platformCut = parseFloat((grossFee * PLATFORM_FEE_PERCENT / 100).toFixed(2));
    const advisorEarning = parseFloat((grossFee - platformCut).toFixed(2));

    const farmer = await prisma.farmer.create({
      data: { name: farmerName, phone: farmerPhone, cohortId },
    });
    await prisma.transaction.create({
      data: {
        advisorId: cohort.advisorId,
        farmerId: farmer.id,
        grossAmount: grossFee,
        platformCut,
        advisorEarning,
        type: "FARMER_FEE",
        status: "COMPLETED",
      },
    });
    return json({ success: true, platformCut, advisorEarning });
  }

  return json({ error: "Unknown intent" });
}

export default function AdvisorDashboard() {
  const { advisor, cohorts, transactions } = useLoaderData();
  const actionData = useActionData();

  const totalEarnings = transactions.reduce((sum, t) => sum + (t.advisorEarning || 0), 0);
  const totalPlatformCut = transactions.reduce((sum, t) => sum + (t.platformCut || 0), 0);
  const currencyInfo = MONTHLY_FEES[advisor?.currency] || MONTHLY_FEES.LSL;
  const sym = currencyInfo.symbol;

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <h1 style={{ color: "#2d6a4f" }}>🌱 Remobu Independent Advisor Dashboard</h1>

      {!advisor && (
        <div>
          <h2>Register as an Independent Extension Advisor</h2>
          <p style={{ color: "#555" }}>
            Platform fee: paid upfront monthly per country rate + 10% auto-deducted per transaction.
            All accounts require Remobu approval before activation.
          </p>
          {actionData?.error && <p style={{ color: "red" }}>{actionData.error}</p>}
          {actionData?.message && <p style={{ color: "green" }}>{actionData.message}</p>}
          <Form method="post" style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 440 }}>
            <input type="hidden" name="intent" value="register" />
            <input name="name" placeholder="Full Name" required style={inputStyle} />
            <input name="email" type="email" placeholder="Email Address" required style={inputStyle} />
            <input name="phone" placeholder="WhatsApp Number (e.g. +26659...)" required style={inputStyle} />
            <select name="country" required style={inputStyle}
              onChange={e => {
                const c = COUNTRIES.find(x => x.name === e.target.value);
                if (c) document.querySelector('[name=currency]').value = c.currency;
              }}>
              <option value="">Select Country</option>
              {COUNTRIES.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name} — {MONTHLY_FEES[c.currency].symbol}{MONTHLY_FEES[c.currency].amount}/month
                </option>
              ))}
            </select>
            <select name="currency" required style={inputStyle}>
              <option value="">Currency (auto-fills)</option>
              {Object.entries(MONTHLY_FEES).map(([code, info]) => (
                <option key={code} value={code}>{code} — {info.label}</option>
              ))}
            </select>
            <button type="submit" style={btnStyle}>Submit Registration</button>
          </Form>

          <h3 style={{ marginTop: 32 }}>Monthly Platform Fees by Country</h3>
          <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 500 }}>
            <thead>
              <tr style={{ background: "#e8f5e9" }}>
                <th style={thStyle}>Country</th>
                <th style={thStyle}>Currency</th>
                <th style={thStyle}>Monthly Fee</th>
              </tr>
            </thead>
            <tbody>
              {COUNTRIES.map(c => (
                <tr key={c.name}>
                  <td style={tdStyle}>{c.name}</td>
                  <td style={tdStyle}>{c.currency}</td>
                  <td style={tdStyle}>{MONTHLY_FEES[c.currency].symbol}{MONTHLY_FEES[c.currency].amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {advisor && (
        <div>
          <div style={{ background: "#f0faf4", padding: 16, borderRadius: 8, marginBottom: 24 }}>
            <h2>{advisor.name}</h2>
            <p>Status: <strong style={{ color: advisor.status === "ACTIVE" ? "green" : "orange" }}>{advisor.status}</strong></p>
            <p>Country: {advisor.country} | Currency: {advisor.currency} ({currencyInfo.label})</p>
            <p>Monthly Platform Fee: <strong>{sym}{currencyInfo.amount.toLocaleString()}</strong> (paid upfront)</p>
            <p>Platform Cut: <strong>10% per transaction</strong> (auto-deducted)</p>
            <hr />
            <p>Net Earnings: <strong>{sym}{totalEarnings.toFixed(2)}</strong></p>
            <p>Total Platform Fees Paid: <strong>{sym}{totalPlatformCut.toFixed(2)}</strong></p>
          </div>

          <h2>My Cohorts ({cohorts.length})</h2>
          <Form method="post" style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <input type="hidden" name="intent" value="create_cohort" />
            <input type="hidden" name="advisorId" value={advisor.id} />
            <input name="cohortName" placeholder="Cohort Name" required style={inputStyle} />
            <input name="feePerFarmer" type="number" placeholder={`Fee per farmer (${advisor.currency})`} required style={inputStyle} />
            <button type="submit" style={btnStyle}>+ Create Cohort</button>
          </Form>

          {cohorts.map(cohort => (
            <div key={cohort.id} style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <h3>{cohort.name} — {sym}{cohort.feePerFarmer}/farmer
                <span style={{ fontSize: 12, color: "#888", marginLeft: 8 }}>
                  (you keep {sym}{(cohort.feePerFarmer * 0.9).toFixed(2)} after 10% cut)
                </span>
              </h3>
              <p>Farmers enrolled: <strong>{cohort.farmers?.length || 0}</strong></p>
              <Form method="post" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input type="hidden" name="intent" value="add_farmer" />
                <input type="hidden" name="cohortId" value={cohort.id} />
                <input name="farmerName" placeholder="Farmer Name" required style={inputStyle} />
                <input name="farmerPhone" placeholder="WhatsApp Phone" required style={inputStyle} />
                <button type="submit" style={btnStyle}>+ Add Farmer</button>
              </Form>
              {cohort.farmers?.length > 0 && (
                <table style={{ width: "100%", marginTop: 12, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#e8f5e9" }}>
                      <th style={thStyle}>Farmer</th>
                      <th style={thStyle}>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohort.farmers.map(f => (
                      <tr key={f.id}>
                        <td style={tdStyle}>{f.name}</td>
                        <td style={tdStyle}>{f.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}

          <h2>Transaction History</h2>
          {transactions.length === 0 && <p style={{ color: "#888" }}>No transactions yet.</p>}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#e8f5e9" }}>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Gross</th>
                <th style={thStyle}>Platform Cut (10%)</th>
                <th style={thStyle}>Your Earning</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id}>
                  <td style={tdStyle}>{t.type}</td>
                  <td style={tdStyle}>{sym}{t.grossAmount?.toFixed(2)}</td>
                  <td style={tdStyle}>{sym}{t.platformCut?.toFixed(2)}</td>
                  <td style={tdStyle}>{sym}{t.advisorEarning?.toFixed(2)}</td>
                  <td style={tdStyle} style={{ color: t.status === "COMPLETED" ? "green" : "orange" }}>{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const inputStyle = { padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", fontSize: 14, minWidth: 180 };
const btnStyle = { padding: "8px 16px", background: "#2d6a4f", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 };
const thStyle = { padding: 8, textAlign: "left", borderBottom: "1px solid #ccc", fontSize: 13 };
const tdStyle = { padding: 8, borderBottom: "1px solid #eee", fontSize: 13 };
