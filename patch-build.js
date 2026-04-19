import { readFileSync, writeFileSync } from "fs";
const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

// @remix-run/react is CJS - patch to default import
const remixRegex = /import \{([^}]+)\} from "@remix-run\/react";/s;
if (remixRegex.test(content)) {
  content = content.replace(
    remixRegex,
    (_, named) => `import remixReact from "@remix-run/react";\nconst {${named.replace(/\s+/g, " ").trim()}} = remixReact;`
  );
  console.log("✅ patched: @remix-run/react");
}

// @shopify/shopify-app-remix/react - inject createRequire shim at top
const shopifyReactRegex = /import \{([^}]+)\} from "@shopify\/shopify-app-remix\/react";/s;
if (shopifyReactRegex.test(content)) {
  const shim = `import { createRequire as _createRequire } from "module";\nconst _require = _createRequire(import.meta.url);\n`;
  content = content.replace(
    shopifyReactRegex,
    (_, named) => `${shim}const { ${named.replace(/\s+/g, " ").trim()} } = _require("@shopify/shopify-app-remix/react");`
  );
  console.log("✅ patched: @shopify/shopify-app-remix/react via createRequire");
}

writeFileSync(file, content);
