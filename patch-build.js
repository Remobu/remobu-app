import { readFileSync, writeFileSync } from "fs";
import { createRequire } from "module";
const _require = createRequire(import.meta.url);

const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

const before = content;

// Target exact line Vite outputs
content = content.replace(
  `import { AppProvider } from "@shopify/shopify-app-remix/react";`,
  `const { AppProvider } = _require("@shopify/shopify-app-remix/react");`
);

// Add _require definition after first import line
if (content !== before) {
  content = content.replace(
    `import { jsx`,
    `import { createRequire as _cr } from "module";\nconst _require = _cr(import.meta.url);\nimport { jsx`
  );
  console.log("✅ AppProvider patch applied");
} else {
  console.log("❌ pattern not found");
}

writeFileSync(file, content);
