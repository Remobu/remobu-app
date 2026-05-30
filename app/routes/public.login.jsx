import { json, redirect } from "@remix-run/node";
import { useActionData, Form, useNavigation } from "@remix-run/react";

export async function action({ request }) {
  const form = await request.formData();
  const step = form.get("step");
  const phone = form.get("phone")?.toString().trim();
  const otp = form.get("otp")?.toString().trim();

  if (step === "request") {
    const res = await fetch(`${process.env.APP_URL}/auth/otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request", phone })
    });
    const data = await res.json();
    if (!res.ok) return json({ error: data.error, step: "request", phone });
    return json({ step: "verify", phone, message: "OTP sent to your WhatsApp!" });
  }

  if (step === "verify") {
    const res = await fetch(`${process.env.APP_URL}/auth/otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", phone, otp })
    });
    const data = await res.json();
    if (!res.ok) return json({ error: data.error, step: "verify", phone });

    const role = data.user.role;
    const dest = role === "ADMIN" ? "/admin-dashboard" : role === "ADVISOR" ? "/public/advisor-dashboard" : "/farmer-dashboard";

    return redirect(dest, {
      headers: {
        "Set-Cookie": `remobu_phone=${encodeURIComponent(phone)}; Path=/; HttpOnly; Max-Age=2592000; SameSite=Lax`
      }
    });
  }

  return json({ error: "Invalid request", step: "request" });
}

export default function Login() {
  const action = useActionData();
  const nav = useNavigation();
  const busy = nav.state === "submitting";
  const step = action?.step || "request";
  const phone = action?.phone || "";

  return (
    <div style={{ fontFamily: "sans-serif", background: "#F5F0E8", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "white", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "380px", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img src="https://cdn.shopify.com/s/files/1/0975/4057/1438/files/Remobu_Logo.jpg?v=1778694454" alt="Remobu" style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "contain", border: "3px solid #2D5233" }} />
          <div style={{ color: "#2D5233", fontWeight: "bold", fontSize: "20px", marginTop: "10px" }}>Remobu Farm Advisor</div>
          <div style={{ color: "#888", fontSize: "13px" }}>Sign in with your WhatsApp number</div>
        </div>

        {action?.error && (
          <div style={{ background: "#fdecea", color: "#c0392b", padding: "10px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
            ❌ {action.error}
          </div>
        )}

        {action?.message && (
          <div style={{ background: "#eafaf1", color: "#27ae60", padding: "10px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
            ✅ {action.message}
          </div>
        )}

        {step === "request" ? (
          <Form method="post">
            <input type="hidden" name="step" value="request" />
            <label style={{ fontSize: "13px", color: "#555", fontWeight: "600" }}>WhatsApp Phone Number</label>
            <input
              name="phone"
              type="tel"
              placeholder="+26659338794"
              defaultValue={phone}
              required
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "15px", marginTop: "6px", marginBottom: "16px", boxSizing: "border-box" }}
            />
            <button type="submit" disabled={busy} style={{ width: "100%", background: "#2D5233", color: "white", border: "none", padding: "13px", borderRadius: "8px", fontSize: "15px", fontWeight: "bold", cursor: busy ? "not-allowed" : "pointer" }}>
              {busy ? "Sending..." : "Send OTP via WhatsApp"}
            </button>
          </Form>
        ) : (
          <Form method="post">
            <input type="hidden" name="step" value="verify" />
            <input type="hidden" name="phone" value={phone} />
            <div style={{ color: "#555", fontSize: "13px", marginBottom: "12px" }}>
              Enter the 6-digit code sent to <strong>{phone}</strong>
            </div>
            <input
              name="otp"
              type="text"
              placeholder="123456"
              maxLength={6}
              required
              autoFocus
              style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "2px solid #2D5233", fontSize: "22px", textAlign: "center", letterSpacing: "8px", marginBottom: "16px", boxSizing: "border-box" }}
            />
            <button type="submit" disabled={busy} style={{ width: "100%", background: "#2D5233", color: "white", border: "none", padding: "13px", borderRadius: "8px", fontSize: "15px", fontWeight: "bold", cursor: busy ? "not-allowed" : "pointer" }}>
              {busy ? "Verifying..." : "Verify & Login"}
            </button>
            <Form method="post" style={{ marginTop: "10px" }}>
              <input type="hidden" name="step" value="request" />
              <input type="hidden" name="phone" value={phone} />
              <button type="submit" style={{ width: "100%", background: "none", border: "1px solid #ddd", padding: "10px", borderRadius: "8px", fontSize: "13px", color: "#888", cursor: "pointer" }}>
                Resend OTP
              </button>
            </Form>
          </Form>
        )}

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "12px", color: "#aaa" }}>
          By signing in you agree to Remobu's terms of service
        </div>
      </div>
    </div>
  );
}
