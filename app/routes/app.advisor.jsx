import { useActionData, useLoaderData, useSubmit, useNavigation, data } from "@remix-run/react";
import { useState } from "react";
import { Page, Card, TextField, Button, Text, BlockStack, Select } from "@shopify/polaris";
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
            description
            priceRangeV2 {
              minVariantPrice { amount currencyCode }
            }
            productType
            tags
          }
        }
      }
    }
  `);
  const json = await response.json();
  const products = json.data.products.edges.map(e => e.node);
  return data({ products });
}

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const question = formData.get("question");
  const language = formData.get("language");

  // Fetch products for context
  const response = await admin.graphql(`
    query {
      products(first: 50) {
        edges {
          node {
            title
            description
            priceRangeV2 {
              minVariantPrice { amount currencyCode }
            }
            productType
            tags
          }
        }
      }
    }
  `);
  const json = await response.json();
  const products = json.data.products.edges.map(e => e.node);
  const productList = products.map(p =>
    `- ${p.title} (${p.productType}) | Price: ${p.priceRangeV2.minVariantPrice.amount} ${p.priceRangeV2.minVariantPrice.currencyCode} | Tags: ${p.tags.join(", ")}`
  ).join("\n");

  const langInstruction = language === "st"
    ? "Respond in Sesotho (Sotho language of Lesotho)."
    : "Respond in English.";

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are an expert agricultural advisor for Lesotho specializing in IPM (Integrated Pest Management), biofertilisers, and regenerative agriculture. ${langInstruction}

You have access to the following REMOBU product catalog:
${productList}

When relevant, recommend specific products from the catalog above by name. Be concise and practical.

Farmer's question: ${question}`;

  const result = await model.generateContent(prompt);
  return data({ answer: result.response.text() });
}

export default function Advisor() {
  const { products } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState("en");
  const isLoading = navigation.state === "submitting";

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("question", question);
    formData.append("language", language);
    submit(formData, { method: "post" });
  };

  return (
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
          <BlockStack gap="200">
            <Text variant="headingMd">Your REMOBU Products ({products.length})</Text>
            <Text variant="bodySm" tone="subdued">These are loaded into the AI context automatically.</Text>
          </BlockStack>
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
  );
}
