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

const host = (process.env.SHOPIFY_APP_URL && process.env.SHOPIFY_APP_URL.startsWith("http")) ? new URL(process.env.SHOPIFY_APP_URL).hostname : "localhost";

export default defineConfig({
  server: {
    allowedHosts: [host],
    host: "127.0.0.1",
    port: Number(process.env.PORT || 3000),
    hmr: false,
    fs: { allow: ["app", "node_modules"] },
  },
  plugins: [remixVitePlugin({
    browserNodeBuiltinsPolyfill: { modules: { module: true } },
  }), tsconfigPaths()],
  build: {
    cssMinify: "terser",
    assetsInlineLimit: 0,
    rollupOptions: {
      external: ["@prisma/client", ".prisma/client/default"],
    },
  },
  ssr: {
    noExternal: [
      "@shopify/polaris",
      "@shopify/shopify-api",
      "@google/generative-ai",
    ],
  },
});
