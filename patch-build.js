import { readFileSync, writeFileSync } from "fs";
import { createRequire } from "module";
const _require = createRequire(import.meta.url);

const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

// Fix 1: @remix-run/react CJS
content = content.replace(
  /^import \{([^}]+)\} from "@remix-run\/react";/m,
  (_, named) => {
    const fixed = named.replace(/(\w+) as (\w+)/g, "$1: $2");
    return `import pkg from "@remix-run/react";\nconst {${fixed}} = pkg;`;
  }
);

// Fix 2: @shopify/polaris CJS
content = content.replace(
  /^import \{([^}]+)\} from "@shopify\/polaris";/m,
  (_, named) => {
    const fixed = named.replace(/(\w+) as (\w+)/g, "$1: $2");
    return `import polarisPkg from "@shopify/polaris";\nconst {${fixed}} = polarisPkg;`;
  }
);

// Inject _require at top if needed
if (!content.includes("createRequire")) {
  content = content.replace(
    /^(import )/m,
    `import { createRequire as _cr } from "module";\nconst _require = _cr(import.meta.url);\n$1`
  );
}

console.log("remix patch:", content.includes('import pkg from "@remix-run/react"') ? "✅" : "❌");
console.log("polaris patch:", content.includes('import polarisPkg from "@shopify/polaris"') ? "✅" : "❌");

writeFileSync(file, content);
