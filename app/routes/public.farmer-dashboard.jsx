import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "../db.server.js";

export async function loader({ request }) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/remobu_phone=([^;]+)/);
  if (!match) return redirect("/login");
  const phone = decodeURIComponent(match[1]);

  const user = await prisma.user.findUnique({
    where: { phone },
    include: {
      farmerProfile: {
        include: {
          farmerSubs: { orderBy: { createdAt: "desc" }, take: 1 },
          advisor: { include: { user: true } }
        }
      },
      queriesAsked: { orderBy: { createdAt: "desc" }, take: 10 }
    }
  });

  if (!user) return redirect("/login");

  const farmer = user.farmerProfile;
  const isSubscribed = farmer?.isSubscribed &&
    farmer?.subscriptionEnd && new Date() < new Date(farmer.subscriptionEnd);

  return json({
    name: user.name || phone,
    phone: user.phone,
    role: user.role,
    queryCount: farmer?.queryCount ?? 0,
    freeQueryLimit: farmer?.freeQueryLimit ?? 50,
    isSubscribed: isSubscribed ?? false,
    subscriptionEnd: farmer?.subscriptionEnd ?? null,
    walletBalance: farmer?.walletBalance ?? 0,
    cropTypes: farmer?.cropTypes ?? [],
    location: farmer?.location ?? null,
    advisor: farmer?.advisor ? {
      name: farmer.advisor.user.name,
      phone: farmer.advisor.user.phone,
      specialization: farmer.advisor.specialization
    } : null,
    recentQueries: user.queriesAsked.map(q => ({
      id: q.id,
      question: q.question,
      status: q.status,
      createdAt: q.createdAt
    }))
  });
}

export default function FarmerDashboard() {
  const data = useLoaderData();
  const queriesLeft = Math.max(0, data.freeQueryLimit - data.queryCount);
  const pct = Math.min(100, Math.round((data.queryCount / data.freeQueryLimit) * 100));

  return (
    <div style={{ fontFamily: "sans-serif", background: "#F5F0E8", minHeight: "100vh", padding: "0" }}>
      {/* Header */}
      <div style={{ background: "#2D5233", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src="https://cdn.shopify.com/s/files/1/0975/4057/1438/files/Remobu_Logo.jpg?v=1778694454" alt="Remobu" style={{ width: "40px", height: "40px", borderRadius: "50%", background: "white", padding: "2px", objectFit: "contain" }} />
          <div>
            <div style={{ color: "#C9922A", fontWeight: "bold", fontSize: "16px" }}>Remobu Farm Advisor</div>
            <div style={{ color: "#F5F0E8", fontSize: "12px" }}>Welcome, {data.name}</div>
          </div>
        </div>
        <a href="/logout" style={{ color: "#F5F0E8", fontSize: "12px", textDecoration: "none" }}>Logout</a>
      </div>

      <div style={{ padding: "20px", maxWidth: "480px", margin: "0 auto" }}>

        {/* Subscription Status */}
        <div style={{ background: data.isSubscribed ? "#2D5233" : "white", borderRadius: "12px", padding: "16px", marginBottom: "16px", border: "2px solid " + (data.isSubscribed ? "#C9922A" : "#ddd") }}>
          {data.isSubscribed ? (
            <>
              <div style={{ color: "#C9922A", fontWeight: "bold", fontSize: "15px" }}>✅ Premium Active</div>
              <div style={{ color: "#F5F0E8", fontSize: "13px", marginTop: "4px" }}>
                Unlimited queries until {new Date(data.subscriptionEnd).toDateString()}
              </div>
            </>
          ) : (
            <>
              <div style={{ color: "#2D5233", fontWeight: "bold", fontSize: "15px" }}>🔓 Free Tier</div>
              <div style={{ color: "#555", fontSize: "13px", marginTop: "4px" }}>
                {queriesLeft} of {data.freeQueryLimit} free queries remaining
              </div>
              <div style={{ background: "#eee", borderRadius: "99px", height: "8px", marginTop: "8px" }}>
                <div style={{ background: pct > 80 ? "#c0392b" : "#C9922A", width: pct + "%", height: "8px", borderRadius: "99px", transition: "width 0.3s" }} />
              </div>
              {queriesLeft === 0 && (
                <div style={{ marginTop: "10px", background: "#2D5233", color: "white", padding: "10px", borderRadius: "8px", fontSize: "13px", textAlign: "center" }}>
                  WhatsApp <strong>PAY 50</strong> to +26659338794 to subscribe for M50/month
                </div>
              )}
            </>
          )}
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          <div style={{ background: "white", borderRadius: "10px", padding: "14px", textAlign: "center", border: "1px solid #ddd" }}>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#2D5233" }}>{data.queryCount}</div>
            <div style={{ fontSize: "12px", color: "#888" }}>Total Queries</div>
          </div>
          <div style={{ background: "white", borderRadius: "10px", padding: "14px", textAlign: "center", border: "1px solid #ddd" }}>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#C9922A" }}>M{data.walletBalance.toFixed(0)}</div>
            <div style={{ fontSize: "12px", color: "#888" }}>Wallet Balance</div>
          </div>
        </div>

        {/* Assigned Advisor */}
        {data.advisor && (
          <div style={{ background: "white", borderRadius: "10px", padding: "14px", marginBottom: "16px", border: "1px solid #ddd" }}>
            <div style={{ fontWeight: "bold", color: "#2D5233", marginBottom: "6px" }}>🧑‍🌾 Your Advisor</div>
            <div style={{ fontSize: "13px", color: "#333" }}>{data.advisor.name || data.advisor.phone}</div>
            <div style={{ fontSize: "12px", color: "#888" }}>{data.advisor.specialization}</div>
          </div>
        )}

        {/* Crop Types */}
        {data.cropTypes.length > 0 && (
          <div style={{ background: "white", borderRadius: "10px", padding: "14px", marginBottom: "16px", border: "1px solid #ddd" }}>
            <div style={{ fontWeight: "bold", color: "#2D5233", marginBottom: "8px" }}>🌱 Your Crops</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {data.cropTypes.map(c => (
                <span key={c} style={{ background: "#F5F0E8", border: "1px solid #C9922A", borderRadius: "99px", padding: "3px 10px", fontSize: "12px", color: "#2D5233" }}>{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Recent Queries */}
        <div style={{ background: "white", borderRadius: "10px", padding: "14px", border: "1px solid #ddd" }}>
          <div style={{ fontWeight: "bold", color: "#2D5233", marginBottom: "10px" }}>📋 Recent Questions</div>
          {data.recentQueries.length === 0 ? (
            <div style={{ color: "#888", fontSize: "13px" }}>No questions yet. Ask via WhatsApp!</div>
          ) : (
            data.recentQueries.map(q => (
              <div key={q.id} style={{ borderBottom: "1px solid #eee", paddingBottom: "8px", marginBottom: "8px" }}>
                <div style={{ fontSize: "13px", color: "#333", fontWeight: "500" }}>{q.question.slice(0, 80)}{q.question.length > 80 ? "..." : ""}</div>
                <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>{new Date(q.createdAt).toLocaleDateString()} · {q.status}</div>
              </div>
            ))
          )}
        </div>

        {/* WhatsApp CTA */}
        <a href="https://wa.me/26659338794" style={{ display: "block", background: "#25D366", color: "white", textAlign: "center", padding: "14px", borderRadius: "10px", marginTop: "16px", fontWeight: "bold", textDecoration: "none", fontSize: "15px" }}>
          💬 Ask Farm Advisor on WhatsApp
        </a>
      </div>
    </div>
  );
}
