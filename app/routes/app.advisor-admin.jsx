import { json } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function loader() {
  const advisors = await prisma.advisor.findMany({
    include: {
      user: { select: { email: true } },
      cohorts: true,
      transactions: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return json({ advisors });
}

export async function action({ request }) {
  const form = await request.formData();
  const intent = form.get("intent");
  const advisorId = form.get("advisorId");

  if (intent === "approve") {
    await prisma.advisor.update({
      where: { id: advisorId },
      data: { isActive: true, isVerified: true },
    });
    return json({ success: true, message: "Advisor approved!" });
  }

  if (intent === "reject") {
    await prisma.advisor.update({
      where: { id: advisorId },
      data: { isActive: false, isVerified: false },
    });
    return json({ success: true, message: "Advisor rejected!" });
  }

  if (intent === "suspend") {
    await prisma.advisor.update({
      where: { id: advisorId },
      data: { isActive: false },
    });
    return json({ success: true, message: "Advisor suspended!" });
  }

  return json({ error: "Unknown intent" });
}

const MONTHLY_FEES = {
  LSL: { symbol: "M"   }, ZAR: { symbol: "R"   }, BWP: { symbol: "P"   },
  SZL: { symbol: "E"   }, NAD: { symbol: "N$"  }, USD: { symbol: "$"   },
  ZMW: { symbol: "K"   }, MWK: { symbol: "MK"  }, MZN: { symbol: "MT"  },
  TZS: { symbol: "TZS" }, AOA: { symbol: "Kz"  }, CDF: { symbol: "FC"  },
  MGA: { symbol: "Ar"  }, MUR: { symbol: "Rs"  },
};

export default function AdvisorAdmin() {
  const { advisors } = useLoaderData();

  const pending  = advisors.filter(a => !a.isVerified && a.isActive);
  const active   = advisors.filter(a => a.isVerified && a.isActive);
  const inactive = advisors.filter(a => !a.isActive);

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <h1 style={{ color: "#2d6a4f" }}>🛡️ Remobu Advisor Approval Panel</h1>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <StatCard label="Pending Approval" value={pending.length}  color="#f59e0b" />
        <StatCard label="Active Advisors"  value={active.length}   color="#10b981" />
        <StatCard label="Inactive/Rejected" value={inactive.length} color="#ef4444" />
        <StatCard label="Total"            value={advisors.length} color="#6366f1" />
      </div>

      <Section title="⏳ Pending Approval" advisors={pending} showApprove showReject />
      <Section title="✅ Active Advisors"  advisors={active}  showSuspend />
      <Section title="❌ Inactive / Rejected" advisors={inactive} showApprove />
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: color, color: "white", borderRadius: 8, padding: "16px 24px", minWidth: 140 }}>
      <div style={{ fontSize: 32, fontWeight: "bold" }}>{value}</div>
      <div style={{ fontSize: 13 }}>{label}</div>
    </div>
  );
}

function Section({ title, advisors, showApprove, showReject, showSuspend }) {
  if (!advisors.length) return null;
  return (
    <div style={{ marginBottom: 32 }}>
      <h2>{title} ({advisors.length})</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#e8f5e9" }}>
            <th style={th}>Name</th>
            <th style={th}>Email</th>
            <th style={th}>Phone</th>
            <th style={th}>Country</th>
            <th style={th}>Currency</th>
            <th style={th}>Monthly Fee</th>
            <th style={th}>Cohorts</th>
            <th style={th}>Transactions</th>
            <th style={th}>Registered</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {advisors.map(a => {
            const sym = MONTHLY_FEES[a.currency]?.symbol || "";
            return (
              <tr key={a.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={td}><strong>{a.user?.email || a.id}</strong></td>
                <td style={td}>{a.user?.email || "—"}</td>
                <td style={td}>{a.payoutAccount || "—"}</td>
                <td style={td}>{a.specialization}</td>
                <td style={td}>{a.currency || "LSL"}</td>
                <td style={td}>{sym}{a.monthlyFee?.toLocaleString() || "50"}</td>
                <td style={td}>{a.cohorts?.length || 0}</td>
                <td style={td}>{a.transactions?.length || 0}</td>
                <td style={td}>{new Date(a.createdAt).toLocaleDateString()}</td>
                <td style={td}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {showApprove && (
                      <Form method="post">
                        <input type="hidden" name="intent" value="approve" />
                        <input type="hidden" name="advisorId" value={a.id} />
                        <button style={{ ...btn, background: "#10b981" }}>✅ Approve</button>
                      </Form>
                    )}
                    {showReject && (
                      <Form method="post">
                        <input type="hidden" name="intent" value="reject" />
                        <input type="hidden" name="advisorId" value={a.id} />
                        <button style={{ ...btn, background: "#ef4444" }}>❌ Reject</button>
                      </Form>
                    )}
                    {showSuspend && (
                      <Form method="post">
                        <input type="hidden" name="intent" value="suspend" />
                        <input type="hidden" name="advisorId" value={a.id} />
                        <button style={{ ...btn, background: "#f59e0b" }}>⏸ Suspend</button>
                      </Form>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const th = { padding: 10, textAlign: "left", fontSize: 13, borderBottom: "2px solid #ccc" };
const td = { padding: 10, fontSize: 13 };
const btn = { padding: "6px 12px", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 };
