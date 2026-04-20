import { readFileSync, writeFileSync } from "fs";
import { createRequire } from "module";
const _require = createRequire(import.meta.url);

const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

// Fix 1: @remix-run/react CJS - convert named imports to default destructuring
content = content.replace(
  /^import \{([^}]+)\} from "@remix-run\/react";/m,
  (_, named) => {
    const fixed = named.replace(/(\w+) as (\w+)/g, "$1: $2");
    return `import pkg from "@remix-run/react";\nconst {${fixed}} = pkg;`;
  }
);

// Fix 2: AppProvider - replace ESM named import with require()
content = content.replace(
  /import \{([^}]*AppProvider[^}]*)\} from "@shopify\/shopify-app-remix\/react";/,
  (_, named) => {
    const fixed = named.replace(/(\w+) as (\w+)/g, "$1: $2");
    return `const {${fixed}} = _require("@shopify/shopify-app-remix/react");`;
  }
);

// Inject _require at top of file if not already present
if (!content.includes("createRequire")) {
  content = content.replace(
    /^(import )/m,
    `import { createRequire as _cr } from "module";\nconst _require = _cr(import.meta.url);\n$1`
  );
}

console.log("remix patch:", content.includes('import pkg from "@remix-run/react"') ? "✅" : "❌");
console.log("AppProvider patch:", content.includes('_require("@shopify/shopify-app-remix/react")') ? "✅" : "❌");

writeFileSync(file, content);
