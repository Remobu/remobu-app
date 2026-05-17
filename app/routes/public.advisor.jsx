import { useState } from "react";
import { data } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const LOGO = "https://cdn.shopify.com/s/files/1/0975/4057/1438/files/Remobu_Logo.jpg?v=1778694454";

export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });
  }
  return new Response("OK", {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    }
  });
}

export async function action({ request }) {
  const formData = await request.formData();
  const question = formData.get("question");
  const language = formData.get("language") || "en";
  const langInstruction = language === "st" ? "Araba ka Sesotho." : "Please respond in English.";
  const prompt = `You are the Remobu Farm Advisor, a comprehensive expert in African agriculture and food systems. Your expertise spans: 1. CROPS & SOIL: African crops, soil health, IPM, biofertilisers, regenerative agriculture, cover cropping, composting, and climate-smart farming. 2. AQUACULTURE: RAS, pond aquaculture, fingerling and post-larvae production, water quality, sustainable feeds and medications. Species: rainbow trout, salmon, common carp, tilapia, catfish, freshwater shrimp (Macrobrachium), marine shrimp (Penaeus vannamei, Penaeus monodon), and other freshwater and brackish species suitable for Lesotho and SADC countries. 3. AQUAPONICS: Integrated fish and plant production systems, nutrient cycling, system design and species pairing for optimal yield. 4. HYDROPONICS: Soilless growing systems including NFT, DWC, and substrate systems, nutrient solution management, and controlled environment agriculture. 5. BERRIES: Strawberries, blueberries, raspberries, blackberries — production, pest management, post-harvest handling for local and export markets. 6. ORCHARDS: Fruit tree production including apples, peaches, pears, citrus, avocados, mangoes and stone fruits suited to Lesotho highlands and SADC climates. 7. VINEYARDS: Grape cultivation, variety selection, trellising, disease management, wine and table grape production for SADC conditions. 8. ENVIRONMENTAL DIAGNOSTICS & MONITORING: - Soil testing: interpretation of pH, EC, macro/micronutrients, CEC, organic matter, and remediation advice. - Plant tissue testing: nutrient deficiency/toxicity diagnosis, corrective fertilisation programs. - Water quality management: pH, DO, ammonia, nitrite, nitrate, turbidity, temperature, hardness for both aquaculture and irrigation systems. - Redox and electrochemical monitoring: ORP (oxidation-reduction potential), redox revolution principles, electron donor/acceptor dynamics in soil and water systems, and their role in nutrient availability, microbial activity, and plant/fish health. - Diagnostic systems: sensor-based monitoring, IoT integration guidance, and data interpretation for precision farming decisions. You advise on production for local consumption and regional/international export markets. Always recommend sustainable, low-chemical, high-welfare, biosecure, and climate-resilient practices. Ground all advice in the specific agroecological conditions of Lesotho and the broader SADC region. ${langInstruction}\n\nFarmer's question: ${question}`;
  let answer = "";
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    answer = result.response.text();
  } catch (err) {
    console.error("Gemini error:", err);
    answer = "Sorry, the advisor is temporarily unavailable. Please try again shortly.";
  }
  return data({ answer }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }
  });
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
        <div style={{width:"44px",height:"44px",borderRadius:"50%",background:"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden",padding:"4px",boxSizing:"border-box"}}>
          <img src={LOGO} alt="Remobu Logo" style={{width:"100%",height:"100%",objectFit:"contain",borderRadius:"50%"}}/>
        </div>
        <div>
          <div style={{color:"#C9922A",fontWeight:"bold",fontSize:"16px",letterSpacing:"0.5px"}}>Remobu Farm Advisor</div>
          <div style={{color:"#F5F0E8",fontSize:"11px",fontStyle:"italic"}}>we're the soil</div>
        </div>
      </div>

      {/* Chat Area */}
      <div style={{flex:1,padding:"16px",overflowY:"auto",display:"flex",flexDirection:"column",gap:"12px"}}>

        {/* Welcome */}
        {!actionData?.answer && !isLoading && (
          <div style={{background:"white",borderRadius:"12px",padding:"14px",borderLeft:"3px solid #C9922A"}}>
            <p style={{margin:0,color:"#2D5233",fontSize:"14px",lineHeight:"1.6"}}>👋 Hello! I'm your <strong>Remobu Farm Advisor</strong>. Ask me anything about farming, crops, soil health, or pests!</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div style={{background:"white",borderRadius:"12px",padding:"14px",borderLeft:"3px solid #C9922A"}}>
            <p style={{margin:0,color:"#888",fontSize:"14px"}}>🌱 Thinking...</p>
          </div>
        )}

        {/* Answer */}
        {actionData?.answer && (
          <div style={{background:"white",borderRadius:"12px",padding:"14px",borderLeft:"3px solid #C9922A"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
              <div style={{width:"28px",height:"28px",borderRadius:"50%",background:"white",border:"1px solid #ddd",overflow:"hidden",padding:"2px",boxSizing:"border-box"}}>
                <img src={LOGO} alt="Remobu" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
              </div>
              <span style={{fontWeight:"bold",color:"#2D5233",fontSize:"13px"}}>Remobu Advisor</span>
            </div>
            <p style={{margin:0,color:"#333",fontSize:"14px",lineHeight:"1.7",whiteSpace:"pre-wrap"}}>{actionData.answer}</p>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{background:"white",padding:"12px",borderTop:"2px solid #2D5233"}}>
        <select value={language} onChange={e => setLanguage(e.target.value)}
          style={{width:"100%",padding:"6px 8px",marginBottom:"8px",borderRadius:"6px",border:"1px solid #ccc",fontSize:"13px",color:"#2D5233",background:"#F5F0E8"}}>
          <option value="en">🇬🇧 English</option>
          <option value="st">🇱🇸 Sesotho</option>
        </select>
        <div style={{display:"flex",gap:"8px"}}>
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); handleSubmit(); }}}
            rows={2}
            placeholder="Ask your farming question..."
            style={{flex:1,padding:"8px",borderRadius:"6px",border:"1px solid #ccc",fontSize:"13px",resize:"none",fontFamily:"inherit",outline:"none"}}
          />
          <button onClick={handleSubmit} disabled={isLoading || !question.trim()}
            style={{background:isLoading||!question.trim()?"#888":"#2D5233",color:"white",border:"none",padding:"8px 14px",borderRadius:"6px",cursor:isLoading||!question.trim()?"not-allowed":"pointer",fontWeight:"bold",fontSize:"13px",transition:"background 0.2s"}}>
            {isLoading ? "..." : "Ask"}
          </button>
        </div>
        <p style={{margin:"6px 0 0",fontSize:"11px",color:"#aaa",textAlign:"center"}}>Enter to send • Shift+Enter for new line</p>
      </div>
    </div>
  );
}
