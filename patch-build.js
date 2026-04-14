import { readFileSync, writeFileSync } from "fs";
const file = "build/server/index.js";
let content = readFileSync(file, "utf8");
content = content.replace(
  `import { ServerRouter, Meta, Links, Outlet, ScrollRestoration, Scripts, useRouteError, isRouteErrorResponse, useLoaderData, useActionData, useSubmit, useNavigation, data, Form, redirect } from "@remix-run/react";`,
  `import remixReact from "@remix-run/react";
const { ServerRouter, Meta, Links, Outlet, ScrollRestoration, Scripts, useRouteError, isRouteErrorResponse, useLoaderData, useActionData, useSubmit, useNavigation, data, Form, redirect } = remixReact;`
);
writeFileSync(file, content);
console.log("✅ Build patched");
