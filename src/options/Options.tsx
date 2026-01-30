import { useEffect, useState } from 'react';
import { Save, Bot, Code, CheckCircle, AlertCircle } from 'lucide-react';
import { AppSettings, defaultSettings, getSettings, saveSettings, AIProvider } from '../utils/storage';

export default function Options() {
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    const [promptJson, setPromptJson] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'providers' | 'prompts'>('providers');

    useEffect(() => {
        getSettings().then((s) => {
            setSettings(s);
            setPromptJson(JSON.stringify(s.prompts, null, 2));
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        try {
            let parsedPrompts = settings.prompts;
            try {
                parsedPrompts = JSON.parse(promptJson);
            } catch (e) {
                setStatus({ type: 'error', message: 'Invalid JSON in Prompts' });
                return;
            }

            await saveSettings({
                ...settings,
                prompts: parsedPrompts
            });
            setStatus({ type: 'success', message: 'Settings saved successfully!' });
            setTimeout(() => setStatus(null), 3000);
        } catch (e) {
            setStatus({ type: 'error', message: 'Failed to save settings' });
        }
    };

    const updateProvider = (index: number, updates: Partial<AIProvider>) => {
        const newProviders = [...settings.providers];
        newProviders[index] = { ...newProviders[index], ...updates };
        setSettings({ ...settings, providers: newProviders });
    };

    if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <div className="max-w-4xl mx-auto p-6">
                <header className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg text-white">
                            <Bot size={24} />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">QuickAsk Configuration</h1>
                    </div>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                    >
                        <Save size={18} />
                        Save Changes
                    </button>
                </header>

                {status && (
                    <div className={`mb-6 p-4 rounded-md flex items-center gap-2 ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        {status.message}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="flex border-b border-slate-200">
                        <button
                            onClick={() => setActiveTab('providers')}
                            className={`flex-1 py-4 text-center font-medium ${activeTab === 'providers' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            AI Providers
                        </button>
                        <button
                            onClick={() => setActiveTab('prompts')}
                            className={`flex-1 py-4 text-center font-medium ${activeTab === 'prompts' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Prompt Blocks
                        </button>
                    </div>

                    <div className="p-6">
                        {activeTab === 'providers' ? (
                            <div className="space-y-6">
                                {settings.providers.map((provider, idx) => (
                                    <div key={provider.id} className={`p-4 rounded-lg border ${provider.enabled ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-semibold">{provider.name}</h3>
                                                <span className="text-xs font-mono text-slate-500 bg-slate-200 px-2 py-0.5 rounded">{provider.id}</span>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={provider.enabled}
                                                    onChange={(e) => updateProvider(idx, { enabled: e.target.checked })}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        {provider.enabled && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Base URL</label>
                                                    <input
                                                        type="text"
                                                        value={provider.baseUrl}
                                                        onChange={(e) => updateProvider(idx, { baseUrl: e.target.value })}
                                                        className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                                        placeholder="https://api..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                                                    <input
                                                        type="password"
                                                        value={provider.apiKey || ''}
                                                        onChange={(e) => updateProvider(idx, { apiKey: e.target.value })}
                                                        className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                                        placeholder={provider.id === 'ollama' ? 'Generic (Local)' : 'sk-...'}
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                                                    {provider.id === 'gemini' ? (
                                                        <select
                                                            value={provider.model || 'gemini-pro'}
                                                            onChange={(e) => updateProvider(idx, { model: e.target.value })}
                                                            className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white"
                                                        >
                                                            <option value="gemini-pro">Gemini Pro</option>
                                                            <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro</option>
                                                            <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash</option>
                                                            <option value="gemini-3-pro-preview">Gemini 3 Pro Preview (experimental)</option>
                                                            <option value="gemini-3-flash-preview">Gemini 3 Flash Preview (experimental)</option>
                                                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (experimental)</option>
                                                            <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (experimental)</option>
                                                        </select>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            value={provider.model || ''}
                                                            onChange={(e) => updateProvider(idx, { model: e.target.value })}
                                                            className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                                            placeholder="gpt-4, llama2, ... "
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {provider.id === 'ollama' && (
                                            <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">
                                                <p><strong>Localhost Issues?</strong> If you see "Forbidden (403)", stop Ollama and run:</p>
                                                <code className="block mt-1 bg-amber-100 p-1 rounded">OLLAMA_ORIGINS="*" ollama serve</code>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-slate-700">JSON Configuration</label>
                                    <span className="text-xs text-slate-500">Edit your [BLOCK] definitions here.</span>
                                </div>
                                <div className="relative">
                                    <textarea
                                        value={promptJson}
                                        onChange={(e) => setPromptJson(e.target.value)}
                                        className="w-full h-96 font-mono text-sm bg-slate-900 text-slate-50 p-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        spellCheck={false}
                                    />
                                    <div className="absolute top-2 right-2 text-slate-500 pointer-events-none">
                                        <Code size={16} />
                                    </div>
                                </div>
                                <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-md text-sm">
                                    <p className="font-semibold">How to use:</p>
                                    <p>Define keys strictly. Example: <code>"CV": &#123; "PROMPT": "..." &#125;</code>.</p>
                                    <p>In any input, type <code>[CV]</code> to trigger the replacement logic (when you click the magic button).</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
