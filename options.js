const saveButton = document.getElementById('save-button');
const apiKeyInput = document.getElementById('api-key');
const targetLangSelect = document.getElementById('target-lang');
const togglePreferredBtn = document.getElementById('toggle-preferred-langs');
const preferredLangsWrapper = document.getElementById('preferred-langs-wrapper');
const preferredLangsList = document.getElementById('preferred-langs-list');
const langSearch = document.getElementById('lang-search');
const statusDiv = document.getElementById('status');

// 預設常用語言
const DEFAULT_PREFERRED_LANGS = ['zh-TW', 'en', 'ja', 'ko'];

// 切換常用語言設定區塊的顯示
togglePreferredBtn.addEventListener('click', () => {
  const isHidden = preferredLangsWrapper.style.display === 'none';
  preferredLangsWrapper.style.display = isHidden ? 'block' : 'none';
  togglePreferredBtn.textContent = isHidden ? '隱藏常用語言設定' : '設定常用語言';
});

// 更新「預設目標語言」下拉選單，使其僅包含已勾選的常用語言
function updateTargetLangSelect(selectedCodes, currentValue) {
  targetLangSelect.innerHTML = '';
  
  // 找出所有已選中的語言物件
  const selectedLangs = ALL_LANGUAGES.filter(l => selectedCodes.includes(l.code));
  
  selectedLangs.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang.code;
    option.textContent = lang.label;
    targetLangSelect.appendChild(option);
  });
  
  // 恢復先前選擇的值 (如果還在清單中)
  if (currentValue && selectedCodes.includes(currentValue)) {
    targetLangSelect.value = currentValue;
  } else if (selectedLangs.length > 0) {
    // 否則預設選第一個
    targetLangSelect.selectedIndex = 0;
  }
}

// 渲染常用語言清單 (Checkbox)
function renderPreferredLangsList(selectedCodes) {
  preferredLangsList.innerHTML = '';
  
  ALL_LANGUAGES.forEach(lang => {
    const div = document.createElement('div');
    div.className = 'lang-item-wrapper';
    div.style.marginBottom = '5px';
    div.dataset.search = `${lang.label.toLowerCase()} ${lang.code.toLowerCase()}`;
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `lang-${lang.code}`;
    checkbox.value = lang.code;
    checkbox.checked = selectedCodes.includes(lang.code);
    
    // 監聽勾選狀態變化，即時更新上方的下拉選單
    checkbox.addEventListener('change', () => {
      const currentSelected = getSelectedPreferredLangs();
      updateTargetLangSelect(currentSelected, targetLangSelect.value);
    });
    
    const label = document.createElement('label');
    label.htmlFor = `lang-${lang.code}`;
    label.textContent = lang.label;
    label.style.display = 'inline';
    label.style.fontWeight = 'normal';
    label.style.marginLeft = '8px';
    label.style.cursor = 'pointer';
    
    div.appendChild(checkbox);
    div.appendChild(label);
    preferredLangsList.appendChild(div);
  });
}

// 搜尋功能
langSearch.addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  const items = preferredLangsList.children;
  
  Array.from(items).forEach(item => {
    const text = item.dataset.search;
    item.style.display = text.includes(term) ? 'block' : 'none';
  });
});

// 取得當前所有勾選的語言代碼
function getSelectedPreferredLangs() {
  const checkboxes = preferredLangsList.querySelectorAll('input[type="checkbox"]:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

// 儲存設定
saveButton.addEventListener('click', () => {
  const apiKey = apiKeyInput.value.trim();
  const targetLang = targetLangSelect.value;
  const preferredLanguages = getSelectedPreferredLangs();

  chrome.storage.sync.set(
    { 
      apiKey: apiKey,
      targetLang: targetLang,
      preferredLanguages: preferredLanguages
    }, 
    () => {
      statusDiv.textContent = '設定已儲存！';
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 2000);
    }
  );
});

// 頁面載入時
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['apiKey', 'targetLang', 'preferredLanguages'], (data) => {
    if (data.apiKey) apiKeyInput.value = data.apiKey;
    
    const currentPreferred = data.preferredLanguages || DEFAULT_PREFERRED_LANGS;
    const currentTarget = data.targetLang || 'zh-TW';
    
    // 1. 渲染 Checkbox 列表
    renderPreferredLangsList(currentPreferred);
    
    // 2. 初始化目標語言下拉選單 (僅包含常用語言)
    updateTargetLangSelect(currentPreferred, currentTarget);
  });
});
