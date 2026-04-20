import{j as e}from"./jsx-runtime-0DLF9kdB.js";import{b as f,c as y,_ as x,e as i,M as S,L as j,S as w}from"./components-cL_86RVJ.js";import{a as g,b as k,r as a,O as M,u as R,i as E}from"./index-DpLPBIDu.js";/**
 * @remix-run/react v2.17.4
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */let l="positions";function O({getKey:t,...c}){let{isSpaMode:u}=f(),o=g(),p=k();y({getKey:t,storageKey:l});let h=a.useMemo(()=>{if(!t)return null;let s=t(o,p);return s!==o.key?s:null},[]);if(u)return null;let m=((s,d)=>{if(!window.history.state||!window.history.state.key){let r=Math.random().toString(32).slice(2);window.history.replaceState({key:r},"")}try{let n=JSON.parse(sessionStorage.getItem(s)||"{}")[d||window.history.state.key];typeof n=="number"&&window.scrollTo(0,n)}catch(r){console.error(r),sessionStorage.removeItem(s)}}).toString();return a.createElement("script",x({},c,{suppressHydrationWarning:!0,dangerouslySetInnerHTML:{__html:`(${m})(${i(JSON.stringify(l))}, ${i(JSON.stringify(h))})`}}))}function _(){return e.jsxs("html",{lang:"en",children:[e.jsxs("head",{children:[e.jsx("meta",{charSet:"utf-8"}),e.jsx("meta",{name:"viewport",content:"width=device-width,initial-scale=1"}),e.jsx("link",{rel:"preconnect",href:"https://cdn.shopify.com/"}),e.jsx("link",{rel:"stylesheet",href:"https://cdn.shopify.com/static/fonts/inter/v4/styles.css"}),e.jsx(S,{}),e.jsx(j,{})]}),e.jsxs("body",{children:[e.jsx(M,{}),e.jsx(O,{}),e.jsx(w,{})]})]})}function H(){const t=R();if(E(t))return null;throw t}export{H as ErrorBoundary,_ as default};
