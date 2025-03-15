let currentType = 'quotes';
const contentElement = document.getElementById('content');
const typeIndicator = document.getElementById('type-indicator');
const CHANGE_INTERVAL = 10000; // 10 seconds

// Exit screensaver on mouse movement
document.addEventListener('mousemove', () => {
    chrome.runtime.sendMessage({ action: 'closeScreensaver' });
});

// Exit screensaver on key press
document.addEventListener('keydown', () => {
    chrome.runtime.sendMessage({ action: 'closeScreensaver' });
});

function getRandomContent(type) {
    const array = contentData[type];
    return array[Math.floor(Math.random() * array.length)];
}

function toggleType() {
    currentType = currentType === 'quotes' ? 'jokes' : 'quotes';
    return currentType;
}

function updateContent() {
    const type = toggleType();
    const content = getRandomContent(type);
    
    // Remove the fade-in class
    contentElement.classList.remove('fade-in');
    
    // Trigger reflow
    void contentElement.offsetWidth;
    
    // Add content and fade-in class
    contentElement.textContent = content;
    contentElement.classList.add('fade-in');
    
    // Update type indicator
    typeIndicator.textContent = type.charAt(0).toUpperCase() + type.slice(1);
}

// Initial content
updateContent();

// Update content periodically
setInterval(updateContent, CHANGE_INTERVAL);

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        updateContent();
    }
}); 