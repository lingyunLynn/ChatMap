// content.js
// 在AI对话页面里运行，负责：
// 1. "标记模式"下，点击任意消息把它加入导图
// 2. 维护一棵树（存到 chrome.storage.local，按页面URL区分对话）
// 3. 接收侧边栏的指令，把对应消息滚动到可视区域

(function () {
  const STORAGE_PREFIX = 'chatmap:';
  const AUTO_MODE_KEY = 'chatmap:autoMode';

  let convKey = getConvKey();
  let tree = null;
  let marking = false;
  let hoverEl = null;
  let autoMode = false;
  let lastAutoText = '';
  let lastAutoTime = 0;
  let undoStack = [];
  let redoStack = [];
  const UNDO_MAX = 20;
  let nextIsChild = false; // false=下一条默认跟当前位置并列；true=下一条记为当前位置的子问题（分支）
  let lang = 'zh';
  let contextOk = true; // 插件被重新加载/更新后，旧标签页里这个脚本的扩展上下文会失效

  function t(key) {
    return chatmapGetStrings(lang)[key];
  }

  // 下面三个函数是对 chrome.storage / chrome.runtime 调用的安全包装。
  // 如果插件在 chrome://extensions 里被重新加载了，已经打开的页面里这个content script
  // 还会继续跑，但这时候调它们会直接抛"Extension context invalidated"这种错误。
  // 包一层 try/catch，遇到这种情况就安静地放弃，不要把裸错误抛到控制台里。
  function safeStorageGet(keys, cb) {
    if (!contextOk) {
      cb({});
      return;
    }
    try {
      chrome.storage.local.get(keys, (res) => {
        cb(res || {});
      });
    } catch (err) {
      contextOk = false;
      cb({});
    }
  }

  function safeStorageSet(items) {
    if (!contextOk) return;
    try {
      chrome.storage.local.set(items);
    } catch (err) {
      contextOk = false;
    }
  }

  function safeSendMessage(payload) {
    if (!contextOk) return;
    try {
      chrome.runtime.sendMessage(payload).catch(() => {});
    } catch (err) {
      contextOk = false;
    }
  }

  // autoMode、语言设置都是全局共享的偏好，要先读出来，再去加载/创建这次对话的导图数据
  // (语言要先确定下来，是因为如果要新建一棵导图，根节点的文字要用对应语言)
  safeStorageGet([AUTO_MODE_KEY, CHATMAP_LANG_KEY], (res) => {
    autoMode = !!res[AUTO_MODE_KEY];
    lang = res[CHATMAP_LANG_KEY] === 'en' ? 'en' : 'zh';
    loadTree(() => broadcast());
  });

  function getConvKey() {
    return STORAGE_PREFIX + location.origin + location.pathname;
  }

  function defaultTree() {
    return {
      nodes: {
        root: { id: 'root', label: t('rootLabel'), parentId: null, children: [] }
      },
      anchor: 'root'
    };
  }

  function loadTree(cb) {
    safeStorageGet([convKey], (res) => {
      tree = res[convKey] || defaultTree();
      cb && cb();
    });
  }

  function saveTree() {
    safeStorageSet({ [convKey]: tree });
  }

  function broadcast() {
    safeSendMessage({
      type: 'treeUpdated',
      convKey,
      tree,
      autoMode,
      canUndo: undoStack.length > 0,
      canRedo: redoStack.length > 0,
      nextIsChild
    });
  }

  // 在每次真正改变导图结构之前，先把当时的状态存一份，方便"撤销"
  // 一旦发生新的操作，之前撤销留下的"重做"历史就不再有效了（跟Word等编辑器的逻辑一样）
  function snapshotBeforeChange() {
    if (!tree) return;
    undoStack.push(JSON.parse(JSON.stringify(tree)));
    if (undoStack.length > UNDO_MAX) undoStack.shift();
    redoStack = [];
  }

  function genId() {
    return 'n' + Date.now() + Math.random().toString(36).slice(2, 7);
  }

  // 从点击的元素往上找一个"看起来像一条完整消息"的容器
  // 规则很简单：文字长度够长（>=12个字符）就认为找到了，最多往上找6层
  function findBestTarget(el) {
    let cur = el;
    let depth = 0;
    while (cur && depth < 6) {
      const text = (cur.innerText || '').trim();
      if (text.length >= 12) return cur;
      cur = cur.parentElement;
      depth++;
    }
    return el;
  }

  // 从根节点一路走到指定节点，拼成"对话起点 › 问题1 › 问题1.2"这样的路径
  function buildBreadcrumb(id) {
    const parts = [];
    let cur = id;
    let guard = 0;
    while (cur && guard < 50) {
      const n = tree.nodes[cur];
      if (!n) break;
      parts.unshift(n.label);
      cur = n.parentId;
      guard++;
    }
    return parts.join(' › ');
  }

  // 算出新节点应该挂在哪个父节点下面：
  // 默认情况(nextIsChild=false)：跟"当前位置"并列，也就是挂在它的父节点下面，主线继续往下走
  // 标了"下一条记为子问题"(nextIsChild=true)：直接挂在"当前位置"下面，往下分一层
  function computeAttachParent() {
    const anchorNode = tree.nodes[tree.anchor];
    if (!anchorNode) return 'root';
    if (nextIsChild) return tree.anchor;
    return anchorNode.parentId || 'root';
  }

  function finalizeMark(target, label) {
    if (!tree) return;
    snapshotBeforeChange();
    const id = genId();
    if (target) target.setAttribute('data-chatmap-id', id);

    const parentId = computeAttachParent();
    const node = { id, label, parentId, children: [] };
    tree.nodes[id] = node;
    tree.nodes[parentId].children.push(id);
    tree.anchor = id;

    // 这一条用完之后，"子问题"标记自动消费掉，恢复成默认的并列模式
    nextIsChild = false;

    saveTree();
    broadcast();

    if (target) {
      target.classList.add('chatmap-marked');
      setTimeout(() => target.classList.remove('chatmap-marked'), 1200);
    }
  }

  function removeLabelEditor() {
    const old = document.getElementById('chatmap-editor');
    if (old) old.remove();
  }

  // 点击消息之后，弹一个小输入框，让你自己写这个节点的简短标题
  // 默认会帮你填上点击那段文字的前24个字，可以直接改
  // 输入框上方会显示这条消息将要挂在哪个标题下面，避免标错位置
  function openLabelEditor(target, defaultLabel, clientX, clientY) {
    removeLabelEditor();

    const breadcrumb = buildBreadcrumb(computeAttachParent());
    const modeText = nextIsChild ? t('editorModeChild') : t('editorModeSibling');

    const box = document.createElement('div');
    box.id = 'chatmap-editor';
    box.style.position = 'fixed';
    box.style.zIndex = 2147483647;
    box.style.left = Math.max(8, Math.min(clientX, window.innerWidth - 260)) + 'px';
    box.style.top = Math.max(8, Math.min(clientY, window.innerHeight - 130)) + 'px';

    const inner = document.createElement('div');
    inner.className = 'chatmap-editor-box';

    const breadcrumbEl = document.createElement('div');
    breadcrumbEl.className = 'chatmap-editor-breadcrumb';
    breadcrumbEl.textContent = t('editorWillGo') + breadcrumb + modeText;
    inner.appendChild(breadcrumbEl);

    const titleEl = document.createElement('div');
    titleEl.className = 'chatmap-editor-title';
    titleEl.textContent = t('editorTitle');
    inner.appendChild(titleEl);

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'chatmap-editor-input';
    input.maxLength = 40;
    inner.appendChild(input);

    const actions = document.createElement('div');
    actions.className = 'chatmap-editor-actions';
    const okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.textContent = t('editorOk');
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = t('editorCancel');
    actions.appendChild(okBtn);
    actions.appendChild(cancelBtn);
    inner.appendChild(actions);

    box.appendChild(inner);
    document.body.appendChild(box);

    input.value = defaultLabel;
    input.focus();
    input.select();

    function cleanup() {
      box.remove();
    }
    function confirmFn() {
      const val = input.value.trim() || defaultLabel || t('editorUnnamed');
      finalizeMark(target, val);
      cleanup();
    }

    input.addEventListener('keydown', (ev) => {
      ev.stopPropagation();
      if (ev.key === 'Enter') confirmFn();
      if (ev.key === 'Escape') cleanup();
    });
    okBtn.addEventListener('click', confirmFn);
    cancelBtn.addEventListener('click', cleanup);
  }

  // 持续记录最近被加到页面里的元素，自动模式靠这个去定位"刚发出去的那条消息"渲染出来后的DOM节点
  const recentNodes = [];
  const RECENT_MAX = 250;
  const recentObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((n) => {
        if (n.nodeType === 1) {
          recentNodes.push(n);
          if (recentNodes.length > RECENT_MAX) recentNodes.shift();
        }
      });
    }
  });
  recentObserver.observe(document.documentElement, { childList: true, subtree: true });

  // 在最近新增的节点里找一个文字包含snippet、但又不会大到像是整个聊天列表的元素
  function findElementContainingText(snippet) {
    if (!snippet) return null;
    for (let i = recentNodes.length - 1; i >= 0; i--) {
      const n = recentNodes[i];
      if (!n.isConnected) continue;
      const text = (n.innerText || n.textContent || '').trim();
      if (text.includes(snippet) && text.length < snippet.length * 6 + 20) {
        return n;
      }
    }
    return null;
  }

  // 发送按键触发后，页面渲染出对应消息需要一点时间，这里轮询一会儿去找它
  function scheduleAutoCapture(typedText) {
    const cleaned = typedText.replace(/\s+/g, ' ').trim();
    if (!cleaned) return;
    const snippet = cleaned.slice(0, 40);
    const shortLabel = cleaned.slice(0, 24) + (cleaned.length > 24 ? '…' : '');
    const deadline = Date.now() + 4000;

    function tryFind() {
      const matchEl = findElementContainingText(snippet);
      if (matchEl) {
        finalizeMark(matchEl, shortLabel);
      } else if (Date.now() < deadline) {
        setTimeout(tryFind, 300);
      } else {
        // 实在找不到对应的页面元素，也先把节点记下来，
        // 以后点它跳转时会用浏览器内置的文字查找去兜底定位
        finalizeMark(null, shortLabel);
      }
    }
    setTimeout(tryFind, 350);
  }

  // 自动模式：只要在输入框里按下Enter发送（没按Shift），就自动把这句话记成一个新节点
  document.addEventListener(
    'keydown',
    (e) => {
      if (!autoMode) return;
      if (e.target && e.target.closest && e.target.closest('#chatmap-editor')) return;
      if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey) return;

      const el = document.activeElement;
      if (!el) return;
      const isTextInput =
        el.tagName === 'TEXTAREA' || el.isContentEditable || el.getAttribute('contenteditable') === 'true';
      if (!isTextInput) return;

      const text = (el.value !== undefined && el.value !== '' ? el.value : el.innerText || '').trim();
      if (text.length < 2) return;

      // 防止同一句话因为重复事件被记两次
      if (text === lastAutoText && Date.now() - lastAutoTime < 2000) return;
      lastAutoText = text;
      lastAutoTime = Date.now();

      scheduleAutoCapture(text);
    },
    true
  );

  function setMarking(on) {
    marking = on;
    document.body.classList.toggle('chatmap-marking', marking);
    if (!marking) {
      removeLabelEditor();
      if (hoverEl) {
        hoverEl.classList.remove('chatmap-hover');
        hoverEl = null;
      }
    }
  }

  document.addEventListener(
    'mousemove',
    (e) => {
      if (!marking) return;
      if (e.target.closest && e.target.closest('#chatmap-editor')) return;
      const el = findBestTarget(e.target);
      if (el === hoverEl) return;
      if (hoverEl) hoverEl.classList.remove('chatmap-hover');
      hoverEl = el;
      if (hoverEl) hoverEl.classList.add('chatmap-hover');
    },
    true
  );

  document.addEventListener(
    'click',
    (e) => {
      if (!marking) return;
      if (e.target.closest && e.target.closest('#chatmap-editor')) return;
      e.preventDefault();
      e.stopPropagation();
      const target = findBestTarget(e.target);
      const raw = (target.innerText || '').trim().replace(/\s+/g, ' ');
      const defaultLabel = raw.slice(0, 24);
      openLabelEditor(target, defaultLabel, e.clientX, e.clientY);
    },
    true
  );

  // 删除一个节点（连同它底下所有的子节点一起删掉），root不允许删
  function deleteNode(id) {
    if (!tree || id === 'root' || !tree.nodes[id]) return false;
    snapshotBeforeChange();

    const node = tree.nodes[id];
    const parentId = node.parentId;

    const toDelete = [];
    (function collect(nid) {
      toDelete.push(nid);
      const n = tree.nodes[nid];
      if (n) n.children.forEach(collect);
    })(id);

    // 如果对应的页面元素还在，把标记属性摘掉，避免留下孤立的标记
    toDelete.forEach((nid) => {
      const el = document.querySelector(`[data-chatmap-id="${nid}"]`);
      if (el) el.removeAttribute('data-chatmap-id');
    });

    if (parentId && tree.nodes[parentId]) {
      tree.nodes[parentId].children = tree.nodes[parentId].children.filter((cid) => cid !== id);
    }

    toDelete.forEach((nid) => delete tree.nodes[nid]);

    // 如果当前位置正好在被删掉的节点里，退回到它的父节点
    if (toDelete.indexOf(tree.anchor) !== -1) {
      tree.anchor = parentId && tree.nodes[parentId] ? parentId : 'root';
    }

    saveTree();
    broadcast();
    return true;
  }

  function scrollToNode(id) {
    const el = document.querySelector(`[data-chatmap-id="${id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('chatmap-marked');
      setTimeout(() => el.classList.remove('chatmap-marked'), 1200);
      return true;
    }
    // 兜底方案：如果页面刷新过，原来打的标记属性会丢失，
    // 这里用浏览器自带的文字查找尝试模糊定位
    const node = tree && tree.nodes[id];
    if (node && node.label && window.find) {
      const text = node.label.replace('…', '');
      try {
        window.getSelection().removeAllRanges();
        return window.find(text, false, false, true, false, true, false);
      } catch (err) {
        return false;
      }
    }
    return false;
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'getTree') {
      loadTree(() =>
        sendResponse({
          convKey,
          tree,
          autoMode,
          canUndo: undoStack.length > 0,
          canRedo: redoStack.length > 0,
          nextIsChild
        })
      );
      return true;
    }
    if (msg.type === 'setMarking') {
      setMarking(msg.value);
      sendResponse({ ok: true });
      return;
    }
    if (msg.type === 'setAutoMode') {
      autoMode = !!msg.value;
      safeStorageSet({ [AUTO_MODE_KEY]: autoMode });
      sendResponse({ ok: true, autoMode });
      return;
    }
    if (msg.type === 'setNextIsChild') {
      nextIsChild = !!msg.value;
      broadcast();
      sendResponse({ ok: true, nextIsChild });
      return;
    }
    if (msg.type === 'goToNode') {
      const ok = scrollToNode(msg.id);
      if (tree && tree.nodes[msg.id]) {
        tree.anchor = msg.id;
        saveTree();
        broadcast();
      }
      sendResponse({ ok });
      return;
    }
    if (msg.type === 'resetTree') {
      snapshotBeforeChange();
      tree = defaultTree();
      saveTree();
      broadcast();
      sendResponse({ ok: true });
      return;
    }
    if (msg.type === 'renameNode') {
      if (tree && tree.nodes[msg.id]) {
        snapshotBeforeChange();
        tree.nodes[msg.id].label = msg.label;
        saveTree();
        broadcast();
      }
      sendResponse({ ok: true });
      return;
    }
    if (msg.type === 'deleteNode') {
      const ok = deleteNode(msg.id);
      sendResponse({ ok });
      return;
    }
    if (msg.type === 'undo') {
      if (undoStack.length === 0) {
        sendResponse({ ok: false, reason: 'empty' });
        return;
      }
      redoStack.push(JSON.parse(JSON.stringify(tree)));
      if (redoStack.length > UNDO_MAX) redoStack.shift();
      tree = undoStack.pop();
      saveTree();
      broadcast();
      sendResponse({ ok: true });
      return;
    }
    if (msg.type === 'redo') {
      if (redoStack.length === 0) {
        sendResponse({ ok: false, reason: 'empty' });
        return;
      }
      undoStack.push(JSON.parse(JSON.stringify(tree)));
      if (undoStack.length > UNDO_MAX) undoStack.shift();
      tree = redoStack.pop();
      saveTree();
      broadcast();
      sendResponse({ ok: true });
      return;
    }
  });

  // 单页应用（SPA）切换对话不会真正刷新页面，靠轮询URL变化来切换对应的树
  let lastHref = location.href;
  const hrefWatcher = setInterval(() => {
    if (!contextOk) {
      clearInterval(hrefWatcher);
      return;
    }
    if (location.href !== lastHref) {
      lastHref = location.href;
      convKey = getConvKey();
      loadTree(() => broadcast());
    }
  }, 1000);
})();
