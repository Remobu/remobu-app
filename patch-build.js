import { readFileSync, writeFileSync } from "fs";
const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

// ONLY patch @shopify/shopify-app-remix/react - NOT @remix-run/react
const shopifyReactRegex = /import \{([^}]+)\} from "@shopify\/shopify-app-remix\/react";/s;
if (shopifyReactRegex.test(content)) {
  content = content.replace(shopifyReactRegex, (_, named) => {
    const names = named.replace(/\s+/g, " ").trim();
    return `import __Module from "module";\nconst { ${names} } = __Module.createRequire(import.meta.url)("@shopify/shopify-app-remix/react");`;
  });
  console.log("✅ patched: @shopify/shopify-app-remix/react");
} else {
  console.log("⏭️ not found: @shopify/shopify-app-remix/react");
}

writeFileSync(file, content);
