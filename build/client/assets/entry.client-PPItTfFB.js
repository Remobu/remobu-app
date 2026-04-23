import{j as R}from"./jsx-runtime-0DLF9kdB.js";import{r,E as C,m as h,c as y,d as E}from"./index-Br-1L6tH.js";import{i as M,d as g,f as b,s as F,g as S,h as k,j as P,k as j,R as B,l as D,m as H,r as O}from"./components-1fYImKjh.js";/**
 * React Router v6.30.3
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */new Promise(()=>{});function z(e){let s={hasErrorBoundary:e.ErrorBoundary!=null||e.errorElement!=null};return e.Component&&Object.assign(s,{element:r.createElement(e.Component),Component:void 0}),e.HydrateFallback&&Object.assign(s,{hydrateFallbackElement:r.createElement(e.HydrateFallback),HydrateFallback:void 0}),e.ErrorBoundary&&Object.assign(s,{errorElement:r.createElement(e.ErrorBoundary),ErrorBoundary:void 0}),s}/**
 * @remix-run/react v2.17.4
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function L(e){if(!e)return null;let s=Object.entries(e),u={};for(let[n,t]of s)if(t&&t.__type==="RouteErrorResponse")u[n]=new C(t.status,t.statusText,t.data,t.internal===!0);else if(t&&t.__type==="Error"){if(t.__subType){let a=window[t.__subType];if(typeof a=="function")try{let i=new a(t.message);i.stack=t.stack,u[n]=i}catch{}}if(u[n]==null){let a=new Error(t.message);a.stack=t.stack,u[n]=a}}else u[n]=t;return u}/**
 * @remix-run/react v2.17.4
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */let l,o,f=!1,v;new Promise(e=>{v=e}).catch(()=>{});function T(e){if(!o){if(window.__remixContext.future.v3_singleFetch){if(!l){let d=window.__remixContext.stream;M(d,"No stream found for single fetch decoding"),window.__remixContext.stream=void 0,l=g(d,window).then(_=>{window.__remixContext.state=_.value,l.value=!0}).catch(_=>{l.error=_})}if(l.error)throw l.error;if(!l.value)throw l}let a=b(window.__remixManifest.routes,window.__remixRouteModules,window.__remixContext.state,window.__remixContext.future,window.__remixContext.isSpaMode),i;if(!window.__remixContext.isSpaMode){i={...window.__remixContext.state,loaderData:{...window.__remixContext.state.loaderData}};let d=h(a,window.location,window.__remixContext.basename);if(d)for(let _ of d){let m=_.route.id,x=window.__remixRouteModules[m],w=window.__remixManifest.routes[m];x&&F(w,x,window.__remixContext.isSpaMode)&&(x.HydrateFallback||!w.hasLoader)?i.loaderData[m]=void 0:w&&!w.hasLoader&&(i.loaderData[m]=null)}i&&i.errors&&(i.errors=L(i.errors))}o=y({routes:a,history:E(),basename:window.__remixContext.basename,future:{v7_normalizeFormMethod:!0,v7_fetcherPersist:window.__remixContext.future.v3_fetcherPersist,v7_partialHydration:!0,v7_prependBasename:!0,v7_relativeSplatPath:window.__remixContext.future.v3_relativeSplatPath,v7_skipActionErrorRevalidation:window.__remixContext.future.v3_singleFetch===!0},hydrationData:i,mapRouteProperties:z,dataStrategy:window.__remixContext.future.v3_singleFetch&&!window.__remixContext.isSpaMode?k(window.__remixManifest,window.__remixRouteModules,()=>o):void 0,patchRoutesOnNavigation:S(window.__remixManifest,window.__remixRouteModules,window.__remixContext.future,window.__remixContext.isSpaMode,window.__remixContext.basename)}),o.state.initialized&&(f=!0,o.initialize()),o.createRoutesForHMR=P,window.__remixRouter=o,v&&v(o)}let[s,u]=r.useState(void 0),[n,t]=r.useState(o.state.location);return r.useLayoutEffect(()=>{f||(f=!0,o.initialize())},[]),r.useLayoutEffect(()=>o.subscribe(a=>{a.location!==n&&t(a.location)}),[n]),j(o,window.__remixManifest,window.__remixRouteModules,window.__remixContext.future,window.__remixContext.isSpaMode),r.createElement(r.Fragment,null,r.createElement(B.Provider,{value:{manifest:window.__remixManifest,routeModules:window.__remixRouteModules,future:window.__remixContext.future,criticalCss:s,isSpaMode:window.__remixContext.isSpaMode}},r.createElement(D,{location:n},r.createElement(H,{router:o,fallbackElement:null,future:{v7_startTransition:!0}}))),window.__remixContext.future.v3_singleFetch?r.createElement(r.Fragment,null):null)}var c={},p;function q(){if(p)return c;p=1;var e=O();return c.createRoot=e.createRoot,c.hydrateRoot=e.hydrateRoot,c}var I=q();r.startTransition(()=>{I.hydrateRoot(document,R.jsx(r.StrictMode,{children:R.jsx(T,{})}))});
