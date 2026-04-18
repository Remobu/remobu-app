import { readFileSync, writeFileSync } from "fs";
const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

// Fix @remix-run/react CJS/ESM conflict
content = content.replace(
  /import \{([^}]+)\} from "@remix-run\/react";/,
  `import remixReact from "@remix-run/react";\nconst {$1} = remixReact;`
);

// Fix @shopify/polaris CJS/ESM conflict
content = content.replace(
  /import \{([^}]+)\} from "@shopify\/polaris";/,
  `import shopifyPolaris from "@shopify/polaris";\nconst {$1} = shopifyPolaris;`
);

writeFileSync(file, content);
console.log("✅ Build patched");
