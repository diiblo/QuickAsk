

console.log('Block Extension Content Script Loaded');

interface BlockConfig {
    [key: string]: string;
}

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'EXECUTE_BLOCKS') {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)) {
            processElement(activeElement);
        } else {
            console.log("No editable element focused");
        }
    }
});

// Also listen for Shortcut (Alt+Shift+E is common but let's just stick to listener for now)
document.addEventListener('keydown', (e) => {
    // Check if user pressed Alt+Shift+E (example)
    if (e.altKey && e.shiftKey && e.code === 'KeyE') {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement) processElement(activeElement);
    }
});

async function processElement(element: HTMLElement) {
    console.log("Processing element", element);

    let text = '';
    let isInput = false;

    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        text = (element as HTMLInputElement | HTMLTextAreaElement).value;
        isInput = true;
    } else if (element.isContentEditable) {
        text = element.innerText; // or innerHTML depending on complexity
        isInput = false;
    }

    if (!text) return;

    // Fetch config
    const data = await chrome.storage.local.get(['blockConfig']);
    const config: BlockConfig = data.blockConfig || {};

    // Regex to find [BLOCK_NAME]
    // We look for [UPPERCASE_WITH_UNDERSCORES]
    const regex = /\[([A-Z0-9_]+)\]/g;

    const newText = text.replace(regex, (match, key) => {
        if (config[key]) {
            return config[key];
        }
        return match; // Return original if not found
    });

    if (newText !== text) {
        if (isInput) {
            (element as HTMLInputElement).value = newText;
            // Dispatch input event to notify frameworks (React, etc)
            element.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            element.innerText = newText;
        }
        console.log("Replaced text successfully");
    }
}
