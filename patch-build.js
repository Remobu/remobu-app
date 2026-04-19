import { readFileSync, writeFileSync } from "fs";
const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

// @remix-run/react - CJS module, use default import then destructure
const remixRegex = /import \{([^}]+)\} from "@remix-run\/react";/s;
if (remixRegex.test(content)) {
  content = content.replace(remixRegex, (_, named) => {
    const names = named.replace(/\s+/g, " ").trim();
    return `import pkg from "@remix-run/react";\nconst { ${names} } = pkg;`;
  });
  console.log("✅ patched: @remix-run/react");
} else {
  console.log("⏭️ skipped: @remix-run/react");
}

// @shopify/shopify-app-remix/react - use Module.createRequire
const shopifyReactRegex = /import \{([^}]+)\} from "@shopify\/shopify-app-remix\/react";/s;
if (shopifyReactRegex.test(content)) {
  content = content.replace(shopifyReactRegex, (_, named) => {
    const names = named.replace(/\s+/g, " ").trim();
    return `import __Module from "module";\nconst { ${names} } = __Module.createRequire(import.meta.url)("@shopify/shopify-app-remix/react");`;
  });
  console.log("✅ patched: @shopify/shopify-app-remix/react");
} else {
  console.log("⏭️ skipped: @shopify/shopify-app-remix/react");
}

writeFileSync(file, content);
