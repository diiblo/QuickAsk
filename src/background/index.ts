chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'execute-blocks',
        title: 'Execute Blocks',
        contexts: ['editable'],
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'execute-blocks' && tab?.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'EXECUTE_BLOCKS' })
            .catch(err => console.log("Could not send message, content script might not be loaded yet", err));
    }
});
