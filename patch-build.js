import { readFileSync, writeFileSync } from "fs";
const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

// Fix @remix-run/react CJS issue
content = content.replace(
  /^import \{([^}]+)\} from "@remix-run\/react";/m,
  (_, named) => `import pkg from "@remix-run/react";\nconst {${named}} = pkg;`
);

console.log("remix patch:", content.includes('import pkg from "@remix-run/react"') ? "✅" : "❌");
writeFileSync(file, content);
