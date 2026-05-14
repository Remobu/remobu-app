import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('server.js', 'utf8');

const advisorRoute = `
app.post("/api/advisor", express.json(), async (req, res) => {
  try {
    const { question, language } = req.body;
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = language && language !== "en"
      ? \`Answer in \${language}: \${question}\`
      : question;
    const result = await model.generateContent(prompt);
    const answer = result.response.text();
    res.json({ answer });
  } catch (err) {
    console.error("Advisor error:", err);
    res.status(500).json({ answer: "Sorry, I could not get a response." });
  }
});
`;

content = content.replace('app.all("*", createRequestHandler({ build }));', advisorRoute + '\napp.all("*", createRequestHandler({ build }));');
writeFileSync('server.js', content);
console.log('Done!');
