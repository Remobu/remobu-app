import { useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  try {
    await authenticate.admin(request);
  } catch (error) {
    if (error instanceof Response) throw error;
    throw error;
  }
  return null;
};

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
