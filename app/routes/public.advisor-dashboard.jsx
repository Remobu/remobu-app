import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import prisma from "../db.server.js";

export async function loader({ request }) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/remobu_phone=([^;]+)/);
  if (!match) return redirect("/public/login?role=advisor");

  const phone = decodeURIComponent(match[1]);
  const user = await prisma.user.findUnique({
    where: { phone },
    include: { advisor: { include: { cohorts: { include: { farmers: true } }, transactions: true } } }
  });

  if (!user || user.role !== "ADVISOR") return redirect("/public/login?role=advisor");

  return json({ user, advisor: user.advisor });
}

export default function AdvisorDashboard() {
  const { user, advisor } = useLoaderData();
  const totalFarmers = advisor?.cohorts?.reduce((sum, c) => sum + c.farmers.length, 0) ?? 0;
  const totalEarnings = advisor?.transactions?.reduce((sum, t) => sum + (t.amount ?? 0), 0) ?? 0;

  return (
    <div style={{ fontFamily: "'Segoe UI',sans-serif", background: "#F5F0E8", minHeight: "100vh" }}>
      <div style={{ background: "#2D5233", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: "#C9922A", fontWeight: "bold", fontSize: "18px" }}>🌱 Remobu Advisor Portal</div>
        <a href="/public/logout" style={{ color: "white", fontSize: "14px" }}>Logout</a>
      </div>
      <div style={{ maxWidth: "600px", margin: "40px auto", padding: "0 16px" }}>
        <p style={{ color: "#555" }}>Welcome, {user.name || user.phone}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          <div style={{ background: "white", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", fontWeight: "bold" }}>{totalFarmers}</div>
            <div style={{ color: "#888", fontSize: "13px" }}>Assigned Farmers</div>
          </div>
          <div style={{ background: "white", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: "#C9922A" }}>M{totalEarnings}</div>
            <div style={{ color: "#888", fontSize: "13px" }}>Total Earnings</div>
          </div>
        </div>
        <div style={{ background: "white", borderRadius: "12px", padding: "20px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "12px" }}>📋 My Farmer Cohorts</div>
          {advisor?.cohorts?.length > 0 ? advisor.cohorts.map(c => (
            <div key={c.id} style={{ borderBottom: "1px solid #eee", padding: "8px 0" }}>
              <div style={{ fontWeight: "500" }}>{c.name || "Cohort"}</div>
              <div style={{ color: "#888", fontSize: "13px" }}>{c.farmers.length} farmers</div>
            </div>
          )) : <div style={{ color: "#888" }}>No cohorts yet. Farmers will appear here once assigned.</div>}
        </div>
        <div style={{ marginTop: "16px" }}>
          <a href="https://wa.me/26659338794" target="_blank" rel="noreferrer"
            style={{ display: "block", background: "#25D366", color: "white", textAlign: "center", padding: "14px", borderRadius: "12px", fontWeight: "bold", textDecoration: "none" }}>
            💬 Open WhatsApp Advisor Channel
          </a>
        </div>
      </div>
    </div>
  );
}
