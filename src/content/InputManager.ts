/**
 * Helper class to abstract away the differences between:
 * - <input> / <textarea>
 * - Standard <div contenteditable="true">
 * - Complex LinkedIn editors (nested <p> tags)
 */
export class InputManager {

    /**
     * returns the text content of the element
     */
    static getValue(element: HTMLElement): string {
        if (!element) return '';

        // 1. Standard Input/Textarea
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            return (element as HTMLInputElement | HTMLTextAreaElement).value;
        }

        // 2. LinkedIn specific check
        // LinkedIn uses a contenteditable div that often contains a <p> where the text actually lives.
        // It sometimes has a placeholder in a data attribute or other structure.
        // We defer to the inner <p> if it exists and we are in a likely LinkedIn editor.
        if (element.getAttribute('contenteditable') === 'true') {
            // Check for inner paragraph for LinkedIn editors
            const innerP = element.querySelector('p');
            if (innerP) {
                // Use innerText of the P tag to avoid getting extra newlines from the div wrapper
                return innerP.innerText;
            }
            // Fallback to standard contenteditable
            return element.innerText;
        }

        return element.innerText || '';
    }

    /**
     * Sets the text content of the element.
     * Handles complex events to ensure React/Frameworks pick up the change.
     */
    static setValue(element: HTMLElement, text: string): void {
        if (!element) return;

        // Ensure focus
        element.focus();

        // 1. Standard Input/Textarea
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            const input = element as HTMLInputElement | HTMLTextAreaElement;

            // React 16+ hack: standard .value = x won't trigger React onChange
            const prototype = Object.getPrototypeOf(element);
            const nativeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

            if (nativeValueSetter) {
                nativeValueSetter.call(input, text);
            } else {
                input.value = text;
            }

            // Dispatch events
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            return;
        }

        // 2. ContentEditable (Generic + LinkedIn)
        if (element.getAttribute('contenteditable') === 'true') {
            // LinkedIn specific: Write inside the <p> if it exists
            const innerP = element.querySelector('p');

            if (innerP) {
                innerP.innerText = text;
            } else {
                // Determine if we should create a p tag? 
                // LinkedIn usually starts with one. If it's empty, it might be just <br> or empty.
                // Safest is to just set innerText of the parent if no P exists, 
                // OR check if we are on LinkedIn and force a P? 
                // For now, let's stick to simple replacement.
                element.innerText = text;
            }

            // Trigger input event for listeners
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    /**
     * Checks if an element matches our target criteria (Focusable input-like element)
     */
    static isValidTarget(element: HTMLElement, customSelectors: string[] = []): boolean {
        if (!element) return false;

        // Custom selectors from user config
        if (customSelectors.some(selector => element.matches(selector))) {
            return true;
        }

        // Standard inputs
        if (element.matches('input[type="text"], input[type="search"], textarea')) {
            return true;
        }

        // Contenteditable
        if (element.getAttribute('contenteditable') === 'true') {
            return true;
        }

        return false;
    }
}
