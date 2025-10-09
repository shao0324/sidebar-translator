const saveButton = document.getElementById('save-button');
const apiKeyInput = document.getElementById('api-key');
const statusDiv = document.getElementById('status');

// 儲存 API Key
saveButton.addEventListener('click', () => {
  const apiKey = apiKeyInput.value.trim();
  chrome.storage.sync.set({ apiKey: apiKey }, () => {
    statusDiv.textContent = '設定已儲存！';
    setTimeout(() => {
      statusDiv.textContent = '';
    }, 2000);
  });
});

// 頁面載入時，讀取並顯示已儲存的 API Key
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get('apiKey', (data) => {
    if (data.apiKey) {
      apiKeyInput.value = data.apiKey;
    }
  });
});
