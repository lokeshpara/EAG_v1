# Dark & Undark Chrome Extension

A Chrome extension that allows you to toggle between dark and light themes for any webpage. The extension provides additional controls for contrast and brightness adjustments.

## Features

- Toggle between dark and light modes
- Adjust contrast levels
- Adjust brightness levels
- Settings are saved per website
- Preserves images and media colors while inverting the rest of the content

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon in your Chrome toolbar
2. Use the toggle switch to enable/disable dark mode
3. Adjust contrast and brightness using the sliders
4. Settings will be automatically saved and applied to the current website

## Technical Details

The extension uses CSS filters to implement the dark mode functionality. It preserves the original colors of images and videos while inverting the colors of the rest of the page content. The extension also saves your preferences using Chrome's storage API. 