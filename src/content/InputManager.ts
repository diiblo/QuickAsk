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

        // 2. ContentEditable (Generic + LinkedIn + WhatsApp)
        if (element.getAttribute('contenteditable') === 'true') {
            // Challenge: Complex editors (Lexical, Draft.js, Monaco) rely on internal state.
            // Direct innerText manipulation often breaks them or gets reverted.
            // Best approach: Simulate user input via execCommand.

            try {
                element.focus();

                // Select all content to replace it
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(element);

                if (selection) {
                    selection.removeAllRanges();
                    selection.addRange(range);

                    // This is deprecated but implies "native user typed this"
                    // It handles undo stack, dirty state, and events for us.
                    const success = document.execCommand('insertText', false, text);

                    // If successful, we are done.
                    if (success) return;
                }
            } catch (err) {
                console.warn('[InputManager] execCommand failed:', err);
            }

            // Fallback: Manual DOM manipulation
            // This is "brittle" for complex editors but works for simple contenteditables

            // LinkedIn specific: Write inside the <p> if it exists
            const innerP = element.querySelector('p');

            if (innerP) {
                // Lexical (WhatsApp, Facebook) often nests text in a span inside p
                const lexicalSpan = innerP.querySelector('span[data-lexical-text="true"]');
                if (lexicalSpan) {
                    (lexicalSpan as HTMLElement).innerText = text;
                } else {
                    innerP.innerText = text;
                }
            } else {
                element.innerText = text;
            }

            // Trigger input event for listeners as a backup
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
