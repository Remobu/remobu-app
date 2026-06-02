import { useState, useEffect } from "react";

const ADMIN_PHONE = "+26663475043";
const SHEET_ID = "1D0y9Yhp9J3TUAy7-fCgU7R8T_RF53aucEFEDGAqd7kU";
const SHEET_GID = "1887381973";

export default function AdvisorAdmin() {
  const [step, setStep] = useState("phone"); // phone | otp | dashboard
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("applications");
  const [applications, setApplications] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const sendOtp = async () => {
    setError("");
    if (phone.replace(/\s/g, "") !== ADMIN_PHONE.replace(/\s/g, "") &&
        phone.replace(/\s/g, "") !== "0663475043" &&
        phone.replace(/\s/g, "") !== "663475043") {
      setError("Access restricted to authorised administrator only.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: ADMIN_PHONE }),
      });
      const data = await res.json();
      if (data.success) { setOtpSent(true); setStep("otp"); }
      else setError(data.error || "Failed to send OTP.");
    } catch { setError("Network error. Please try again."); }
    setLoading(false);
  };

  const verifyOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: ADMIN_PHONE, otp }),
      });
      const data = await res.json();
      if (data.success) { setStep("dashboard"); loadData(); }
      else setError("Invalid OTP. Please try again.");
    } catch { setError("Network error. Please try again."); }
    setLoading(false);
  };

  const loadData = async () => {
    try {
      const [appRes, advRes, farRes, anaRes] = await Promise.all([
        fetch("/api/admin/applications"),
        fetch("/api/admin/advisors"),
        fetch("/api/admin/farmers"),
        fetch("/api/admin/analytics"),
      ]);
      const [appData, advData, farData, anaData] = await Promise.all([
        appRes.json(), advRes.json(), farRes.json(), anaRes.json()
      ]);
      setApplications(appData.applications || []);
      setAdvisors(advData.advisors || []);
      setFarmers(farData.farmers || []);
      setAnalytics(anaData);
    } catch (e) { console.error("Load error", e); }
  };

  const handleDecision = async (id, decision) => {
    try {
      await fetch("/api/admin/applications/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision }),
      });
      loadData();
    } catch (e) { console.error(e); }
  };

  const styles = {
    page: { fontFamily: "Georgia, serif", background: "#f5f5f0", minHeight: "100vh", padding: "0" },
    header: { background: "linear-gradient(135deg, #1a3c2e, #2d6a4f)", color: "white", padding: "20px 32px", display: "flex", alignItems: "center", gap: "16px" },
    logo: { height: "48px", width: "48px", borderRadius: "8px", objectFit: "contain" },
    headerText: { margin: 0, fontSize: "20px", fontWeight: "700" },
    headerSub: { margin: 0, fontSize: "13px", color: "#b7e4c7" },
    loginBox: { maxWidth: "400px", margin: "80px auto", background: "white", borderRadius: "12px", padding: "40px", boxShadow: "0 4px 24px rgba(0,0,0,0.10)" },
    loginTitle: { fontSize: "22px", fontWeight: "700", color: "#1a3c2e", marginBottom: "8px" },
    loginSub: { fontSize: "13px", color: "#888", marginBottom: "28px" },
    input: { width: "100%", padding: "12px 14px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "15px", fontFamily: "Georgia, serif", boxSizing: "border-box", marginBottom: "14px" },
    btn: { width: "100%", padding: "13px", background: "#2d6a4f", color: "white", border: "none", borderRadius: "6px", fontSize: "15px", fontFamily: "Georgia, serif", cursor: "pointer", fontWeight: "600" },
    error: { color: "#c0392b", fontSize: "13px", marginBottom: "12px" },
    tabs: { display: "flex", gap: "0", borderBottom: "2px solid #e0e0e0", background: "white", padding: "0 32px" },
    tab: { padding: "14px 20px", cursor: "pointer", fontSize: "14px", fontFamily: "Georgia, serif", border: "none", background: "none", borderBottom: "3px solid transparent", marginBottom: "-2px", color: "#666" },
    tabActive: { padding: "14px 20px", cursor: "pointer", fontSize: "14px", fontFamily: "Georgia, serif", border: "none", background: "none", borderBottom: "3px solid #2d6a4f", marginBottom: "-2px", color: "#1a3c2e", fontWeight: "700" },
    content: { padding: "28px 32px", maxWidth: "1100px", margin: "0 auto" },
    card: { background: "white", borderRadius: "10px", padding: "24px", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
    cardTitle: { fontSize: "16px", fontWeight: "700", color: "#1a3c2e", marginBottom: "16px", borderBottom: "1px solid #eee", paddingBottom: "10px" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
    th: { textAlign: "left", padding: "10px 12px", background: "#f5f5f0", color: "#555", fontWeight: "600", borderBottom: "1px solid #e0e0e0" },
    td: { padding: "10px 12px", borderBottom: "1px solid #f0f0f0", verticalAlign: "top" },
    approveBtn: { padding: "6px 14px", background: "#2d6a4f", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px", marginRight: "6px", fontFamily: "Georgia, serif" },
    rejectBtn: { padding: "6px 14px", background: "#c0392b", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontFamily: "Georgia, serif" },
    statGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" },
    stat: { background: "white", borderRadius: "10px", padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderLeft: "4px solid #2d6a4f" },
    statNum: { fontSize: "32px", fontWeight: "700", color: "#1a3c2e", margin: "0 0 4px" },
    statLabel: { fontSize: "13px", color: "#888", margin: 0 },
    badge: (status) => ({
      display: "inline-block", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "600",
      background: status === "APPROVED" ? "#d4edda" : status === "PENDING" ? "#fff3cd" : "#f8d7da",
      color: status === "APPROVED" ? "#155724" : status === "PENDING" ? "#856404" : "#721c24",
    }),
    sheetLink: { display: "inline-block", marginBottom: "16px", color: "#2d6a4f", fontSize: "13px", textDecoration: "none", borderBottom: "1px solid #2d6a4f" },
  };

  if (step === "phone") return (
    <div style={styles.page}>
      <div style={styles.header}>
        <img src="https://cdn.shopify.com/s/files/1/0975/4057/1438/files/REMOBU_-logo_bb6e3738-183f-44bf-bce2-1f64042bee80.png?v=1780381151" style={styles.logo} alt="Remobu" />
        <div><p style={styles.headerText}>Remobu Admin Portal</p><p style={styles.headerSub}>Restricted Access</p></div>
      </div>
      <div style={styles.loginBox}>
        <p style={styles.loginTitle}>Administrator Login</p>
        <p style={styles.loginSub}>Enter your registered admin phone number to receive a one-time PIN via WhatsApp.</p>
        {error && <p style={styles.error}>{error}</p>}
        <input style={styles.input} type="tel" placeholder="+266 63 475 043" value={phone} onChange={e => setPhone(e.target.value)} />
        <button style={styles.btn} onClick={sendOtp} disabled={loading}>{loading ? "Sending..." : "Send OTP via WhatsApp"}</button>
      </div>
    </div>
  );

  if (step === "otp") return (
    <div style={styles.page}>
      <div style={styles.header}>
        <img src="https://cdn.shopify.com/s/files/1/0975/4057/1438/files/REMOBU_-logo_bb6e3738-183f-44bf-bce2-1f64042bee80.png?v=1780381151" style={styles.logo} alt="Remobu" />
        <div><p style={styles.headerText}>Remobu Admin Portal</p><p style={styles.headerSub}>Restricted Access</p></div>
      </div>
      <div style={styles.loginBox}>
        <p style={styles.loginTitle}>Enter OTP</p>
        <p style={styles.loginSub}>A one-time PIN has been sent to your WhatsApp. Enter it below to continue.</p>
        {error && <p style={styles.error}>{error}</p>}
        <input style={styles.input} type="text" placeholder="6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} />
        <button style={styles.btn} onClick={verifyOtp} disabled={loading}>{loading ? "Verifying..." : "Verify & Enter"}</button>
        <p style={{textAlign:"center",marginTop:"14px",fontSize:"13px",color:"#888",cursor:"pointer"}} onClick={() => setStep("phone")}>Back</p>
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <img src="https://cdn.shopify.com/s/files/1/0975/4057/1438/files/REMOBU_-logo_bb6e3738-183f-44bf-bce2-1f64042bee80.png?v=1780381151" style={styles.logo} alt="Remobu" />
        <div><p style={styles.headerText}>Remobu Admin Dashboard</p><p style={styles.headerSub}>Platform Management</p></div>
      </div>

      <div style={styles.tabs}>
        {["applications","advisors","farmers","analytics"].map(t => (
          <button key={t} style={activeTab === t ? styles.tabActive : styles.tab} onClick={() => setActiveTab(t)}>
            {t === "applications" ? "Applications" : t === "advisors" ? "Active Advisors" : t === "farmers" ? "Farmers" : "Analytics"}
          </button>
        ))}
      </div>

      <div style={styles.content}>

        {activeTab === "applications" && (
          <div style={styles.card}>
            <p style={styles.cardTitle}>Advisor Applications</p>
            <a href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${SHEET_GID}`} target="_blank" rel="noreferrer" style={styles.sheetLink}>View source Google Sheet</a>
            {applications.length === 0 ? <p style={{color:"#888",fontSize:"14px"}}>No applications found.</p> : (
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>Name</th><th style={styles.th}>Phone</th><th style={styles.th}>District</th>
                  <th style={styles.th}>Specialization</th><th style={styles.th}>Experience</th><th style={styles.th}>Status</th><th style={styles.th}>Action</th>
                </tr></thead>
                <tbody>{applications.map(a => (
                  <tr key={a.id}>
                    <td style={styles.td}>{a.name}</td>
                    <td style={styles.td}>{a.phone}</td>
                    <td style={styles.td}>{a.district}</td>
                    <td style={styles.td}>{a.specialization}</td>
                    <td style={styles.td}>{a.yearsOfExperience}</td>
                    <td style={styles.td}><span style={styles.badge(a.status)}>{a.status}</span></td>
                    <td style={styles.td}>
                      {a.status === "PENDING" && <>
                        <button style={styles.approveBtn} onClick={() => handleDecision(a.id, "APPROVED")}>Approve</button>
                        <button style={styles.rejectBtn} onClick={() => handleDecision(a.id, "REJECTED")}>Reject</button>
                      </>}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "advisors" && (
          <div style={styles.card}>
            <p style={styles.cardTitle}>Active Advisors</p>
            {advisors.length === 0 ? <p style={{color:"#888",fontSize:"14px"}}>No active advisors yet.</p> : (
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>Name</th><th style={styles.th}>Phone</th><th style={styles.th}>Specialization</th>
                  <th style={styles.th}>Farmers Assigned</th><th style={styles.th}>Status</th>
                </tr></thead>
                <tbody>{advisors.map(a => (
                  <tr key={a.id}>
                    <td style={styles.td}>{a.name}</td>
                    <td style={styles.td}>{a.phone}</td>
                    <td style={styles.td}>{a.specialization}</td>
                    <td style={styles.td}>{a.farmerCount || 0}</td>
                    <td style={styles.td}><span style={styles.badge("APPROVED")}>Active</span></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "farmers" && (
          <div style={styles.card}>
            <p style={styles.cardTitle}>Registered Farmers</p>
            {farmers.length === 0 ? <p style={{color:"#888",fontSize:"14px"}}>No farmers registered yet.</p> : (
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>Phone</th><th style={styles.th}>Queries Used</th>
                  <th style={styles.th}>Subscription</th><th style={styles.th}>Joined</th>
                </tr></thead>
                <tbody>{farmers.map(f => (
                  <tr key={f.id}>
                    <td style={styles.td}>{f.phone}</td>
                    <td style={styles.td}>{f.totalQueries || 0} / {f.freeQueries || 50}</td>
                    <td style={styles.td}><span style={styles.badge(f.subscriptionStatus === "active" ? "APPROVED" : "PENDING")}>{f.subscriptionStatus || "Free"}</span></td>
                    <td style={styles.td}>{f.createdAt ? new Date(f.createdAt).toLocaleDateString() : "-"}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "analytics" && analytics && (
          <>
            <div style={styles.statGrid}>
              <div style={styles.stat}><p style={styles.statNum}>{analytics.totalFarmers || 0}</p><p style={styles.statLabel}>Total Farmers</p></div>
              <div style={styles.stat}><p style={styles.statNum}>{analytics.totalAdvisors || 0}</p><p style={styles.statLabel}>Active Advisors</p></div>
              <div style={styles.stat}><p style={styles.statNum}>{analytics.totalQueries || 0}</p><p style={styles.statLabel}>Total AI Queries</p></div>
              <div style={styles.stat}><p style={styles.statNum}>{analytics.pendingApplications || 0}</p><p style={styles.statLabel}>Pending Applications</p></div>
              <div style={styles.stat}><p style={styles.statNum}>M{analytics.monthlyRevenue || 0}</p><p style={styles.statLabel}>Monthly Revenue</p></div>
              <div style={styles.stat}><p style={styles.statNum}>{analytics.activeSubscriptions || 0}</p><p style={styles.statLabel}>Active Subscriptions</p></div>
            </div>
          </>
        )}
        {activeTab === "analytics" && !analytics && <p style={{color:"#888",fontSize:"14px"}}>Loading analytics...</p>}

      </div>
    </div>
  );
}
