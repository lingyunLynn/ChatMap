// background.js
chrome.runtime.onInstalled.addListener((details) => {
  // 点击插件图标时自动打开侧边栏
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  }

  // 第一次安装（不是更新）的时候，弹一个语言选择页面
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
  }
});
