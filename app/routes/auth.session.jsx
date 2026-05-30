import { json } from "@remix-run/node";
import prisma from "../db.server.js";

export async function loader({ request }) {
  const phone = request.headers.get("x-farmer-phone");
  if (!phone) return json({ error: "Phone required" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { phone },
    include: {
      farmerProfile: { include: { farmerSubs: { orderBy: { createdAt: "desc" }, take: 1 } } },
      advisorProfile: true
    }
  });

  if (!user) return json({ error: "Not found" }, { status: 404 });

  const farmer = user.farmerProfile;
  const isSubscribed = farmer?.isSubscribed &&
    farmer?.subscriptionEnd && new Date() < new Date(farmer.subscriptionEnd);

  return json({
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
    queryCount: farmer?.queryCount ?? 0,
    freeQueryLimit: farmer?.freeQueryLimit ?? 50,
    isSubscribed: isSubscribed ?? false,
    subscriptionEnd: farmer?.subscriptionEnd ?? null,
    walletBalance: farmer?.walletBalance ?? 0
  });
}
