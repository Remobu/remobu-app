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

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});


app.use(express.static("build/client"));

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    const build = await import("./build/server/index.js");
    const { createRequestHandler } = _require("@remix-run/express");

    
app.post("/api/advisor", express.json(), async (req, res) => {
  try {
    const { question, language } = req.body;
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-04-17" });
    const prompt = language && language !== "en"
      ? `Answer in ${language}: ${question}`
      : question;
    const result = await model.generateContent(prompt);
    const answer = result.response.text();
    res.json({ answer });
  } catch (err) {
    console.error("Advisor error:", err);
    res.status(500).json({ answer: "Sorry, I could not get a response." });
  }
});

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
