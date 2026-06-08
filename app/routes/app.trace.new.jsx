import { useState } from "react";
import { useNavigate } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  await authenticate.admin(request);
  return json({});
}

export default function NewBatch() {
  const navigate = useNavigate();
  const [type, setType] = useState("CROPS");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    farmerName: "", farmerPhone: "", village: "", plotOrShedId: "",
    animalOrCrop: "", quantity: "", dateProcessed: "", inputs: "",
    certifications: "", notes: "",
  });

  const s = {
    page: { fontFamily: "Georgia, serif", background: "#fdfaf0", minHeight: "100vh", padding: "32px", maxWidth: "720px", margin: "0 auto" },
    title: { color: "#1a3c2e", fontSize: "26px", fontWeight: "bold", marginBottom: "4px" },
    sub: { color: "#5a7a6a", fontSize: "14px", marginBottom: "28px" },
    toggle: { display: "flex", gap: "12px", marginBottom: "28px" },
    toggleBtn: (active) => ({ flex: 1, padding: "14px", borderRadius: "10px", border: `2px solid ${active ? "#1a3c2e" : "#d0c9b0"}`, background: active ? "#1a3c2e" : "#fff", color: active ? "#C8A951" : "#5a7a6a", fontFamily: "Georgia, serif", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }),
    card: { background: "#fff", border: "1px solid #e0d9c8", borderRadius: "12px", padding: "24px", marginBottom: "20px" },
    label: { display: "block", color: "#1a3c2e", fontWeight: "bold", fontSize: "13px", marginBottom: "6px" },
    input: { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #d0c9b0", fontFamily: "Georgia, serif", fontSize: "14px", boxSizing: "border-box", background: "#fdfaf0" },
    row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" },
    field: { marginBottom: "16px" },
    btn: { width: "100%", padding: "16px", background: "#1a3c2e", color: "#C8A951", border: "none", borderRadius: "10px", fontSize: "17px", fontWeight: "bold", fontFamily: "Georgia, serif", cursor: "pointer", marginTop: "8px" },
    backBtn: { background: "none", border: "none", color: "#1a3c2e", cursor: "pointer", fontSize: "14px", marginBottom: "20px", fontFamily: "Georgia, serif" },
    result: { background: "#e8f5e9", border: "2px solid #2e7d32", borderRadius: "12px", padding: "24px", textAlign: "center", marginTop: "24px" },
    qrImg: { width: "180px", height: "180px", margin: "16px auto", display: "block", border: "4px solid #C8A951", borderRadius: "8px" },
  };

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/trace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type, skipWhatsApp: !form.farmerPhone }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert("Error saving batch: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div style={s.page}>
        <div style={s.result}>
          <div style={{ fontSize: "48px" }}>✅</div>
          <h2 style={{ color: "#1a3c2e" }}>Batch Registered!</h2>
          <p style={{ color: "#2e7d32", fontWeight: "bold", fontSize: "18px" }}>{result.batchCode}</p>
          <img src={result.qrImageUrl} alt="QR Code" style={s.qrImg} />
          <p style={{ color: "#5a7a6a", fontSize: "13px" }}>Public URL: <a href={result.publicUrl} target="_blank" rel="noreferrer">{result.publicUrl}</a></p>
          {result.batch?.whatsappSent && <p style={{ color: "#2e7d32" }}>📱 QR Code sent to farmer via WhatsApp ✅</p>}
          <div style={{ display: "flex", gap: "12px", marginTop: "20px", justifyContent: "center" }}>
            <button style={{ ...s.btn, width: "auto", padding: "12px 24px" }} onClick={() => window.open(result.qrImageUrl, "_blank")}>⬇ Download QR</button>
            <button style={{ ...s.btn, width: "auto", padding: "12px 24px", background: "#fff", color: "#1a3c2e", border: "2px solid #1a3c2e" }} onClick={() => { setResult(null); setForm({ farmerName: "", farmerPhone: "", village: "", plotOrShedId: "", animalOrCrop: "", quantity: "", dateProcessed: "", inputs: "", certifications: "", notes: "" }); }}>+ New Batch</button>
            <button style={{ ...s.btn, width: "auto", padding: "12px 24px", background: "#C8A951", color: "#1a3c2e", border: "none" }} onClick={() => navigate("/app/trace")}>View All Batches</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <button style={s.backBtn} onClick={() => navigate("/app/trace")}>← Back to Dashboard</button>
      <h1 style={s.title}>🌾 Register New Batch</h1>
      <p style={s.sub}>Create a traceability pass for a crop or livestock batch</p>

      <div style={s.toggle}>
        <button style={s.toggleBtn(type === "CROPS")} onClick={() => setType("CROPS")}>🌱 Crops</button>
        <button style={s.toggleBtn(type === "LIVESTOCK")} onClick={() => setType("LIVESTOCK")}>🐑 Livestock / Flock</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={s.card}>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Farmer Name *</label>
              <input style={s.input} required value={form.farmerName} onChange={(e) => update("farmerName", e.target.value)} placeholder="e.g. Nthabiseng Mokoena" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Farmer WhatsApp Number</label>
              <input style={s.input} value={form.farmerPhone} onChange={(e) => update("farmerPhone", e.target.value)} placeholder="e.g. 26658123456" />
            </div>
          </div>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Village / Co-op *</label>
              <input style={s.input} required value={form.village} onChange={(e) => update("village", e.target.value)} placeholder="e.g. Ha Foso" />
            </div>
            <div style={s.field}>
              <label style={s.label}>{type === "CROPS" ? "Plot / Co-op ID *" : "Shearing Shed / Farm ID *"}</label>
              <input style={s.input} required value={form.plotOrShedId} onChange={(e) => update("plotOrShedId", e.target.value)} placeholder={type === "CROPS" ? "e.g. Ha Foso Plot 3" : "e.g. SHED-Maseru-09"} />
            </div>
          </div>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>{type === "CROPS" ? "Crop Type *" : "Animal / Product Type *"}</label>
              <input style={s.input} required value={form.animalOrCrop} onChange={(e) => update("animalOrCrop", e.target.value)} placeholder={type === "CROPS" ? "e.g. Cabbage, Potatoes" : "e.g. Wool Sheep, Mohair Goats"} />
            </div>
            <div style={s.field}>
              <label style={s.label}>{type === "CROPS" ? "Harvest Date *" : "Shearing / Processing Date *"}</label>
              <input style={s.input} type="date" required value={form.dateProcessed} onChange={(e) => update("dateProcessed", e.target.value)} />
            </div>
          </div>
          <div style={s.field}>
            <label style={s.label}>{type === "CROPS" ? "Quantity / Yield" : "Number of Animals / Bales"}</label>
            <input style={s.input} value={form.quantity} onChange={(e) => update("quantity", e.target.value)} placeholder={type === "CROPS" ? "e.g. 200kg" : "e.g. 45 animals / 12 bales"} />
          </div>
          <div style={s.field}>
            <label style={s.label}>{type === "CROPS" ? "Fertilizers / Inputs Used" : "Vaccines / Medications Used"}</label>
            <input style={s.input} value={form.inputs} onChange={(e) => update("inputs", e.target.value)} placeholder={type === "CROPS" ? "e.g. Organic manure only" : "e.g. Ivermectin — cleared 30 days"} />
          </div>
          <div style={s.field}>
            <label style={s.label}>Certifications</label>
            <input style={s.input} value={form.certifications} onChange={(e) => update("certifications", e.target.value)} placeholder="e.g. Organic, Fair Trade, GlobalG.A.P." />
          </div>
          <div style={s.field}>
            <label style={s.label}>{type === "CROPS" ? "Soil Health Notes" : "Health / Veterinary Notes"}</label>
            <textarea style={{ ...s.input, height: "80px", resize: "vertical" }} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Any additional notes..." />
          </div>
        </div>

        <button style={s.btn} type="submit" disabled={loading}>
          {loading ? "⏳ Registering Batch..." : "🌿 Register Batch & Generate QR"}
        </button>
      </form>
    </div>
  );
}
