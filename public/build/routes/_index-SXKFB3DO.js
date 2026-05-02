import {
  require_shopify
} from "/build/_shared/chunk-3GJP5LZF.js";
import {
  Form,
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
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// app/routes/_index/route.jsx
var import_shopify = __toESM(require_shopify(), 1);

// app/routes/_index/styles.module.css
var styles_module_default = { "index": "styles-module__index__LQCYp", "heading": "styles-module__heading__bVg-E", "text": "styles-module__text__5LEJl", "content": "styles-module__content__IjJz7", "form": "styles-module__form__sI1Wg", "label": "styles-module__label__py2aZ", "input": "styles-module__input__k8y5b", "button": "styles-module__button__DcRe8", "list": "styles-module__list__qyGLW" };

// app/routes/_index/route.jsx
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/_index/route.jsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/routes/_index/route.jsx"
  );
}
function App() {
  _s();
  const {
    showForm
  } = useLoaderData();
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: styles_module_default.index, children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: styles_module_default.content, children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", { className: styles_module_default.heading, children: "A short heading about [your app]" }, void 0, false, {
      fileName: "app/routes/_index/route.jsx",
      lineNumber: 42,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: styles_module_default.text, children: "A tagline about [your app] that describes your value proposition." }, void 0, false, {
      fileName: "app/routes/_index/route.jsx",
      lineNumber: 43,
      columnNumber: 9
    }, this),
    showForm && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Form, { className: styles_module_default.form, method: "post", action: "/auth/login", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", { className: styles_module_default.label, children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Shop domain" }, void 0, false, {
          fileName: "app/routes/_index/route.jsx",
          lineNumber: 48,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", { className: styles_module_default.input, type: "text", name: "shop" }, void 0, false, {
          fileName: "app/routes/_index/route.jsx",
          lineNumber: 49,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "e.g: my-shop-domain.myshopify.com" }, void 0, false, {
          fileName: "app/routes/_index/route.jsx",
          lineNumber: 50,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/_index/route.jsx",
        lineNumber: 47,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { className: styles_module_default.button, type: "submit", children: "Log in" }, void 0, false, {
        fileName: "app/routes/_index/route.jsx",
        lineNumber: 52,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/_index/route.jsx",
      lineNumber: 46,
      columnNumber: 22
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("ul", { className: styles_module_default.list, children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("strong", { children: "Product feature" }, void 0, false, {
          fileName: "app/routes/_index/route.jsx",
          lineNumber: 58,
          columnNumber: 13
        }, this),
        ". Some detail about your feature and its benefit to your customer."
      ] }, void 0, true, {
        fileName: "app/routes/_index/route.jsx",
        lineNumber: 57,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("strong", { children: "Product feature" }, void 0, false, {
          fileName: "app/routes/_index/route.jsx",
          lineNumber: 62,
          columnNumber: 13
        }, this),
        ". Some detail about your feature and its benefit to your customer."
      ] }, void 0, true, {
        fileName: "app/routes/_index/route.jsx",
        lineNumber: 61,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("strong", { children: "Product feature" }, void 0, false, {
          fileName: "app/routes/_index/route.jsx",
          lineNumber: 66,
          columnNumber: 13
        }, this),
        ". Some detail about your feature and its benefit to your customer."
      ] }, void 0, true, {
        fileName: "app/routes/_index/route.jsx",
        lineNumber: 65,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/_index/route.jsx",
      lineNumber: 56,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/_index/route.jsx",
    lineNumber: 41,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/routes/_index/route.jsx",
    lineNumber: 40,
    columnNumber: 10
  }, this);
}
_s(App, "hl3ORacHENSh4XLd7LIOvLca+TI=", false, function() {
  return [useLoaderData];
});
_c = App;
var _c;
$RefreshReg$(_c, "App");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  App as default
};
//# sourceMappingURL=/build/routes/_index-SXKFB3DO.js.map
