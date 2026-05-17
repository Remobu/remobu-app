import { useActionData, useLoaderData, useFetcher, useNavigation } from "@remix-run/react";
import { data } from "@remix-run/react";
import { useState } from "react";
import { AppProvider, Page, Card, TextField, Button, Text, BlockStack, Select } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(`
    query {
      products(first: 50) {
        edges {
          node {
            title
            productType
            tags
            priceRangeV2 { minVariantPrice { amount currencyCode } }
          }
        }
      }
    }
  `);
  const json = await response.json();
  const products = json?.data?.products?.edges?.map(e => e.node) ?? [];
  return data({ products });
}

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const question = formData.get("question") ?? "";
  const language = formData.get("language") ?? "en";

  const response = await admin.graphql(`
    query {
      products(first: 50) {
        edges {
          node {
            title
            productType
            tags
            priceRangeV2 { minVariantPrice { amount currencyCode } }
          }
        }
      }
    }
  `);
  const json = await response.json();
  const products = json?.data?.products?.edges?.map(e => e.node) ?? [];
  const productList = products.map(p =>
    `- ${p.title} (${p.productType}) | Price: ${p.priceRangeV2.minVariantPrice.amount} ${p.priceRangeV2.minVariantPrice.currencyCode} | Tags: ${p.tags.join(", ")}`
  ).join("\n") || "No products listed.";

  const langInstruction = language === "st"
    ? "Respond in Sesotho (Sotho language of Lesotho)."
    : "Respond in English.";

  const prompt = `You are the Remobu Farm Advisor, a comprehensive expert in African agriculture and food systems. Your expertise spans: 1. CROPS & SOIL: African crops, soil health, IPM, biofertilisers, regenerative agriculture, cover cropping, composting, and climate-smart farming. 2. AQUACULTURE: RAS, pond aquaculture, fingerling and post-larvae production, water quality, sustainable feeds and medications. Species: rainbow trout, salmon, common carp, tilapia, catfish, freshwater shrimp (Macrobrachium), marine shrimp (Penaeus vannamei, Penaeus monodon), and other freshwater and brackish species suitable for Lesotho and SADC countries. 3. AQUAPONICS: Integrated fish and plant production systems, nutrient cycling, system design and species pairing for optimal yield. 4. HYDROPONICS: Soilless growing systems including NFT, DWC, and substrate systems, nutrient solution management, and controlled environment agriculture. 5. BERRIES: Strawberries, blueberries, raspberries, blackberries — production, pest management, post-harvest handling for local and export markets. 6. ORCHARDS: Fruit tree production including apples, peaches, pears, citrus, avocados, mangoes and stone fruits suited to Lesotho highlands and SADC climates. 7. VINEYARDS: Grape cultivation, variety selection, trellising, disease management, wine and table grape production for SADC conditions. 8. ENVIRONMENTAL DIAGNOSTICS & MONITORING: - Soil testing: interpretation of pH, EC, macro/micronutrients, CEC, organic matter, and remediation advice. - Plant tissue testing: nutrient deficiency/toxicity diagnosis, corrective fertilisation programs. - Water quality management: pH, DO, ammonia, nitrite, nitrate, turbidity, temperature, hardness for both aquaculture and irrigation systems. - Redox and electrochemical monitoring: ORP (oxidation-reduction potential), redox revolution principles, electron donor/acceptor dynamics in soil and water systems, and their role in nutrient availability, microbial activity, and plant/fish health. - Diagnostic systems: sensor-based monitoring, IoT integration guidance, and data interpretation for precision farming decisions. You advise on production for local consumption and regional/international export markets. Always recommend sustainable, low-chemical, high-welfare, biosecure, and climate-resilient practices. Ground all advice in the specific agroecological conditions of Lesotho and the broader SADC region. SADC SMALLHOLDER BASELINE DATA: LESOTHO: avg farm 0.5-1.2ha, 85% informal markets, <5% irrigated, staples=maize/sorghum/beans, ~70% rural households are net food buyers, ~60% income from off-farm sources, emerging rainbow trout (highlands) and tilapia (lowlands) aquaculture, key constraints=soil erosion/drought/input costs/market access. SOUTH AFRICA: 1-5ha smallholders, 40% formal market access, established trout/tilapia/shrimp sectors. ZIMBABWE: 1-3ha, 80% informal, tilapia pond culture, input shortages. ZAMBIA: 1.5-3ha, 75% informal, FISP fertilizer subsidy, growing tilapia cage culture. MALAWI: 0.4-0.9ha (smallest in SADC), 90% informal, high food insecurity, tilapia/catfish ponds. MOZAMBIQUE: 1-2ha, 88% informal, coastal shrimp (P.monodon), cyclone risk. TANZANIA: 1-3ha, 78% informal, tilapia/catfish, Lake Victoria Nile perch. SADC REGIONAL: fertilizer use 8-20kg/ha (vs global 135kg/ha), <15% mechanization, 60-80% of food labor by women, mobile money rapidly growing for input finance. Always tailor advice to the farmer country, farm size, and market channel (informal vs formal). ${langInstruction}\n\nREMOBU products:\n${productList}\n\nFarmer question: ${question}`;

  // Primary: AgrILLM by AI71
  let answer;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const agriRes = await fetch("https://api.ai71.ai/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${process.env.AI71_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "AI71ai/Llama-agrillm-3.3-70B",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 512
      })
    });
    clearTimeout(timeoutId);
    const agriJson = await agriRes.json();
    if (!agriJson.choices?.[0]?.message?.content) throw new Error("Empty AgrILLM response");
    answer = agriJson.choices[0].message.content;
  } catch (err) {
    console.warn("AgrILLM failed, falling back to Gemini:", err.message);
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      answer = result.response.text();
      console.log("Gemini success, answer length:", answer.length);
    } catch (err2) {
      console.error("Both providers failed:", err2.message, err2.stack);
      answer = "Sorry, the advisor is temporarily unavailable. Please try again shortly.";
    }
  }
  return data({ answer });
}

export default function Advisor() {
  const { products = [] } = useLoaderData() ?? {};
  const fetcher = useFetcher();
  const actionData = fetcher.data;
  const navigation = useNavigation();
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
    <AppProvider i18n={enTranslations}>
      <Page title="REMOBU AI Farm Advisor">
        <BlockStack gap="400">
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd">Ask your farming question</Text>
              <Select
                label="Language / Puo"
                options={[
                  { label: "English", value: "en" },
                  { label: "Sesotho", value: "st" },
                ]}
                value={language}
                onChange={setLanguage}
              />
              <TextField
                label="Question"
                value={question}
                onChange={setQuestion}
                multiline={3}
                placeholder="e.g. What controls work best for aphids on brassicas?"
              />
              <Button variant="primary" onClick={handleSubmit} loading={isLoading}>
                Ask Advisor
              </Button>
            </BlockStack>
          </Card>
          <Card>
            <Text variant="headingMd">Your REMOBU Products ({products.length})</Text>
          </Card>
          {actionData?.answer && (
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd">Advisor Response</Text>
                <Text>{actionData.answer}</Text>
              </BlockStack>
            </Card>
          )}
        </BlockStack>
      </Page>
    </AppProvider>
  );
}
