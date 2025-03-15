# Form Filler Chrome Extension

A Chrome extension that helps you automatically fill forms on websites with your saved information.

## Features

- Save your personal information securely in the extension
- Automatically fill forms on any website with your saved information
- Supports common form field patterns
- Works with input fields and textareas
- Modern and user-friendly interface

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon in your Chrome toolbar
2. Enter your personal information in the form
3. Click "Save Details" to store your information
4. When you visit a website with a form:
   - Click the extension icon
   - Click "Fill Form" to automatically fill the form with your saved information

## Supported Fields

The extension supports the following fields:
- First Name
- Last Name
- Email
- Phone
- Address
- City
- State
- ZIP Code
- Country

## Privacy

Your information is stored locally in your browser and is not sent to any external servers.

## Development

The extension is built using vanilla JavaScript and Chrome Extension APIs. The code is organized into the following files:

- `manifest.json`: Extension configuration
- `popup.html`: User interface for inputting form details
- `popup.js`: Logic for the popup interface
- `content.js`: Script that runs on web pages to fill forms
- `background.js`: Background script for extension functionality
- `styles.css`: Styling for the popup interface

## License

MIT License 