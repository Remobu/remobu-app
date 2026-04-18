import { readFileSync, writeFileSync } from "fs";
const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

const patches = [
  ["@remix-run/react", "remixReact"],
  ["@shopify/polaris", "shopifyPolaris"],
  ["react/jsx-runtime", "reactJsxRuntime"],
  ["react-dom/server", "reactDomServer"],
  ["react", "reactCore"],
  ["@google/generative-ai", "googleAI"],
];

for (const [pkg, alias] of patches) {
  const escaped = pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`import \\{([^}]+)\\} from "${escaped}";`);
  content = content.replace(
    regex,
    `import ${alias} from "${pkg}";\nconst {$1} = ${alias};`
  );
}

writeFileSync(file, content);
console.log("✅ Build patched");
