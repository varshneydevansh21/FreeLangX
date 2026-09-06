// content.js - Injects a Netflix-style subtitle overlay onto the webpage

let subtitleContainer = null;
let subtitleClearTimer = null;

// Ensure the container is built when the page loads
function initSubtitleContainer() {
    if (document.getElementById('freelangx-subtitle-container')) return;

    subtitleContainer = document.createElement('div');
    subtitleContainer.id = 'freelangx-subtitle-container';
    
    // Netflix-style styling
    subtitleContainer.style.cssText = `
        position: fixed;
        bottom: 8%;
        left: 50%;
        transform: translateX(-50%);
        width: 80%;
        text-align: center;
        z-index: 2147483647;
        pointer-events: none;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        font-size: 32px;
        font-weight: bold;
        color: white;
        text-shadow: 
            0px 0px 4px rgba(0,0,0,1),
            0px 0px 8px rgba(0,0,0,0.8),
            2px 2px 4px rgba(0,0,0,1);
        letter-spacing: 0.5px;
        line-height: 1.3;
        display: none;
        transition: opacity 0.3s ease-in-out;
    `;

    document.body.appendChild(subtitleContainer);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'SHOW_SUBTITLE') {
        
        if (!subtitleContainer) {
            initSubtitleContainer();
        }

        // If offscreen.js sends an empty string (audio stopped), clear the screen immediately
        if (!message.text || message.text.trim() === '') {
            subtitleContainer.style.display = 'none';
            subtitleContainer.innerText = '';
            return;
        }

        // Otherwise, show the new perfectly synced subtitle
        subtitleContainer.innerText = message.text;
        subtitleContainer.style.display = 'block';
        
        // Failsafe: Just in case the audio gets permanently stuck, auto-clear after 15s
        if (subtitleClearTimer) {
            clearTimeout(subtitleClearTimer);
        }
        subtitleClearTimer = setTimeout(() => {
            subtitleContainer.style.display = 'none';
            subtitleContainer.innerText = '';
        }, 15000);
    }
});