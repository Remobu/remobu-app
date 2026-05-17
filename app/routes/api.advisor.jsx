import { json } from "@remix-run/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function action({ request }) {
  const { question, language } = await request.json();
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-04-17" });
  const langInstruction = language === "st"
    ? "Araba ka Sesotho (Sesotho sa Lesotho, eseng Sesotho sa Afrika Borwa)."
    : "Please respond in English.";
  const prompt = `You are the Remobu Farm Advisor, an expert in African agriculture, crops, soil, and pests. ${langInstruction}\n\nFarmer's question: ${question}`;
  const result = await model.generateContent(prompt);
  const answer = result.response.text();
  return json({ answer });
}
