import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

async function sendWhatsApp(phone, message) {
  if (!phone || !WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) return;
  await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone.replace(/\D/g, ""),
      type: "text",
      text: { body: message }
    })
  }).catch(() => {});
}

export async function loader({ request }) {
  await authenticate.admin(request);
  const applications = await prisma.advisorApplication.findMany({
    orderBy: { createdAt: "desc" }
  });
  return json({ applications });
}

export async function action({ request }) {
  await authenticate.admin(request);
  const form = await request.formData();
  const id = form.get("id");
  const action = form.get("action");
  const phone = form.get("phone");
  const name = form.get("name");

  await prisma.advisorApplication.update({
    where: { id },
    data: { status: action === "approve" ? "APPROVED" : "REJECTED" }
  });

  if (action === "approve") {
    await sendWhatsApp(phone,
      `Hello ${name},\n\nYour application to join the Remobu Advisor Network has been approved.\n\nYou can now access your advisor dashboard at:\nhttps://remobu-app-production.up.railway.app/advisor-dashboard\n\nWelcome to the Remobu network.`
    );
  } else {
    await sendWhatsApp(phone,
      `Hello ${name},\n\nThank you for applying to join the Remobu Advisor Network.\n\nAfter reviewing your application, we are unable to approve it at this time. You are welcome to reapply in future.\n\nFor queries, contact us on WhatsApp at +266 59 338 794.`
    );
  }

  return json({ success: true });
}

const STATUS_COLOR = {
  PENDING: "#C8A951",
  APPROVED: "#2d6a4f",
  REJECTED: "#c0392b"
};

export default function AdvisorAdmin() {
  const { applications } = useLoaderData();
  const fetcher = useFetcher();

  const pending = applications.filter(a => a.status === "PENDING");
  const reviewed = applications.filter(a => a.status !== "PENDING");

  return (
    <div style={{ fontFamily: "Georgia, serif", maxWidth: 860, margin: "0 auto", padding: "32px 24px", color: "#1a3c2e" }}>
      <div style={{ background: "linear-gradient(135deg,#0f2318,#1a3c2e)", borderRadius: 12, padding: "36px 32px", marginBottom: 32, border: "2px solid #C8A951" }}>
        <h1 style={{ color: "white", fontSize: 24, fontWeight: 700, margin: "0 0 6px" }}>Advisor Applications</h1>
        <p style={{ color: "#a8d5b5", fontSize: 14, margin: 0 }}>{pending.length} pending review</p>
      </div>

      {pending.length === 0 && (
        <div style={{ background: "#fdfaf0", border: "1px solid #e0d9c8", borderRadius: 10, padding: "24px", textAlign: "center", color: "#5a7a6a", fontSize: 14, marginBottom: 32 }}>
          No pending applications.
        </div>
      )}

      {pending.map(app => (
        <div key={app.id} style={{ background: "white", borderRadius: 12, border: "2px solid #C8A951", marginBottom: 20, overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(90deg,#f5f0e0,#fdfaf0)", borderBottom: "2px solid #C8A951", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#1a3c2e" }}>{app.fullName}</div>
              <div style={{ fontSize: 12, color: "#5a7a6a", marginTop: 2 }}>{app.specialization} — {app.location || "Location not provided"}</div>
            </div>
            <div style={{ fontSize: 11, color: "#C8A951", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Pending</div>
          </div>
          <div style={{ padding: "20px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                ["Phone", app.phone],
                ["Email", app.email || "Not provided"],
                ["Experience", app.experience || "Not provided"],
                ["Languages", app.languages || "Not provided"],
                ["Applied", new Date(app.createdAt).toLocaleDateString("en-LS", { year: "numeric", month: "long", day: "numeric" })],
                ["Qualifications", app.qualifications || "Not provided"]
              ].map(([label, value]) => (
                <div key={label} style={{ background: "#fdfaf0", border: "1px solid #e0d9c8", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#C8A951", marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13, color: "#1a3c2e", fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>
            {app.motivation && (
              <div style={{ background: "#fdfaf0", border: "1px solid #e0d9c8", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#C8A951", marginBottom: 4 }}>Motivation</div>
                <div style={{ fontSize: 13, color: "#2d4a3e", lineHeight: 1.7 }}>{app.motivation}</div>
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <fetcher.Form method="post" style={{ display: "inline" }}>
                <input type="hidden" name="id" value={app.id} />
                <input type="hidden" name="action" value="approve" />
                <input type="hidden" name="phone" value={app.phone} />
                <input type="hidden" name="name" value={app.fullName} />
                <button type="submit" style={{ background: "#1a3c2e", color: "#C8A951", border: "none", padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: "Georgia, serif", cursor: "pointer" }}>
                  Approve
                </button>
              </fetcher.Form>
              <fetcher.Form method="post" style={{ display: "inline" }}>
                <input type="hidden" name="id" value={app.id} />
                <input type="hidden" name="action" value="reject" />
                <input type="hidden" name="phone" value={app.phone} />
                <input type="hidden" name="name" value={app.fullName} />
                <button type="submit" style={{ background: "white", color: "#c0392b", border: "2px solid #c0392b", padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: "Georgia, serif", cursor: "pointer" }}>
                  Reject
                </button>
              </fetcher.Form>
            </div>
          </div>
        </div>
      ))}

      {reviewed.length > 0 && (
        <>
          <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#C8A951", margin: "32px 0 16px" }}>Reviewed</h2>
          {reviewed.map(app => (
            <div key={app.id} style={{ background: "white", borderRadius: 10, border: "1px solid #e0d9c8", marginBottom: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1a3c2e" }}>{app.fullName}</div>
                <div style={{ fontSize: 12, color: "#5a7a6a", marginTop: 2 }}>{app.specialization} — {new Date(app.createdAt).toLocaleDateString("en-LS")}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: STATUS_COLOR[app.status] }}>{app.status}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
