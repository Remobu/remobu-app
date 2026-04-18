import { readFileSync, writeFileSync } from "fs";
const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

const defaultExportPatches = [
  ["@remix-run/react", "remixReact"],
  ["@shopify/polaris", "shopifyPolaris"],
  ["react/jsx-runtime", "reactJsxRuntime"],
  ["react-dom/server", "reactDomServer"],
  ["react", "reactCore"],
];

for (const [pkg, alias] of defaultExportPatches) {
  const escaped = pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Handle both single-line and multiline imports
  const regex = new RegExp(`import \\{([^}]+)\\} from "${escaped}";`, "s");
  content = content.replace(
    regex,
    (_, named) => `import ${alias} from "${pkg}";\nconst {${named.replace(/\s+/g, " ").trim()}} = ${alias};`
  );
}

writeFileSync(file, content);
console.log("✅ Build patched");
