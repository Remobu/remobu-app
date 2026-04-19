import { readFileSync, writeFileSync } from "fs";
const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

const patches = [
  ["@remix-run/react", "remixReact"],
  ["@shopify/shopify-app-remix/react", "shopifyAppReact"],
];

for (const [pkg, alias] of patches) {
  const escaped = pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`import \\{([^}]+)\\} from "${escaped}";`, "s");
  if (regex.test(content)) {
    content = content.replace(
      regex,
      (_, named) => `import ${alias} from "${pkg}";\nconst {${named.replace(/\s+/g, " ").trim()}} = ${alias};`
    );
    console.log(`✅ patched: ${pkg}`);
  } else {
    console.log(`⏭️  not found: ${pkg}`);
  }
}

writeFileSync(file, content);
