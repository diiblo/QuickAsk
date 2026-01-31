import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { AppSettings, AIProvider, saveSettings } from '../utils/storage';
import { t } from '../utils/i18n';

interface SettingsPanelProps {
    settings: AppSettings;
    onClose: () => void;
    onSave: (newSettings: AppSettings) => void;
}

const DEFAULT_PROVIDER_IDS = ['ollama', 'openai', 'anthropic', 'gemini', 'openrouter'];

export const SettingsPanel = ({ settings: initialSettings, onClose, onSave }: SettingsPanelProps) => {
    // Les paramètres locaux (on ne sauvegarde rien tant qu'on n'a pas cliqué sur "Enregistrer")
    const [settings, setSettings] = useState<AppSettings>(initialSettings);
    const [activeTab, setActiveTab] = useState<'providers' | 'blocks'>('providers');
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // État temporaire pour les blocs : On sépare la Clé Principale (Catégorie) et la Sous-Clé pour l'affichage
    const [blocks, setBlocks] = useState<{ mainKey: string; subKey: string; value: string }[]>([]);

    // --- Conversion de l'objet JSON (imbriqué) vers une liste plate pour l'interface ---
    useEffect(() => {
        // Flatten prompts for the UI
        const flat: { mainKey: string; subKey: string; value: string }[] = [];

        // Fonction récursive qui parcourt tout l'objet de prompts
        const traverse = (obj: any, prefix = '') => {
            for (const key in obj) {
                const val = obj[key];
                // On construit la clé complète ex: "CV_Canada"
                const fullKey = prefix ? `${prefix}_${key}` : key;

                if (typeof val === 'string') {
                    // C'est une feuille (un texte). On doit le découper pour l'afficher dans les 2 champs.
                    // On coupe au PREMIER underscore.
                    const parts = fullKey.split('_');
                    const mainKey = parts[0]; // ex: "CV"
                    // Join the rest as the subkey (if any)
                    const subKey = parts.slice(1).join('_'); // ex: "Canada" (ou vide si pas de sous-clé)

                    flat.push({ mainKey, subKey, value: val });
                } else if (typeof val === 'object' && val !== null) {
                    // C'est un dossier, on continue de creuser
                    traverse(val, fullKey);
                }
            }
        };
        traverse(settings.prompts);
        setBlocks(flat);
    }, [settings.prompts]);

    // --- Sauvegarde des changements ---
    const handleSave = async () => {
        try {
            // 1. On reconstruit l'objet JSON complet à partir de la liste plate des blocs
            const newPrompts: Record<string, any> = {};

            blocks.forEach(block => {
                // On recrée la clé composite : CATEGORIE_SOUSCLE
                const compositeKey = block.subKey && block.subKey.trim() !== ''
                    ? `${block.mainKey}_${block.subKey}`
                    : block.mainKey;

                // On redécoupe par underscore pour créer la structure d'objet
                const parts = compositeKey.split('_');
                let current = newPrompts;

                parts.forEach((part, index) => {
                    const cleanPart = part.trim();
                    if (!cleanPart) return; // Sécurité contre les erreurs de frappe (ex: double underscore)

                    // Si c'est le dernier morceau, on met la valeur (le texte du prompt)
                    if (index === parts.length - 1) {
                        current[cleanPart] = block.value;
                    } else {
                        // Sinon on crée un sous-objet s'il n'existe pas
                        current[cleanPart] = current[cleanPart] || {};
                        // Petite sécurité au cas où on écrase une chaîne par un objet
                        if (typeof current[cleanPart] !== 'object') {
                            current[cleanPart] = {};
                        }
                        current = current[cleanPart];
                    }
                });
            });

            // 2. On sauvegarde tout
            const newSettings = { ...settings, prompts: newPrompts };
            await saveSettings(newSettings);
            onSave(newSettings);
            // Feedback utilisateur
            setStatus({ type: 'success', message: t(settings.language, 'saved') });
            setTimeout(() => setStatus(null), 2000);
        } catch (e) {
            setStatus({ type: 'error', message: t(settings.language, 'error') });
        }
    };

    // --- Gestion des Fournisseurs IA ---
    const updateProvider = (index: number, updates: Partial<AIProvider>) => {
        const newProviders = [...settings.providers];
        newProviders[index] = { ...newProviders[index], ...updates };
        setSettings({ ...settings, providers: newProviders });
    };

    const addProvider = () => {
        const newProvider: AIProvider = {
            id: `custom-${Date.now()}`,
            name: 'Nouveau Fournisseur',
            baseUrl: 'https://api.example.com/v1',
            apiKey: '',
            model: 'gpt-3.5-turbo',
            enabled: false
        };
        setSettings({ ...settings, providers: [...settings.providers, newProvider] });
    };

    const removeProvider = (index: number) => {
        if (confirm(t(settings.language, 'removeProviderConfirm'))) {
            const newProviders = settings.providers.filter((_, i) => i !== index);
            setSettings({ ...settings, providers: newProviders });
        }
    };

    // --- Gestion des Blocs (Mise à jour locale) ---
    const updateBlock = (index: number, field: 'mainKey' | 'subKey' | 'value', val: string) => {
        const newBlocks = [...blocks];
        newBlocks[index] = { ...newBlocks[index], [field]: val };
        setBlocks(newBlocks);
    };

    const addBlock = () => {
        // Ajout d'un bloc vide par défaut
        setBlocks([...blocks, { mainKey: 'NOUVEAU', subKey: '', value: 'Contenu...' }]);
    };

    const removeBlock = (index: number) => {
        const newBlocks = blocks.filter((_, i) => i !== index);
        setBlocks(newBlocks);
    };

    return (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-sans animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* En-tête (Header) */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">{t(settings.language, 'configTitle')}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 p-2 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Onglets (Tabs) */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('providers')}
                        className={`flex-1 py-3 text-center font-medium transition-colors ${activeTab === 'providers' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                    >
                        {t(settings.language, 'providersTab')}
                    </button>
                    <button
                        onClick={() => setActiveTab('blocks')}
                        className={`flex-1 py-3 text-center font-medium transition-colors ${activeTab === 'blocks' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                    >
                        {t(settings.language, 'promptsTab')}
                    </button>
                </div>

                {/* Contenu Principal */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {/* Message de statut (Succès/Erreur) */}
                    {status && (
                        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                            {status.message}
                        </div>
                    )}

                    {activeTab === 'providers' ? (
                        <div className="space-y-4">
                            {settings.providers.map((provider, idx) => {
                                const isDefault = DEFAULT_PROVIDER_IDS.includes(provider.id);
                                return (
                                    <div key={idx} className={`p-4 rounded-xl border transition-all ${provider.enabled ? 'border-blue-300 bg-white shadow-sm ring-1 ring-blue-100' : 'border-gray-200 bg-gray-50 opacity-80'}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2 flex-1">
                                                {isDefault ? (
                                                    <span className="font-bold text-gray-800">{provider.name}</span>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={provider.name}
                                                        onChange={(e) => updateProvider(idx, { name: e.target.value })}
                                                        className="font-bold bg-transparent border-none focus:ring-0 p-0 text-gray-800 w-full"
                                                        placeholder={t(settings.language, 'providerNamePlaceholder')}
                                                    />
                                                )}
                                                <span className="text-xs font-mono text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">{provider.id}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={provider.enabled}
                                                        onChange={(e) => updateProvider(idx, { enabled: e.target.checked })}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                                </label>
                                                {!isDefault && (
                                                    <button onClick={() => removeProvider(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {provider.enabled && (
                                            <div className="grid grid-cols-1 gap-3 mt-3 animate-in slide-in-from-top-2 duration-200">
                                                <input
                                                    type="text"
                                                    value={provider.baseUrl}
                                                    onChange={(e) => updateProvider(idx, { baseUrl: e.target.value })}
                                                    className="w-full rounded-lg border-gray-300 text-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder={t(settings.language, 'baseUrl')}
                                                />
                                                <div className="flex gap-3">
                                                    <input
                                                        type="password"
                                                        value={provider.apiKey || ''}
                                                        onChange={(e) => updateProvider(idx, { apiKey: e.target.value })}
                                                        className="flex-1 rounded-lg border-gray-300 text-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder={t(settings.language, 'apiKey')}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={provider.model || ''}
                                                        onChange={(e) => updateProvider(idx, { model: e.target.value })}
                                                        className="w-1/3 rounded-lg border-gray-300 text-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder={t(settings.language, 'model')}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            <button
                                onClick={addProvider}
                                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 flex items-center justify-center gap-2 transition-all font-medium hover:bg-blue-50"
                            >
                                <Plus size={18} />
                                {t(settings.language, 'addNewProvider')}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
                                {t(settings.language, 'blocksHelp')}
                            </div>
                            {blocks.map((block, idx) => (
                                <div key={idx} className="flex flex-col md:flex-row gap-3 items-start p-3 bg-white rounded-xl shadow-sm border border-gray-200 group hover:border-blue-300 transition-colors">
                                    <div className="w-full md:w-5/12 grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">{t(settings.language, 'category')}</label>
                                            <div className="relative">
                                                <span className="absolute left-2 top-2 text-gray-400 font-mono">[</span>
                                                <input
                                                    type="text"
                                                    value={block.mainKey}
                                                    onChange={(e) => updateBlock(idx, 'mainKey', e.target.value)}
                                                    className="w-full pl-4 py-1.5 rounded-lg border-gray-300 font-mono text-sm focus:ring-blue-500 focus:border-blue-500 text-blue-700 font-bold"
                                                    placeholder="CAT..."
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider flex justify-between">
                                                {t(settings.language, 'subkey')}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-2 top-0.5 text-gray-400 font-mono font-bold">_</span>
                                                <input
                                                    type="text"
                                                    value={block.subKey}
                                                    onChange={(e) => updateBlock(idx, 'subKey', e.target.value)}
                                                    className="w-full pl-5 pr-4 py-1.5 rounded-lg border-gray-300 font-mono text-sm focus:ring-blue-500 focus:border-blue-500 text-purple-700 font-bold"
                                                    placeholder="SUB..."
                                                />
                                                <span className="absolute right-2 top-2 text-gray-400 font-mono">]</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">{t(settings.language, 'blockContent')}</label>
                                        <textarea
                                            value={block.value}
                                            onChange={(e) => updateBlock(idx, 'value', e.target.value)}
                                            className="w-full rounded-lg border-gray-300 text-sm p-2 focus:ring-blue-500 focus:border-blue-500 min-h-[60px]"
                                            placeholder="..."
                                            rows={2}
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeBlock(idx)}
                                        className="mt-6 text-gray-400 hover:text-red-500 transition-colors p-1"
                                        title={t(settings.language, 'deleteBlock')}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={addBlock}
                                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 flex items-center justify-center gap-2 transition-all font-medium hover:bg-blue-50"
                            >
                                <Plus size={18} />
                                {t(settings.language, 'addBlock')}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        {t(settings.language, 'cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                    >
                        <Save size={18} />
                        {t(settings.language, 'save')}
                    </button>
                </div>
            </div>
        </div>
    );
};
