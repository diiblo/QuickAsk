export class InputManager {
  /**
   * returns the text content of the element
   */
  static getValue(element) {
    if (!element) return "";
    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
      return element.value;
    }
    if (element.getAttribute("contenteditable") === "true") {
      const innerP = element.querySelector("p");
      if (innerP) {
        return innerP.innerText;
      }
      return element.innerText;
    }
    return element.innerText || "";
  }
  /**
   * Sets the text content of the element.
   * Handles complex events to ensure React/Frameworks pick up the change.
   */
  static setValue(element, text) {
    if (!element) return;
    element.focus();
    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
      const input = element;
      const prototype = Object.getPrototypeOf(element);
      const nativeValueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
      if (nativeValueSetter) {
        nativeValueSetter.call(input, text);
      } else {
        input.value = text;
      }
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    if (element.getAttribute("contenteditable") === "true") {
      try {
        element.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(element);
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
          const success = document.execCommand("insertText", false, text);
          if (success) return;
        }
      } catch (err) {
        console.warn("[InputManager] execCommand failed:", err);
      }
      const innerP = element.querySelector("p");
      if (innerP) {
        const lexicalSpan = innerP.querySelector('span[data-lexical-text="true"]');
        if (lexicalSpan) {
          lexicalSpan.innerText = text;
        } else {
          innerP.innerText = text;
        }
      } else {
        element.innerText = text;
      }
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
  /**
   * Checks if an element matches our target criteria (Focusable input-like element)
   */
  static isValidTarget(element, customSelectors = []) {
    if (!element) return false;
    if (customSelectors.some((selector) => element.matches(selector))) {
      return true;
    }
    if (element.matches('input[type="text"], input[type="search"], textarea')) {
      return true;
    }
    if (element.getAttribute("contenteditable") === "true") {
      return true;
    }
    return false;
  }
}
