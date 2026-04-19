import { readFileSync, writeFileSync } from "fs";
const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

// CJS packages that need default import destructuring
const patches = [
  ["@remix-run/react", "remixReact"],
  ["@shopify/shopify-app-remix/react", "shopifyAppRemixReact"],
];

for (const [pkg, alias] of patches) {
  const escaped = pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`import \\{([^}]+)\\} from "${escaped}";`, "s");
  content = content.replace(
    regex,
    (_, named) => `import ${alias} from "${pkg}";\nconst {${named.replace(/\s+/g, " ").trim()}} = ${alias};`
  );
}

writeFileSync(file, content);
console.log("✅ patch applied: CJS default import fixes");
