import { boundary } from "@shopify/shopify-app-react-router/server";
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

export const ErrorBoundary = boundary.error;

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
