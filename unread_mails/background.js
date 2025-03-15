// Store for email accounts
let emailAccounts = [];

// Initialize alarm for periodic email checking
chrome.alarms.create('checkEmails', { periodInMinutes: 1 });

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkEmails') {
    checkAllAccounts();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getUnreadEmails') {
    handleGetUnreadEmails(sendResponse);
    return true; // Will respond asynchronously
  } else if (request.action === 'addAccount') {
    // Handle add account with response
    handleAddAccount().then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      sendResponse({ error: error.message });
    });
    return true; // Will respond asynchronously
  }
  return false;
});

async function refreshToken(account) {
  try {
    // Remove the old token
    await chrome.identity.removeCachedAuthToken({ token: account.token });
    
    // Get a new token
    const newToken = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(token);
        }
      });
    });
    
    account.token = newToken;
    
    // Update the account in storage
    const storage = await chrome.storage.local.get('accounts');
    const accounts = storage.accounts || [];
    const index = accounts.findIndex(a => a.email === account.email);
    if (index !== -1) {
      accounts[index] = account;
      await chrome.storage.local.set({ accounts });
    }
    
    return newToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
}

async function handleGetUnreadEmails(sendResponse) {
  try {
    // First load accounts from storage to ensure we have the latest data
    const storage = await chrome.storage.local.get('accounts');
    emailAccounts = storage.accounts || [];
    
    console.log('Current accounts:', emailAccounts);

    if (!emailAccounts || emailAccounts.length === 0) {
      sendResponse({ accounts: [] });
      return;
    }

    try {
      const accounts = await Promise.all(emailAccounts.map(async (account) => {
        try {
          console.log('Fetching emails for account:', account.email);
          const emails = await fetchUnreadEmails(account);
          console.log('Fetched emails:', emails);
          return {
            email: account.email,
            unreadCount: emails.length,
            emails: emails
          };
        } catch (accountError) {
          console.error('Error fetching emails for account:', account.email, accountError);
          return {
            email: account.email,
            unreadCount: 0,
            emails: [],
            error: accountError.message
          };
        }
      }));

      console.log('Sending response with accounts:', accounts);
      sendResponse({ accounts });
    } catch (fetchError) {
      console.error('Error fetching emails:', fetchError);
      sendResponse({ error: 'Failed to fetch emails. Please try again.' });
    }
  } catch (error) {
    console.error('Error in handleGetUnreadEmails:', error);
    sendResponse({ error: error.message });
  }
}

async function handleAddAccount() {
  try {
    // Get token using Promise wrapper with interactive mode forced
    const auth = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ 
        interactive: true,
        scopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/userinfo.email'
        ]
      }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(token);
        }
      });
    });
    
    console.log('Got token:', auth ? 'yes' : 'no');
    
    const userInfo = await fetchUserInfo(auth);
    console.log('Got user info:', userInfo);
    
    if (!userInfo.email) {
      throw new Error('Failed to get user email from Google');
    }

    // Load existing accounts from storage first
    const storage = await chrome.storage.local.get('accounts');
    emailAccounts = storage.accounts || [];

    // Check if account already exists
    const existingAccount = emailAccounts.find(account => account.email === userInfo.email);
    
    if (!existingAccount) {
      // Add new account
      const newAccount = {
        email: userInfo.email,
        token: auth,
        type: 'gmail'
      };
      
      emailAccounts.push(newAccount);
      console.log('Added new account:', newAccount.email);

      // Save to storage
      await chrome.storage.local.set({ accounts: emailAccounts });
      console.log('Saved accounts to storage');
      
      // Fetch emails for all accounts
      await checkAllAccounts();
    } else {
      // Update existing account's token
      existingAccount.token = auth;
      await chrome.storage.local.set({ accounts: emailAccounts });
      console.log('Updated token for existing account:', userInfo.email);
      await checkAllAccounts();
    }

    // Clear any cached tokens to ensure fresh authentication next time
    await new Promise((resolve) => {
      chrome.identity.clearAllCachedAuthTokens(resolve);
    });

  } catch (error) {
    console.error('Error adding account:', error);
    if (error.message && error.message.includes('invalid_grant')) {
      // Clear all cached tokens and try again
      await new Promise((resolve) => {
        chrome.identity.clearAllCachedAuthTokens(resolve);
      });
      handleAddAccount(); // Retry
    }
  }
}

async function fetchUserInfo(token) {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Clear the cached token
        await chrome.identity.removeCachedAuthToken({ token });
        
        // Try to get a new token
        const newToken = await new Promise((resolve, reject) => {
          chrome.identity.getAuthToken({ interactive: true, scopes: [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/userinfo.email'
          ]}, (token) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(token);
            }
          });
        });
        
        // Retry with new token
        const retryResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${newToken}`,
            'Accept': 'application/json'
          }
        });
        
        if (!retryResponse.ok) {
          throw new Error(`Failed to fetch user info: ${retryResponse.status}`);
        }
        
        const data = await retryResponse.json();
        console.log('User info response:', data);
        return data;
      }
      throw new Error(`Failed to fetch user info: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('User info response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
}

async function fetchUnreadEmails(account) {
  if (account.type === 'gmail') {
    return await fetchGmailUnread(account);
  }
  // Add support for other email providers here
  return [];
}

async function fetchGmailUnread(account) {
  try {
    console.log('Fetching unread Gmail for:', account.email);
    
    // Helper function to delay execution
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    async function makeRequest(url, token, retryCount = 0) {
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            // Clear the cached token
            await chrome.identity.removeCachedAuthToken({ token });
            
            // Get a new token
            const newToken = await new Promise((resolve, reject) => {
              chrome.identity.getAuthToken({ interactive: true, scopes: [
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/userinfo.email'
              ]}, (token) => {
                if (chrome.runtime.lastError) {
                  reject(chrome.runtime.lastError);
                } else {
                  resolve(token);
                }
              });
            });
            
            // Update account token in storage
            account.token = newToken;
            const storage = await chrome.storage.local.get('accounts');
            const accounts = storage.accounts || [];
            const index = accounts.findIndex(a => a.email === account.email);
            if (index !== -1) {
              accounts[index] = account;
              await chrome.storage.local.set({ accounts });
            }
            
            // Retry the request with the new token
            return await fetch(url, {
              headers: {
                'Authorization': `Bearer ${newToken}`,
                'Accept': 'application/json'
              }
            });
          }
          
          if (response.status === 429 && retryCount < 3) {
            // Rate limited - wait and retry with exponential backoff
            const waitTime = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
            console.log(`Rate limited, waiting ${waitTime}ms before retry`);
            await delay(waitTime);
            return makeRequest(url, token, retryCount + 1);
          }
          
          throw new Error(`API error: ${response.status}`);
        }
        
        return response;
      } catch (error) {
        if (retryCount < 3) {
          // General error - wait and retry
          const waitTime = Math.pow(2, retryCount) * 1000;
          console.log(`Request failed, waiting ${waitTime}ms before retry`);
          await delay(waitTime);
          return makeRequest(url, token, retryCount + 1);
        }
        throw error;
      }
    }
    
    // Get total number of unread messages first
    const response = await makeRequest(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=25',
      account.token
    );

    const data = await response.json();
    console.log('Unread messages response:', data);

    if (!data.messages) {
      console.log('No unread messages found');
      return [];
    }

    // Fetch details for each email with delay between requests
    const emails = [];
    for (const message of data.messages) {
      try {
        // Add a small delay between message detail requests
        await delay(100); // Reduced delay to 100ms to speed up fetching
        
        const details = await makeRequest(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
          account.token
        );
        
        const messageData = await details.json();
        emails.push(parseGmailMessage(messageData));
      } catch (error) {
        console.error('Error fetching message details:', error);
        // Continue with other messages even if one fails
        continue;
      }
    }

    console.log('Fetched email details:', emails);
    return emails;
  } catch (error) {
    console.error('Error fetching Gmail:', error);
    throw error; // Propagate error to be handled by caller
  }
}

function parseGmailMessage(message) {
  try {
    let headers = [];
    let subject = '(No subject)';
    let from = '';

    // Handle different message payload structures
    if (message && message.payload) {
      if (message.payload.headers) {
        headers = message.payload.headers;
      } else if (message.payload.parts && message.payload.parts[0] && message.payload.parts[0].headers) {
        headers = message.payload.parts[0].headers;
      }

      // Try to find headers in nested parts if not found at top level
      if (headers.length === 0 && message.payload.parts) {
        for (const part of message.payload.parts) {
          if (part.headers) {
            headers = part.headers;
            break;
          }
        }
      }

      // Extract subject and from
      const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject');
      const fromHeader = headers.find(h => h.name.toLowerCase() === 'from');

      subject = subjectHeader ? subjectHeader.value : '(No subject)';
      from = fromHeader ? fromHeader.value : '(Unknown sender)';

      // Clean up the subject and from fields
      subject = subject.trim();
      from = from.trim();

      // If from contains both name and email, extract just the name or email
      if (from.includes('<')) {
        // Format: "Name <email@domain.com>"
        const matches = from.match(/"?([^"<]+)"?\s*<([^>]+)>/);
        if (matches) {
          from = matches[1].trim() || matches[2]; // Use name if available, otherwise email
        }
      }
    }
    
    return {
      id: message.id || 'unknown',
      subject: subject || '(No subject)',
      from: from || '(Unknown sender)',
      url: message.id ? `https://mail.google.com/mail/u/0/#inbox/${message.id}` : '#',
      timestamp: message.internalDate ? new Date(parseInt(message.internalDate)).toLocaleString() : ''
    };
  } catch (error) {
    console.error('Error parsing message:', error, 'Message structure:', message);
    return {
      id: message?.id || 'unknown',
      subject: '(Error parsing message)',
      from: '(Error)',
      url: message?.id ? `https://mail.google.com/mail/u/0/#inbox/${message.id}` : '#',
      timestamp: ''
    };
  }
}

async function checkAllAccounts() {
  try {
    // Load accounts from storage
    const storage = await chrome.storage.local.get('accounts');
    emailAccounts = storage.accounts || [];
    console.log('Loaded accounts from storage:', emailAccounts);

    // Update badge with total unread count
    let totalUnread = 0;
    for (const account of emailAccounts) {
      const emails = await fetchUnreadEmails(account);
      totalUnread += emails.length;
    }

    console.log('Total unread count:', totalUnread);
    // Update extension badge
    chrome.action.setBadgeText({ text: totalUnread.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#1a73e8' });
  } catch (error) {
    console.error('Error checking accounts:', error);
  }
}

// Initial check
checkAllAccounts(); 