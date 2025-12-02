const saveButton = document.getElementById('save-button');
const apiKeyInput = document.getElementById('api-key');
const targetLangSelect = document.getElementById('target-lang');
const statusDiv = document.getElementById('status');

// 儲存設定
saveButton.addEventListener('click', () => {
  const apiKey = apiKeyInput.value.trim();
  const targetLang = targetLangSelect.value;

  chrome.storage.sync.set(
    { 
      apiKey: apiKey,
      targetLang: targetLang 
    }, 
    () => {
      statusDiv.textContent = '設定已儲存！';
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 2000);
    }
  );
});

// 頁面載入時，讀取並顯示已儲存的設定
document.addEventListener('DOMContentLoaded', () => {
  // 讀取多個項目：API Key 和目標語言
  chrome.storage.sync.get(['apiKey', 'targetLang'], (data) => {
    if (data.apiKey) apiKeyInput.value = data.apiKey;
    // 如果有儲存的目標語言，則設定下拉選單的值，否則使用 HTML 中的預設值
    if (data.targetLang) targetLangSelect.value = data.targetLang;
  });
});
