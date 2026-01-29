import { getSettings } from '../utils/storage';
import { callAI } from '../utils/ai-api';

console.log('QuickAsk background service worker started.');

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'ASK_AI') {
        processAskAI(message.payload).then(sendResponse);
        return true; // Asynchronous response
    }
});

async function processAskAI(payload: { prompt: string }) {
    try {
        const settings = await getSettings();
        // Find the first enabled provider or a specific one if we add selection logic later
        const provider = settings.providers.find(p => p.enabled);

        if (!provider) {
            return { success: false, error: 'No AI provider is enabled. Please configure settings.' };
        }

        const response = await callAI(provider, payload.prompt);

        if (response.error) {
            return { success: false, error: response.error };
        }

        return { success: true, text: response.text };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
