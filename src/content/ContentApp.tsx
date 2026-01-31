import { useEffect, useState } from 'react';
import { Sparkles, Loader2, X, Settings, Power } from 'lucide-react';
import { getSettings, AppSettings } from '../utils/storage';
import { InputManager } from './InputManager';
import { SettingsPanel } from './SettingsPanel';
import { t } from '../utils/i18n';

// --- Fonction utilitaire pour trouver une valeur dans les blocs ---
// Elle cherche si une clé comme "CV_CV1" existe dans notre objet de configuration
const findBlockValue = (obj: any, key: string): string | null => {
    if (typeof obj !== 'object' || obj === null) return null;

    // 1. Recherche directe (ex: clé "LM" qui vaut un texte)
    if (key in obj && typeof obj[key] === 'string') {
        return obj[key];
    }

    // 2. Recherche imbriquée avec underscore (ex: "CV_CV1" -> cherche "CV" puis "CV1")
    if (key.includes('_')) {
        const parts = key.split('_');
        let current = obj;
        // On descend dans l'objet niveau par niveau
        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                current = null;
                break;
            }
        }
        // Si on a trouvé une chaine de caractère à la fin, on la retourne
        if (typeof current === 'string') return current;
    }

    return null;
};

// --- Fonction pour remplacer les [CODES] par leur contenu ---
const expandPrompts = (text: string, prompts: any): string => {
    // Regex qui cherche tout ce qui est entre crochets, ex: [MON_CODE]
    const regex = /\[([a-zA-Z0-9_.]+)\]/g;
    return text.replace(regex, (match, key) => {
        const val = findBlockValue(prompts, key);
        return val !== null ? val : match; // Si on trouve le bloc, on remplace. Sinon on laisse tel quel.
    });
};

// === Composant Principal de l'Extension ===
export const ContentApp = () => {
    // L'élément HTML actuellement sélectionné (input, textarea...)
    const [activeElement, setActiveElement] = useState<HTMLElement | null>(null);
    // Position du bouton flottant (top, left)
    const [position, setPosition] = useState({ top: 0, left: 0 });
    // État de chargement (quand l'IA réfléchit)
    const [loading, setLoading] = useState(false);
    // Message d'erreur éventuel
    const [error, setError] = useState<string | null>(null);
    // Les paramètres de l'utilisateur (chargés depuis le stockage)
    const [settings, setSettings] = useState<AppSettings | null>(null);
    // Si le panneau de configuration est ouvert ou non
    const [showSettings, setShowSettings] = useState(false);

    // État ON/OFF pour l'IA. On retient le choix de l'utilisateur dans localStorage pour qu'il reste après rechargement.
    const [aiEnabled, setAiEnabled] = useState(() => {
        return localStorage.getItem('quickAsk_aiEnabled') !== 'false';
    });

    // Chargement initial des paramètres. On recharge aussi quand on ferme le panneau de config pour avoir les modifs à jour.
    useEffect(() => {
        getSettings().then(setSettings);
    }, [showSettings]);

    // Bascule ON/OFF de l'IA
    const toggleAi = () => {
        const newState = !aiEnabled;
        setAiEnabled(newState);
        localStorage.setItem('quickAsk_aiEnabled', String(newState));
    };

    // --- Gestionnaire d'événements pour détecter quand on clique dans un champ ---
    useEffect(() => {
        const handleFocus = (e: Event) => {
            const target = e.target as HTMLElement;
            // On vérifie si c'est un champ valide (input texte, textarea, ou div éditable comme LinkedIn)
            const customSelectors = settings?.customSelectors || [];
            if (InputManager.isValidTarget(target, customSelectors)) {
                updatePosition(target);    // On place le bouton à côté
                setActiveElement(target); // On mémorise cet élément comme "actif"
                setError(null);
            }
        };

        // On réajuste la position si on scrolle
        const handleScroll = () => {
            if (activeElement) updatePosition(activeElement);
        };

        // 'focusin' est mieux que 'focus' car il remonte (bubble)
        document.addEventListener('focusin', handleFocus);
        window.addEventListener('resize', handleScroll);
        window.addEventListener('scroll', handleScroll, true);

        // Nettoyage quand le composant est détruit (propreté du code)
        return () => {
            document.removeEventListener('focusin', handleFocus);
            window.removeEventListener('resize', handleScroll);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [activeElement, settings]);

    // Calcule où placer le bouton (juste à droite du champ, un peu en haut)
    const updatePosition = (target: HTMLElement) => {
        const rect = target.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

        setPosition({
            top: rect.top + scrollTop + 8,
            left: rect.right + scrollLeft - 10
        });
    };

    // --- Action principale : Clic sur le bouton Magic ✨ ---
    const handleAskAI = async () => {
        if (!activeElement || !settings) return;

        // Récupérer le texte écrit par l'utilisateur
        const text = InputManager.getValue(activeElement);
        if (!text.trim()) return;

        setLoading(true);
        setError(null);

        try {
            // On récupère les réglages frais (au cas où on vient de changer un bloc)
            const freshSettings = await getSettings();
            // 1. On remplace les blocs [CODE] par leur texte
            const expandedPrompt = expandPrompts(text, freshSettings.prompts);

            // Si le texte a changé (c'était juste un bloc), on met à jour le champ immédiatement
            if (expandedPrompt !== text) {
                InputManager.setValue(activeElement, expandedPrompt);
            }

            // Si l'IA est désactivée (OFF), on s'arrête là. On a juste fait l'expansion de bloc.
            if (!aiEnabled) {
                setLoading(false);
                return;
            }

            // 2. Si l'IA est ON, on envoie le tout au background script (backend)
            console.log('Envoi à l\'IA :', expandedPrompt);

            chrome.runtime.sendMessage({ type: 'ASK_AI', payload: { prompt: expandedPrompt } }, (response) => {
                setLoading(false);
                // Gestion des erreurs techniques (ex: background script planté)
                if (chrome.runtime.lastError) {
                    setError(chrome.runtime.lastError.message || 'Erreur de communication');
                    return;
                }

                // Succès ! On remplace le texte par la réponse de l'IA
                if (response && response.success) {
                    InputManager.setValue(activeElement, response.text);
                } else {
                    setError(response?.error || 'Erreur inconnue de l\'IA');
                }
            });

        } catch (err: any) {
            setLoading(false);
            setError(err.message);
        }
    };

    if (!activeElement) return null;

    return (
        <div className="font-sans text-base">
            {/* Affichage du panneau de configuration si demandé */}
            {showSettings && settings && (
                <SettingsPanel
                    settings={settings}
                    onClose={() => setShowSettings(false)}
                    onSave={(newSettings) => setSettings(newSettings)}
                />
            )}

            {/* Conteneur flottant du bouton */}
            <div
                style={{
                    position: 'absolute',
                    top: position.top,
                    left: position.left,
                    zIndex: 999990
                }}
                className="pointer-events-auto"
            >
                {/* Structure du Ruban (Bouton + Menu déroulant) */}
                <div className="relative flex items-center flex-row-reverse group h-10">
                    {/* Le Bouton Principal (Rond) */}
                    <button
                        onMouseDown={(e) => e.preventDefault()} // Empêche de perdre le focus du champ texte
                        onClick={handleAskAI}
                        className={`
                            relative z-20 flex items-center justify-center w-8 h-8 rounded-full shadow-lg transition-all duration-300 transform group-hover:scale-110
                            ${loading ? 'bg-slate-100 cursor-wait' : aiEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-800'}
                            ${error ? 'bg-red-500' : ''}
                            text-white ring-2 ring-white
                        `}
                        title={aiEnabled ? t(settings?.language || 'fr', 'askAI') : t(settings?.language || 'fr', 'aiDisabledTooltip')}
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : error ? (
                            <X size={16} />
                        ) : (
                            <Sparkles size={16} className={aiEnabled ? "" : "opacity-50"} />
                        )}
                    </button>

                    {/* Le Ruban (Se déroule vers la gauche au survol) */}
                    <div className="
                        absolute right-[50%] translate-x-[50%] top-0 h-8 bg-black/90 backdrop-blur-md text-white rounded-full flex items-center gap-2 
                        w-8 opacity-0 overflow-hidden transition-all duration-300 ease-out group-hover:w-48 group-hover:opacity-100 group-hover:translate-x-0 group-hover:right-0 group-hover:pr-10 group-hover:pl-3
                        shadow-xl z-10
                    "
                        style={{ right: '4px' }}>

                        {/* Bouton Paramètres ⚙️ */}
                        <button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setShowSettings(true)}
                            className="p-1.5 hover:bg-white/20 rounded-full transition-colors flex flex-shrink-0"
                            title={t(settings?.language || 'fr', 'settings')}
                        >
                            <Settings size={14} />
                        </button>

                        <div className="w-px h-4 bg-white/20 flex-shrink-0"></div>

                        {/* Bouton Toggle ON/OFF IA */}
                        <button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={toggleAi}
                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors whitespace-nowrap flex-shrink-0
                                ${aiEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                            title={aiEnabled ? t(settings?.language || 'fr', 'aiDisabledTooltip') : t(settings?.language || 'fr', 'aiEnabledTooltip')}
                        >
                            <Power size={12} />
                            {aiEnabled ? t(settings?.language || 'fr', 'aiOn') : t(settings?.language || 'fr', 'aiOff')}
                        </button>
                    </div>

                    {/* Message d'erreur flottant */}
                    {error && (
                        <div className="absolute top-10 right-0 w-48 bg-red-100 text-red-800 text-xs p-2 rounded shadow-lg border border-red-200 z-50">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
