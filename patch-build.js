import { readFileSync, writeFileSync } from "fs";
const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

// Fix @remix-run/react CJS - convert aliases to valid destructuring
content = content.replace(
  /^import \{([^}]+)\} from "@remix-run\/react";/m,
  (_, named) => {
    // Convert "X as Y" → "X: Y" for destructuring
    const fixed = named.replace(/(\w+) as (\w+)/g, "$1: $2");
    return `import pkg from "@remix-run/react";\nconst {${fixed}} = pkg;`;
  }
);

console.log("remix patch:", content.includes('import pkg from "@remix-run/react"') ? "✅" : "❌");
writeFileSync(file, content);
