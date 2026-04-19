import { readFileSync, writeFileSync } from "fs";
const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

// Only patch @remix-run/react - confirmed CJS
// All other packages (@shopify/polaris, @shopify/shopify-app-remix) are true ESM
const regex = /import \{([^}]+)\} from "@remix-run\/react";/s;
content = content.replace(
  regex,
  (_, named) => `import remixReact from "@remix-run/react";\nconst {${named.replace(/\s+/g, " ").trim()}} = remixReact;`
);

console.log("✅ patch applied");
writeFileSync(file, content);
