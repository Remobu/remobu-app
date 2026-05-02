var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: !0 });
};

// app/entry.server.jsx
var entry_server_exports = {};
__export(entry_server_exports, {
  default: () => handleRequest,
  streamTimeout: () => streamTimeout
});
import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { RemixServer } from "@remix-run/react";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { isbot } from "isbot";

// app/shopify.server.js
import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";

// app/db.server.js
import prismaClientPkg from "@prisma/client";
var { PrismaClient } = prismaClientPkg;
global.prismaGlobal || (global.prismaGlobal = new PrismaClient());
var prisma = global.prismaGlobal ?? new PrismaClient(), db_server_default = prisma;

// app/shopify.server.js
var appUrl = process.env.SHOPIFY_APP_URL || process.env.HOST, shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(","),
  appUrl,
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(db_server_default),
  distribution: AppDistribution.AppStore,
  future: {
    expiringOfflineAccessTokens: !0
    // unstable_newEmbeddedAuthStrategy: true,
  },
  ...process.env.SHOP_CUSTOM_DOMAIN ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] } : {}
});
var apiVersion = ApiVersion.October25, addDocumentResponseHeaders = shopify.addDocumentResponseHeaders, authenticate = shopify.authenticate, unauthenticated = shopify.unauthenticated, login = shopify.login, registerWebhooks = shopify.registerWebhooks, sessionStorage = shopify.sessionStorage;

// app/entry.server.jsx
import { jsxDEV } from "react/jsx-dev-runtime";
var streamTimeout = 5e3;
async function handleRequest(request, responseStatusCode, responseHeaders, reactRouterContext) {
  addDocumentResponseHeaders(request, responseHeaders), responseHeaders.set("ngrok-skip-browser-warning", "true");
  let userAgent = request.headers.get("user-agent"), callbackName = isbot(userAgent ?? "") ? "onAllReady" : "onShellReady";
  return new Promise((resolve, reject) => {
    let { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsxDEV(RemixServer, { context: reactRouterContext, url: request.url }, void 0, !1, {
        fileName: "app/entry.server.jsx",
        lineNumber: 23,
        columnNumber: 7
      }, this),
      {
        [callbackName]: () => {
          let body = new PassThrough(), stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html"), resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          ), pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500, console.error(error);
        }
      }
    );
    setTimeout(abort, streamTimeout + 1e3);
  });
}

// app/root.jsx
var root_exports = {};
__export(root_exports, {
  ErrorBoundary: () => ErrorBoundary,
  default: () => App
});
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteError, isRouteErrorResponse } from "@remix-run/react";
import { jsxDEV as jsxDEV2 } from "react/jsx-dev-runtime";
function App() {
  return /* @__PURE__ */ jsxDEV2("html", { lang: "en", children: [
    /* @__PURE__ */ jsxDEV2("head", { children: [
      /* @__PURE__ */ jsxDEV2("meta", { charSet: "utf-8" }, void 0, !1, {
        fileName: "app/root.jsx",
        lineNumber: 7,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV2("meta", { name: "viewport", content: "width=device-width,initial-scale=1" }, void 0, !1, {
        fileName: "app/root.jsx",
        lineNumber: 8,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV2("link", { rel: "preconnect", href: "https://cdn.shopify.com/" }, void 0, !1, {
        fileName: "app/root.jsx",
        lineNumber: 9,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV2(
        "link",
        {
          rel: "stylesheet",
          href: "https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        },
        void 0,
        !1,
        {
          fileName: "app/root.jsx",
          lineNumber: 10,
          columnNumber: 9
        },
        this
      ),
      /* @__PURE__ */ jsxDEV2(Meta, {}, void 0, !1, {
        fileName: "app/root.jsx",
        lineNumber: 14,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV2(Links, {}, void 0, !1, {
        fileName: "app/root.jsx",
        lineNumber: 15,
        columnNumber: 9
      }, this)
    ] }, void 0, !0, {
      fileName: "app/root.jsx",
      lineNumber: 6,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV2("body", { children: [
      /* @__PURE__ */ jsxDEV2(Outlet, {}, void 0, !1, {
        fileName: "app/root.jsx",
        lineNumber: 18,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV2(ScrollRestoration, {}, void 0, !1, {
        fileName: "app/root.jsx",
        lineNumber: 19,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV2(Scripts, {}, void 0, !1, {
        fileName: "app/root.jsx",
        lineNumber: 20,
        columnNumber: 9
      }, this)
    ] }, void 0, !0, {
      fileName: "app/root.jsx",
      lineNumber: 17,
      columnNumber: 7
    }, this)
  ] }, void 0, !0, {
    fileName: "app/root.jsx",
    lineNumber: 5,
    columnNumber: 5
  }, this);
}
function ErrorBoundary() {
  let error = useRouteError();
  if (isRouteErrorResponse(error))
    return null;
  throw error;
}

// app/routes/webhooks.app.scopes_update.jsx
var webhooks_app_scopes_update_exports = {};
__export(webhooks_app_scopes_update_exports, {
  action: () => action
});
var action = async ({ request }) => {
  let { payload, session, topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);
  let current = payload.current;
  return session && await db_server_default.session.update({
    where: {
      id: session.id
    },
    data: {
      scope: current.toString()
    }
  }), new Response();
};

// app/routes/webhooks.app.uninstalled.jsx
var webhooks_app_uninstalled_exports = {};
__export(webhooks_app_uninstalled_exports, {
  action: () => action2
});
var action2 = async ({ request }) => {
  let { shop, session, topic } = await authenticate.webhook(request);
  return console.log(`Received ${topic} webhook for ${shop}`), session && await db_server_default.session.deleteMany({ where: { shop } }), new Response();
};

// app/routes/webhook.whatsapp.jsx
var webhook_whatsapp_exports = {};
__export(webhook_whatsapp_exports, {
  action: () => action3,
  config: () => config,
  loader: () => loader
});
import { json } from "@remix-run/node";
var config = { unstable_middleware: !1 }, VERIFY_TOKEN = (process.env.WEBHOOK_VERIFY_TOKEN || "").trim(), WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN, PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID, GEMINI_API_KEY = process.env.GEMINI_API_KEY;
async function loader({ request }) {
  let url = new URL(request.url), mode2 = url.searchParams.get("hub.mode"), token = url.searchParams.get("hub.verify_token"), challenge = url.searchParams.get("hub.challenge");
  return mode2 === "subscribe" && token === VERIFY_TOKEN ? new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } }) : new Response("Forbidden", { status: 403 });
}
async function action3({ request }) {
  try {
    let text = await request.text();
    console.log("\u{1F4E8} Raw webhook body:", text);
    let message = JSON.parse(text).entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message)
      return console.log("\u26A0\uFE0F No message in payload"), json({ status: "no message" });
    let from = message.from, text2 = message.text?.body || "Hello";
    console.log(`\u{1F4F1} Message from ${from}: ${text2}`);
    let reply = await getGeminiResponse(text2);
    return await sendWhatsAppMessage(from, reply), json({ status: "ok" });
  } catch (err) {
    return console.error("\u274C Webhook error:", err.message), json({ status: "error", error: err.message }, { status: 500 });
  }
}
async function getGeminiResponse(userMessage) {
  let systemPrompt = `You are REMOBU Farm Advisor, an expert agricultural assistant serving farmers in Lesotho and the SADC region. 
You specialize in horticulture, cannabis cultivation, animal husbandry, regenerative farming, and SACU trade.
Respond in the same language the farmer uses (Sesotho or English).
Keep responses concise and practical for smallholder farmers.
Always provide actionable advice.`;
  return (await (await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}

Farmer: ${userMessage}` }] }]
      })
    }
  )).json()).candidates?.[0]?.content?.parts?.[0]?.text || "I could not process your request. Please try again.";
}
async function sendWhatsAppMessage(to, message) {
  let result = await (await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WHATSAPP_TOKEN}`
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message }
    })
  })).json();
  console.log("\u{1F4E4} WhatsApp send result:", JSON.stringify(result));
}

// app/routes/app.additional.jsx
var app_additional_exports = {};
__export(app_additional_exports, {
  default: () => AdditionalPage
});
import { jsxDEV as jsxDEV3 } from "react/jsx-dev-runtime";
function AdditionalPage() {
  return /* @__PURE__ */ jsxDEV3("s-page", { heading: "Additional page", children: [
    /* @__PURE__ */ jsxDEV3("s-section", { heading: "Multiple pages", children: [
      /* @__PURE__ */ jsxDEV3("s-paragraph", { children: [
        "The app template comes with an additional page which demonstrates how to create multiple pages within app navigation using",
        " ",
        /* @__PURE__ */ jsxDEV3(
          "s-link",
          {
            href: "https://shopify.dev/docs/apps/tools/app-bridge",
            target: "_blank",
            children: "App Bridge"
          },
          void 0,
          !1,
          {
            fileName: "app/routes/app.additional.jsx",
            lineNumber: 8,
            columnNumber: 11
          },
          this
        ),
        "."
      ] }, void 0, !0, {
        fileName: "app/routes/app.additional.jsx",
        lineNumber: 5,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV3("s-paragraph", { children: [
        "To create your own page and have it show up in the app navigation, add a page inside ",
        /* @__PURE__ */ jsxDEV3("code", { children: "app/routes" }, void 0, !1, {
          fileName: "app/routes/app.additional.jsx",
          lineNumber: 18,
          columnNumber: 25
        }, this),
        ", and a link to it in the",
        " ",
        /* @__PURE__ */ jsxDEV3("code", { children: "<ui-nav-menu>" }, void 0, !1, {
          fileName: "app/routes/app.additional.jsx",
          lineNumber: 19,
          columnNumber: 11
        }, this),
        " component found in",
        " ",
        /* @__PURE__ */ jsxDEV3("code", { children: "app/routes/app.jsx" }, void 0, !1, {
          fileName: "app/routes/app.additional.jsx",
          lineNumber: 20,
          columnNumber: 11
        }, this),
        "."
      ] }, void 0, !0, {
        fileName: "app/routes/app.additional.jsx",
        lineNumber: 16,
        columnNumber: 9
      }, this)
    ] }, void 0, !0, {
      fileName: "app/routes/app.additional.jsx",
      lineNumber: 4,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV3("s-section", { slot: "aside", heading: "Resources", children: /* @__PURE__ */ jsxDEV3("s-unordered-list", { children: /* @__PURE__ */ jsxDEV3("s-list-item", { children: /* @__PURE__ */ jsxDEV3(
      "s-link",
      {
        href: "https://shopify.dev/docs/apps/design-guidelines/navigation#app-nav",
        target: "_blank",
        children: "App nav best practices"
      },
      void 0,
      !1,
      {
        fileName: "app/routes/app.additional.jsx",
        lineNumber: 26,
        columnNumber: 13
      },
      this
    ) }, void 0, !1, {
      fileName: "app/routes/app.additional.jsx",
      lineNumber: 25,
      columnNumber: 11
    }, this) }, void 0, !1, {
      fileName: "app/routes/app.additional.jsx",
      lineNumber: 24,
      columnNumber: 9
    }, this) }, void 0, !1, {
      fileName: "app/routes/app.additional.jsx",
      lineNumber: 23,
      columnNumber: 7
    }, this)
  ] }, void 0, !0, {
    fileName: "app/routes/app.additional.jsx",
    lineNumber: 3,
    columnNumber: 5
  }, this);
}

// app/routes/app.advisor.jsx
var app_advisor_exports = {};
__export(app_advisor_exports, {
  action: () => action4,
  default: () => Advisor,
  loader: () => loader2
});
import { useActionData, useLoaderData, useSubmit, useNavigation, data } from "@remix-run/react";
import { useState } from "react";
import { Page, Card, TextField, Button, Text, BlockStack, Select } from "@shopify/polaris";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { jsxDEV as jsxDEV4 } from "react/jsx-dev-runtime";
async function loader2({ request }) {
  let { admin } = await authenticate.admin(request), products = (await (await admin.graphql(`
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
  `)).json()).data.products.edges.map((e) => e.node);
  return data({ products });
}
async function action4({ request }) {
  let { admin } = await authenticate.admin(request), formData = await request.formData(), question = formData.get("question"), language = formData.get("language"), productList = (await (await admin.graphql(`
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
  `)).json()).data.products.edges.map((e) => e.node).map(
    (p) => `- ${p.title} (${p.productType}) | Price: ${p.priceRangeV2.minVariantPrice.amount} ${p.priceRangeV2.minVariantPrice.currencyCode} | Tags: ${p.tags.join(", ")}`
  ).join(`
`), langInstruction = language === "st" ? "Respond in Sesotho (Sotho language of Lesotho)." : "Respond in English.", model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: "gemini-1.5-flash" }), prompt = `You are an expert agricultural advisor for Lesotho specializing in IPM (Integrated Pest Management), biofertilisers, and regenerative agriculture. ${langInstruction}

You have access to the following REMOBU product catalog:
${productList}

When relevant, recommend specific products from the catalog above by name. Be concise and practical.

Farmer's question: ${question}`, result = await model.generateContent(prompt);
  return data({ answer: result.response.text() });
}
function Advisor() {
  let { products } = useLoaderData(), actionData = useActionData(), submit = useSubmit(), navigation = useNavigation(), [question, setQuestion] = useState(""), [language, setLanguage] = useState("en"), isLoading = navigation.state === "submitting";
  return /* @__PURE__ */ jsxDEV4(Page, { title: "REMOBU AI Farm Advisor", children: /* @__PURE__ */ jsxDEV4(BlockStack, { gap: "400", children: [
    /* @__PURE__ */ jsxDEV4(Card, { children: /* @__PURE__ */ jsxDEV4(BlockStack, { gap: "300", children: [
      /* @__PURE__ */ jsxDEV4(Text, { variant: "headingMd", children: "Ask your farming question" }, void 0, !1, {
        fileName: "app/routes/app.advisor.jsx",
        lineNumber: 102,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV4(
        Select,
        {
          label: "Language / Puo",
          options: [
            { label: "English", value: "en" },
            { label: "Sesotho", value: "st" }
          ],
          value: language,
          onChange: setLanguage
        },
        void 0,
        !1,
        {
          fileName: "app/routes/app.advisor.jsx",
          lineNumber: 103,
          columnNumber: 13
        },
        this
      ),
      /* @__PURE__ */ jsxDEV4(
        TextField,
        {
          label: "Question",
          value: question,
          onChange: setQuestion,
          multiline: 3,
          placeholder: "e.g. What controls work best for aphids on brassicas?"
        },
        void 0,
        !1,
        {
          fileName: "app/routes/app.advisor.jsx",
          lineNumber: 112,
          columnNumber: 13
        },
        this
      ),
      /* @__PURE__ */ jsxDEV4(Button, { variant: "primary", onClick: () => {
        let formData = new FormData();
        formData.append("question", question), formData.append("language", language), submit(formData, { method: "post" });
      }, loading: isLoading, children: "Ask Advisor" }, void 0, !1, {
        fileName: "app/routes/app.advisor.jsx",
        lineNumber: 119,
        columnNumber: 13
      }, this)
    ] }, void 0, !0, {
      fileName: "app/routes/app.advisor.jsx",
      lineNumber: 101,
      columnNumber: 11
    }, this) }, void 0, !1, {
      fileName: "app/routes/app.advisor.jsx",
      lineNumber: 100,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV4(Card, { children: /* @__PURE__ */ jsxDEV4(BlockStack, { gap: "200", children: [
      /* @__PURE__ */ jsxDEV4(Text, { variant: "headingMd", children: [
        "Your REMOBU Products (",
        products.length,
        ")"
      ] }, void 0, !0, {
        fileName: "app/routes/app.advisor.jsx",
        lineNumber: 126,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV4(Text, { variant: "bodySm", tone: "subdued", children: "These are loaded into the AI context automatically." }, void 0, !1, {
        fileName: "app/routes/app.advisor.jsx",
        lineNumber: 127,
        columnNumber: 13
      }, this)
    ] }, void 0, !0, {
      fileName: "app/routes/app.advisor.jsx",
      lineNumber: 125,
      columnNumber: 11
    }, this) }, void 0, !1, {
      fileName: "app/routes/app.advisor.jsx",
      lineNumber: 124,
      columnNumber: 9
    }, this),
    actionData?.answer && /* @__PURE__ */ jsxDEV4(Card, { children: /* @__PURE__ */ jsxDEV4(BlockStack, { gap: "200", children: [
      /* @__PURE__ */ jsxDEV4(Text, { variant: "headingMd", children: "Advisor Response" }, void 0, !1, {
        fileName: "app/routes/app.advisor.jsx",
        lineNumber: 133,
        columnNumber: 15
      }, this),
      /* @__PURE__ */ jsxDEV4(Text, { children: actionData.answer }, void 0, !1, {
        fileName: "app/routes/app.advisor.jsx",
        lineNumber: 134,
        columnNumber: 15
      }, this)
    ] }, void 0, !0, {
      fileName: "app/routes/app.advisor.jsx",
      lineNumber: 132,
      columnNumber: 13
    }, this) }, void 0, !1, {
      fileName: "app/routes/app.advisor.jsx",
      lineNumber: 131,
      columnNumber: 11
    }, this)
  ] }, void 0, !0, {
    fileName: "app/routes/app.advisor.jsx",
    lineNumber: 99,
    columnNumber: 7
  }, this) }, void 0, !1, {
    fileName: "app/routes/app.advisor.jsx",
    lineNumber: 98,
    columnNumber: 5
  }, this);
}

// app/routes/app._index.jsx
var app_index_exports = {};
__export(app_index_exports, {
  default: () => Index
});
import { jsxDEV as jsxDEV5 } from "react/jsx-dev-runtime";
function Index() {
  return /* @__PURE__ */ jsxDEV5("div", { style: { padding: "20px", maxWidth: "800px", margin: "0 auto" }, children: [
    /* @__PURE__ */ jsxDEV5("h1", { style: { fontSize: "24px", marginBottom: "16px" }, children: "Welcome to REMOBU App" }, void 0, !1, {
      fileName: "app/routes/app._index.jsx",
      lineNumber: 4,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV5("a", { href: "/app/advisor", style: { display: "block", padding: "16px", background: "#008060", color: "white", borderRadius: "8px", textDecoration: "none", fontSize: "18px", textAlign: "center" }, children: "\u{1F331} Open AI Farm Advisor" }, void 0, !1, {
      fileName: "app/routes/app._index.jsx",
      lineNumber: 5,
      columnNumber: 7
    }, this)
  ] }, void 0, !0, {
    fileName: "app/routes/app._index.jsx",
    lineNumber: 3,
    columnNumber: 5
  }, this);
}

// app/routes/auth.login/route.jsx
var route_exports = {};
__export(route_exports, {
  action: () => action5,
  default: () => Auth,
  loader: () => loader3
});
import { Form, useActionData as useActionData2, useLoaderData as useLoaderData2 } from "@remix-run/react";

// app/routes/auth.login/error.server.jsx
import { LoginErrorType } from "@shopify/shopify-app-remix/server";
function loginErrorMessage(loginErrors) {
  return loginErrors?.shop === LoginErrorType.MissingShop ? { shop: "Please enter your shop domain to log in" } : loginErrors?.shop === LoginErrorType.InvalidShop ? { shop: "Please enter a valid shop domain to log in" } : {};
}

// app/routes/auth.login/route.jsx
import { jsxDEV as jsxDEV6 } from "react/jsx-dev-runtime";
var loader3 = async ({ request }) => ({ errors: loginErrorMessage(await login(request)) }), action5 = async ({ request }) => ({ errors: loginErrorMessage(await login(request)) });
function Auth() {
  let { errors } = useLoaderData2(), allErrors = useActionData2()?.errors || errors;
  return /* @__PURE__ */ jsxDEV6("html", { lang: "en", children: [
    /* @__PURE__ */ jsxDEV6("head", { children: [
      /* @__PURE__ */ jsxDEV6("meta", { charSet: "utf-8" }, void 0, !1, {
        fileName: "app/routes/auth.login/route.jsx",
        lineNumber: 23,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV6("meta", { name: "viewport", content: "width=device-width,initial-scale=1" }, void 0, !1, {
        fileName: "app/routes/auth.login/route.jsx",
        lineNumber: 24,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV6("title", { children: "REMOBU - Login" }, void 0, !1, {
        fileName: "app/routes/auth.login/route.jsx",
        lineNumber: 25,
        columnNumber: 9
      }, this)
    ] }, void 0, !0, {
      fileName: "app/routes/auth.login/route.jsx",
      lineNumber: 22,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV6("body", { style: { fontFamily: "sans-serif", maxWidth: 400, margin: "80px auto", padding: 24 }, children: [
      /* @__PURE__ */ jsxDEV6("h1", { children: "Log in to REMOBU" }, void 0, !1, {
        fileName: "app/routes/auth.login/route.jsx",
        lineNumber: 28,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV6(Form, { method: "post", children: [
        /* @__PURE__ */ jsxDEV6("div", { style: { marginBottom: 16 }, children: [
          /* @__PURE__ */ jsxDEV6("label", { children: "Shop domain" }, void 0, !1, {
            fileName: "app/routes/auth.login/route.jsx",
            lineNumber: 31,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV6("br", {}, void 0, !1, {
            fileName: "app/routes/auth.login/route.jsx",
            lineNumber: 31,
            columnNumber: 39
          }, this),
          /* @__PURE__ */ jsxDEV6(
            "input",
            {
              type: "text",
              name: "shop",
              placeholder: "your-store.myshopify.com",
              style: { width: "100%", padding: 8, marginTop: 4 }
            },
            void 0,
            !1,
            {
              fileName: "app/routes/auth.login/route.jsx",
              lineNumber: 32,
              columnNumber: 13
            },
            this
          )
        ] }, void 0, !0, {
          fileName: "app/routes/auth.login/route.jsx",
          lineNumber: 30,
          columnNumber: 11
        }, this),
        allErrors?.shop && /* @__PURE__ */ jsxDEV6("p", { style: { color: "red" }, children: allErrors.shop }, void 0, !1, {
          fileName: "app/routes/auth.login/route.jsx",
          lineNumber: 39,
          columnNumber: 31
        }, this),
        /* @__PURE__ */ jsxDEV6("button", { type: "submit", style: { padding: "8px 24px" }, children: "Log in" }, void 0, !1, {
          fileName: "app/routes/auth.login/route.jsx",
          lineNumber: 40,
          columnNumber: 11
        }, this)
      ] }, void 0, !0, {
        fileName: "app/routes/auth.login/route.jsx",
        lineNumber: 29,
        columnNumber: 9
      }, this)
    ] }, void 0, !0, {
      fileName: "app/routes/auth.login/route.jsx",
      lineNumber: 27,
      columnNumber: 7
    }, this)
  ] }, void 0, !0, {
    fileName: "app/routes/auth.login/route.jsx",
    lineNumber: 21,
    columnNumber: 5
  }, this);
}

// app/routes/_index/route.jsx
var route_exports2 = {};
__export(route_exports2, {
  default: () => App2,
  loader: () => loader4
});
import { redirect, Form as Form2, useLoaderData as useLoaderData3 } from "@remix-run/react";

// app/routes/_index/styles.module.css
var styles_module_default = { index: "styles-module__index__LQCYp", heading: "styles-module__heading__bVg-E", text: "styles-module__text__5LEJl", content: "styles-module__content__IjJz7", form: "styles-module__form__sI1Wg", label: "styles-module__label__py2aZ", input: "styles-module__input__k8y5b", button: "styles-module__button__DcRe8", list: "styles-module__list__qyGLW" };

// app/routes/_index/route.jsx
import { jsxDEV as jsxDEV7 } from "react/jsx-dev-runtime";
var loader4 = async ({ request }) => {
  let url = new URL(request.url);
  if (url.searchParams.get("shop"))
    throw redirect(`/app?${url.searchParams.toString()}`);
  return { showForm: Boolean(login) };
};
function App2() {
  let { showForm } = useLoaderData3();
  return /* @__PURE__ */ jsxDEV7("div", { className: styles_module_default.index, children: /* @__PURE__ */ jsxDEV7("div", { className: styles_module_default.content, children: [
    /* @__PURE__ */ jsxDEV7("h1", { className: styles_module_default.heading, children: "A short heading about [your app]" }, void 0, !1, {
      fileName: "app/routes/_index/route.jsx",
      lineNumber: 21,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV7("p", { className: styles_module_default.text, children: "A tagline about [your app] that describes your value proposition." }, void 0, !1, {
      fileName: "app/routes/_index/route.jsx",
      lineNumber: 22,
      columnNumber: 9
    }, this),
    showForm && /* @__PURE__ */ jsxDEV7(Form2, { className: styles_module_default.form, method: "post", action: "/auth/login", children: [
      /* @__PURE__ */ jsxDEV7("label", { className: styles_module_default.label, children: [
        /* @__PURE__ */ jsxDEV7("span", { children: "Shop domain" }, void 0, !1, {
          fileName: "app/routes/_index/route.jsx",
          lineNumber: 28,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV7("input", { className: styles_module_default.input, type: "text", name: "shop" }, void 0, !1, {
          fileName: "app/routes/_index/route.jsx",
          lineNumber: 29,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV7("span", { children: "e.g: my-shop-domain.myshopify.com" }, void 0, !1, {
          fileName: "app/routes/_index/route.jsx",
          lineNumber: 30,
          columnNumber: 15
        }, this)
      ] }, void 0, !0, {
        fileName: "app/routes/_index/route.jsx",
        lineNumber: 27,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV7("button", { className: styles_module_default.button, type: "submit", children: "Log in" }, void 0, !1, {
        fileName: "app/routes/_index/route.jsx",
        lineNumber: 32,
        columnNumber: 13
      }, this)
    ] }, void 0, !0, {
      fileName: "app/routes/_index/route.jsx",
      lineNumber: 26,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV7("ul", { className: styles_module_default.list, children: [
      /* @__PURE__ */ jsxDEV7("li", { children: [
        /* @__PURE__ */ jsxDEV7("strong", { children: "Product feature" }, void 0, !1, {
          fileName: "app/routes/_index/route.jsx",
          lineNumber: 39,
          columnNumber: 13
        }, this),
        ". Some detail about your feature and its benefit to your customer."
      ] }, void 0, !0, {
        fileName: "app/routes/_index/route.jsx",
        lineNumber: 38,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV7("li", { children: [
        /* @__PURE__ */ jsxDEV7("strong", { children: "Product feature" }, void 0, !1, {
          fileName: "app/routes/_index/route.jsx",
          lineNumber: 43,
          columnNumber: 13
        }, this),
        ". Some detail about your feature and its benefit to your customer."
      ] }, void 0, !0, {
        fileName: "app/routes/_index/route.jsx",
        lineNumber: 42,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV7("li", { children: [
        /* @__PURE__ */ jsxDEV7("strong", { children: "Product feature" }, void 0, !1, {
          fileName: "app/routes/_index/route.jsx",
          lineNumber: 47,
          columnNumber: 13
        }, this),
        ". Some detail about your feature and its benefit to your customer."
      ] }, void 0, !0, {
        fileName: "app/routes/_index/route.jsx",
        lineNumber: 46,
        columnNumber: 11
      }, this)
    ] }, void 0, !0, {
      fileName: "app/routes/_index/route.jsx",
      lineNumber: 37,
      columnNumber: 9
    }, this)
  ] }, void 0, !0, {
    fileName: "app/routes/_index/route.jsx",
    lineNumber: 20,
    columnNumber: 7
  }, this) }, void 0, !1, {
    fileName: "app/routes/_index/route.jsx",
    lineNumber: 19,
    columnNumber: 5
  }, this);
}

// app/routes/auth.$.jsx
var auth_exports = {};
__export(auth_exports, {
  loader: () => loader5
});
var loader5 = async ({ request }) => (await authenticate.admin(request), null);

// app/routes/app.jsx
var app_exports = {};
__export(app_exports, {
  ErrorBoundary: () => ErrorBoundary2,
  default: () => App3,
  headers: () => headers,
  loader: () => loader6
});
import { Outlet as Outlet2, useLoaderData as useLoaderData4, useRouteError as useRouteError2 } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { jsxDEV as jsxDEV8 } from "react/jsx-dev-runtime";
var loader6 = async ({ request }) => (await authenticate.admin(request), { apiKey: process.env.SHOPIFY_API_KEY });
function App3() {
  let { apiKey } = useLoaderData4();
  return /* @__PURE__ */ jsxDEV8(AppProvider, { isEmbeddedApp: !0, apiKey, children: /* @__PURE__ */ jsxDEV8(Outlet2, {}, void 0, !1, {
    fileName: "app/routes/app.jsx",
    lineNumber: 16,
    columnNumber: 7
  }, this) }, void 0, !1, {
    fileName: "app/routes/app.jsx",
    lineNumber: 15,
    columnNumber: 5
  }, this);
}
function ErrorBoundary2() {
  return boundary.error(useRouteError2());
}
var headers = (headersArgs) => boundary.headers(headersArgs);

// server-assets-manifest:@remix-run/dev/assets-manifest
var assets_manifest_default = { entry: { module: "/build/entry.client-P2VTLYPS.js", imports: ["/build/_shared/chunk-O4BRYNJ4.js", "/build/_shared/chunk-NMVRFGPI.js", "/build/_shared/chunk-U4FRFQSK.js", "/build/_shared/chunk-T6EM7PCZ.js", "/build/_shared/chunk-XGOTYLZ5.js", "/build/_shared/chunk-7M6SC7J5.js", "/build/_shared/chunk-UWV35TSL.js", "/build/_shared/chunk-PNG5AS42.js"] }, routes: { root: { id: "root", parentId: void 0, path: "", index: void 0, caseSensitive: void 0, module: "/build/root-KKJG25IU.js", imports: void 0, hasAction: !1, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !0 }, "routes/_index": { id: "routes/_index", parentId: "root", path: void 0, index: !0, caseSensitive: void 0, module: "/build/routes/_index-SXKFB3DO.js", imports: ["/build/_shared/chunk-3GJP5LZF.js"], hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/app": { id: "routes/app", parentId: "root", path: "app", index: void 0, caseSensitive: void 0, module: "/build/routes/app-BCFZ66UB.js", imports: ["/build/_shared/chunk-B43JI2TA.js", "/build/_shared/chunk-KYZCIFKH.js"], hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !0 }, "routes/app._index": { id: "routes/app._index", parentId: "routes/app", path: void 0, index: !0, caseSensitive: void 0, module: "/build/routes/app._index-MWUHSAAL.js", imports: void 0, hasAction: !1, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/app.additional": { id: "routes/app.additional", parentId: "routes/app", path: "additional", index: void 0, caseSensitive: void 0, module: "/build/routes/app.additional-S6UBKWKX.js", imports: void 0, hasAction: !1, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/app.advisor": { id: "routes/app.advisor", parentId: "routes/app", path: "advisor", index: void 0, caseSensitive: void 0, module: "/build/routes/app.advisor-OZ5DEEON.js", imports: void 0, hasAction: !0, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/auth.$": { id: "routes/auth.$", parentId: "root", path: "auth/*", index: void 0, caseSensitive: void 0, module: "/build/routes/auth.$-4B5WQABX.js", imports: void 0, hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/auth.login": { id: "routes/auth.login", parentId: "root", path: "auth/login", index: void 0, caseSensitive: void 0, module: "/build/routes/auth.login-I467QO7Y.js", imports: ["/build/_shared/chunk-3GJP5LZF.js"], hasAction: !0, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/webhook.whatsapp": { id: "routes/webhook.whatsapp", parentId: "root", path: "webhook/whatsapp", index: void 0, caseSensitive: void 0, module: "/build/routes/webhook.whatsapp-4REFQEVP.js", imports: void 0, hasAction: !0, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/webhooks.app.scopes_update": { id: "routes/webhooks.app.scopes_update", parentId: "root", path: "webhooks/app/scopes_update", index: void 0, caseSensitive: void 0, module: "/build/routes/webhooks.app.scopes_update-WHME25TS.js", imports: void 0, hasAction: !0, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/webhooks.app.uninstalled": { id: "routes/webhooks.app.uninstalled", parentId: "root", path: "webhooks/app/uninstalled", index: void 0, caseSensitive: void 0, module: "/build/routes/webhooks.app.uninstalled-27VY3UWS.js", imports: void 0, hasAction: !0, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 } }, version: "74fd12f3", hmr: { runtime: "/build/_shared/chunk-T6EM7PCZ.js", timestamp: 1777717754667 }, url: "/build/manifest-74FD12F3.js" };

// server-entry-module:@remix-run/dev/server-build
var mode = "development", assetsBuildDirectory = "public/build", future = { v3_fetcherPersist: !1, v3_relativeSplatPath: !1, v3_throwAbortReason: !1, v3_routeConfig: !1, v3_singleFetch: !1, v3_lazyRouteDiscovery: !1, unstable_optimizeDeps: !1 }, publicPath = "/build/", entry = { module: entry_server_exports }, routes = {
  root: {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: root_exports
  },
  "routes/webhooks.app.scopes_update": {
    id: "routes/webhooks.app.scopes_update",
    parentId: "root",
    path: "webhooks/app/scopes_update",
    index: void 0,
    caseSensitive: void 0,
    module: webhooks_app_scopes_update_exports
  },
  "routes/webhooks.app.uninstalled": {
    id: "routes/webhooks.app.uninstalled",
    parentId: "root",
    path: "webhooks/app/uninstalled",
    index: void 0,
    caseSensitive: void 0,
    module: webhooks_app_uninstalled_exports
  },
  "routes/webhook.whatsapp": {
    id: "routes/webhook.whatsapp",
    parentId: "root",
    path: "webhook/whatsapp",
    index: void 0,
    caseSensitive: void 0,
    module: webhook_whatsapp_exports
  },
  "routes/app.additional": {
    id: "routes/app.additional",
    parentId: "routes/app",
    path: "additional",
    index: void 0,
    caseSensitive: void 0,
    module: app_additional_exports
  },
  "routes/app.advisor": {
    id: "routes/app.advisor",
    parentId: "routes/app",
    path: "advisor",
    index: void 0,
    caseSensitive: void 0,
    module: app_advisor_exports
  },
  "routes/app._index": {
    id: "routes/app._index",
    parentId: "routes/app",
    path: void 0,
    index: !0,
    caseSensitive: void 0,
    module: app_index_exports
  },
  "routes/auth.login": {
    id: "routes/auth.login",
    parentId: "root",
    path: "auth/login",
    index: void 0,
    caseSensitive: void 0,
    module: route_exports
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: !0,
    caseSensitive: void 0,
    module: route_exports2
  },
  "routes/auth.$": {
    id: "routes/auth.$",
    parentId: "root",
    path: "auth/*",
    index: void 0,
    caseSensitive: void 0,
    module: auth_exports
  },
  "routes/app": {
    id: "routes/app",
    parentId: "root",
    path: "app",
    index: void 0,
    caseSensitive: void 0,
    module: app_exports
  }
};
export {
  assets_manifest_default as assets,
  assetsBuildDirectory,
  entry,
  future,
  mode,
  publicPath,
  routes
};
//# sourceMappingURL=index.js.map
