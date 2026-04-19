import { readFileSync, writeFileSync } from "fs";
const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

// @remix-run/react is CJS - needs default import destructuring
const escaped = "@remix-run\\/react";
const regex = new RegExp(`import \\{([^}]+)\\} from "@remix-run/react";`, "s");
content = content.replace(
  regex,
  (_, named) => `import remixReact from "@remix-run/react";\nconst {${named.replace(/\s+/g, " ").trim()}} = remixReact;`
);

writeFileSync(file, content);
console.log("✅ patch applied: @remix-run/react CJS fix");
