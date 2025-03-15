console.log('Background script loaded');

// Function to detect language
async function detectLanguage(text) {
  try {
    const response = await fetch('https://api.mymemory.translated.net/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `q=${encodeURIComponent(text)}`
    });
    const data = await response.json();
    return data.responseData.detectedLanguage;
  } catch (error) {
    console.error('Language detection error:', error);
    return 'en'; // Default to English if detection fails
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background script received message:', request);
  
  if (request.action === 'translate') {
    // First detect the language
    detectLanguage(request.text)
      .then(sourceLanguage => {
        // Using MyMemory Translation API with detected language
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(request.text)}&langpair=${sourceLanguage}|${request.targetLanguage}`;
        
        console.log('Sending translation request to:', url);
        
        return fetch(url);
      })
      .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Translation response:', data);
        if (data.responseData && data.responseData.translatedText) {
          sendResponse({ translation: data.responseData.translatedText });
        } else {
          sendResponse({ translation: 'Translation failed. Please try again.' });
        }
      })
      .catch(error => {
        console.error('Translation error:', error);
        sendResponse({ translation: 'Error: ' + error.message });
      });
    
    return true; // Will respond asynchronously
  }
}); 