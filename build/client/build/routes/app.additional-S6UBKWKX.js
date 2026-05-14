import {
  createHotContext
} from "/build/_shared/chunk-T6EM7PCZ.js";
import {
  require_jsx_dev_runtime
} from "/build/_shared/chunk-XGOTYLZ5.js";
import "/build/_shared/chunk-7M6SC7J5.js";
import "/build/_shared/chunk-UWV35TSL.js";
import {
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// app/routes/app.additional.jsx
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/app.additional.jsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/routes/app.additional.jsx"
  );
  import.meta.hot.lastModified = "1775670698261.0022";
}
function AdditionalPage() {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("s-page", { heading: "Additional page", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("s-section", { heading: "Multiple pages", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("s-paragraph", { children: [
        "The app template comes with an additional page which demonstrates how to create multiple pages within app navigation using",
        " ",
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("s-link", { href: "https://shopify.dev/docs/apps/tools/app-bridge", target: "_blank", children: "App Bridge" }, void 0, false, {
          fileName: "app/routes/app.additional.jsx",
          lineNumber: 27,
          columnNumber: 11
        }, this),
        "."
      ] }, void 0, true, {
        fileName: "app/routes/app.additional.jsx",
        lineNumber: 24,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("s-paragraph", { children: [
        "To create your own page and have it show up in the app navigation, add a page inside ",
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("code", { children: "app/routes" }, void 0, false, {
          fileName: "app/routes/app.additional.jsx",
          lineNumber: 34,
          columnNumber: 25
        }, this),
        ", and a link to it in the",
        " ",
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("code", { children: "<ui-nav-menu>" }, void 0, false, {
          fileName: "app/routes/app.additional.jsx",
          lineNumber: 35,
          columnNumber: 11
        }, this),
        " component found in",
        " ",
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("code", { children: "app/routes/app.jsx" }, void 0, false, {
          fileName: "app/routes/app.additional.jsx",
          lineNumber: 36,
          columnNumber: 11
        }, this),
        "."
      ] }, void 0, true, {
        fileName: "app/routes/app.additional.jsx",
        lineNumber: 32,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/app.additional.jsx",
      lineNumber: 23,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("s-section", { slot: "aside", heading: "Resources", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("s-unordered-list", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("s-list-item", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("s-link", { href: "https://shopify.dev/docs/apps/design-guidelines/navigation#app-nav", target: "_blank", children: "App nav best practices" }, void 0, false, {
      fileName: "app/routes/app.additional.jsx",
      lineNumber: 42,
      columnNumber: 13
    }, this) }, void 0, false, {
      fileName: "app/routes/app.additional.jsx",
      lineNumber: 41,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "app/routes/app.additional.jsx",
      lineNumber: 40,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "app/routes/app.additional.jsx",
      lineNumber: 39,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/app.additional.jsx",
    lineNumber: 22,
    columnNumber: 10
  }, this);
}
_c = AdditionalPage;
var _c;
$RefreshReg$(_c, "AdditionalPage");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  AdditionalPage as default
};
//# sourceMappingURL=/build/routes/app.additional-S6UBKWKX.js.map
