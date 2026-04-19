import { readFileSync, writeFileSync } from "fs";
const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

// @remix-run/react - CJS default import
const remixRegex = /import \{([^}]+)\} from "@remix-run\/react";/s;
if (remixRegex.test(content)) {
  content = content.replace(remixRegex, (_, named) =>
    `import remixReact from "@remix-run/react";\nconst {${named.replace(/\s+/g, " ").trim()}} = remixReact;`
  );
  console.log("✅ patched: @remix-run/react");
} else console.log("⏭️ not found: @remix-run/react (already patched)");

// @shopify/shopify-app-remix/react - use Module.createRequire with import.meta.url
const shopifyReactRegex = /import \{([^}]+)\} from "@shopify\/shopify-app-remix\/react";/s;
if (shopifyReactRegex.test(content)) {
  content = content.replace(shopifyReactRegex, (_, named) => {
    const names = named.replace(/\s+/g, " ").trim();
    return `import __Module from "module";\nconst { ${names} } = __Module.createRequire(import.meta.url)("@shopify/shopify-app-remix/react");`;
  });
  console.log("✅ patched: @shopify/shopify-app-remix/react");
} else console.log("⏭️ not found: @shopify/shopify-app-remix/react (already patched)");

writeFileSync(file, content);
