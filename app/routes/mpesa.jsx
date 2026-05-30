// M-Pesa Vodacom Lesotho Payment Integration
// Handles: STK Push, Payment Callback, Payment Status

import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MPESA_BASE_URL = process.env.MPESA_BASE_URL || "https://openapi.m-pesa.com";
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY;

// Step 1: Get OAuth token
async function getMpesaToken() {
  const credentials = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64");
  const res = await fetch(`${MPESA_BASE_URL}/v1/oauth/token?grant_type=client_credentials`, {
    method: "GET",
    headers: { Authorization: `Basic ${credentials}` },
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to get M-Pesa token: " + JSON.stringify(data));
  return data.access_token;
}

// Step 2: STK Push — prompts farmer's phone with payment request
async function stkPush({ phone, amount, reference, description }) {
  const token = await getMpesaToken();
  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64");

  const body = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.ceil(amount),
    PartyA: phone,           // Farmer's phone e.g. 26659338794
    PartyB: MPESA_SHORTCODE,
    PhoneNumber: phone,
    CallBackURL: `${process.env.APP_URL}/mpesa/callback`,
    AccountReference: reference,
    TransactionDesc: description,
  };

  const res = await fetch(`${MPESA_BASE_URL}/v1/stkpush/process`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return await res.json();
}

// Remix action — handles POST requests
export async function action({ request }) {
  const url = new URL(request.url);
  const path = url.pathname;

  // POST /mpesa/callback — M-Pesa payment result
  if (path.endsWith("/callback")) {
    try {
      const body = await request.json();
      const result = body?.Body?.stkCallback;
      const checkoutId = result?.CheckoutRequestID;
      const resultCode = result?.ResultCode;
      const resultDesc = result?.ResultDesc;

      console.log("📲 M-Pesa callback:", JSON.stringify(result));

      if (resultCode === 0) {
        // Payment successful
        const items = result?.CallbackMetadata?.Item || [];
        const get = (name) => items.find(i => i.Name === name)?.Value;

        await prisma.mpesaPayment.create({
          data: {
            checkoutRequestId: checkoutId,
            merchantRequestId: result?.MerchantRequestID,
            amount: parseFloat(get("Amount") || 0),
            mpesaReceiptNumber: get("MpesaReceiptNumber") || "",
            phone: String(get("PhoneNumber") || ""),
            status: "SUCCESS",
            description: resultDesc,
          },
        });
        console.log("✅ Payment recorded:", get("MpesaReceiptNumber"));

        // Activate farmer subscription if amount is M50
        const paidAmount = parseFloat(get("Amount") || 0);
        const paidPhone = "+" + String(get("PhoneNumber") || "");
        if (paidAmount >= 50) {
          const user = await prisma.user.findUnique({ where: { phone: paidPhone }, include: { farmerProfile: true } });
          if (user?.farmerProfile) {
            const now = new Date();
            const periodEnd = new Date(now);
            periodEnd.setDate(periodEnd.getDate() + 30);
            await prisma.farmer.update({
              where: { userId: user.id },
              data: { isSubscribed: true, subscriptionEnd: periodEnd }
            });
            await prisma.farmerSubscription.create({
              data: {
                farmerId: user.farmerProfile.id,
                amount: paidAmount,
                status: "COMPLETED",
                mpesaRef: get("MpesaReceiptNumber") || "",
                checkoutRequestId: checkoutId,
                periodStart: now,
                periodEnd: periodEnd
              }
            });
            // Notify farmer via WhatsApp
            const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
            const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
            await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
              method: "POST",
              headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                to: String(get("PhoneNumber") || ""),
                type: "text",
                text: { body: "✅ *Subscription activated!*\n\nWelcome to Remobu Premium 🌾\n\nYou now have unlimited farm advisor access for 30 days (until " + periodEnd.toDateString() + ").\n\nAsk me anything!" }
              })
            });
          }
        }
      } else {
        // Payment failed
        await prisma.mpesaPayment.create({
          data: {
            checkoutRequestId: checkoutId,
            merchantRequestId: result?.MerchantRequestID,
            amount: 0,
            mpesaReceiptNumber: "",
            phone: "",
            status: "FAILED",
            description: resultDesc,
          },
        });
        console.log("❌ Payment failed:", resultDesc);
      }

      return json({ status: "ok" }, { status: 200 });
    } catch (e) {
      console.error("❌ Callback error:", e.message);
      return json({ status: "error" }, { status: 200 });
    }
  }

  // POST /mpesa — initiate STK Push
  try {
    const body = await request.json();
    const { phone, amount, reference, description } = body;

    if (!phone || !amount || !reference) {
      return json({ error: "Missing phone, amount, or reference" }, { status: 400 });
    }

    // Normalize phone: 26659338794 format
    const normalizedPhone = phone.replace(/^\+/, "").replace(/^0/, "266");

    const result = await stkPush({
      phone: normalizedPhone,
      amount,
      reference,
      description: description || "Remobu Payment",
    });

    console.log("📤 STK Push result:", JSON.stringify(result));
    return json(result, { status: 200 });
  } catch (e) {
    console.error("❌ STK Push error:", e.message);
    return json({ error: e.message }, { status: 500 });
  }
}

// Remix loader — payment status check
export async function loader({ request }) {
  const url = new URL(request.url);
  const checkoutId = url.searchParams.get("checkoutId");

  if (!checkoutId) {
    return json({ error: "Missing checkoutId" }, { status: 400 });
  }

  const payment = await prisma.mpesaPayment.findFirst({
    where: { checkoutRequestId: checkoutId },
    orderBy: { createdAt: "desc" },
  });

  if (!payment) {
    return json({ status: "PENDING" }, { status: 200 });
  }

  return json({ status: payment.status, receipt: payment.mpesaReceiptNumber }, { status: 200 });
}
