let activeTabId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "START_TRANSLATION") {
        startTranslation(message.language);
    } else if (message.action === "STOP_TRANSLATION") {
        stopTranslation();
    } 
    // PHASE 1 FEATURE: Catch the subtitle text and route it to the active video tab
    else if (message.type === "FORWARD_SUBTITLE" && activeTabId !== null) {
        chrome.tabs.sendMessage(activeTabId, { 
            action: 'SHOW_SUBTITLE', 
            text: message.text 
        }).catch(() => {
            // Failsafe: Ignore error if user hasn't refreshed the tab since installing extension
            console.log("Could not inject subtitles. Tab needs a refresh.");
        });
    }
});

async function startTranslation(language) {
    await setupOffscreenDocument('offscreen.html');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) return;
        
        const currentTab = tabs[0];
        activeTabId = currentTab.id; // Remember where to send subtitles
        
        chrome.tabCapture.getMediaStreamId({ targetTabId: currentTab.id }, (streamId) => {
            if (!streamId) return;

            chrome.runtime.sendMessage({
                target: 'offscreen',
                type: 'START_CAPTURE',
                streamId: streamId,
                language: language
            });
        });
    });
}

function stopTranslation() {
    chrome.runtime.sendMessage({
        target: 'offscreen',
        type: 'STOP_CAPTURE'
    });
    
    // Clear subtitles on stop
    if (activeTabId !== null) {
        chrome.tabs.sendMessage(activeTabId, { action: 'SHOW_SUBTITLE', text: '' }).catch(()=>{});
        activeTabId = null;
    }
}

let creating;
async function setupOffscreenDocument(path) {
    const offscreenUrl = chrome.runtime.getURL(path);
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [offscreenUrl]
    });

    if (existingContexts.length > 0) return;

    if (creating) {
        await creating;
    } else {
        creating = chrome.offscreen.createDocument({
            url: path,
            reasons: ['USER_MEDIA', 'AUDIO_PLAYBACK'],
            justification: 'Capturing tab audio to process real-time AI translation.'
        });
        await creating;
        creating = null;
    }
}