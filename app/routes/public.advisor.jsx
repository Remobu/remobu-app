import { useState } from "react";
import { data } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function action({ request }) {
  const formData = await request.formData();
  const question = formData.get("question");
  const language = formData.get("language") || "en";

  const langInstruction = language === "st"
    ? "Please respond in Sesotho."
    : "Please respond in English.";

  const prompt = `You are the Remobu Farm Advisor, an expert in African agriculture. ${langInstruction}\n\nFarmer's question: ${question}`;

  let answer = "";
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    answer = result.response.text();
  } catch (err) {
    answer = "Sorry, the advisor is temporarily unavailable. Please try again shortly.";
  }
  return data({ answer });
}

export default function PublicAdvisor() {
  const fetcher = useFetcher();
  const actionData = fetcher.data;
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState("en");
  const isLoading = fetcher.state === "submitting";

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("question", question);
    formData.append("language", language);
    fetcher.submit(formData, { method: "post" });
  };

  return (
    <div style={{fontFamily:"sans-serif",maxWidth:"600px",margin:"0 auto",padding:"20px",background:"#f9f5f0",minHeight:"100vh"}}>
      <div style={{background:"#2D5233",padding:"16px",borderRadius:"8px",marginBottom:"20px"}}>
        <h2 style={{color:"#C9922A",margin:0}}>🌾 Remobu Farm Advisor</h2>
        <p style={{color:"#F5F0E8",margin:"4px 0 0",fontSize:"13px",fontStyle:"italic"}}>we're the soil</p>
      </div>

      <div style={{background:"white",padding:"16px",borderRadius:"8px",marginBottom:"16px"}}>
        <label style={{display:"block",marginBottom:"8px",fontWeight:"bold",color:"#2D5233"}}>Language / Puo</label>
        <select value={language} onChange={e => setLanguage(e.target.value)}
          style={{width:"100%",padding:"8px",marginBottom:"16px",borderRadius:"4px",border:"1px solid #ccc"}}>
          <option value="en">English</option>
          <option value="st">Sesotho</option>
        </select>

        <label style={{display:"block",marginBottom:"8px",fontWeight:"bold",color:"#2D5233"}}>Your Question</label>
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          rows={3}
          placeholder="e.g. What controls work best for aphids on brassicas?"
          style={{width:"100%",padding:"8px",borderRadius:"4px",border:"1px solid #ccc",boxSizing:"border-box"}}
        />
        <button onClick={handleSubmit} disabled={isLoading}
          style={{marginTop:"12px",background:"#2D5233",color:"#F5F0E8",border:"none",padding:"10px 24px",borderRadius:"6px",cursor:"pointer",fontWeight:"bold",width:"100%"}}>
          {isLoading ? "Asking Advisor..." : "Ask Advisor"}
        </button>
      </div>

      {actionData?.answer && (
        <div style={{background:"white",padding:"16px",borderRadius:"8px",borderLeft:"4px solid #C9922A"}}>
          <h3 style={{color:"#2D5233",marginTop:0}}>Advisor Response</h3>
          <p style={{lineHeight:"1.6",color:"#333"}}>{actionData.answer}</p>
        </div>
      )}
    </div>
  );
}
