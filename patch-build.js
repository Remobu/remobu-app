import { readFileSync, writeFileSync } from "fs";
const file = "build/server/index.js";
let content = readFileSync(file, "utf8");

// Only patch packages that have CJS default exports
// @shopify/polaris uses named exports only - DO NOT patch it
const defaultExportPatches = [
  ["@remix-run/react", "remixReact"],
  ["react/jsx-runtime", "reactJsxRuntime"],
  ["react-dom/server", "reactDomServer"],
  ["react", "reactCore"],
];

for (const [pkg, alias] of defaultExportPatches) {
  const escaped = pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`import \\{([^}]+)\\} from "${escaped}";`, "s");
  content = content.replace(
    regex,
    (_, named) => `import ${alias} from "${pkg}";\nconst {${named.replace(/\s+/g, " ").trim()}} = ${alias};`
  );
}

writeFileSync(file, content);
console.log("✅ Build patched");
