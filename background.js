// 創建右鍵選單
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "translate-selection",
    title: "使用側邊欄翻譯 '%s'",
    contexts: ["selection"]
  });
});

// 監聽右鍵選單點擊事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translate-selection") {
    // 打開側邊欄
    chrome.sidePanel.open({ windowId: tab.windowId }, () => {
      // 發送選取的文字到側邊欄
      setTimeout(() => {
        chrome.runtime.sendMessage({
          name: "translate-text",
          data: { value: info.selectionText }
        });
      }, 100); // 短暫延遲確保側邊欄已開啟並載入JS
    });
  }
});

// 監聽擴充圖示點擊事件
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});
