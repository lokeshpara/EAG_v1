# Multi-Account Email Checker Chrome Extension

This Chrome extension allows you to view unread emails from multiple email accounts in one place. Currently supports Gmail accounts, with more providers coming soon.

## Setup Instructions

1. First, you need to set up a Google Cloud Project and obtain OAuth 2.0 credentials:
   - Go to the [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project
   - Enable the Gmail API for your project
   - Go to the Credentials page
   - Create an OAuth 2.0 Client ID for a Chrome Extension
   - Add your extension ID to the authorized JavaScript origins

2. Replace the `${YOUR_CLIENT_ID}` in the `manifest.json` file with your OAuth client ID.

3. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select this directory

4. Click the extension icon and click "Add Email Account" to add your Gmail accounts.

## Features

- View unread emails from multiple Gmail accounts
- Automatically updates every minute
- Shows unread count in the extension badge
- Click on any email to open it in Gmail
- Modern, clean UI

## Privacy

This extension only requests the minimum permissions needed to read your unread email count and basic email information. It does not store any email content locally and only maintains the necessary authentication tokens to check your unread emails.

## Support

Currently supports:
- Gmail accounts

Coming soon:
- Outlook support
- Other email providers

## Development

The extension is built using vanilla JavaScript and Chrome Extension Manifest V3. To modify or extend the extension:

1. Make your changes to the source files
2. Reload the extension in Chrome
3. Test your changes

## License

MIT License 