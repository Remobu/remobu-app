import { readFileSync, writeFileSync } from "fs";
const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

// These packages have CJS default exports - patch with default import
const defaultExportPatches = [
  ["@remix-run/react", "remixReact"],
  ["@shopify/polaris", "shopifyPolaris"],
  ["react/jsx-runtime", "reactJsxRuntime"],
  ["react-dom/server", "reactDomServer"],
  ["react", "reactCore"],
];

for (const [pkg, alias] of defaultExportPatches) {
  const escaped = pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`import \\{([^}]+)\\} from "${escaped}";`);
  content = content.replace(
    regex,
    `import ${alias} from "${pkg}";\nconst {$1} = ${alias};`
  );
}

// @google/generative-ai is ESM with named exports - keep as-is (no patch needed)

writeFileSync(file, content);
console.log("✅ Build patched");
