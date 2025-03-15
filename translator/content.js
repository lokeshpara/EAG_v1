console.log('Content script loaded');

// Function to replace selected text with translation
function replaceSelectedText(translation) {
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  
  // Create a new text node with the translation
  const translatedText = document.createTextNode(translation);
  
  // Replace the selected content with the translation
  range.deleteContents();
  range.insertNode(translatedText);
  
  // Clear the selection
  selection.removeAllRanges();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'getSelectedText') {
    const selectedText = window.getSelection().toString().trim();
    console.log('Selected text:', selectedText);
    
    if (selectedText) {
      // Send the selected text to the background script for translation
      chrome.runtime.sendMessage({
        action: 'translate',
        text: selectedText,
        targetLanguage: request.targetLanguage
      }, response => {
        console.log('Translation response in content script:', response);
        if (chrome.runtime.lastError) {
          console.error('Chrome runtime error:', chrome.runtime.lastError);
          sendResponse({ translation: 'Error: ' + chrome.runtime.lastError.message });
        } else if (response && response.translation) {
          // Replace the selected text with the translation
          replaceSelectedText(response.translation);
          sendResponse(response);
        } else {
          sendResponse({ translation: 'Translation failed. Please try again.' });
        }
      });
      return true; // Will respond asynchronously
    } else {
      console.log('No text selected');
      sendResponse({ translation: null });
    }
  }
}); 