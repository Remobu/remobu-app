import { json } from "@remix-run/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function action({ request }) {
  const { question, language } = await request.json();
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-04-17" });
  const prompt = language && language !== "en"
    ? `Answer in ${language}: ${question}`
    : question;
  const result = await model.generateContent(prompt);
  const answer = result.response.text();
  return json({ answer });
}
