const sourceText = document.getElementById('source-text');
const translateButton = document.getElementById('translate-button');
const resultContainer = document.getElementById('result-container');
const resultText = document.getElementById('result-text');
const engineSelect = document.getElementById('engine-select');
const clearButton = document.getElementById('clear-button');

// 監聽從 background.js 傳來的訊息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.name === 'translate-text') {
    const text = message.data.value;
    sourceText.value = text;
    // 自動觸發翻譯
    if (text) {
      translateButton.click();
    }
  }
});

// 清空按鈕點擊事件
clearButton.addEventListener('click', () => {
  sourceText.value = '';
  resultText.innerHTML = ''; // 同時清空翻譯結果
});

// 翻譯按鈕點擊事件
translateButton.addEventListener('click', async () => {
  const text = sourceText.value.trim();
  if (!text) {
    // 如果沒有輸入文字，則不動作，避免產生空的翻譯紀錄
    return;
  }

  const engine = engineSelect.value;
  
  // 每次開始新的翻譯前先清除先前的結果，避免不斷疊加
  resultText.innerHTML = '';
  // 顯示讀取中
  resultContainer.classList.add('loading');

  try {
    let translation = '';
    if (engine === 'google') {
      translation = await translateWithGoogle(text);
    } else if (engine === 'gemini') {
      const { apiKey } = await chrome.storage.sync.get('apiKey');
      if (!apiKey) {
        throw new Error('尚未設定 Gemini API Key。請點擊右上角的「設定」進行配置。');
      }
      translation = await translateWithGemini(text, apiKey);
    }
    
    // 建立新結果元素，並顯示為唯一的翻譯結果（覆蓋先前內容）
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
    // 隱藏讀取中
    resultContainer.classList.remove('loading');
  }
});

// 使用 Google 翻譯 (非官方 API，僅供示範)
async function translateWithGoogle(text) {
  const targetLang = 'zh-TW'; // 目標語言：繁體中文
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.append('client', 'gtx');
  url.searchParams.append('sl', 'auto'); // 自動偵測來源語言
  url.searchParams.append('tl', targetLang);
  url.searchParams.append('dt', 't');
  url.searchParams.append('q', text);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Google 翻譯服務請求失敗');
  }
  const data = await response.json();
  // 從回傳的複雜陣列中提取翻譯結果
  return data[0].map(item => item[0]).join('');
}

// 使用 Gemini API 翻譯
async function translateWithGemini(text, apiKey) {
  // API 端點 URL
  const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      "contents": [{
        "parts": [{
          // 【修正處】移除 text 變數後多餘的雙引號
          "text": `Translate the following text to Traditional Chinese (繁體中文). Do not add any extra explanations or translations of the original text, just provide the translated result.\n\nOriginal text: "${text}"`
        }]
      }],
      // generationConfig 和 safetySettings 的設定是正確且良好的實踐
      "generationConfig": {
        "temperature": 0.5,
        "topK": 1,
        "topP": 1,
        "maxOutputTokens": 2048,
        "stopSequences": []
      },
      "safetySettings": [
        { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
        { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
        { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
        { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" }
      ]
    })
  });

  // 處理 API 請求失敗的情況 (例如：網路問題、API Key 錯誤)
  if (!response.ok) {
    let errorMsg = `Gemini API 請求失敗 (狀態碼: ${response.status})`;
    try {
      const errorData = await response.json();
      errorMsg += `: ${errorData.error.message}`;
    } catch (e) {
      errorMsg += `: ${response.statusText}`; // 如果無法解析 JSON，顯示原始狀態文字
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  
  // 處理並解析 API 回應
  try {
    // 檢查 API 是否因為安全設定而封鎖了回應
    if (data.promptFeedback && data.promptFeedback.blockReason) {
      throw new Error(`請求被封鎖，原因：${data.promptFeedback.blockReason}`);
    }
    
    // 提取翻譯結果
    if (data.candidates && data.candidates.length > 0) {
      const part = data.candidates[0].content.parts[0];
      if (part && part.text) {
        return part.text.trim(); // 使用 trim() 清除可能存在的前後空白
      }
    }
    
    // 如果 API 回應中沒有有效的翻譯結果
    throw new Error('無法從 API 回應中提取翻譯結果。');

  } catch (e) {
    // 當解析過程出錯時，提供更詳細的偵錯資訊
    console.error("解析 Gemini API 回應時出錯:", e);
    console.error("收到的原始資料:", JSON.stringify(data, null, 2)); // 輸出格式化的 JSON
    throw new Error(`解析 Gemini API 回應時出錯: ${e.message}`);
  }
}
