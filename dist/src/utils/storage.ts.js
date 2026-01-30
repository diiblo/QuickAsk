export const defaultSettings = {
  providers: [
    { id: "ollama", name: "Ollama", baseUrl: "http://localhost:11434", model: "llama3", enabled: true },
    { id: "openai", name: "OpenAI", baseUrl: "https://api.openai.com/v1", apiKey: "", model: "gpt-4-turbo", enabled: false },
    { id: "anthropic", name: "Claude", baseUrl: "https://api.anthropic.com/v1", apiKey: "", model: "claude-3-opus-20240229", enabled: false },
    { id: "gemini", name: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta", apiKey: "", model: "gemini-2.5-flash", enabled: false },
    { id: "openrouter", name: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", apiKey: "", model: "openai/gpt-3.5-turbo", enabled: false }
  ],
  prompts: {
    "CV": {
      "CV1": "Rédige moi un CV en Latex type canada",
      "CV2": "Rédige moi un CV en Latex type France"
    },
    "LM": "Lettre de motivation en Latex"
  },
  customSelectors: [],
  language: "en"
};
export const getSettings = async () => {
  const data = await chrome.storage.sync.get("settings");
  return data.settings || defaultSettings;
};
export const saveSettings = async (settings) => {
  await chrome.storage.sync.set({ settings });
};
