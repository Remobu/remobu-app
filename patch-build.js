import { readFileSync, writeFileSync } from "fs";
import { createRequire } from "module";
const _require = createRequire(import.meta.url);

const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

// Fix 1: @remix-run/react named imports → pkg default
content = content.replace(
  /import \{([^}]+)\} from "@remix-run\/react";/,
  (_, named) => `import pkg from "@remix-run/react";\nconst {${named}} = pkg;`
);

// Fix 2: AppProvider
content = content.replace(
  `import { AppProvider } from "@shopify/shopify-app-remix/react";`,
  `const { AppProvider } = _require("@shopify/shopify-app-remix/react");`
);

// Inject _require at top
content = content.replace(
  `import { jsx`,
  `import { createRequire as _cr } from "module";\nconst _require = _cr(import.meta.url);\nimport { jsx`
);

console.log("remix patch:", content.includes('import pkg from "@remix-run/react"') ? "✅" : "❌");
console.log("AppProvider patch:", content.includes('_require("@shopify/shopify-app-remix/react")') ? "✅" : "❌");

writeFileSync(file, content);
