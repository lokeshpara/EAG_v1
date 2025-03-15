document.addEventListener('DOMContentLoaded', () => {
  const accountsContainer = document.getElementById('accounts-container');
  const addAccountButton = document.getElementById('add-account');

  // Load and display emails for all accounts
  loadEmails();

  // Add account button click handler
  addAccountButton.addEventListener('click', async () => {
    try {
      // Disable the button while processing
      addAccountButton.disabled = true;
      addAccountButton.textContent = 'Adding Account...';

      // Clear all cached tokens to force new account selection
      const storage = await chrome.storage.local.get('accounts');
      const accounts = storage.accounts || [];
      
      // Remove all cached tokens
      for (const account of accounts) {
        await new Promise((resolve) => {
          chrome.identity.removeCachedAuthToken({ token: account.token }, resolve);
        });
      }

      // Clear identity API cache
      await new Promise((resolve) => {
        chrome.identity.clearAllCachedAuthTokens(resolve);
      });

      // Send message to add new account and wait for response
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'addAccount', forceNewAccount: true }, (result) => {
          resolve(result);
        });
      });

      if (response && response.error) {
        throw new Error(response.error);
      }

      // Reload emails after successful account addition
      await loadEmails();
      
    } catch (error) {
      console.error('Error in add account:', error);
      accountsContainer.innerHTML = `<div class="loading">Error adding account: ${error.message}</div>`;
    } finally {
      // Re-enable the button
      addAccountButton.disabled = false;
      addAccountButton.textContent = 'Add Email Account';
    }
  });

  async function loadEmails() {
    try {
      // Show loading state
      accountsContainer.innerHTML = '<div class="loading">Loading emails...</div>';

      // Get emails from background script
      const response = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Request timed out'));
        }, 30000); // 30 second timeout

        chrome.runtime.sendMessage({ action: 'getUnreadEmails' }, (result) => {
          clearTimeout(timeoutId);
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result);
          }
        });
      });
      
      if (!response) {
        throw new Error('No response received');
      }
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Clear loading state
      accountsContainer.innerHTML = '';

      if (!response.accounts || response.accounts.length === 0) {
        accountsContainer.innerHTML = '<div class="loading">No email accounts added. Click "Add Email Account" to get started.</div>';
        return;
      }

      // Display emails for each account
      response.accounts.forEach(account => {
        if (account.error) {
          // Show error for this account but continue with others
          const errorSection = document.createElement('div');
          errorSection.className = 'account-section';
          errorSection.innerHTML = `
            <div class="account-header">
              <div class="account-info">
                <span class="account-name">${account.email}</span>
                <span class="error-message">Error: ${account.error}</span>
              </div>
            </div>
          `;
          accountsContainer.appendChild(errorSection);
        } else {
          const accountSection = createAccountSection(account);
          accountsContainer.appendChild(accountSection);
        }
      });

    } catch (error) {
      console.error('Error loading emails:', error);
      accountsContainer.innerHTML = `
        <div class="loading">
          Error loading emails: ${error.message}
          <br><br>
          <button onclick="window.location.reload()" class="add-account-btn">Retry</button>
        </div>
      `;
    }
  }

  function createAccountSection(account) {
    const section = document.createElement('div');
    section.className = 'account-section';

    const header = document.createElement('div');
    header.className = 'account-header';
    
    const accountInfo = document.createElement('div');
    accountInfo.className = 'account-info';
    accountInfo.innerHTML = `
      <span class="account-name">${account.email}</span>
      <span class="unread-count">${account.unreadCount} unread</span>
    `;

    const dropdownIcon = document.createElement('span');
    dropdownIcon.className = 'dropdown-icon';
    dropdownIcon.innerHTML = '▼';

    header.appendChild(accountInfo);
    header.appendChild(dropdownIcon);

    const emailList = document.createElement('div');
    emailList.className = 'email-list';

    // Toggle dropdown on header click
    header.addEventListener('click', () => {
      emailList.classList.toggle('open');
      dropdownIcon.classList.toggle('open');
    });

    account.emails.forEach(email => {
      const emailItem = document.createElement('div');
      emailItem.className = 'email-item';
      emailItem.innerHTML = `
        <div class="email-subject">${email.subject}</div>
        <div class="email-details">
          <span class="email-sender">${email.from}</span>
          <span class="timestamp">${email.timestamp}</span>
        </div>
      `;
      emailItem.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering the dropdown toggle
        chrome.tabs.create({ url: email.url });
      });
      emailList.appendChild(emailItem);
    });

    section.appendChild(header);
    section.appendChild(emailList);
    return section;
  }

  // Refresh emails every minute
  setInterval(loadEmails, 60000);
}); 