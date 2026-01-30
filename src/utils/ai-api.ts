import { AIProvider } from './storage';

interface AIResponse {
    text: string;
    error?: string;
}

export const callAI = async (provider: AIProvider, prompt: string): Promise<AIResponse> => {
    if (!provider.enabled) {
        return { text: '', error: `Provider ${provider.name} is disabled.` };
    }

    try {
        if (provider.id === 'ollama') {
            return callOllama(provider, prompt);
        } else if (provider.id === 'gemini') {
            return callGemini(provider, prompt);
        } else {
            // Assume OpenAI compatible for everything else for now (OpenAI, DeepSeek, OpenRouter, Groq, etc.)
            return callOpenAICompatible(provider, prompt);
        }
    } catch (error: any) {
        console.error('AI Call failed:', error);
        return { text: '', error: error.message || 'Unknown error occurred.' };
    }
};

const callOllama = async (provider: AIProvider, prompt: string): Promise<AIResponse> => {
    // Basic cleanup of URL
    let baseUrl = provider.baseUrl.replace(/\/$/, '');

    // Check if user already included /api/generate
    if (!baseUrl.endsWith('/api/generate')) {
        baseUrl = `${baseUrl}/api/generate`;
    }
    const url = baseUrl;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (provider.apiKey) {
        headers['Authorization'] = `Bearer ${provider.apiKey}`;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: provider.model || 'llama2',
                prompt: prompt,
                stream: false,
            }),
        });

        if (response.status === 403) {
            throw new Error(`Forbidden (403). For local Ollama, set environment variable OLLAMA_ORIGINS="*".`);
        }

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Ollama Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        return { text: data.response };
    } catch (e: any) {
        if (e.message && e.message.includes('Failed to fetch')) {
            throw new Error('Connection failed. Verify Ollama is running and OLLAMA_ORIGINS="*" is set.');
        }
        throw e;
    }
};

const callGemini = async (provider: AIProvider, prompt: string): Promise<AIResponse> => {
    // Gemini API: https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=API_KEY

    let baseUrl = provider.baseUrl.replace(/\/$/, '');
    const model = provider.model || 'gemini-pro';

    // Fix common user misconfig: ensure URL points to the API root, not chat/completions
    if (baseUrl.includes('googleapis.com')) {
        // Force correct structure if it's the official API
        // Allow users to just paste "https://generativelanguage.googleapis.com"
        if (!baseUrl.includes('/v1beta')) {
            baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
        }
    }

    // If the base URL is the official one, construct the standard path
    let url = `${baseUrl}/models/${model}:generateContent`;

    const response = await fetch(`${url}?key=${provider.apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        // Handle common 404
        if (response.status === 404) {
            throw new Error(`404 Not Found. Check if model "${model}" exists or API key is valid.`);
        }
        throw new Error(`Gemini Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error('Gemini: No text returned in response. Content blocked?');
    }

    return { text };
};

const callOpenAICompatible = async (provider: AIProvider, prompt: string): Promise<AIResponse> => {
    // Handle different paths if needed, but standard is /chat/completions
    let url = provider.baseUrl;
    if (!url.endsWith('/chat/completions') && !url.endsWith('/generate')) {
        // Append standard path if not present and doesn't look like a full path
        if (!url.includes('/', 8)) { // basic check if it has path
            url = `${url}/chat/completions`;
        } else if (url.endsWith('/v1')) {
            url = `${url}/chat/completions`;
        }
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
            model: provider.model || 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`API Error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    return { text: data.choices[0].message.content };
};
