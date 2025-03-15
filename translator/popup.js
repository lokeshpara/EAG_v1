document.addEventListener('DOMContentLoaded', function() {
  const translateBtn = document.getElementById('translateBtn');
  const targetLanguage = document.getElementById('targetLanguage');
  const resultBox = document.getElementById('result');
  const replaceOnPage = document.getElementById('replaceOnPage');

  translateBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        throw new Error('No active tab found');
      }

      resultBox.textContent = 'Detecting language...';
      resultBox.classList.add('show');

      // First, inject the content script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      
      // Then send the message
      chrome.tabs.sendMessage(tab.id, {
        action: 'getSelectedText',
        targetLanguage: targetLanguage.value,
        replaceOnPage: replaceOnPage.checked
      }, response => {
        if (chrome.runtime.lastError) {
          console.error('Chrome runtime error:', chrome.runtime.lastError);
          resultBox.textContent = 'Error: ' + chrome.runtime.lastError.message;
        } else if (response && response.translation) {
          if (!replaceOnPage.checked) {
            resultBox.textContent = response.translation;
          } else {
            resultBox.textContent = 'Text replaced on page!';
          }
        } else {
          resultBox.textContent = 'Please select some text on the page first.';
        }
      });
    } catch (error) {
      console.error('Error:', error);
      resultBox.textContent = 'Error: ' + error.message;
      resultBox.classList.add('show');
    }
  });
}); 