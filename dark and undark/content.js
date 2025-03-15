// Function to safely inject style element
function injectStyle() {
  let style = document.getElementById('dark-mode-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'dark-mode-style';
    
    // If document.head is not available yet, wait for it
    if (!document.head) {
      const observer = new MutationObserver(function(mutations, obs) {
        if (document.head) {
          document.head.appendChild(style);
          obs.disconnect();
        }
      });
      
      observer.observe(document.documentElement || document, {
        childList: true,
        subtree: true
      });
    } else {
      document.head.appendChild(style);
    }
  }
  return style;
}

// Create and inject the theme stylesheet
const style = injectStyle();

// Function to generate CSS filters
function generateFilters(contrast, brightness, isDark) {
  return `
    :root {
      color-scheme: ${isDark ? 'dark' : 'light'};
    }
    
    html {
      filter: 
        contrast(${contrast}%) 
        brightness(${brightness}%) 
        ${isDark ? 'invert(1) hue-rotate(180deg)' : ''} !important;
      background: ${isDark ? '#1a1a1a' : '#ffffff'} !important;
    }
    
    /* Prevent double inversion of media elements */
    img, video, canvas, picture, svg,
    [style*="background-image"],
    [style*="background-url"] {
      filter: ${isDark ? 'invert(1) hue-rotate(180deg)' : ''} !important;
    }

    /* Fix for iframes */
    iframe {
      filter: ${isDark ? 'invert(1) hue-rotate(180deg)' : ''} !important;
    }
    
    /* Preserve original colors for specific elements */
    .preserve-colors {
      filter: ${isDark ? 'invert(1) hue-rotate(180deg)' : ''} !important;
    }
  `;
}

// Function to apply dark mode
function applyDarkMode(settings) {
  if (!settings) return;
  
  try {
    if (settings.darkMode) {
      const filters = generateFilters(
        settings.contrast || 100,
        settings.brightness || 100,
        true
      );
      style.textContent = filters;
    } else {
      const filters = generateFilters(
        settings.contrast || 100,
        settings.brightness || 100,
        false
      );
      style.textContent = filters;
    }
  } catch (error) {
    console.error('Error applying dark mode:', error);
  }
}

// Function to initialize the extension
function initializeExtension() {
  // Load saved settings on page load
  chrome.storage.sync.get(['darkMode', 'contrast', 'brightness'], function(data) {
    applyDarkMode({
      darkMode: data.darkMode || false,
      contrast: data.contrast || 100,
      brightness: data.brightness || 100
    });
  });

  // Notify that content script is ready
  try {
    chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_READY' });
  } catch (error) {
    console.log('Error sending ready message:', error);
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type === 'UPDATE_THEME') {
    applyDarkMode(request.settings);
    sendResponse({ success: true });
  }
  return true; // Required for async response
});

// Initialize when document is ready or immediately if already ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
} 