import { redirect } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.callback(request);
  return redirect(`/app?shop=${session.shop}`);
};
