import { vitePlugin } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

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
    cors: { preflightContinue: true },
    port: Number(process.env.PORT || 3000),
    hmr: host === "localhost"
      ? { protocol: "ws", host: "localhost", port: 64999, clientPort: 64999 }
      : { protocol: "wss", host, port: parseInt(process.env.FRONTEND_PORT) || 8002, clientPort: 443 },
    fs: { allow: ["app", "node_modules"] },
  },
  resolve: {
    alias: {
      "@shopify/shopify-app-remix/react": new URL("./node_modules/@shopify/shopify-app-remix/dist/esm/react/index.mjs", import.meta.url).pathname,
    },
  },
  plugins: [vitePlugin(), tsconfigPaths()],
  build: { assetsInlineLimit: 0 },
  optimizeDeps: { include: ["@shopify/app-bridge-react"] },
});
