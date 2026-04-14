import express from "express";
import { createRequestHandler } from "@remix-run/express";
import { installGlobals } from "@remix-run/node";

installGlobals();

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

app.get("/webhook/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  console.log("WEBHOOK HIT:", { mode, token, VERIFY_TOKEN, match: token === VERIFY_TOKEN });
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

app.get("/debug/token", (req, res) => {
  res.json({ WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN || "NOT SET" });
});

const build = await import("./build/server/index.js");
app.all("*", createRequestHandler({ build }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🌱 REMOBU on port ${port}`));
