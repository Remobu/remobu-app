import { Link } from "@remix-run/react";

import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { data } from "@remix-run/react";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  return data({ shop: session.shop });
}

export default function Index() {
  const { shop } = useLoaderData();
  return (
    <div style={{padding: "20px", maxWidth: "800px", margin: "0 auto"}}>
      <h1 style={{fontSize: "24px", marginBottom: "16px"}}>Welcome to REMOBU App</h1>
      <Link to="/app/advisor" style={{display: "block", padding: "16px", background: "#008060", color: "white", borderRadius: "8px", textDecoration: "none", fontSize: "18px", textAlign: "center"}}>
        🌱 Open AI Farm Advisor
      </Link>
    </div>
  );
}
