export interface AIProvider {
    id: string; // 'ollama', 'openai', 'anthropic', 'deepseek', 'openrouter', 'gemini', 'grok'
    name: string;
    baseUrl: string;
    apiKey?: string;
    model?: string;
    enabled: boolean;
}

export interface AppSettings {
    providers: AIProvider[];
    prompts: Record<string, any>;
}

export const defaultSettings: AppSettings = {
    providers: [
        { id: 'ollama', name: 'Ollama', baseUrl: 'http://localhost:11434', model: 'llama3', enabled: true },
        { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4-turbo', enabled: false },
        { id: 'anthropic', name: 'Claude', baseUrl: 'https://api.anthropic.com/v1', apiKey: '', model: 'claude-3-opus-20240229', enabled: false },
        { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', apiKey: '', model: 'deepseek-chat', enabled: false },
        { id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', apiKey: '', model: 'openai/gpt-3.5-turbo', enabled: false },
        { id: 'gemini', name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', apiKey: '', model: 'gemini-pro', enabled: false },
        { id: 'grok', name: 'Grok', baseUrl: 'https://api.x.ai/v1', apiKey: '', model: 'grok-1', enabled: false },
    ],
    prompts: {
        "CV": {
            "PROMPT": "Rédige une lettre de motivation..."
        }
    },
};

export const getSettings = async (): Promise<AppSettings> => {
    const data = await chrome.storage.sync.get('settings');
    return (data.settings as AppSettings) || defaultSettings;
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
    await chrome.storage.sync.set({ settings });
};
