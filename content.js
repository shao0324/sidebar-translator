// 監聽滑鼠釋放事件，以捕捉文字選取
document.addEventListener('mouseup', () => {
  // 短暫延遲以確保 window.getSelection() 能取到最新的值
  setTimeout(() => {
    const selectedText = window.getSelection().toString().trim();

    if (selectedText) {
      // 發送訊息，讓側邊欄知道有新的文字被選取了
      // 如果側邊欄沒開，這個訊息會被忽略，這是正常的
      chrome.runtime.sendMessage({
        name: 'translate-text',
        data: { value: selectedText }
      });
    }
  }, 0);
});
