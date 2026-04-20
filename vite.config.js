import { vitePlugin as remixVitePlugin } from "@remix-run/dev";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vite";

if (
  process.env.HOST &&
  (!process.env.SHOPIFY_APP_URL ||
    process.env.SHOPIFY_APP_URL === process.env.HOST)
) {
  process.env.SHOPIFY_APP_URL = process.env.HOST;
  delete process.env.HOST;
}

const host = new URL(process.env.SHOPIFY_APP_URL || "http://localhost").hostname;

export default defineConfig({
  server: {
    allowedHosts: [host],
    port: Number(process.env.PORT || 3000),
    hmr: false,
    fs: { allow: ["app", "node_modules"] },
  },
  plugins: [remixVitePlugin(), tsconfigPaths()],
  build: { assetsInlineLimit: 0 },
  ssr: {
    noExternal: [
      "@shopify/polaris",
      "@shopify/app-bridge-react",
      "@shopify/shopify-app-remix",
      "@google/generative-ai",
    ],
  },
});
