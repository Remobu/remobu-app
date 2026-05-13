import { useState } from "react";
import { data } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function action({ request }) {
  const formData = await request.formData();
  const question = formData.get("question");
  const language = formData.get("language") || "en";
  const langInstruction = language === "st" ? "Please respond in Sesotho." : "Please respond in English.";
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
    if (!question.trim()) return;
    const formData = new FormData();
    formData.append("question", question);
    formData.append("language", language);
    fetcher.submit(formData, { method: "post", action: "/public/advisor" });
  };

  return (
    <div style={{fontFamily:"'Segoe UI',sans-serif",background:"#F5F0E8",minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      
      {/* Header */}
      <div style={{background:"#2D5233",padding:"12px 16px",display:"flex",alignItems:"center",gap:"12px"}}>
        {/* LOGO PLACEHOLDER - Replace src with your logo URL */}
        <div style={{width:"40px",height:"40px",borderRadius:"50%",background:"#C9922A",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",flexShrink:0}}>
          🌾
        </div>
        <div>
          <div style={{color:"#C9922A",fontWeight:"bold",fontSize:"16px"}}>Remobu Farm Advisor</div>
          <div style={{color:"#F5F0E8",fontSize:"11px",fontStyle:"italic"}}>we're the soil</div>
        </div>
      </div>

      {/* Chat Area */}
      <div style={{flex:1,padding:"16px",overflowY:"auto"}}>
        
        {/* Welcome message */}
        {!actionData?.answer && !isLoading && (
          <div style={{background:"white",borderRadius:"12px",padding:"14px",marginBottom:"12px",borderLeft:"3px solid #C9922A"}}>
            <p style={{margin:0,color:"#2D5233",fontSize:"14px"}}>👋 Hello! I'm your Remobu Farm Advisor. Ask me anything about farming, crops, soil, or pests!</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div style={{background:"white",borderRadius:"12px",padding:"14px",marginBottom:"12px",borderLeft:"3px solid #C9922A"}}>
            <p style={{margin:0,color:"#888",fontSize:"14px"}}>🌱 Thinking...</p>
          </div>
        )}

        {/* Answer */}
        {actionData?.answer && (
          <div style={{background:"white",borderRadius:"12px",padding:"14px",marginBottom:"12px",borderLeft:"3px solid #C9922A"}}>
            <p style={{margin:"0 0 6px",fontWeight:"bold",color:"#2D5233",fontSize:"13px"}}>🌾 Advisor</p>
            <p style={{margin:0,color:"#333",fontSize:"14px",lineHeight:"1.6",whiteSpace:"pre-wrap"}}>{actionData.answer}</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={{background:"white",padding:"12px",borderTop:"1px solid #ddd"}}>
        <select value={language} onChange={e => setLanguage(e.target.value)}
          style={{width:"100%",padding:"6px",marginBottom:"8px",borderRadius:"6px",border:"1px solid #ccc",fontSize:"13px",color:"#2D5233"}}>
          <option value="en">🇬🇧 English</option>
          <option value="st">🇱🇸 Sesotho</option>
        </select>
        <div style={{display:"flex",gap:"8px"}}>
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); handleSubmit(); }}}
            rows={2}
            placeholder="Ask your farming question..."
            style={{flex:1,padding:"8px",borderRadius:"6px",border:"1px solid #ccc",fontSize:"13px",resize:"none",fontFamily:"inherit"}}
          />
          <button onClick={handleSubmit} disabled={isLoading || !question.trim()}
            style={{background:"#2D5233",color:"#F5F0E8",border:"none",padding:"8px 14px",borderRadius:"6px",cursor:"pointer",fontWeight:"bold",fontSize:"13px",opacity:isLoading||!question.trim()?0.6:1}}>
            {isLoading ? "..." : "Ask"}
          </button>
        </div>
        <p style={{margin:"6px 0 0",fontSize:"11px",color:"#888",textAlign:"center"}}>Press Enter to send • Shift+Enter for new line</p>
      </div>
    </div>
  );
}
