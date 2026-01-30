import { createHotContext as __vite__createHotContext } from "/vendor/vite-client.js";import.meta.hot = __vite__createHotContext("/src/content/ContentApp.tsx.js");import __vite__cjsImport0_react_jsxDevRuntime from "/vendor/.vite-deps-react_jsx-dev-runtime.js__v--6897614c.js"; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
import * as RefreshRuntime from "/vendor/react-refresh.js";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
let prevRefreshReg;
let prevRefreshSig;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = RefreshRuntime.getRefreshReg("/home/diiblo/Project/QuickAsk/src/content/ContentApp.tsx");
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}
var _s = $RefreshSig$();
import __vite__cjsImport3_react from "/vendor/.vite-deps-react.js__v--6897614c.js"; const useEffect = __vite__cjsImport3_react["useEffect"]; const useState = __vite__cjsImport3_react["useState"];
import { Sparkles, Loader2, X } from "/vendor/.vite-deps-lucide-react.js__v--5afe5b49.js";
import { getSettings } from "/src/utils/storage.ts.js";
import { InputManager } from "/src/content/InputManager.ts.js";
const findBlockValue = (obj, key) => {
  if (typeof obj !== "object" || obj === null) return null;
  if (key in obj && typeof obj[key] === "string") {
    return obj[key];
  }
  if (key.includes("_")) {
    const parts = key.split("_");
    let current = obj;
    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        current = null;
        break;
      }
    }
    if (typeof current === "string") return current;
  }
  return null;
};
const expandPrompts = (text, prompts) => {
  const regex = /\[([a-zA-Z0-9_.]+)\]/g;
  return text.replace(regex, (match, key) => {
    const val = findBlockValue(prompts, key);
    return val !== null ? val : match;
  });
};
export const ContentApp = () => {
  _s();
  const [activeElement, setActiveElement] = useState(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState(null);
  useEffect(() => {
    getSettings().then(setSettings);
  }, []);
  useEffect(() => {
    const handleFocus = (e) => {
      const target = e.target;
      const customSelectors = settings?.customSelectors || [];
      if (InputManager.isValidTarget(target, customSelectors)) {
        updatePosition(target);
        setActiveElement(target);
        setError(null);
      }
    };
    const handleScroll = () => {
      if (activeElement) updatePosition(activeElement);
    };
    document.addEventListener("focusin", handleFocus);
    window.addEventListener("resize", handleScroll);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("focusin", handleFocus);
      window.removeEventListener("resize", handleScroll);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [activeElement, settings]);
  const updatePosition = (target) => {
    const rect = target.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    setPosition({
      top: rect.top + scrollTop + 8,
      left: rect.right + scrollLeft - 40
      // Moved a bit more to left to avoid scrollbars
    });
  };
  const handleAskAI = async () => {
    if (!activeElement || !settings) return;
    const text = InputManager.getValue(activeElement);
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const freshSettings = await getSettings();
      const expandedPrompt = expandPrompts(text, freshSettings.prompts);
      console.log("Sending prompt:", expandedPrompt);
      chrome.runtime.sendMessage({ type: "ASK_AI", payload: { prompt: expandedPrompt } }, (response) => {
        setLoading(false);
        if (chrome.runtime.lastError) {
          setError(chrome.runtime.lastError.message || "Error communicating with background");
          return;
        }
        if (response && response.success) {
          InputManager.setValue(activeElement, response.text);
        } else {
          setError(response?.error || "Unknown error from AI");
        }
      });
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };
  if (!activeElement) return null;
  return /* @__PURE__ */ jsxDEV(
    "div",
    {
      style: {
        position: "absolute",
        top: position.top,
        left: position.left,
        zIndex: 999999
      },
      className: "font-sans",
      children: /* @__PURE__ */ jsxDEV("div", { className: "relative group", children: [
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onMouseDown: (e) => e.preventDefault(),
            onClick: handleAskAI,
            className: `
                flex items-center justify-center w-8 h-8 rounded-full shadow-md transition-all
                ${loading ? "bg-slate-100 cursor-wait" : "bg-blue-600 hover:bg-blue-700 hover:scale-110 cursor-pointer"}
                ${error ? "bg-red-500" : ""}
                text-white
            `,
            title: "Ask AI",
            children: loading ? /* @__PURE__ */ jsxDEV(Loader2, { size: 16, className: "text-blue-600 animate-spin" }, void 0, false, {
              fileName: "/home/diiblo/Project/QuickAsk/src/content/ContentApp.tsx",
              lineNumber: 194,
              columnNumber: 11
            }, this) : error ? /* @__PURE__ */ jsxDEV(X, { size: 16 }, void 0, false, {
              fileName: "/home/diiblo/Project/QuickAsk/src/content/ContentApp.tsx",
              lineNumber: 196,
              columnNumber: 11
            }, this) : /* @__PURE__ */ jsxDEV(Sparkles, { size: 16 }, void 0, false, {
              fileName: "/home/diiblo/Project/QuickAsk/src/content/ContentApp.tsx",
              lineNumber: 198,
              columnNumber: 11
            }, this)
          },
          void 0,
          false,
          {
            fileName: "/home/diiblo/Project/QuickAsk/src/content/ContentApp.tsx",
            lineNumber: 182,
            columnNumber: 17
          },
          this
        ),
        error && /* @__PURE__ */ jsxDEV("div", { className: "absolute top-10 right-0 w-48 bg-red-100 text-red-800 text-xs p-2 rounded shadow-lg border border-red-200", children: error }, void 0, false, {
          fileName: "/home/diiblo/Project/QuickAsk/src/content/ContentApp.tsx",
          lineNumber: 203,
          columnNumber: 9
        }, this)
      ] }, void 0, true, {
        fileName: "/home/diiblo/Project/QuickAsk/src/content/ContentApp.tsx",
        lineNumber: 181,
        columnNumber: 13
      }, this)
    },
    void 0,
    false,
    {
      fileName: "/home/diiblo/Project/QuickAsk/src/content/ContentApp.tsx",
      lineNumber: 172,
      columnNumber: 5
    },
    this
  );
};
_s(ContentApp, "XtXmUVrgy8QGajRjGJDz3o00gxk=");
_c = ContentApp;
var _c;
$RefreshReg$(_c, "ContentApp");
if (import.meta.hot && !inWebWorker) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
}
if (import.meta.hot && !inWebWorker) {
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("/home/diiblo/Project/QuickAsk/src/content/ContentApp.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/home/diiblo/Project/QuickAsk/src/content/ContentApp.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
