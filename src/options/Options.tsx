import React, { useEffect, useState } from 'react';

interface Config {
    [key: string]: string;
}

const Options: React.FC = () => {
    const [config, setConfig] = useState<Config>({
        NAME: '',
        SURNAME: '',
        EMAIL: ''
    });
    const [status, setStatus] = useState<string>('');

    useEffect(() => {
        chrome.storage.local.get(['blockConfig'], (result) => {
            if (result.blockConfig) {
                setConfig(result.blockConfig);
            }
        });
    }, []);

    const handleChange = (key: string, value: string) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        chrome.storage.local.set({ blockConfig: config }, () => {
            setStatus('Settings saved successfully!');
            setTimeout(() => setStatus(''), 2000);
        });
    };

    // Helper to add a new dynamic key if needed, or just stick to fixed for MVP
    // For MVP user requested [NAME], [SURNAME]. I'll allow adding custom keys.
    const [newKey, setNewKey] = useState('');

    const addNewKey = () => {
        if (newKey && !config[newKey]) {
            setConfig(prev => ({ ...prev, [newKey.toUpperCase()]: '' }));
            setNewKey('');
        }
    };

    return (
        <div className="container">
            <h1>Block Configuration</h1>
            <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
                Define your static blocks here. Use format <code>[KEY]</code> in inputs.
            </p>

            {Object.entries(config).map(([key, value]) => (
                <div key={key} className="form-group">
                    <label>[{key}]</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => handleChange(key, e.target.value)}
                            placeholder={`Value for [${key}]`}
                        />
                        <button
                            onClick={() => {
                                const newConfig = { ...config };
                                delete newConfig[key];
                                setConfig(newConfig);
                            }}
                            style={{ backgroundColor: '#ef4444' }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ))}

            <div className="form-group" style={{ marginTop: '2rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                <label>Add New Block Variable</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toUpperCase())}
                        placeholder="e.g. PHONE_NUMBER"
                    />
                    <button onClick={addNewKey} style={{ backgroundColor: '#10b981' }}>Add</button>
                </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <button onClick={handleSave}>Save Configuration</button>
            </div>

            {status && <div className="toast">{status}</div>}
        </div>
    );
};

export default Options;
