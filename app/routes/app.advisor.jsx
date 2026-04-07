import { data } from "react-router";
import { useActionData, useSubmit, useNavigation } from "react-router";
import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function action({ request }) {
  const formData = await request.formData();
  const question = formData.get("question");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = "You are an expert agricultural advisor for Lesotho. Answer concisely: " + question;
  const result = await model.generateContent(prompt);
  return data({ answer: result.response.text() });
}

export default function Advisor() {
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const [question, setQuestion] = useState("");
  const isLoading = navigation.state === "submitting";
  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("question", question);
    submit(formData, { method: "post" });
  };
  return (
    <div style={{padding: "20px", maxWidth: "800px", margin: "0 auto"}}>
      <h1 style={{fontSize: "24px", marginBottom: "20px"}}>REMOBU AI Farm Advisor</h1>
      <textarea rows={4} style={{width: "100%", padding: "8px", fontSize: "16px"}}
        placeholder="e.g. What biological controls work best for aphids on brassicas?"
        value={question} onChange={(e) => setQuestion(e.target.value)} />
      <br/><br/>
      <button onClick={handleSubmit} disabled={isLoading}
        style={{padding: "10px 24px", fontSize: "16px", background: "#008060", color: "white", border: "none", borderRadius: "4px", cursor: "pointer"}}>
        {isLoading ? "Asking..." : "Ask Advisor"}
      </button>
      {actionData?.answer && (
        <div style={{marginTop: "24px", padding: "16px", background: "#f6f6f7", borderRadius: "8px"}}>
          <h2 style={{fontSize: "18px", marginBottom: "8px"}}>Advisor Response</h2>
          <p style={{whiteSpace: "pre-wrap"}}>{actionData.answer}</p>
        </div>
      )}
    </div>
  );
}
