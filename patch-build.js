import { readFileSync, writeFileSync } from "fs";
const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

// Fix @remix-run/react - has no default export, only named exports
// Revert the bad default import back to named imports
content = content.replace(
  /import remixReact from "@remix-run\/react";\s*\nconst \{([^}]+)\} = remixReact;/s,
  (_, named) => `import {${named}} from "@remix-run/react";`
);

writeFileSync(file, content);
console.log("✅ Build patched - remix-run/react restored to named imports");
