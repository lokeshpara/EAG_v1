// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "fillForm") {
    fillForm();
  }
});

// Function to fill form fields
function fillForm() {
  chrome.storage.local.get(['formData'], function(result) {
    if (!result.formData) {
      alert('No form data saved. Please save your details first.');
      return;
    }

    const formData = result.formData;
    
    // Common field name patterns
    const fieldPatterns = {
      firstName: ['firstname', 'first-name', 'first_name', 'fname', 'given-name'],
      lastName: ['lastname', 'last-name', 'last_name', 'lname', 'family-name'],
      email: ['email', 'e-mail', 'emailaddress'],
      phone: ['phone', 'telephone', 'tel', 'mobile', 'cell'],
      address: ['address', 'street', 'street-address'],
      city: ['city', 'town'],
      state: ['state', 'province', 'region'],
      zipCode: ['zip', 'zipcode', 'postal-code', 'postalcode'],
      country: ['country', 'nation']
    };

    // Function to find and fill input fields
    function fillInputField(patterns, value) {
      patterns.forEach(pattern => {
        // Try to find by name
        const inputsByName = document.querySelectorAll(`input[name*="${pattern}"]`);
        inputsByName.forEach(input => {
          if (input.type !== 'hidden') {
            input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });

        // Try to find by id
        const inputsById = document.querySelectorAll(`input[id*="${pattern}"]`);
        inputsById.forEach(input => {
          if (input.type !== 'hidden') {
            input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });

        // Try to find by placeholder
        const inputsByPlaceholder = document.querySelectorAll(`input[placeholder*="${pattern}"]`);
        inputsByPlaceholder.forEach(input => {
          if (input.type !== 'hidden') {
            input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      });
    }

    // Fill each field using the patterns
    Object.entries(fieldPatterns).forEach(([field, patterns]) => {
      if (formData[field]) {
        fillInputField(patterns, formData[field]);
      }
    });

    // Handle textarea fields
    const textareaPatterns = {
      address: ['address', 'street', 'street-address', 'message', 'comment']
    };

    Object.entries(textareaPatterns).forEach(([field, patterns]) => {
      if (formData[field]) {
        patterns.forEach(pattern => {
          const textareas = document.querySelectorAll(`textarea[name*="${pattern}"], textarea[id*="${pattern}"], textarea[placeholder*="${pattern}"]`);
          textareas.forEach(textarea => {
            textarea.value = formData[field];
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
          });
        });
      }
    });
  });
} 