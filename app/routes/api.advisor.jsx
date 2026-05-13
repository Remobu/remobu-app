import { GoogleGenerativeAI } from "@google/generative-ai";

export async function action({ request }) {
  const formData = await request.formData();
  const question = formData.get("question");
  const language = formData.get("language") || "en";
  const langInstruction = language === "st" ? "Araba ka Sesotho." : "Please respond in English.";
  const prompt = `You are the Remobu Farm Advisor, an expert in African agriculture, crops, soil, and pests. ${langInstruction}\n\nFarmer's question: ${question}`;
  
  let answer = "";
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    answer = result.response.text();
  } catch (err) {
    answer = "Sorry, the advisor is temporarily unavailable.";
  }

  return new Response(JSON.stringify({ answer }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }
  });
}

export async function loader() {
  return new Response(JSON.stringify({ status: "ok" }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    }
  });
}
