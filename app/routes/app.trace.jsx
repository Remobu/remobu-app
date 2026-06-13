import { useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export async function loader({ request }) {
  await authenticate.admin(request);
  const batches = await prisma.traceBatch.findMany({
    orderBy: { createdAt: "desc" },
  });
  return json({ batches });
}

export async function action({ request }) {
  await authenticate.admin(request);
  const body = await request.json();
  const batchCode = "RMB-" + Date.now();
  const batch = await prisma.traceBatch.create({
    data: {
      batchCode,
      type: body.type,
      farmerName: body.farmerName,
      village: body.village,
      plotOrShedId: body.plotOrShedId,
      animalOrCrop: body.animalOrCrop,
      quantity: body.quantity || null,
      dateProcessed: new Date(body.dateProcessed),
      inputs: body.inputs || null,
      certifications: body.certifications || null,
      notes: body.notes || null,
      qrUrl: null,
      whatsappSent: false,
    },
  });
  return json({ success: true, batch });
}

export default function TracePage() {
  const { batches } = useLoaderData();
  const [view, setView] = useState("dashboard");
  const [type, setType] = useState("CROPS");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    farmerName: "", village: "", plotOrShedId: "",
    animalOrCrop: "", quantity: "", dateProcessed: "",
    inputs: "", certifications: "", notes: "",
  });

  const s = {
    page: { fontFamily: "Georgia, serif", background: "#fdfaf0", minHeight: "100vh", padding: "32px", maxWidth: "760px", margin: "0 auto" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" },
    title: { color: "#1a3c2e", fontSize: "26px", fontWeight: "bold", margin: 0 },
    subtitle: { color: "#5a7a6a", fontSize: "14px", margin: "4px 0 0" },
    btn: { padding: "12px 24px", background: "#1a3c2e", color: "#C8A951", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "bold", fontFamily: "Georgia, serif", cursor: "pointer" },
    backBtn: { background: "none", border: "none", color: "#1a3c2e", cursor: "pointer", fontSize: "14px", marginBottom: "20px", fontFamily: "Georgia, serif" },
    statsRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "32px" },
    statCard: { background: "#fff", border: "1px solid #e0d9c8", borderRadius: "12px", padding: "20px", textAlign: "center" },
    statNum: { fontSize: "36px", fontWeight: "bold", color: "#1a3c2e" },
    statLabel: { fontSize: "13px", color: "#5a7a6a", marginTop: "4px" },
    empty: { textAlign: "center", padding: "60px 20px", color: "#5a7a6a" },
    table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "12px", overflow: "hidden", border: "1px solid #e0d9c8" },
    th: { background: "#1a3c2e", color: "#C8A951", padding: "12px 16px", textAlign: "left", fontSize: "13px" },
    td: { padding: "12px 16px", borderBottom: "1px solid #f0ebe0", fontSize: "13px", color: "#2d2d2d" },
    toggle: { display: "flex", gap: "12px", marginBottom: "28px" },
    toggleBtn: (active) => ({ flex: 1, padding: "14px", borderRadius: "10px", border: `2px solid ${active ? "#1a3c2e" : "#d0c9b0"}`, background: active ? "#1a3c2e" : "#fff", color: active ? "#C8A951" : "#5a7a6a", fontFamily: "Georgia, serif", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }),
    card: { background: "#fff", border: "1px solid #e0d9c8", borderRadius: "12px", padding: "24px", marginBottom: "20px" },
    label: { display: "block", color: "#1a3c2e", fontWeight: "bold", fontSize: "13px", marginBottom: "6px" },
    input: { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #d0c9b0", fontFamily: "Georgia, serif", fontSize: "14px", boxSizing: "border-box", background: "#fdfaf0" },
    row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" },
    field: { marginBottom: "16px" },
    submitBtn: { width: "100%", padding: "16px", background: "#1a3c2e", color: "#C8A951", border: "none", borderRadius: "10px", fontSize: "17px", fontWeight: "bold", fontFamily: "Georgia, serif", cursor: "pointer", marginTop: "8px" },
    resultBox: { background: "#e8f5e9", border: "2px solid #2e7d32", borderRadius: "12px", padding: "24px", textAlign: "center", marginTop: "24px" },
  };

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/trace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const crops = batches.filter((b) => b.type === "CROPS").length;
  const livestock = batches.filter((b) => b.type === "LIVESTOCK").length;

  if (view === "new") {
    if (result) {
      return (
        <div style={s.page}>
          <div style={s.resultBox}>
            <div style={{ fontSize: "48px" }}>✅</div>
            <h2 style={{ color: "#1a3c2e" }}>Batch Registered!</h2>
            <p style={{ color: "#2e7d32", fontSize: "18px", fontWeight: "bold" }}>{result.batch?.batchCode}</p>
            <p style={{ color: "#5a7a6a" }}>QR code generation coming soon.</p>
            <button style={s.btn} onClick={() => { setResult(null); setView("dashboard"); setForm({ farmerName: "", village: "", plotOrShedId: "", animalOrCrop: "", quantity: "", dateProcessed: "", inputs: "", certifications: "", notes: "" }); }}>
              ← Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={s.page}>
        <button style={s.backBtn} onClick={() => setView("dashboard")}>← Back to Dashboard</button>
        <h1 style={s.title}>Register New Batch</h1>
        <p style={{ color: "#5a7a6a", marginBottom: "24px" }}>Record a new crop or livestock traceability batch</p>

        <div style={s.toggle}>
          <button style={s.toggleBtn(type === "CROPS")} onClick={() => setType("CROPS")}>🌾 Crops</button>
          <button style={s.toggleBtn(type === "LIVESTOCK")} onClick={() => setType("LIVESTOCK")}>🐄 Livestock/Flock</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={s.card}>
            <div style={s.row}>
              <div><label style={s.label}>Farmer Name *</label><input style={s.input} required value={form.farmerName} onChange={(e) => update("farmerName", e.target.value)} /></div>
              <div><label style={s.label}>Village *</label><input style={s.input} required value={form.village} onChange={(e) => update("village", e.target.value)} /></div>
            </div>
            <div style={s.row}>
              <div><label style={s.label}>{type === "CROPS" ? "Plot ID *" : "Shed/Kraal ID *"}</label><input style={s.input} required value={form.plotOrShedId} onChange={(e) => update("plotOrShedId", e.target.value)} /></div>
              <div><label style={s.label}>{type === "CROPS" ? "Crop *" : "Animal Type *"}</label><input style={s.input} required value={form.animalOrCrop} onChange={(e) => update("animalOrCrop", e.target.value)} /></div>
            </div>
            <div style={s.row}>
              <div><label style={s.label}>Quantity</label><input style={s.input} value={form.quantity} onChange={(e) => update("quantity", e.target.value)} placeholder="e.g. 50kg or 20 heads" /></div>
              <div><label style={s.label}>Date Processed *</label><input style={s.input} type="date" required value={form.dateProcessed} onChange={(e) => update("dateProcessed", e.target.value)} /></div>
            </div>
            <div style={s.field}><label style={s.label}>Inputs Used</label><input style={s.input} value={form.inputs} onChange={(e) => update("inputs", e.target.value)} placeholder="e.g. Organic fertilizer, vaccines" /></div>
            <div style={s.field}><label style={s.label}>Certifications</label><input style={s.input} value={form.certifications} onChange={(e) => update("certifications", e.target.value)} placeholder="e.g. Organic, GAP" /></div>
            <div style={s.field}><label style={s.label}>Notes</label><textarea style={{...s.input, height: "80px"}} value={form.notes} onChange={(e) => update("notes", e.target.value)} /></div>
          </div>
          <button type="submit" style={s.submitBtn} disabled={loading}>{loading ? "Saving..." : "✅ Register Batch"}</button>
        </form>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>🌿 Remobu Trace</h1>
          <p style={s.subtitle}>Farm-to-Flock QR Traceability Network — Lesotho</p>
        </div>
        <button style={s.btn} onClick={() => setView("new")}>+ Register New Batch</button>
      </div>

      <div style={s.statsRow}>
        <div style={s.statCard}><div style={s.statNum}>{batches.length}</div><div style={s.statLabel}>Total Batches Registered</div></div>
        <div style={s.statCard}><div style={s.statNum}>🌾 {crops}</div><div style={s.statLabel}>Crop Batches</div></div>
        <div style={s.statCard}><div style={s.statNum}>🐄 {livestock}</div><div style={s.statLabel}>Livestock/Flock Batches</div></div>
      </div>

      {batches.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: "48px" }}>🌱</div>
          <p>No batches registered yet. Click <strong>Register New Batch</strong> to get started.</p>
        </div>
      ) : (
        <table style={s.table}>
          <thead><tr><th style={s.th}>Batch Code</th><th style={s.th}>Type</th><th style={s.th}>Farmer</th><th style={s.th}>Crop/Animal</th><th style={s.th}>Village</th><th style={s.th}>Date</th></tr></thead>
          <tbody>{batches.map((b) => (<tr key={b.id}><td style={s.td}>{b.batchCode}</td><td style={s.td}>{b.type}</td><td style={s.td}>{b.farmerName}</td><td style={s.td}>{b.animalOrCrop}</td><td style={s.td}>{b.village}</td><td style={s.td}>{new Date(b.dateProcessed).toLocaleDateString()}</td></tr>))}</tbody>
        </table>
      )}
    </div>
  );
}
