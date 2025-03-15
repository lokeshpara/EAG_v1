// List of supported price comparison websites
const COMPARISON_SITES = [
  {
    name: 'Walmart',
    searchUrl: 'https://www.walmart.com/search?q=',
    priceSelector: '.price-main .price-group'
  },
  {
    name: 'Target',
    searchUrl: 'https://www.target.com/s?searchTerm=',
    priceSelector: '.styles__StyledPricePromoWrapper-sc-1n0fd6l-0'
  },
  {
    name: 'Best Buy',
    searchUrl: 'https://www.bestbuy.com/site/searchpage.jsp?st=',
    priceSelector: '.priceView-customer-price span'
  }
];

// Function to parse price string to number
function parsePriceToNumber(priceStr) {
  if (!priceStr) return null;
  return parseFloat(priceStr.replace(/[^0-9.]/g, ''));
}

async function fetchWithProxy(url) {
  // Using allorigins.win as a CORS proxy
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.text();
}

async function searchProductPrices(productInfo) {
  const results = [];
  const amazonPrice = parsePriceToNumber(productInfo.price);
  
  // Clean the product title for better search results
  const searchTitle = productInfo.title
    .replace(/\(.*?\)/g, '') // Remove parentheses and their contents
    .replace(/[^\w\s]/g, ' ') // Remove special characters
    .trim()
    .split(' ')
    .slice(0, 6) // Take first 6 words for better matching
    .join(' ');

  for (const site of COMPARISON_SITES) {
    try {
      const searchUrl = site.searchUrl + encodeURIComponent(searchTitle);
      
      // For demonstration, we'll generate a simulated price
      // In a real implementation, you would parse the actual HTML response
      const simulatedPrice = amazonPrice * (0.8 + Math.random() * 0.4); // Random price ±20% of Amazon price
      
      results.push({
        store: site.name,
        url: searchUrl,
        price: `$${simulatedPrice.toFixed(2)}`,
        priceDiff: (amazonPrice - simulatedPrice).toFixed(2),
        isLower: simulatedPrice < amazonPrice
      });
    } catch (error) {
      console.error(`Error searching ${site.name}:`, error);
      results.push({
        store: site.name,
        url: site.searchUrl + encodeURIComponent(searchTitle),
        price: 'Price unavailable',
        error: true
      });
    }
  }
  
  // Sort results by price (lowest first)
  return results.sort((a, b) => {
    if (a.error) return 1;
    if (b.error) return -1;
    return parsePriceToNumber(a.price) - parsePriceToNumber(b.price);
  });
}

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'searchPrices') {
    searchProductPrices(request.productInfo)
      .then(results => {
        sendResponse({ success: true, results });
      })
      .catch(error => {
        console.error('Price comparison error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Required for async response
  }
}); 