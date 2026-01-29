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
    const url = `${provider.baseUrl.replace(/\/$/, '')}/api/generate`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: provider.model || 'llama2',
            prompt: prompt,
            stream: false,
        }),
    });

    if (!response.ok) {
        throw new Error(`Ollama Error: ${response.statusText}`);
    }

    const data = await response.json();
    return { text: data.response };
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
