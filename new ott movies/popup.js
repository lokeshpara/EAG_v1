// API configuration
const TMDB_API_KEY = '50da3a5a8b8ce8b8fbdb93d0da7264d1'; // User needs to replace this with their API key
const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';

// Platform IDs for filtering (These are example network IDs from TMDB)
const PLATFORMS = {
  netflix: 213,
  prime: 1024,
  disney: 2739,
  hulu: 453
};

// Current filter state
let currentPlatform = 'all';
let currentLanguage = 'all';

// Initialize the extension
document.addEventListener('DOMContentLoaded', () => {
  // Set up platform filter buttons
  setupPlatformButtons();
  // Set up language filter
  setupLanguageFilter();
  // Load initial data
  fetchLatestSeries();
});

function setupLanguageFilter() {
  const languageSelect = document.getElementById('languageFilter');
  languageSelect.addEventListener('change', (e) => {
    currentLanguage = e.target.value;
    fetchLatestSeries();
  });
}

function setupPlatformButtons() {
  const buttons = document.querySelectorAll('.platform-btn');
  buttons.forEach(button => {
    button.addEventListener('click', (e) => {
      // Remove active class from all buttons
      buttons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      e.target.classList.add('active');
      // Update current platform and fetch series
      currentPlatform = e.target.dataset.platform;
      fetchLatestSeries();
    });
  });
}

async function fetchLatestSeries() {
  const container = document.getElementById('seriesContainer');
  container.innerHTML = '<div class="loading">Loading...</div>';

  try {
    let url = `${TMDB_API_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&sort_by=first_air_date.desc&with_type=2`;
    
    // Add platform filter if selected
    if (currentPlatform !== 'all') {
      url += `&with_networks=${PLATFORMS[currentPlatform]}`;
    }

    // Add language filter if selected
    if (currentLanguage !== 'all') {
      url += `&with_original_language=${currentLanguage}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      displaySeries(data.results);
    } else {
      container.innerHTML = '<div class="error">No series found for the selected filters</div>';
    }
  } catch (error) {
    container.innerHTML = '<div class="error">Error loading series. Please check your API key.</div>';
  }
}

function displaySeries(series) {
  const container = document.getElementById('seriesContainer');
  container.innerHTML = '';

  series.slice(0, 10).forEach(show => {
    const card = document.createElement('div');
    card.className = 'series-card';
    
    const posterPath = show.poster_path 
      ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
      : 'placeholder-image.jpg';

    // Get language name from code
    const languageName = getLanguageName(show.original_language);

    card.innerHTML = `
      <img src="${posterPath}" alt="${show.name}">
      <div class="series-title">${show.name}</div>
      <div class="series-platform">
        <span>First Air Date: ${show.first_air_date}</span>
        <br>
        <span>Language: ${languageName}</span>
      </div>
      <div class="series-description">${show.overview.substring(0, 150)}...</div>
    `;

    container.appendChild(card);
  });
}

function getLanguageName(languageCode) {
  const languages = {
    'en': 'English',
    'hi': 'Hindi',
    'ta': 'Tamil',
    'te': 'Telugu',
    'ml': 'Malayalam',
    'kn': 'Kannada',
    'ja': 'Japanese',
    'ko': 'Korean'
  };
  return languages[languageCode] || languageCode;
} 