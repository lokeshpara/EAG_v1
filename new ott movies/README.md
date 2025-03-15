# OTT TV Series Tracker Chrome Extension

A Chrome extension that shows the latest TV series from major OTT platforms like Netflix, Amazon Prime, Disney+, and Hulu.

## Features

- View latest TV series from major streaming platforms
- Filter series by platform
- Clean and modern user interface
- Shows series details including title, release date, and description
- Images and basic information for each series

## Setup Instructions

1. Clone or download this repository
2. Get an API key from TMDB (The Movie Database):
   - Go to https://www.themoviedb.org/
   - Create an account and sign in
   - Go to your account settings
   - Click on "API" in the left sidebar
   - Follow the steps to get an API key
3. Open `popup.js` and replace `'YOUR_TMDB_API_KEY'` with your actual TMDB API key
4. Open Chrome and go to `chrome://extensions/`
5. Enable "Developer mode" in the top right
6. Click "Load unpacked" and select the directory containing this extension

## Usage

1. Click the extension icon in your Chrome toolbar
2. View the latest TV series from all platforms
3. Use the platform buttons to filter series by specific streaming services
4. Click on any series card to view more details

## Note

This extension uses The Movie Database (TMDB) API to fetch TV series information. The platform filtering is based on network IDs from TMDB, which might not be 100% accurate for all streaming platforms.

## Privacy

This extension only makes API calls to TMDB and doesn't collect any user data.

## License

MIT License 