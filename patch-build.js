import { readFileSync, writeFileSync } from "fs";

const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

// Fix 1: @remix-run/react CJS interop only
content = content.replace(
  /^import \{([^}]+)\} from "@remix-run\/react";/m,
  (_, named) => {
    const fixed = named.replace(/(\w+) as (\w+)/g, "$1: $2");
    return `import pkg from "@remix-run/react";\nconst {${fixed}} = pkg;`;
  }
);

// Fix 2: Leave @shopify/polaris named imports UNTOUCHED
// Polaris has no default export - do NOT wrap it

console.log("remix patch:", content.includes('import pkg from "@remix-run/react"') ? "✅" : "❌");
console.log("polaris patch: skipped ✅ (named exports preserved)");

writeFileSync(file, content);
