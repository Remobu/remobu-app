import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname } from "path";
import express from "express";
import { installGlobals } from "@remix-run/node";

installGlobals();

const __dirname = dirname(fileURLToPath(import.meta.url));
const _require = createRequire(import.meta.url);

const { PrismaClient } = _require("@prisma/client");
const prisma = new PrismaClient();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));

// Required for Shopify embedded app
app.use((req, res, next) => {
  const shop = req.query.shop || '';
  if (shop) {
    res.setHeader('Content-Security-Policy', `frame-ancestors https://${shop} https://admin.shopify.com;`);
  } else {
    res.setHeader('Content-Security-Policy', "frame-ancestors https://admin.shopify.com;");
  }
  next();
});
app.use(express.static("build/client"));

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    const build = await import("./build/server/index.js");
    const { createRequestHandler } = _require("@remix-run/express");

    app.all("*", createRequestHandler({ build }));

    app.listen(port, () => {
      console.log(`REMOBU server running on port ${port}`);
    });
  } catch (err) {
    console.error("STARTUP ERROR:", err);
    process.exit(1);
  }
}

startServer();
