import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import db from "../db.server";

export async function loader({ params }) {
  const batch = await db.traceBatch.findUnique({
    where: { batchCode: params.batchId },
  });
  if (!batch) throw new Response("Batch not found", { status: 404 });
  return json({ batch });
}

export default function TracePublicPage() {
  const { batch } = useLoaderData();
  const isCrops = batch.type === "CROPS";

  const s = {
    page: { fontFamily: "Georgia, serif", background: "#fdfaf0", minHeight: "100vh", margin: 0, padding: 0 },
    hero: { background: "#1a3c2e", padding: "40px 24px 32px", textAlign: "center" },
    logo: { color: "#C8A951", fontSize: "28px", fontWeight: "bold", letterSpacing: "2px" },
    heroSub: { color: "#a8d5b5", fontSize: "14px", marginTop: "6px" },
    badge: { display: "inline-block", background: "#C8A951", color: "#1a3c2e", borderRadius: "20px", padding: "6px 18px", fontSize: "13px", fontWeight: "bold", marginTop: "16px" },
    body: { maxWidth: "600px", margin: "0 auto", padding: "32px 24px" },
    card: { background: "#fff", border: "1px solid #e0d9c8", borderRadius: "16px", padding: "24px", marginBottom: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" },
    cardTitle: { color: "#1a3c2e", fontSize: "16px", fontWeight: "bold", borderBottom: "2px solid #C8A951", paddingBottom: "10px", marginBottom: "16px" },
    row: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0ebe0", fontSize: "14px" },
    key: { color: "#5a7a6a", fontWeight: "bold" },
    val: { color: "#2d2d2d", textAlign: "right", maxWidth: "60%" },
    certBadge: { display: "inline-block", background: "#e8f5e9", color: "#2e7d32", borderRadius: "12px", padding: "4px 12px", fontSize: "12px", fontWeight: "bold", margin: "4px" },
    qrSection: { textAlign: "center", padding: "24px" },
    qrImg: { width: "160px", height: "160px", border: "4px solid #C8A951", borderRadius: "12px", margin: "0 auto 16px" },
    tagline: { background: "#1a3c2e", color: "#C8A951", textAlign: "center", padding: "24px", fontSize: "15px", fontStyle: "italic" },
    footer: { textAlign: "center", padding: "20px", color: "#5a7a6a", fontSize: "12px" },
  };

  const certs = batch.certifications
    ? batch.certifications.split(",").map((c) => c.trim()).filter(Boolean)
    : [];

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(batch.qrUrl)}`;

  return (
    <div style={s.page}>
      {/* Hero */}
      <div style={s.hero}>
        <div style={s.logo}>🌿 REMOBU</div>
        <div style={s.heroSub}>Verified African Origin Pass</div>
        <div style={s.badge}>{isCrops ? "🌱 Crop Batch" : "🐑 Livestock / Flock Batch"}</div>
      </div>

      <div style={s.body}>
        {/* Origin Details */}
        <div style={s.card}>
          <div style={s.cardTitle}>📍 Origin & Farmer Details</div>
          <div style={s.row}><span style={s.key}>Farmer</span><span style={s.val}>{batch.farmerName}</span></div>
          <div style={s.row}><span style={s.key}>Village</span><span style={s.val}>{batch.village}</span></div>
          <div style={s.row}><span style={s.key}>{isCrops ? "Plot / Co-op" : "Shearing Shed"}</span><span style={s.val}>{batch.plotOrShedId}</span></div>
          <div style={s.row}><span style={s.key}>{isCrops ? "Crop" : "Animal / Product"}</span><span style={s.val}>{batch.animalOrCrop}</span></div>
          {batch.quantity && <div style={s.row}><span style={s.key}>Quantity</span><span style={s.val}>{batch.quantity}</span></div>}
          <div style={s.row}><span style={s.key}>{isCrops ? "Harvest Date" : "Processing Date"}</span><span style={s.val}>{new Date(batch.dateProcessed).toLocaleDateString("en-LS", { year: "numeric", month: "long", day: "numeric" })}</span></div>
        </div>

        {/* Inputs & Health */}
        {batch.inputs && (
          <div style={s.card}>
            <div style={s.cardTitle}>{isCrops ? "🌿 Inputs & Farming Practices" : "💉 Animal Health & Veterinary Log"}</div>
            <p style={{ color: "#2d2d2d", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>{batch.inputs}</p>
          </div>
        )}

        {/* Certifications */}
        {certs.length > 0 && (
          <div style={s.card}>
            <div style={s.cardTitle}>🏅 Certifications</div>
            <div>{certs.map((c, i) => <span key={i} style={s.certBadge}>✓ {c}</span>)}</div>
          </div>
        )}

        {/* Notes */}
        {batch.notes && (
          <div style={s.card}>
            <div style={s.cardTitle}>📋 Additional Notes</div>
            <p style={{ color: "#2d2d2d", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>{batch.notes}</p>
          </div>
        )}

        {/* QR Code */}
        <div style={{ ...s.card, ...s.qrSection }}>
          <div style={s.cardTitle}>🔍 Verify This Batch</div>
          <img src={qrUrl} alt="QR Code" style={s.qrImg} />
          <p style={{ color: "#5a7a6a", fontSize: "12px" }}>Batch ID: <strong>{batch.batchCode}</strong></p>
          <p style={{ color: "#5a7a6a", fontSize: "11px" }}>Registered on {new Date(batch.createdAt).toLocaleDateString("en-LS")}</p>
        </div>
      </div>

      {/* Tagline */}
      <div style={s.tagline}>
        "Traced from the highlands of Lesotho to your table — by REMOBU Africa."
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <p>Powered by <strong>REMOBU Africa</strong> · remobu.africa</p>
        <p>This traceability pass is an immutable digital record secured by the Remobu Network.</p>
      </div>
    </div>
  );
}
