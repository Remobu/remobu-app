// Remobu Advisor Fee Billing Flow
// Triggers M-Pesa STK Push when advisor closes a session

import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Platform fee config
const PLATFORM_FEE_PERCENT = 0.15; // 15% revenue share
const FREE_QUERY_LIMIT = 50;

export async function action({ request }) {
  try {
    const body = await request.json();
    const { farmerPhone, advisorId, sessionId, amount, description } = body;

    if (!farmerPhone || !advisorId || !amount) {
      return json({ error: "Missing farmerPhone, advisorId, or amount" }, { status: 400 });
    }

    // Check free query limit
    const queryCount = await prisma.mpesaPayment.count({
      where: { phone: farmerPhone, status: "SUCCESS" }
    });

    if (queryCount < FREE_QUERY_LIMIT && amount === 0) {
      return json({ 
        status: "FREE_TIER",
        message: `Farmer has ${FREE_QUERY_LIMIT - queryCount} free queries remaining.`
      });
    }

    // Calculate platform fee
    const platformFee = parseFloat((amount * PLATFORM_FEE_PERCENT).toFixed(2));
    const advisorPayout = parseFloat((amount - platformFee).toFixed(2));

    // Normalize phone
    const normalizedPhone = farmerPhone.replace(/^\+/, "").replace(/^0/, "266");

    // Trigger STK Push via M-Pesa route
    const res = await fetch(`${process.env.APP_URL}/mpesa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: normalizedPhone,
        amount,
        reference: `ADV-${advisorId}-${sessionId || Date.now()}`,
        description: description || "Remobu Advisor Session Fee"
      })
    });

    const result = await res.json();

    if (result.ResponseCode === "0") {
      // Log billing record
      await prisma.advisorBilling.create({
        data: {
          farmerPhone: normalizedPhone,
          advisorId,
          sessionId: sessionId || `session-${Date.now()}`,
          amount,
          platformFee,
          advisorPayout,
          checkoutRequestId: result.CheckoutRequestID || "",
          status: "PENDING"
        }
      });

      return json({
        status: "STK_SENT",
        message: "M-Pesa prompt sent to farmer.",
        platformFee,
        advisorPayout,
        checkoutRequestId: result.CheckoutRequestID
      });
    } else {
      return json({ status: "FAILED", error: result.errorMessage || "STK Push failed" }, { status: 500 });
    }

  } catch (e) {
    console.error("❌ Billing error:", e.message);
    return json({ error: e.message }, { status: 500 });
  }
}

// GET — check billing status by sessionId
export async function loader({ request }) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) return json({ error: "Missing sessionId" }, { status: 400 });

  const billing = await prisma.advisorBilling.findFirst({
    where: { sessionId },
    orderBy: { createdAt: "desc" }
  });

  if (!billing) return json({ status: "NOT_FOUND" }, { status: 404 });

  return json({
    status: billing.status,
    amount: billing.amount,
    platformFee: billing.platformFee,
    advisorPayout: billing.advisorPayout
  });
}
