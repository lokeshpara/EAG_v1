// Constants for idle detection
const IDLE_TIME = 15; // Minimum allowed value in seconds for Chrome's idle detection
let screensaverWindow = null;

// Configure idle detection
chrome.idle.setDetectionInterval(IDLE_TIME);

// Listen for messages from screensaver
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'closeScreensaver' && screensaverWindow) {
        chrome.windows.remove(screensaverWindow.id, () => {
            screensaverWindow = null;
        });
    }
});

// Listen for idle state changes
chrome.idle.onStateChanged.addListener((state) => {
    if (state === 'idle' || state === 'locked') {
        // Show screensaver if not already showing
        if (!screensaverWindow) {
            chrome.windows.create({
                url: 'screensaver.html',
                type: 'popup',
                state: 'fullscreen'
            }, (window) => {
                screensaverWindow = window;
            });
        }
    } else if (state === 'active') {
        // Close screensaver if it's open
        if (screensaverWindow) {
            chrome.windows.remove(screensaverWindow.id, () => {
                screensaverWindow = null;
            });
        }
    }
}); 