document.addEventListener('DOMContentLoaded', function() {
  const themeToggle = document.getElementById('themeToggle');
  const contrastSlider = document.getElementById('contrast');
  const brightnessSlider = document.getElementById('brightness');

  // Load saved settings
  chrome.storage.sync.get(['darkMode', 'contrast', 'brightness'], function(data) {
    themeToggle.checked = data.darkMode || false;
    contrastSlider.value = data.contrast || 100;
    brightnessSlider.value = data.brightness || 100;
    
    // Apply settings immediately after loading
    updateSettings();
  });

  // Common function to update and apply settings
  function updateSettings() {
    const settings = {
      darkMode: themeToggle.checked,
      contrast: parseInt(contrastSlider.value),
      brightness: parseInt(brightnessSlider.value)
    };

    // Save settings
    chrome.storage.sync.set(settings);

    // Send message to content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        try {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'UPDATE_THEME',
            settings: settings
          }).catch(function(error) {
            console.log('Error sending message:', error);
            // If content script is not ready, try injecting it
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              files: ['content.js']
            });
          });
        } catch (error) {
          console.log('Error in messaging:', error);
        }
      }
    });
  }

  // Add event listeners with debouncing for sliders
  let timeoutId;
  function debouncedUpdate() {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(updateSettings, 100);
  }

  themeToggle.addEventListener('change', updateSettings);
  contrastSlider.addEventListener('input', debouncedUpdate);
  brightnessSlider.addEventListener('input', debouncedUpdate);
}); 