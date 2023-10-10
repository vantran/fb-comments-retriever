// Saves options to chrome.storage
const saveOptions = () => {
  const appId = document.getElementById('app-id').value;
  const pageId = document.getElementById('page-id').value;

  chrome.storage.sync.set(
    { appId, pageId },
    () => {
      // Update status to let user know options were saved.
      const status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(() => {
        status.textContent = '';
      }, 750);
    }
  );
};

document.getElementById('save').addEventListener('click', saveOptions);

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
  chrome.storage.sync.get(
    { appId: '1175093920071946', pageId: '' },
    (items) => {
      document.getElementById('app-id').value = items.appId;
      document.getElementById('page-id').value = items.pageId;
    }
  );
};

document.addEventListener('DOMContentLoaded', restoreOptions);

