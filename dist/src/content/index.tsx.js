import __vite__cjsImport0_react_jsxDevRuntime from "/vendor/.vite-deps-react_jsx-dev-runtime.js__v--6897614c.js"; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
import __vite__cjsImport1_react from "/vendor/.vite-deps-react.js__v--6897614c.js"; const React = __vite__cjsImport1_react.__esModule ? __vite__cjsImport1_react.default : __vite__cjsImport1_react;
import __vite__cjsImport2_reactDom_client from "/vendor/.vite-deps-react-dom_client.js__v--8ab8a22b.js"; const createRoot = __vite__cjsImport2_reactDom_client["createRoot"];
import { ContentApp } from "/src/content/ContentApp.tsx.js";
import styleText from "/src/index.css__inline.js";
const host = document.createElement("div");
host.id = "quick-ask-extension-root";
host.style.position = "absolute";
host.style.top = "0";
host.style.left = "0";
host.style.zIndex = "2147483647";
host.style.pointerEvents = "none";
document.body.appendChild(host);
const shadow = host.attachShadow({ mode: "open" });
const style = document.createElement("style");
style.textContent = styleText;
shadow.appendChild(style);
const rootContainer = document.createElement("div");
rootContainer.style.pointerEvents = "auto";
shadow.appendChild(rootContainer);
const root = createRoot(rootContainer);
root.render(
  /* @__PURE__ */ jsxDEV(React.StrictMode, { children: /* @__PURE__ */ jsxDEV(ContentApp, {}, void 0, false, {
    fileName: "/home/diiblo/Project/QuickAsk/src/content/index.tsx",
    lineNumber: 32,
    columnNumber: 9
  }, this) }, void 0, false, {
    fileName: "/home/diiblo/Project/QuickAsk/src/content/index.tsx",
    lineNumber: 31,
    columnNumber: 3
  }, this)
);
console.log("QuickAsk Content Script Mounted");
