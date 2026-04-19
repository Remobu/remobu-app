import { readFileSync, writeFileSync } from "fs";
const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

// Fix @remix-run/react - Vite outputs: import remixReact from "..."; const { X } = remixReact;
content = content.replace(
  /import remixReact from "@remix-run\/react";\nconst \{([^}]+)\} = remixReact;/,
  (_, named) => `import pkg from "@remix-run/react";\nconst { ${named.trim()} } = pkg;`
);

// Fix @shopify/shopify-app-remix/react
const _cr = (await import("module")).default.createRequire(import.meta.url);
const built = readFileSync(file, "utf8");
console.log("remix-run/react patch:", built.includes('import pkg from "@remix-run/react"') ? "✅" : "❌");
console.log("shopify patch:", built.includes('_require("@shopify/shopify-app-remix/react")') ? "✅" : "❌");

writeFileSync(file, content);
