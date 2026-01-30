const sourceText = document.getElementById('source-text');
const translateButton = document.getElementById('translate-button');
const resultContainer = document.getElementById('result-container');
const resultText = document.getElementById('result-text');
const engineSelect = document.getElementById('engine-select');
const targetLangSelect = document.getElementById('target-lang-select');
const clearButton = document.getElementById('clear-button');

// 預設常用語言
const DEFAULT_PREFERRED_LANGS = ['zh-TW', 'en', 'ja', 'ko'];

// 監聽從 background.js 傳來的訊息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.name === 'translate-text') {
    const text = message.data.value;
    sourceText.value = text;
    if (text) {
      translateButton.click();
    }
  }
});

// 填充語言下拉選單
function populateLanguageSelect(preferredCodes, currentSelection) {
  if (!targetLangSelect) return;
  
  targetLangSelect.innerHTML = '';

  // 1. 常用語言群組
  const preferredGroup = document.createElement('optgroup');
  preferredGroup.label = '常用語言';
  
  preferredCodes.forEach(code => {
    const lang = ALL_LANGUAGES.find(l => l.code === code);
    if (lang) {
      const option = document.createElement('option');
      option.value = lang.code;
      option.textContent = lang.label;
      preferredGroup.appendChild(option);
    }
  });
  
  if (preferredGroup.children.length > 0) {
    targetLangSelect.appendChild(preferredGroup);
  }

  // 2. 所有語言群組
  const allGroup = document.createElement('optgroup');
  allGroup.label = '所有語言';
  
  ALL_LANGUAGES.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang.code;
    option.textContent = lang.label;
    allGroup.appendChild(option);
  });
  targetLangSelect.appendChild(allGroup);

  // 設定當前選取值
  if (currentSelection) {
    targetLangSelect.value = currentSelection;
  }
}

// 頁面載入時
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await chrome.storage.sync.get(['engine', 'targetLang', 'preferredLanguages']);
    
    if (data.engine) {
      engineSelect.value = data.engine;
    }

    const preferredLangs = data.preferredLanguages || DEFAULT_PREFERRED_LANGS;
    const currentTarget = data.targetLang || 'zh-TW';
    
    populateLanguageSelect(preferredLangs, currentTarget);
  } catch (error) {
    console.error('初始化側邊欄失敗:', error);
  }
});

// 監聽引擎變化
engineSelect.addEventListener('change', () => {
  chrome.storage.sync.set({ engine: engineSelect.value });
});

// 監聽目標語言變化
targetLangSelect.addEventListener('change', () => {
  chrome.storage.sync.set({ targetLang: targetLangSelect.value });
});

// 清空
clearButton.addEventListener('click', () => {
  sourceText.value = '';
  resultText.innerHTML = '';
});

// 翻譯
translateButton.addEventListener('click', async () => {
  const text = sourceText.value.trim();
  if (!text) return;

  const targetLangCode = targetLangSelect.value;
  const engine = engineSelect.value;
  const { apiKey } = await chrome.storage.sync.get(['apiKey']);

  resultText.innerHTML = '';
  resultContainer.classList.add('loading');

  try {
    let translation = '';
    if (engine === 'google') {
      translation = await translateWithGoogle(text, targetLangCode);
    } else if (engine === 'gemini') {
      if (!apiKey) throw new Error('尚未設定 Gemini API Key。');
      translation = await translateWithGemini(text, apiKey, targetLangCode);
    } else if (engine === 'mymemory') {
      translation = await translateWithMyMemory(text, targetLangCode);
    }
    
    const newResult = document.createElement('div');
    newResult.className = 'translation-item';
    newResult.textContent = translation;
    resultText.appendChild(newResult);
  } catch (error) {
    const errorResult = document.createElement('div');
    errorResult.className = 'translation-item error';
    errorResult.textContent = `翻譯失敗：${error.message}`;
    resultText.appendChild(errorResult);
  } finally {
    resultContainer.classList.remove('loading');
  }
});

async function translateWithGoogle(text, targetLang) {
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.append('client', 'gtx');
  url.searchParams.append('sl', 'auto');
  url.searchParams.append('tl', targetLang);
  url.searchParams.append('dt', 't');
  url.searchParams.append('q', text);

  const response = await fetch(url);
  if (!response.ok) throw new Error('Google 請求失敗');
  const data = await response.json();
  return data[0].map(item => item[0]).join('');
}

async function translateWithGemini(text, apiKey, targetLangCode) {
  const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const langObj = ALL_LANGUAGES.find(l => l.code === targetLangCode);
  const targetLangName = langObj ? langObj.name : targetLangCode;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      "contents": [{ "parts": [{ "text": `Translate the following text to ${targetLangName} (${targetLangCode}). Provide only the translation.\n\nText: "${text}"` }] }],
      "generationConfig": { "temperature": 0.5 }
    })
  });

  if (!response.ok) throw new Error(`Gemini 請求失敗 (${response.status})`);
  const data = await response.json();
  if (data.candidates && data.candidates[0].content.parts[0].text) {
    return data.candidates[0].content.parts[0].text.trim();
  }
  throw new Error('無法提取結果');
}

async function translateWithMyMemory(text, targetLangCode) {
  // MyMemory API: https://mymemory.translated.net/doc/spec.php
  // Free usage limit: 5000 chars/day without email/key.
  // langpair: 'source|target' (e.g., 'en|it'). Use 'Autodetect|target' for auto-detection.
  
  const url = new URL('https://api.mymemory.translated.net/get');
  url.searchParams.append('q', text);
  url.searchParams.append('langpair', `Autodetect|${targetLangCode}`);

  const response = await fetch(url);
  
  if (!response.ok) {
    // MyMemory returns 403 or other codes when limit reached or error
    throw new Error(`MyMemory 請求失敗 (${response.status})`);
  }
  
  const data = await response.json();
  
  if (data.responseStatus !== 200) {
    // MyMemory puts error details in responseDetails even if HTTP status is 200 sometimes, 
    // or if responseStatus is not 200.
    // However, usually HTTP 200 comes with data. 
    // If responseStatus is 403 (limit exceeded), it might still be a JSON body.
    throw new Error(data.responseDetails || 'MyMemory 翻譯錯誤');
  }

  return data.responseData.translatedText;
}