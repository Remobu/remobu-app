import { readFileSync, writeFileSync } from "fs";
const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

// Replace any named import from @remix-run/react with default import
content = content.replace(
  /import \{([^}]+)\} from "@remix-run\/react";/,
  `import remixReact from "@remix-run/react";\nconst {$1} = remixReact;`
);

writeFileSync(file, content);
console.log("✅ Build patched");
