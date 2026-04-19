import { readFileSync, writeFileSync } from "fs";
const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

// Find ALL named imports and test each one - patch any that are CJS
// Known CJS packages that need default import destructuring:
const cjsPackages = [
  ["@remix-run/react", "remixReact"],
  ["@remix-run/node", "remixNode"],
  ["@shopify/shopify-app-remix/react", "shopifyAppReact"],
  ["react-dom/server", "reactDomServer"],
  ["react", "reactCore"],
];

for (const [pkg, alias] of cjsPackages) {
  const escaped = pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`import \\{([^}]+)\\} from "${escaped}";`, "s");
  if (regex.test(content)) {
    content = content.replace(
      regex,
      (_, named) => `import ${alias} from "${pkg}";\nconst {${named.replace(/\s+/g, " ").trim()}} = ${alias};`
    );
    console.log(`✅ patched: ${pkg}`);
  } else {
    console.log(`⏭️  skipped (not found or already patched): ${pkg}`);
  }
}

// ESM-only packages - leave as named imports (DO NOT patch):
// @shopify/polaris, @google/generative-ai, @shopify/shopify-app-remix/server

writeFileSync(file, content);
console.log("✅ All CJS patches applied");
