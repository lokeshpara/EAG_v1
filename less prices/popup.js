document.addEventListener('DOMContentLoaded', async () => {
  const productInfo = document.getElementById('product-info');
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');
  const error = document.getElementById('error');
  const comparisonList = document.getElementById('comparison-list');

  // Get the current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url.includes('amazon.com') || !tab.url.includes('/dp/')) {
    error.classList.remove('hidden');
    productInfo.classList.add('hidden');
    return;
  }

  // Show loading state
  loading.classList.remove('hidden');

  try {
    // Inject content script manually if not already injected
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    // Get product information from the content script
    chrome.tabs.sendMessage(tab.id, { action: 'getProductInfo' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        loading.classList.add('hidden');
        error.textContent = 'Unable to extract product information. Please refresh the page and try again.';
        error.classList.remove('hidden');
        return;
      }

      if (response) {
        // Display product information
        document.getElementById('product-name').textContent = response.title;
        document.getElementById('amazon-price').textContent = `Amazon Price: ${response.price}`;

        // Search for prices on other websites
        chrome.runtime.sendMessage(
          { action: 'searchPrices', productInfo: response },
          (searchResponse) => {
            loading.classList.add('hidden');
            
            if (searchResponse && searchResponse.success) {
              results.classList.remove('hidden');
              comparisonList.innerHTML = ''; // Clear existing results
              
              // Display comparison results
              searchResponse.results.forEach(result => {
                const item = document.createElement('div');
                item.className = 'comparison-item';
                
                const priceClass = result.isLower ? 'better-price' : 'worse-price';
                const savingsText = result.isLower ? 
                  `Save $${result.priceDiff}` : 
                  `Costs $${Math.abs(result.priceDiff)} more`;
                
                item.innerHTML = `
                  <div class="store-info">
                    <div class="store-name">${result.store}</div>
                    ${!result.error ? `<div class="savings ${priceClass}">${savingsText}</div>` : ''}
                  </div>
                  <div class="price-info">
                    <div class="price ${priceClass}">${result.price}</div>
                    <a href="${result.url}" target="_blank" class="visit-link">Visit Store</a>
                  </div>
                `;
                
                comparisonList.appendChild(item);
              });
            } else {
              error.textContent = 'Error comparing prices. Please try again.';
              error.classList.remove('hidden');
            }
          }
        );
      } else {
        loading.classList.add('hidden');
        error.textContent = 'Could not find product information.';
        error.classList.remove('hidden');
      }
    });
  } catch (err) {
    console.error('Error:', err);
    loading.classList.add('hidden');
    error.textContent = 'An error occurred. Please refresh the page and try again.';
    error.classList.remove('hidden');
  }
});

function comparePrices(amazonPrice, comparisonPrice) {
  // In a real implementation, this would properly parse and compare prices
  // Returns: negative if comparison is cheaper, positive if more expensive, 0 if equal
  return 0;
} 