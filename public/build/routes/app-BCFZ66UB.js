import {
  require_jsx_runtime
} from "/build/_shared/chunk-B43JI2TA.js";
import {
  AppProvider,
  require_shopify
} from "/build/_shared/chunk-KYZCIFKH.js";
import {
  Link,
  Outlet,
  useLoaderData,
  useNavigate,
  useRouteError
} from "/build/_shared/chunk-NMVRFGPI.js";
import "/build/_shared/chunk-U4FRFQSK.js";
import {
  createHotContext
} from "/build/_shared/chunk-T6EM7PCZ.js";
import {
  require_jsx_dev_runtime
} from "/build/_shared/chunk-XGOTYLZ5.js";
import {
  require_react
} from "/build/_shared/chunk-7M6SC7J5.js";
import "/build/_shared/chunk-UWV35TSL.js";
import {
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// node_modules/@shopify/shopify-api/dist/esm/runtime/http/headers.mjs
function canonicalizeHeaderName(hdr) {
  return hdr.replace(/(^|-)(\w+)/g, (_fullMatch, start, letters) => start + letters.slice(0, 1).toUpperCase() + letters.slice(1).toLowerCase());
}
function addHeader(headers, key, value) {
  canonicalizeHeaders(headers);
  const canonKey = canonicalizeHeaderName(key);
  let list = headers[canonKey];
  if (!list) {
    list = [];
  } else if (!Array.isArray(list)) {
    list = [list];
  }
  headers[canonKey] = list;
  list.push(value);
}
function canonicalizeValue(value) {
  if (typeof value === "number")
    return value.toString();
  return value;
}
function canonicalizeHeaders(hdr) {
  for (const [key, values] of Object.entries(hdr)) {
    const canonKey = canonicalizeHeaderName(key);
    if (!hdr[canonKey])
      hdr[canonKey] = [];
    if (!Array.isArray(hdr[canonKey]))
      hdr[canonKey] = [canonicalizeValue(hdr[canonKey])];
    if (key === canonKey)
      continue;
    delete hdr[key];
    hdr[canonKey].push(...[values].flat().map((value) => canonicalizeValue(value)));
  }
  return hdr;
}
function flatHeaders(headers) {
  if (!headers)
    return [];
  return Object.entries(headers).flatMap(([header, values]) => Array.isArray(values) ? values.map((value) => [header, value]) : [[header, values]]);
}

// node_modules/@shopify/shopify-api/dist/esm/adapters/web-api/adapter.mjs
async function webApiConvertRequest(adapterArgs) {
  const request = adapterArgs.rawRequest;
  const headers = {};
  for (const [key, value] of request.headers.entries()) {
    addHeader(headers, key, value);
  }
  return {
    headers,
    method: request.method ?? "GET",
    url: new URL(request.url).toString()
  };
}
async function webApiConvertHeaders(headers, _adapterArgs) {
  const remixHeaders = new Headers();
  flatHeaders(headers ?? {}).forEach(([key, value]) => remixHeaders.append(key, value));
  return Promise.resolve(remixHeaders);
}
async function webApiConvertResponse(resp, adapterArgs) {
  return new Response(resp.body, {
    status: resp.statusCode,
    statusText: resp.statusText,
    headers: await webApiConvertHeaders(resp.headers ?? {})
  });
}
function webApiRuntimeString() {
  return "Web API";
}

// node_modules/@shopify/shopify-api/dist/esm/runtime/http/index.mjs
var abstractFetch = () => {
  throw new Error("Missing adapter implementation for 'abstractFetch' - make sure to import the appropriate adapter for your platform");
};
function setAbstractFetchFunc(func) {
  abstractFetch = func;
}
var abstractConvertRequest = () => {
  throw new Error("Missing adapter implementation for 'abstractConvertRequest' - make sure to import the appropriate adapter for your platform");
};
function setAbstractConvertRequestFunc(func) {
  abstractConvertRequest = func;
}
var abstractConvertResponse = () => {
  throw new Error("Missing adapter implementation for 'abstractConvertResponse' - make sure to import the appropriate adapter for your platform");
};
function setAbstractConvertResponseFunc(func) {
  abstractConvertResponse = func;
}
var abstractConvertHeaders = () => {
  throw new Error("Missing adapter implementation for 'abstractConvertHeaders' - make sure to import the appropriate adapter for your platform");
};
function setAbstractConvertHeadersFunc(func) {
  abstractConvertHeaders = func;
}

// node_modules/@shopify/shopify-api/dist/esm/runtime/platform/runtime-string.mjs
var abstractRuntimeString = () => {
  throw new Error("Missing adapter implementation for 'abstractRuntimeString' - make sure to import the appropriate adapter for your platform");
};
function setAbstractRuntimeString(func) {
  abstractRuntimeString = func;
}

// node_modules/@shopify/shopify-api/dist/esm/adapters/web-api/index.mjs
setAbstractFetchFunc(fetch);
setAbstractConvertRequestFunc(webApiConvertRequest);
setAbstractConvertResponseFunc(webApiConvertResponse);
setAbstractConvertHeadersFunc(webApiConvertHeaders);
setAbstractRuntimeString(webApiRuntimeString);

// node_modules/@shopify/shopify-app-remix/dist/esm/server/types.mjs
var AppDistribution;
(function(AppDistribution2) {
  AppDistribution2["AppStore"] = "app_store";
  AppDistribution2["SingleMerchant"] = "single_merchant";
  AppDistribution2["ShopifyAdmin"] = "shopify_admin";
})(AppDistribution || (AppDistribution = {}));
var LoginErrorType;
(function(LoginErrorType2) {
  LoginErrorType2["MissingShop"] = "MISSING_SHOP";
  LoginErrorType2["InvalidShop"] = "INVALID_SHOP";
})(LoginErrorType || (LoginErrorType = {}));

// node_modules/@shopify/shopify-app-remix/dist/esm/server/boundary/headers.mjs
function headersBoundary(headers) {
  const { parentHeaders, loaderHeaders, actionHeaders, errorHeaders } = headers;
  if (errorHeaders && Array.from(errorHeaders.entries()).length > 0) {
    return errorHeaders;
  }
  return new Headers([
    ...parentHeaders ? Array.from(parentHeaders.entries()) : [],
    ...loaderHeaders ? Array.from(loaderHeaders.entries()) : [],
    ...actionHeaders ? Array.from(actionHeaders.entries()) : []
  ]);
}

// node_modules/@shopify/shopify-app-remix/dist/esm/server/boundary/error.mjs
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
function errorBoundary(error) {
  if (error.constructor.name === "ErrorResponse" || error.constructor.name === "ErrorResponseImpl") {
    return (0, import_jsx_runtime.jsx)("div", { dangerouslySetInnerHTML: { __html: error.data || "Handling response" } });
  }
  throw error;
}

// node_modules/@shopify/shopify-app-remix/dist/esm/server/boundary/index.mjs
var boundary = {
  /**
   * A function that handles errors or thrown responses.
   *
   * @example
   * <caption>Catching errors in a route</caption>
   * ```ts
   * // /app/routes/admin/widgets.ts
   * import { boundary } from "@shopify/shopify-app-remix/server";
   *
   * export function ErrorBoundary() {
   *   return boundary.error(useRouteError());
   * }
   * ```
   */
  error: errorBoundary,
  /**
   * A function that sets the appropriate document response headers.
   *
   * @example
   * <caption>Catching errors in a route</caption>
   * ```ts
   * // /app/routes/admin/widgets.ts
   * import { boundary } from "@shopify/shopify-app-remix/server";
   *
   * export const headers = (headersArgs) => {
   *   return boundary.headers(headersArgs);
   * };
   * ```
   */
  headers: headersBoundary
};

// node_modules/@shopify/shopify-app-remix/dist/esm/server/helpers/ensure-offline-token-is-not-expired.mjs
var WITHIN_MILLISECONDS_OF_EXPIRY = 5 * 60 * 1e3;

// node_modules/@shopify/shopify-app-remix/dist/esm/server/index.mjs
setAbstractRuntimeString(() => {
  return `Remix`;
});

// node_modules/@shopify/shopify-app-remix/dist/esm/react/components/AppProvider/AppProvider.mjs
var import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
var import_react4 = __toESM(require_react(), 1);

// node_modules/@shopify/shopify-app-remix/dist/esm/react/const.mjs
var APP_BRIDGE_URL2 = "https://cdn.shopify.com/shopifycloud/app-bridge.js";

// node_modules/@shopify/shopify-app-remix/dist/esm/react/components/RemixPolarisLink.mjs
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
var import_react = __toESM(require_react(), 1);
var RemixPolarisLink = import_react.default.forwardRef((props, ref) => (0, import_jsx_runtime2.jsx)(Link, { ...props, to: props.url ?? props.to, ref }));

// node_modules/@shopify/shopify-app-remix/dist/esm/react/components/AppProvider/AppProvider.mjs
var englishI18n = { "Polaris": { "ActionMenu": { "Actions": { "moreActions": "More actions" }, "RollupActions": { "rollupButton": "View actions" } }, "ActionList": { "SearchField": { "clearButtonLabel": "Clear", "search": "Search", "placeholder": "Search actions" } }, "Avatar": { "label": "Avatar", "labelWithInitials": "Avatar with initials {initials}" }, "Autocomplete": { "spinnerAccessibilityLabel": "Loading", "ellipsis": "{content}\u2026" }, "Badge": { "PROGRESS_LABELS": { "incomplete": "Incomplete", "partiallyComplete": "Partially complete", "complete": "Complete" }, "TONE_LABELS": { "info": "Info", "success": "Success", "warning": "Warning", "critical": "Critical", "attention": "Attention", "new": "New", "readOnly": "Read-only", "enabled": "Enabled" }, "progressAndTone": "{toneLabel} {progressLabel}" }, "Banner": { "dismissButton": "Dismiss notification" }, "Button": { "spinnerAccessibilityLabel": "Loading" }, "Common": { "checkbox": "checkbox", "undo": "Undo", "cancel": "Cancel", "clear": "Clear", "close": "Close", "submit": "Submit", "more": "More" }, "ContextualSaveBar": { "save": "Save", "discard": "Discard" }, "DataTable": { "sortAccessibilityLabel": "sort {direction} by", "navAccessibilityLabel": "Scroll table {direction} one column", "totalsRowHeading": "Totals", "totalRowHeading": "Total" }, "DatePicker": { "previousMonth": "Show previous month, {previousMonthName} {showPreviousYear}", "nextMonth": "Show next month, {nextMonth} {nextYear}", "today": "Today ", "start": "Start of range", "end": "End of range", "months": { "january": "January", "february": "February", "march": "March", "april": "April", "may": "May", "june": "June", "july": "July", "august": "August", "september": "September", "october": "October", "november": "November", "december": "December" }, "days": { "monday": "Monday", "tuesday": "Tuesday", "wednesday": "Wednesday", "thursday": "Thursday", "friday": "Friday", "saturday": "Saturday", "sunday": "Sunday" }, "daysAbbreviated": { "monday": "Mo", "tuesday": "Tu", "wednesday": "We", "thursday": "Th", "friday": "Fr", "saturday": "Sa", "sunday": "Su" } }, "DiscardConfirmationModal": { "title": "Discard all unsaved changes", "message": "If you discard changes, you\u2019ll delete any edits you made since you last saved.", "primaryAction": "Discard changes", "secondaryAction": "Continue editing" }, "DropZone": { "single": { "overlayTextFile": "Drop file to upload", "overlayTextImage": "Drop image to upload", "overlayTextVideo": "Drop video to upload", "actionTitleFile": "Add file", "actionTitleImage": "Add image", "actionTitleVideo": "Add video", "actionHintFile": "or drop file to upload", "actionHintImage": "or drop image to upload", "actionHintVideo": "or drop video to upload", "labelFile": "Upload file", "labelImage": "Upload image", "labelVideo": "Upload video" }, "allowMultiple": { "overlayTextFile": "Drop files to upload", "overlayTextImage": "Drop images to upload", "overlayTextVideo": "Drop videos to upload", "actionTitleFile": "Add files", "actionTitleImage": "Add images", "actionTitleVideo": "Add videos", "actionHintFile": "or drop files to upload", "actionHintImage": "or drop images to upload", "actionHintVideo": "or drop videos to upload", "labelFile": "Upload files", "labelImage": "Upload images", "labelVideo": "Upload videos" }, "errorOverlayTextFile": "File type is not valid", "errorOverlayTextImage": "Image type is not valid", "errorOverlayTextVideo": "Video type is not valid" }, "EmptySearchResult": { "altText": "Empty search results" }, "Frame": { "skipToContent": "Skip to content", "navigationLabel": "Navigation", "Navigation": { "closeMobileNavigationLabel": "Close navigation" } }, "FullscreenBar": { "back": "Back", "accessibilityLabel": "Exit fullscreen mode" }, "Filters": { "moreFilters": "More filters", "moreFiltersWithCount": "More filters ({count})", "filter": "Filter {resourceName}", "noFiltersApplied": "No filters applied", "cancel": "Cancel", "done": "Done", "clearAllFilters": "Clear all filters", "clear": "Clear", "clearLabel": "Clear {filterName}", "addFilter": "Add filter", "clearFilters": "Clear all", "searchInView": "in:{viewName}" }, "FilterPill": { "clear": "Clear", "unsavedChanges": "Unsaved changes - {label}" }, "IndexFilters": { "searchFilterTooltip": "Search and filter", "searchFilterTooltipWithShortcut": "Search and filter (F)", "searchFilterAccessibilityLabel": "Search and filter results", "sort": "Sort your results", "addView": "Add a new view", "newView": "Custom search", "SortButton": { "ariaLabel": "Sort the results", "tooltip": "Sort", "title": "Sort by", "sorting": { "asc": "Ascending", "desc": "Descending", "az": "A-Z", "za": "Z-A" } }, "EditColumnsButton": { "tooltip": "Edit columns", "accessibilityLabel": "Customize table column order and visibility" }, "UpdateButtons": { "cancel": "Cancel", "update": "Update", "save": "Save", "saveAs": "Save as", "modal": { "title": "Save view as", "label": "Name", "sameName": "A view with this name already exists. Please choose a different name.", "save": "Save", "cancel": "Cancel" } } }, "IndexProvider": { "defaultItemSingular": "Item", "defaultItemPlural": "Items", "allItemsSelected": "All {itemsLength}+ {resourceNamePlural} are selected", "selected": "{selectedItemsCount} selected", "a11yCheckboxDeselectAllSingle": "Deselect {resourceNameSingular}", "a11yCheckboxSelectAllSingle": "Select {resourceNameSingular}", "a11yCheckboxDeselectAllMultiple": "Deselect all {itemsLength} {resourceNamePlural}", "a11yCheckboxSelectAllMultiple": "Select all {itemsLength} {resourceNamePlural}" }, "IndexTable": { "emptySearchTitle": "No {resourceNamePlural} found", "emptySearchDescription": "Try changing the filters or search term", "onboardingBadgeText": "New", "resourceLoadingAccessibilityLabel": "Loading {resourceNamePlural}\u2026", "selectAllLabel": "Select all {resourceNamePlural}", "selected": "{selectedItemsCount} selected", "undo": "Undo", "selectAllItems": "Select all {itemsLength}+ {resourceNamePlural}", "selectItem": "Select {resourceName}", "selectButtonText": "Select", "sortAccessibilityLabel": "sort {direction} by" }, "Loading": { "label": "Page loading bar" }, "Modal": { "iFrameTitle": "body markup", "modalWarning": "These required properties are missing from Modal: {missingProps}" }, "Page": { "Header": { "rollupActionsLabel": "View actions for {title}", "pageReadyAccessibilityLabel": "{title}. This page is ready" } }, "Pagination": { "previous": "Previous", "next": "Next", "pagination": "Pagination" }, "ProgressBar": { "negativeWarningMessage": "Values passed to the progress prop shouldn\u2019t be negative. Resetting {progress} to 0.", "exceedWarningMessage": "Values passed to the progress prop shouldn\u2019t exceed 100. Setting {progress} to 100." }, "ResourceList": { "sortingLabel": "Sort by", "defaultItemSingular": "item", "defaultItemPlural": "items", "showing": "Showing {itemsCount} {resource}", "showingTotalCount": "Showing {itemsCount} of {totalItemsCount} {resource}", "loading": "Loading {resource}", "selected": "{selectedItemsCount} selected", "allItemsSelected": "All {itemsLength}+ {resourceNamePlural} in your store are selected", "allFilteredItemsSelected": "All {itemsLength}+ {resourceNamePlural} in this filter are selected", "selectAllItems": "Select all {itemsLength}+ {resourceNamePlural} in your store", "selectAllFilteredItems": "Select all {itemsLength}+ {resourceNamePlural} in this filter", "emptySearchResultTitle": "No {resourceNamePlural} found", "emptySearchResultDescription": "Try changing the filters or search term", "selectButtonText": "Select", "a11yCheckboxDeselectAllSingle": "Deselect {resourceNameSingular}", "a11yCheckboxSelectAllSingle": "Select {resourceNameSingular}", "a11yCheckboxDeselectAllMultiple": "Deselect all {itemsLength} {resourceNamePlural}", "a11yCheckboxSelectAllMultiple": "Select all {itemsLength} {resourceNamePlural}", "Item": { "actionsDropdownLabel": "Actions for {accessibilityLabel}", "actionsDropdown": "Actions dropdown", "viewItem": "View details for {itemName}" }, "BulkActions": { "actionsActivatorLabel": "Actions", "moreActionsActivatorLabel": "More actions" } }, "SkeletonPage": { "loadingLabel": "Page loading" }, "Tabs": { "newViewAccessibilityLabel": "Create new view", "newViewTooltip": "Create view", "toggleTabsLabel": "More views", "Tab": { "rename": "Rename view", "duplicate": "Duplicate view", "edit": "Edit view", "editColumns": "Edit columns", "delete": "Delete view", "copy": "Copy of {name}", "deleteModal": { "title": "Delete view?", "description": "This can\u2019t be undone. {viewName} view will no longer be available in your admin.", "cancel": "Cancel", "delete": "Delete view" } }, "RenameModal": { "title": "Rename view", "label": "Name", "cancel": "Cancel", "create": "Save", "errors": { "sameName": "A view with this name already exists. Please choose a different name." } }, "DuplicateModal": { "title": "Duplicate view", "label": "Name", "cancel": "Cancel", "create": "Create view", "errors": { "sameName": "A view with this name already exists. Please choose a different name." } }, "CreateViewModal": { "title": "Create new view", "label": "Name", "cancel": "Cancel", "create": "Create view", "errors": { "sameName": "A view with this name already exists. Please choose a different name." } } }, "Tag": { "ariaLabel": "Remove {children}" }, "TextField": { "characterCount": "{count} characters", "characterCountWithMaxLength": "{count} of {limit} characters used" }, "TooltipOverlay": { "accessibilityLabel": "Tooltip: {label}" }, "TopBar": { "toggleMenuLabel": "Toggle menu", "SearchField": { "clearButtonLabel": "Clear", "search": "Search" } }, "MediaCard": { "dismissButton": "Dismiss", "popoverButton": "Actions" }, "VideoThumbnail": { "playButtonA11yLabel": { "default": "Play video", "defaultWithDuration": "Play video of length {duration}", "duration": { "hours": { "other": { "only": "{hourCount} hours", "andMinutes": "{hourCount} hours and {minuteCount} minutes", "andMinute": "{hourCount} hours and {minuteCount} minute", "minutesAndSeconds": "{hourCount} hours, {minuteCount} minutes, and {secondCount} seconds", "minutesAndSecond": "{hourCount} hours, {minuteCount} minutes, and {secondCount} second", "minuteAndSeconds": "{hourCount} hours, {minuteCount} minute, and {secondCount} seconds", "minuteAndSecond": "{hourCount} hours, {minuteCount} minute, and {secondCount} second", "andSeconds": "{hourCount} hours and {secondCount} seconds", "andSecond": "{hourCount} hours and {secondCount} second" }, "one": { "only": "{hourCount} hour", "andMinutes": "{hourCount} hour and {minuteCount} minutes", "andMinute": "{hourCount} hour and {minuteCount} minute", "minutesAndSeconds": "{hourCount} hour, {minuteCount} minutes, and {secondCount} seconds", "minutesAndSecond": "{hourCount} hour, {minuteCount} minutes, and {secondCount} second", "minuteAndSeconds": "{hourCount} hour, {minuteCount} minute, and {secondCount} seconds", "minuteAndSecond": "{hourCount} hour, {minuteCount} minute, and {secondCount} second", "andSeconds": "{hourCount} hour and {secondCount} seconds", "andSecond": "{hourCount} hour and {secondCount} second" } }, "minutes": { "other": { "only": "{minuteCount} minutes", "andSeconds": "{minuteCount} minutes and {secondCount} seconds", "andSecond": "{minuteCount} minutes and {secondCount} second" }, "one": { "only": "{minuteCount} minute", "andSeconds": "{minuteCount} minute and {secondCount} seconds", "andSecond": "{minuteCount} minute and {secondCount} second" } }, "seconds": { "other": "{secondCount} seconds", "one": "{secondCount} second" } } } } } };
function AppProvider2(props) {
  const { children, apiKey, i18n, isEmbeddedApp = true, __APP_BRIDGE_URL = APP_BRIDGE_URL2, ...polarisProps } = props;
  const navigate = useNavigate();
  (0, import_react4.useEffect)(() => {
    const handleNavigate = (event) => {
      const href = event.target?.getAttribute("href");
      if (href) {
        navigate(href);
      }
    };
    addEventListener("shopify:navigate", handleNavigate);
    return () => {
      removeEventListener("shopify:navigate", handleNavigate);
    };
  }, [navigate]);
  return (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [isEmbeddedApp && (0, import_jsx_runtime3.jsx)("script", { src: __APP_BRIDGE_URL, "data-api-key": apiKey }), (0, import_jsx_runtime3.jsx)(AppProvider, { ...polarisProps, linkComponent: RemixPolarisLink, i18n: i18n || englishI18n, children })] });
}

// node_modules/@shopify/shopify-app-remix/dist/esm/react/components/AppProxyProvider/AppProxyProvider.mjs
var import_jsx_runtime4 = __toESM(require_jsx_runtime(), 1);
var import_react5 = __toESM(require_react(), 1);
var AppProxyProviderContext = (0, import_react5.createContext)(null);

// node_modules/@shopify/shopify-app-remix/dist/esm/react/components/AppProxyForm/AppProxyForm.mjs
var import_jsx_runtime5 = __toESM(require_jsx_runtime(), 1);
var import_react6 = __toESM(require_react(), 1);

// node_modules/@shopify/shopify-app-remix/dist/esm/react/components/AppProxyLink/AppProxyLink.mjs
var import_jsx_runtime6 = __toESM(require_jsx_runtime(), 1);
var import_react7 = __toESM(require_react(), 1);

// app/routes/app.jsx
var import_shopify = __toESM(require_shopify(), 1);
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/app.jsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
var _s2 = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/routes/app.jsx"
  );
}
function App() {
  _s();
  const {
    apiKey
  } = useLoaderData();
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AppProvider2, { isEmbeddedApp: true, apiKey, children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Outlet, {}, void 0, false, {
    fileName: "app/routes/app.jsx",
    lineNumber: 41,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/routes/app.jsx",
    lineNumber: 40,
    columnNumber: 10
  }, this);
}
_s(App, "OkbQxR4MmTZWMtDciFEyh6Qymi4=", false, function() {
  return [useLoaderData];
});
_c = App;
function ErrorBoundary() {
  _s2();
  return boundary.error(useRouteError());
}
_s2(ErrorBoundary, "YDkf/bojC730qvJxOiv5VT1rhKY=", false, function() {
  return [useRouteError];
});
_c2 = ErrorBoundary;
var _c;
var _c2;
$RefreshReg$(_c, "App");
$RefreshReg$(_c2, "ErrorBoundary");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  ErrorBoundary,
  App as default
};
//# sourceMappingURL=/build/routes/app-BCFZ66UB.js.map
