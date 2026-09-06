// popup.js - Handles the UI interactions and sends commands to the background worker.

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusText = document.getElementById('status-text');
const statusIndicator = document.getElementById('status-indicator');
const languageSelect = document.getElementById('languageSelect');

// Restore state when the popup is opened
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['isTranslating', 'activeLanguage'], (data) => {
        if (data.isTranslating) {
            // Restore the dropdown to the active language
            languageSelect.value = data.activeLanguage;
            
            // Set UI to active state
            startBtn.disabled = true;
            startBtn.classList.add('opacity-50', 'cursor-not-allowed');
            stopBtn.disabled = false;
            
            statusText.innerText = 'Translating...';
            statusIndicator.classList.add('active');
        }
    });
});

startBtn.addEventListener('click', () => {
    const selectedLanguage = languageSelect.value;
    
    // Save state so it remembers when we reopen popup
    chrome.storage.local.set({ isTranslating: true, activeLanguage: selectedLanguage });
    
    // Update UI State
    startBtn.disabled = true;
    startBtn.classList.add('opacity-50', 'cursor-not-allowed');
    stopBtn.disabled = false;
    
    statusText.innerText = 'Translating...';
    statusIndicator.classList.add('active');

    // Send start message to the background service worker
    chrome.runtime.sendMessage({ 
        action: "START_TRANSLATION", 
        language: selectedLanguage 
    });
});

stopBtn.addEventListener('click', () => {
    // Revert UI State
    startBtn.disabled = false;
    startBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    stopBtn.disabled = true;

    statusText.innerText = 'Inactive';
    statusIndicator.classList.remove('active');

    // Send stop message to the background service worker
    chrome.runtime.sendMessage({ action: "STOP_TRANSLATION" });
    
    // Clear the saved state in Chrome storage
    chrome.storage.local.set({ isTranslating: false });
});