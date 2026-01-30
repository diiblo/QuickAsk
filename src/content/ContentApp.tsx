import { useEffect, useState } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { getSettings, AppSettings } from '../utils/storage';
import { InputManager } from './InputManager';

// Logic to traverse object by path or key
const findBlockValue = (obj: any, key: string): string | null => {
    if (typeof obj !== 'object' || obj === null) return null;

    // 1. Direct match
    if (key in obj && typeof obj[key] === 'string') {
        return obj[key];
    }

    // 2. Nested match with underscore [BLOCK_KEY] -> obj[BLOCK][KEY]
    if (key.includes('_')) {
        const parts = key.split('_');
        // We only support 1 level of nesting for now as per spec [CV_CV1]
        // But let's be generic: iterate parts
        let current = obj;
        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                current = null;
                break;
            }
        }
        if (typeof current === 'string') return current;
    }

    // 3. Fallback: If it's an object, do we return something? 
    // Spec says: [LM] -> "Lettre..." (string). [CV] -> {CV1...}. 
    // If user types [CV], we probably can't replace it with an object.

    return null;
};

const expandPrompts = (text: string, prompts: any): string => {
    const regex = /\[([a-zA-Z0-9_.]+)\]/g;
    return text.replace(regex, (match, key) => {
        const val = findBlockValue(prompts, key);
        return val !== null ? val : match; // Keep original if not found
    });
};

export const ContentApp = () => {
    const [activeElement, setActiveElement] = useState<HTMLElement | null>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [settings, setSettings] = useState<AppSettings | null>(null);

    // Initial settings load
    useEffect(() => {
        getSettings().then(setSettings);
    }, []);

    // Listen for focus events
    useEffect(() => {
        const handleFocus = (e: Event) => {
            const target = e.target as HTMLElement;
            // Use InputManager and Custom Selectors
            const customSelectors = settings?.customSelectors || [];
            if (InputManager.isValidTarget(target, customSelectors)) {
                updatePosition(target);
                setActiveElement(target);
                setError(null);
            }
        };

        // Also listen for clicks/interactions that might change focus but isn't a standard focus event
        // (common in complex SPA editors like LinkedIn where focus stays on a container)
        // Note: 'focusin' generally bubbles and catches most things.

        const handleScroll = () => {
            if (activeElement) updatePosition(activeElement);
        };

        document.addEventListener('focusin', handleFocus);
        // Checking for 'data-artdeco-is-focused' mutation might be overkill if focusin works, 
        // but for LinkedIn sometimes focus is managed virtually. 
        // Let's stick to focusin for now, it usually fires for contenteditable.

        window.addEventListener('resize', handleScroll);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('focusin', handleFocus);
            window.removeEventListener('resize', handleScroll);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [activeElement, settings]);

    const updatePosition = (target: HTMLElement) => {
        const rect = target.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

        // Check if it's the specific LinkedIn structure to position better?
        // Usually top-right relative to the container is fine.

        setPosition({
            top: rect.top + scrollTop + 8,
            left: rect.right + scrollLeft - 40
            // Moved a bit more to left to avoid scrollbars
        });
    };

    const handleAskAI = async () => {
        if (!activeElement || !settings) return;

        // Use InputManager to get text
        const text = InputManager.getValue(activeElement);

        if (!text.trim()) return;

        setLoading(true);
        setError(null);

        try {
            // Re-fetch settings closely to ensure fresh prompts? 
            // Or rely on state. State is fine for now but syncing might be safer.
            const freshSettings = await getSettings();
            const expandedPrompt = expandPrompts(text, freshSettings.prompts);

            console.log('Sending prompt:', expandedPrompt);

            chrome.runtime.sendMessage({ type: 'ASK_AI', payload: { prompt: expandedPrompt } }, (response) => {
                setLoading(false);
                if (chrome.runtime.lastError) {
                    setError(chrome.runtime.lastError.message || 'Error communicating with background');
                    return;
                }

                if (response && response.success) {
                    // Use InputManager to set text
                    InputManager.setValue(activeElement, response.text);
                } else {
                    setError(response?.error || 'Unknown error from AI');
                }
            });

        } catch (err: any) {
            setLoading(false);
            setError(err.message);
        }
    };

    if (!activeElement) return null;

    return (
        <div
            style={{
                position: 'absolute',
                top: position.top,
                left: position.left,
                zIndex: 999999
            }}
            className="font-sans"
        >
            <div className="relative group">
                <button
                    onMouseDown={(e) => e.preventDefault()} // Prevent blur
                    onClick={handleAskAI}
                    className={`
                flex items-center justify-center w-8 h-8 rounded-full shadow-md transition-all
                ${loading ? 'bg-slate-100 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 hover:scale-110 cursor-pointer'}
                ${error ? 'bg-red-500' : ''}
                text-white
            `}
                    title="Ask AI"
                >
                    {loading ? (
                        <Loader2 size={16} className="text-blue-600 animate-spin" />
                    ) : error ? (
                        <X size={16} />
                    ) : (
                        <Sparkles size={16} />
                    )}
                </button>

                {error && (
                    <div className="absolute top-10 right-0 w-48 bg-red-100 text-red-800 text-xs p-2 rounded shadow-lg border border-red-200">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};
