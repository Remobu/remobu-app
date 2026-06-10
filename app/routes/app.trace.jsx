import { useLoaderData, useNavigate } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export async function loader({ request }) {
  await authenticate.admin(request);
  const batches = await db.traceBatch.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const total = await db.traceBatch.count();
  const crops = await db.traceBatch.count({ where: { type: "CROPS" } });
  const livestock = await db.traceBatch.count({ where: { type: "LIVESTOCK" } });
  return json({ batches, stats: { total, crops, livestock } });
}

export default function TraceAdmin() {
  const { batches, stats } = useLoaderData();
  const navigate = useNavigate();

  const styles = {
    page: { fontFamily: "Georgia, serif", background: "#fdfaf0", minHeight: "100vh", padding: "32px" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" },
    title: { color: "#1a3c2e", fontSize: "28px", fontWeight: "bold", margin: 0 },
    subtitle: { color: "#5a7a6a", fontSize: "14px", margin: "4px 0 0 0" },
    btn: { background: "#1a3c2e", color: "#C8A951", border: "none", borderRadius: "8px", padding: "12px 24px", fontSize: "15px", fontWeight: "bold", cursor: "pointer" },
    statsRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" },
    statCard: { background: "#fff", border: "2px solid #C8A951", borderRadius: "12px", padding: "20px", textAlign: "center" },
    statNum: { fontSize: "36px", fontWeight: "bold", color: "#1a3c2e" },
    statLabel: { color: "#5a7a6a", fontSize: "13px", marginTop: "4px" },
    table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
    th: { background: "#1a3c2e", color: "#C8A951", padding: "14px 16px", textAlign: "left", fontSize: "13px", fontWeight: "bold" },
    td: { padding: "14px 16px", borderBottom: "1px solid #f0ebe0", fontSize: "14px", color: "#2d2d2d" },
    badge: (type) => ({ background: type === "CROPS" ? "#e8f5e9" : "#fff3e0", color: type === "CROPS" ? "#2e7d32" : "#e65100", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: "bold" }),
    qrLink: { color: "#1a3c2e", textDecoration: "none", fontWeight: "bold", fontSize: "12px" },
    empty: { textAlign: "center", padding: "60px", color: "#5a7a6a" },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🌿 Remobu Trace</h1>
          <p style={styles.subtitle}>Farm-to-Flock QR Traceability Network — Lesotho</p>
        </div>
        <button style={styles.btn} onClick={() => window.open("https://admin.shopify.com/store/remobu-2/apps/remobu-trace/app/trace/new", "_top")}>
          + Register New Batch
        </button>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statNum}>{stats.total}</div>
          <div style={styles.statLabel}>Total Batches Registered</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statNum, color: "#2e7d32" }}>{stats.crops}</div>
          <div style={styles.statLabel}>🌱 Crop Batches</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statNum, color: "#e65100" }}>{stats.livestock}</div>
          <div style={styles.statLabel}>🐑 Livestock/Flock Batches</div>
        </div>
      </div>

      {batches.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ fontSize: "48px" }}>🌾</p>
          <p>No batches registered yet. Click <strong>Register New Batch</strong> to get started.</p>
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Batch Code</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Farmer</th>
              <th style={styles.th}>Village</th>
              <th style={styles.th}>Product</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>WhatsApp</th>
              <th style={styles.th}>QR Code</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.id}>
                <td style={styles.td}><strong>{b.batchCode}</strong></td>
                <td style={styles.td}><span style={styles.badge(b.type)}>{b.type}</span></td>
                <td style={styles.td}>{b.farmerName}</td>
                <td style={styles.td}>{b.village}</td>
                <td style={styles.td}>{b.animalOrCrop}</td>
                <td style={styles.td}>{new Date(b.dateProcessed).toLocaleDateString("en-LS")}</td>
                <td style={styles.td}>{b.whatsappSent ? "✅ Sent" : "⏳ Pending"}</td>
                <td style={styles.td}>
                  {b.qrUrl && (
                    <a href={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(b.qrUrl)}`}
                      target="_blank" rel="noreferrer" style={styles.qrLink}>
                      📷 View QR
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
