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

// @shopify/shopify-app-remix/react - point to correct CJS path
content = content.replace(
  `from "@shopify/shopify-app-remix/react"`,
  `from "@shopify/shopify-app-remix/dist/cjs/react/index.js"`
);
console.log("✅ patched: shopify-app-remix/react -> dist/cjs");

writeFileSync(file, content);
