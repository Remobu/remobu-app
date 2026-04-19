import { readFileSync, writeFileSync } from "fs";
import { createRequire } from "module";
const _require = createRequire(import.meta.url);
const file = "build/server/index.js";
let content = readFileSync(file, "utf8");
content = content.replace(
  `import { AppProvider } from "@shopify/shopify-app-remix/react";`,
  `import { createRequire as _cr } from "module";\nconst _require2 = _cr(import.meta.url);\nconst { AppProvider } = _require2("@shopify/shopify-app-remix/react");`
);
writeFileSync(file, content);
console.log("AppProvider:", content.includes("_require2") ? "✅" : "❌");
