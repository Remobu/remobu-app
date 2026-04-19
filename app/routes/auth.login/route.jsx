import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

export const loader = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));
  return { errors };
};

export const action = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));
  return { errors };
};

export default function Auth() {
  const { errors } = useLoaderData();
  const actionData = useActionData();
  const allErrors = actionData?.errors || errors;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>REMOBU - Login</title>
      </head>
      <body style={{ fontFamily: "sans-serif", maxWidth: 400, margin: "80px auto", padding: 24 }}>
        <h1>Log in to REMOBU</h1>
        <Form method="post">
          <div style={{ marginBottom: 16 }}>
            <label>Shop domain</label><br />
            <input
              type="text"
              name="shop"
              placeholder="your-store.myshopify.com"
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            />
          </div>
          {allErrors?.shop && <p style={{ color: "red" }}>{allErrors.shop}</p>}
          <button type="submit" style={{ padding: "8px 24px" }}>Log in</button>
        </Form>
      </body>
    </html>
  );
}
