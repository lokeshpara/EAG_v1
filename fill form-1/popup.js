document.addEventListener('DOMContentLoaded', function() {
  // Load saved form data
  chrome.storage.local.get(['formData'], function(result) {
    if (result.formData) {
      Object.keys(result.formData).forEach(key => {
        const input = document.getElementById(key);
        if (input) {
          input.value = result.formData[key];
        }
      });
    }
  });

  // Save form data
  document.getElementById('saveButton').addEventListener('click', function(e) {
    e.preventDefault();
    const formData = {};
    const form = document.getElementById('formFiller');
    const inputs = form.querySelectorAll('input, textarea');
    
    inputs.forEach(input => {
      formData[input.id] = input.value;
    });

    chrome.storage.local.set({ formData: formData }, function() {
      alert('Form data saved successfully!');
    });
  });

  // Fill form on current page
  document.getElementById('fillButton').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "fillForm"});
    });
  });
}); 