import React from 'react';
import { createRoot } from 'react-dom/client';
import { ContentApp } from './ContentApp';
import styleText from '../index.css?inline';

const host = document.createElement('div');
host.id = 'quick-ask-extension-root';
host.style.position = 'absolute';
host.style.top = '0';
host.style.left = '0';
host.style.zIndex = '2147483647';
host.style.pointerEvents = 'none'; // Check this! We want clicks on our children to work
// Actually, if we put the host as full screen overlay, we block interactions.
// Better to just have the host be where it needs to be or 0x0 size.
document.body.appendChild(host);

const shadow = host.attachShadow({ mode: 'open' });

// Inject styles
const style = document.createElement('style');
style.textContent = styleText;
shadow.appendChild(style);

const rootContainer = document.createElement('div');
// We need to re-enable pointer events for our content
rootContainer.style.pointerEvents = 'auto';
shadow.appendChild(rootContainer);

const root = createRoot(rootContainer);
root.render(
    <React.StrictMode>
        <ContentApp />
    </React.StrictMode>
);

console.log('QuickAsk Content Script Mounted');
