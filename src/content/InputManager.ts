/**
 * Classe utilitaire pour gérer les différences complexes entre :
 * - <input> / <textarea> (Simples)
 * - <div contenteditable="true"> (Utilisé par Facebook, Gmail, etc.)
 * - Éditeurs complexes (LinkedIn avec des balises <p> imbriquées)
 */
export class InputManager {

    /**
     * Récupère le texte actuel de l'élément ciblé.
     */
    static getValue(element: HTMLElement): string {
        if (!element) return '';

        // 1. Cas simple : Input ou Textarea standard
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            return (element as HTMLInputElement | HTMLTextAreaElement).value;
        }

        // 2. Cas complexe : Zone éditable (contenteditable)
        // LinkedIn, par exemple, met le vrai texte dans un paragraphe <p> à l'intérieur de la div.
        if (element.getAttribute('contenteditable') === 'true') {
            const innerP = element.querySelector('p');
            if (innerP) {
                // On prend le texte du <p> pour éviter les retours à la ligne parasites du conteneur
                return innerP.innerText;
            }
            // Sinon on prend tout le texte brute
            return element.innerText;
        }

        return element.innerText || '';
    }

    /**
     * Remplace le texte de l'élément par le nouveau texte.
     * C'est la partie difficile car React/Angular/Vue peuvent ignorer nos changements simples.
     */
    static setValue(element: HTMLElement, text: string): void {
        if (!element) return;

        // On s'assure d'avoir le focus pour simuler une frappe
        element.focus();

        // 1. Cas simple : Input ou Textarea
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            const input = element as HTMLInputElement | HTMLTextAreaElement;

            // Hack pour React 16+ : Si on fait juste input.value = "..." React ne le "voit" pas.
            // On doit aller chercher le "setter" natif du prototype HTML.
            const prototype = Object.getPrototypeOf(element);
            const nativeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

            if (nativeValueSetter) {
                nativeValueSetter.call(input, text);
            } else {
                input.value = text;
            }

            // On crie à tout le monde que ça a changé
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            return;
        }

        // 2. Cas complexe : ContentEditable
        // (Utilisé par les éditeurs riches comme WhatsApp Web, LinkedIn, etc.)
        if (element.getAttribute('contenteditable') === 'true') {

            // Meilleure méthode : execCommand('insertText')
            // Ça fait croire au navigateur que l'utilisateur a physiquement tapé ou collé le texte.
            // C'est vital pour que les sites ne "perdent" pas le texte après coup.
            try {
                element.focus();

                // On sélectionne tout le texte existant pour l'écraser
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(element);

                if (selection) {
                    selection.removeAllRanges();
                    selection.addRange(range);

                    // La commande magique
                    const success = document.execCommand('insertText', false, text);

                    if (success) return; // Si ça a marché, on s'arrête là, c'est parfait.
                }
            } catch (err) {
                console.warn('[QuickAsk] execCommand a échoué, passage en mode manuel :', err);
            }

            // Plan B : Manipulation brutale du DOM (Moins fiable mais nécessaire parfois)

            // Spécifique LinkedIn : On écrit dans le <p>
            const innerP = element.querySelector('p');

            if (innerP) {
                // Spécifique Lexical (Framework de Facebook/WhatsApp)
                const lexicalSpan = innerP.querySelector('span[data-lexical-text="true"]');
                if (lexicalSpan) {
                    (lexicalSpan as HTMLElement).innerText = text;
                } else {
                    innerP.innerText = text;
                }
            } else {
                element.innerText = text;
            }

            // On appelle l'événement 'input' au cas où
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    /**
     * Détermine si un élément HTML mérite d'avoir le bouton Assistant.
     */
    static isValidTarget(element: HTMLElement, customSelectors: string[] = []): boolean {
        if (!element) return false;

        // Sélecteurs personnalisés définis par l'utilisateur
        if (customSelectors.some(selector => element.matches(selector))) {
            return true;
        }

        // Inputs classiques (texte, recherche) et zones de texte
        if (element.matches('input[type="text"], input[type="search"], textarea')) {
            return true;
        }

        // Zones éditables riches (div contenteditable)
        if (element.getAttribute('contenteditable') === 'true') {
            return true;
        }

        return false;
    }
}
