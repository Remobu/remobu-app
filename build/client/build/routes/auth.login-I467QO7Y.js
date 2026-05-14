import {
  require_shopify
} from "/build/_shared/chunk-3GJP5LZF.js";
import {
  Form,
  useActionData,
  useLoaderData
} from "/build/_shared/chunk-NMVRFGPI.js";
import "/build/_shared/chunk-U4FRFQSK.js";
import {
  createHotContext
} from "/build/_shared/chunk-T6EM7PCZ.js";
import {
  require_jsx_dev_runtime
} from "/build/_shared/chunk-XGOTYLZ5.js";
import "/build/_shared/chunk-7M6SC7J5.js";
import "/build/_shared/chunk-UWV35TSL.js";
import {
  __commonJS,
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// empty-module:./error.server
var require_error = __commonJS({
  "empty-module:./error.server"(exports, module) {
    module.exports = {};
  }
});

// app/routes/auth.login/route.jsx
var import_shopify = __toESM(require_shopify(), 1);
var import_error = __toESM(require_error(), 1);
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/auth.login/route.jsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/routes/auth.login/route.jsx"
  );
  import.meta.hot.lastModified = "1776626515263.7976";
}
function Auth() {
  _s();
  const {
    errors
  } = useLoaderData();
  const actionData = useActionData();
  const allErrors = actionData?.errors || errors;
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("html", { lang: "en", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("head", { children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("meta", { charSet: "utf-8" }, void 0, false, {
        fileName: "app/routes/auth.login/route.jsx",
        lineNumber: 50,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("meta", { name: "viewport", content: "width=device-width,initial-scale=1" }, void 0, false, {
        fileName: "app/routes/auth.login/route.jsx",
        lineNumber: 51,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("title", { children: "REMOBU - Login" }, void 0, false, {
        fileName: "app/routes/auth.login/route.jsx",
        lineNumber: 52,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/auth.login/route.jsx",
      lineNumber: 49,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("body", { style: {
      fontFamily: "sans-serif",
      maxWidth: 400,
      margin: "80px auto",
      padding: 24
    }, children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", { children: "Log in to REMOBU" }, void 0, false, {
        fileName: "app/routes/auth.login/route.jsx",
        lineNumber: 60,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Form, { method: "post", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { style: {
          marginBottom: 16
        }, children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", { children: "Shop domain" }, void 0, false, {
            fileName: "app/routes/auth.login/route.jsx",
            lineNumber: 65,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("br", {}, void 0, false, {
            fileName: "app/routes/auth.login/route.jsx",
            lineNumber: 65,
            columnNumber: 39
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", { type: "text", name: "shop", placeholder: "your-store.myshopify.com", style: {
            width: "100%",
            padding: 8,
            marginTop: 4
          } }, void 0, false, {
            fileName: "app/routes/auth.login/route.jsx",
            lineNumber: 66,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/auth.login/route.jsx",
          lineNumber: 62,
          columnNumber: 11
        }, this),
        allErrors?.shop && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { style: {
          color: "red"
        }, children: allErrors.shop }, void 0, false, {
          fileName: "app/routes/auth.login/route.jsx",
          lineNumber: 72,
          columnNumber: 31
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { type: "submit", style: {
          padding: "8px 24px"
        }, children: "Log in" }, void 0, false, {
          fileName: "app/routes/auth.login/route.jsx",
          lineNumber: 75,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/auth.login/route.jsx",
        lineNumber: 61,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/auth.login/route.jsx",
      lineNumber: 54,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/auth.login/route.jsx",
    lineNumber: 48,
    columnNumber: 10
  }, this);
}
_s(Auth, "yhXWJLAtvLlK3A4Q1M7poQ8+V3U=", false, function() {
  return [useLoaderData, useActionData];
});
_c = Auth;
var _c;
$RefreshReg$(_c, "Auth");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  Auth as default
};
//# sourceMappingURL=/build/routes/auth.login-I467QO7Y.js.map
