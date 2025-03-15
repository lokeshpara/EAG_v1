// Initialize the content script
console.log('Price Comparison Tool: Content script loaded');

function extractProductInfo() {
  try {
    const productTitle = document.getElementById('productTitle')?.textContent.trim();
    const priceElement = document.querySelector('.a-price .a-offscreen');
    const price = priceElement ? priceElement.textContent.trim() : null;
    
    // Get ASIN from URL or product data
    let asin = '';
    const asinMatch = window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/);
    if (asinMatch) {
      asin = asinMatch[1];
    }

    // Validate that we have the necessary information
    if (!productTitle || !price) {
      console.warn('Price Comparison Tool: Missing product information');
      return null;
    }

    return {
      title: productTitle,
      price: price,
      asin: asin,
      url: window.location.href
    };
  } catch (error) {
    console.error('Price Comparison Tool: Error extracting product info:', error);
    return null;
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Price Comparison Tool: Received message', request);
  
  if (request.action === 'getProductInfo') {
    try {
      const productInfo = extractProductInfo();
      console.log('Price Comparison Tool: Extracted product info', productInfo);
      sendResponse(productInfo);
    } catch (error) {
      console.error('Price Comparison Tool: Error in message listener:', error);
      sendResponse(null);
    }
  }
  return true; // Keep the message channel open for async response
});

// Initial check if we're on an Amazon product page
if (window.location.hostname.includes('amazon.com') && 
    window.location.pathname.includes('/dp/')) {
  console.log('Price Comparison Tool: Detected Amazon product page');
  const productInfo = extractProductInfo();
  if (productInfo) {
    chrome.runtime.sendMessage({
      action: 'onAmazonProduct',
      data: productInfo
    }).catch(error => console.error('Price Comparison Tool: Error sending initial message:', error));
  }
} 