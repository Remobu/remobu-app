import { redirect } from "@remix-run/node";

export async function loader() {
  return redirect("/login", {
    headers: { "Set-Cookie": "remobu_phone=; Path=/; Max-Age=0" }
  });
}
