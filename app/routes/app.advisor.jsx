import { useActionData, useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
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

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `You are an expert agricultural advisor for Lesotho. ${langInstruction}\n\nREMOBU products:\n${productList}\n\nFarmer's question: ${question}`;
  const result = await model.generateContent(prompt);
  return data({ answer: result.response.text() });
}

export default function Advisor() {
  const { products = [] } = useLoaderData() ?? {};
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
