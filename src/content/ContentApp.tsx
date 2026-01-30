import { useEffect, useState } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { getSettings } from '../utils/storage';

// Logic to traverse object by path or key
const findBlockValue = (obj: any, key: string): string | null => {
    if (typeof obj !== 'object' || obj === null) return null;

    let value: any = null;

    if (key in obj) {
        value = obj[key];
    } else if (key.includes('_') || key.includes('.')) {
        // Try dot notation
        const parts = key.split(/[_.]/);
        let current = obj;
        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                current = null;
                break;
            }
        }
        value = current;
    }

    if (typeof value === 'string') return value;

    // If it is an object, look for "PROMPT" key (convention)
    if (value && typeof value === 'object' && 'PROMPT' in value && typeof value['PROMPT'] === 'string') {
        return value['PROMPT'];
    }

    // Fallback: If object but no PROMPT, maybe stringify it? 
    // Or just return null to ignore it. 
    // Given the user example, "aa": { "PROMPT": "..." } -> [aa] -> "..."
    // We should definitely prioritize the logic above.

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

    useEffect(() => {
        const handleFocus = (e: Event) => {
            const target = e.target as HTMLElement;
            if (target.matches('input[type="text"], input[type="search"], textarea, [contenteditable="true"]')) {
                updatePosition(target);
                setActiveElement(target);
                setError(null);
            }
        };

        const handleScroll = () => {
            if (activeElement) updatePosition(activeElement);
        };

        document.addEventListener('focusin', handleFocus);
        window.addEventListener('resize', handleScroll);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('focusin', handleFocus);
            window.removeEventListener('resize', handleScroll);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [activeElement]);

    const updatePosition = (target: HTMLElement) => {
        const rect = target.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

        // Position at top right inside the input
        setPosition({
            top: rect.top + scrollTop + 8,
            left: rect.right + scrollLeft - 32 // 32px from right
        });
    };

    const handleAskAI = async () => {
        if (!activeElement) return;

        let text = '';
        if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
            text = (activeElement as HTMLInputElement | HTMLTextAreaElement).value;
        } else {
            text = activeElement.innerText;
        }

        if (!text.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const settings = await getSettings();
            const expandedPrompt = expandPrompts(text, settings.prompts);

            console.log('Sending prompt:', expandedPrompt);

            chrome.runtime.sendMessage({ type: 'ASK_AI', payload: { prompt: expandedPrompt } }, (response) => {
                setLoading(false);
                if (chrome.runtime.lastError) {
                    setError(chrome.runtime.lastError.message || 'Error communicating with background');
                    return;
                }

                if (response && response.success) {
                    insertText(response.text);
                } else {
                    setError(response?.error || 'Unknown error from AI');
                }
            });

        } catch (err: any) {
            setLoading(false);
            setError(err.message);
        }
    };

    const insertText = (text: string) => {
        if (!activeElement) return;

        // Focus element again if lost
        activeElement.focus();

        // Native setter hack for React/Frameworks
        const prototype = Object.getPrototypeOf(activeElement);
        const nativeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

        if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
            const input = activeElement as HTMLInputElement;

            // Clear and set
            // The request said "préalablement vidé", so strictly replace.
            if (nativeValueSetter) {
                nativeValueSetter.call(input, text);
            } else {
                input.value = text;
            }

            // Dispatch events
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
            // contenteditable
            activeElement.innerText = text;
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
