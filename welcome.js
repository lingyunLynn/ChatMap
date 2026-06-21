// welcome.js

function finishPick(lang) {
  chrome.storage.local.set({ [CHATMAP_LANG_KEY]: lang }, () => {
    document.getElementById('pickZh').disabled = true;
    document.getElementById('pickEn').disabled = true;

    const box = document.getElementById('confirm');
    box.classList.remove('hidden');
    box.textContent =
      lang === 'en'
        ? 'All set! You can close this tab now, then open the ChatMap side panel from any supported AI chat page.'
        : '设置好了！现在可以关掉这个页面，去任意支持的AI对话页面打开ChatMap侧边栏就行。';
  });
}

document.getElementById('pickZh').addEventListener('click', () => finishPick('zh'));
document.getElementById('pickEn').addEventListener('click', () => finishPick('en'));
