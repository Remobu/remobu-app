import { json } from "@remix-run/node";
import { prisma } from "../db.server";

export async function loader() {
  try {
    const [totalFarmers, totalAdvisors, totalQueries, pendingApplications, activeSubscriptions] = await Promise.all([
      prisma.user.count({ where: { role: "FARMER" } }),
      prisma.user.count({ where: { role: "ADVISOR" } }),
      prisma.conversation.count(),
      prisma.advisorApplication.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { subscriptionStatus: "active" } }),
    ]);
    const monthlyRevenue = activeSubscriptions * 50;
    return json({ totalFarmers, totalAdvisors, totalQueries, pendingApplications, activeSubscriptions, monthlyRevenue });
  } catch (e) {
    return json({ error: e.message });
  }
}
