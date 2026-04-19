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
} else console.log("⏭️ not found: @remix-run/react");

// @shopify/shopify-app-remix/react - use createRequire (CJS)
content = content.replace(
  /import \{([^}]+)\} from "@shopify\/shopify-app-remix\/react";/s,
  (_, named) => {
    const names = named.replace(/\s+/g, " ").trim();
    return `import { createRequire as __cjsRequire } from "module";\nconst { ${names} } = __cjsRequire("@shopify/shopify-app-remix/react");`;
  }
);

if (content.includes('__cjsRequire')) {
  console.log("✅ patched: @shopify/shopify-app-remix/react");
} else {
  console.log("⏭️ not found: @shopify/shopify-app-remix/react");
}

writeFileSync(file, content);
