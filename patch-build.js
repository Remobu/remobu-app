import { readFileSync, writeFileSync } from "fs";
const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

// Only fix AppProvider - nothing else
content = content.replace(
  `import { AppProvider } from "@shopify/shopify-app-remix/react";`,
  `import { createRequire as _cr } from "module";\nconst { AppProvider } = _cr(import.meta.url)("@shopify/shopify-app-remix/react");`
);

const fixed = content.includes('_cr(import.meta.url)("@shopify/shopify-app-remix/react")');
console.log("AppProvider patch:", fixed ? "✅" : "❌ not found - already removed");
writeFileSync(file, content);
