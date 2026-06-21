// sidepanel.js

let currentTree = null;
let marking = false;
let autoMode = false;
let canUndo = false;
let canRedo = false;
let nextIsChild = false;
let lang = 'zh';
const collapsedSet = new Set();

function t(key) {
  return chatmapGetStrings(lang)[key];
}

function getActiveTabId(cb) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    cb(tabs[0] && tabs[0].id);
  });
}

function sendToContent(msg, cb) {
  getActiveTabId((tabId) => {
    if (!tabId) {
      cb && cb(null);
      return;
    }
    chrome.tabs.sendMessage(tabId, msg, (res) => {
      if (chrome.runtime.lastError) {
        cb && cb(null);
        return;
      }
      cb && cb(res);
    });
  });
}

function countDescendants(node) {
  let count = 0;
  function walk(n) {
    n.children.forEach((cid) => {
      count++;
      const child = currentTree.nodes[cid];
      if (child) walk(child);
    });
  }
  walk(node);
  return count;
}

function buildBreadcrumb(id) {
  const parts = [];
  let cur = id;
  let guard = 0;
  while (cur && guard < 50) {
    const n = currentTree.nodes[cur];
    if (!n) break;
    parts.unshift(n.label);
    cur = n.parentId;
    guard++;
  }
  return parts.join(' › ');
}

// 跟content.js里的computeAttachParent逻辑保持一致，只是这边只是用来预览展示
function computeAttachParentId() {
  if (!currentTree) return 'root';
  const anchorNode = currentTree.nodes[currentTree.anchor];
  if (!anchorNode) return 'root';
  if (nextIsChild) return currentTree.anchor;
  return anchorNode.parentId || 'root';
}

function render() {
  const treeEl = document.getElementById('tree');
  const statusEl = document.getElementById('status');
  const nextEl = document.getElementById('nextStatus');
  treeEl.innerHTML = '';

  if (!currentTree) {
    statusEl.textContent = '';
    nextEl.textContent = '';
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = t('emptyState');
    treeEl.appendChild(empty);
    return;
  }

  statusEl.textContent = t('currentPos') + buildBreadcrumb(currentTree.anchor);
  const modeText = nextIsChild ? t('modeChild') : t('modeSibling');
  nextEl.textContent = t('nextWillGo') + buildBreadcrumb(computeAttachParentId()) + ' ' + modeText;

  const rootUl = document.createElement('ul');
  rootUl.className = 'chatmap-tree root-tree';
  rootUl.appendChild(renderNode('root', ''));
  treeEl.appendChild(rootUl);
}

// 双击节点标题时，把那段文字原地换成一个输入框，改完按Enter确认，Esc取消，
// 不用弹浏览器自带的prompt窗口，样式跟侧边栏保持一致
function startInlineEdit(row, labelSpan, id, currentLabel) {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'chatmap-inline-edit';
  input.maxLength = 40;
  input.value = currentLabel;
  row.replaceChild(input, labelSpan);
  input.focus();
  input.select();

  let done = false;

  function commit() {
    if (done) return;
    done = true;
    const val = input.value.trim();
    if (val && val !== currentLabel) {
      sendToContent({ type: 'renameNode', id, label: val }, () => refresh());
    } else {
      render();
    }
  }

  function cancel() {
    if (done) return;
    done = true;
    render();
  }

  input.addEventListener('keydown', (ev) => {
    ev.stopPropagation();
    if (ev.key === 'Enter') {
      ev.preventDefault();
      commit();
    }
    if (ev.key === 'Escape') {
      ev.preventDefault();
      cancel();
    }
  });
  input.addEventListener('blur', () => commit());
  input.addEventListener('click', (ev) => ev.stopPropagation());
}

function renderNode(id, prefix) {
  const node = currentTree.nodes[id];
  const li = document.createElement('li');
  li.className = 'chatmap-node';

  const row = document.createElement('div');
  row.className = 'chatmap-row';

  const hasChildren = node.children && node.children.length > 0;
  const collapsed = collapsedSet.has(id);

  const toggle = document.createElement('span');
  if (hasChildren) {
    toggle.className = 'chatmap-toggle';
    toggle.textContent = collapsed ? '▸' : '▾';
    toggle.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (collapsed) collapsedSet.delete(id);
      else collapsedSet.add(id);
      render();
    });
  } else {
    toggle.className = 'chatmap-toggle chatmap-toggle-leaf';
    toggle.textContent = '·';
  }
  row.appendChild(toggle);

  if (prefix) {
    const num = document.createElement('span');
    num.className = 'chatmap-number';
    num.textContent = prefix;
    row.appendChild(num);
  }

  const label = document.createElement('span');
  label.className = 'chatmap-node-label' + (currentTree.anchor === id ? ' anchor' : '');
  label.textContent = node.label;
  label.title = node.label + t('nodeTitleHint');

  // 单击=跳转，双击=重命名。这两个是冲突的：双击的时候浏览器会先后触发两次click再触发一次dblclick，
  // 如果单击直接立刻跳转并刷新整张树，刚好会把双击弹出来的编辑框冲掉。
  // 所以单击先等一下，如果紧接着来了第二次点击(也就是双击)，就取消这次跳转，只让双击的重命名生效。
  let clickTimer = null;
  label.addEventListener('click', () => {
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
      return;
    }
    clickTimer = setTimeout(() => {
      clickTimer = null;
      sendToContent({ type: 'goToNode', id }, () => refresh());
    }, 280);
  });
  label.addEventListener('dblclick', (ev) => {
    ev.stopPropagation();
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
    }
    startInlineEdit(row, label, id, node.label);
  });
  row.appendChild(label);

  if (hasChildren && collapsed) {
    const countSpan = document.createElement('span');
    countSpan.className = 'chatmap-count';
    countSpan.textContent = t('foldedCount')(countDescendants(node));
    row.appendChild(countSpan);
  }

  if (id !== 'root') {
    const del = document.createElement('span');
    del.className = 'chatmap-delete';
    del.textContent = '🗑';
    del.title = t('deleteTitle');
    del.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const descCount = countDescendants(node);
      const msg = descCount > 0 ? t('confirmDeleteWithChildren')(descCount) : t('confirmDeleteSimple');
      if (!confirm(msg)) return;
      sendToContent({ type: 'deleteNode', id }, () => refresh());
    });
    row.appendChild(del);
  }

  li.appendChild(row);

  if (hasChildren && !collapsed) {
    const ul = document.createElement('ul');
    ul.className = 'chatmap-tree';
    node.children.forEach((cid, idx) => {
      const childPrefix = prefix ? `${prefix}.${idx + 1}` : `${idx + 1}`;
      const child = currentTree.nodes[cid];
      if (child) ul.appendChild(renderNode(cid, childPrefix));
    });
    li.appendChild(ul);
  }

  return li;
}

function updateAutoUI() {
  const btn = document.getElementById('toggleAuto');
  const hint = document.getElementById('autoHint');
  btn.textContent = autoMode ? t('autoOn') : t('autoOff');
  btn.classList.toggle('active', autoMode);
  hint.classList.toggle('show', autoMode);
}

function updateUndoUI() {
  document.getElementById('undoBtn').disabled = !canUndo;
}

function updateRedoUI() {
  document.getElementById('redoBtn').disabled = !canRedo;
}

function updateBranchUI() {
  const btn = document.getElementById('toggleBranch');
  btn.textContent = nextIsChild ? t('branchChild') : t('branchSibling');
  btn.classList.toggle('active', nextIsChild);
}

function applyStaticI18n() {
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh';
  document.getElementById('toggleMark').textContent = marking ? t('markOn') : t('markOff');
  document.getElementById('undoBtn').textContent = t('undo');
  document.getElementById('undoBtn').title = t('undoTitle');
  document.getElementById('redoBtn').textContent = t('redo');
  document.getElementById('redoBtn').title = t('redoTitle');
  document.getElementById('resetBtn').textContent = t('reset');
  document.getElementById('resetBtn').title = t('resetTitle');
  document.getElementById('autoHint').textContent = t('autoHint');
  document.getElementById('hint').textContent = t('hint');
}

function refresh() {
  sendToContent({ type: 'getTree' }, (res) => {
    currentTree = res ? res.tree : null;
    autoMode = res ? !!res.autoMode : false;
    canUndo = res ? !!res.canUndo : false;
    canRedo = res ? !!res.canRedo : false;
    nextIsChild = res ? !!res.nextIsChild : false;
    updateAutoUI();
    updateUndoUI();
    updateRedoUI();
    updateBranchUI();
    render();
  });
}

document.getElementById('toggleBranch').addEventListener('click', () => {
  nextIsChild = !nextIsChild;
  updateBranchUI();
  sendToContent({ type: 'setNextIsChild', value: nextIsChild }, () => render());
});

document.getElementById('toggleAuto').addEventListener('click', () => {
  autoMode = !autoMode;
  updateAutoUI();
  sendToContent({ type: 'setAutoMode', value: autoMode });
});

document.getElementById('undoBtn').addEventListener('click', () => {
  sendToContent({ type: 'undo' }, () => refresh());
});

document.getElementById('redoBtn').addEventListener('click', () => {
  sendToContent({ type: 'redo' }, () => refresh());
});

document.getElementById('toggleMark').addEventListener('click', () => {
  marking = !marking;
  const btn = document.getElementById('toggleMark');
  btn.textContent = marking ? t('markOn') : t('markOff');
  btn.classList.toggle('active', marking);
  sendToContent({ type: 'setMarking', value: marking });
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm(t('confirmReset'))) return;
  sendToContent({ type: 'resetTree' }, () => refresh());
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'treeUpdated') {
    currentTree = msg.tree;
    if (typeof msg.autoMode === 'boolean') {
      autoMode = msg.autoMode;
      updateAutoUI();
    }
    if (typeof msg.canUndo === 'boolean') {
      canUndo = msg.canUndo;
      updateUndoUI();
    }
    if (typeof msg.canRedo === 'boolean') {
      canRedo = msg.canRedo;
      updateRedoUI();
    }
    if (typeof msg.nextIsChild === 'boolean') {
      nextIsChild = msg.nextIsChild;
      updateBranchUI();
    }
    render();
  }
});

chrome.tabs.onActivated.addListener(() => refresh());

chrome.storage.local.get([CHATMAP_LANG_KEY], (res) => {
  lang = res[CHATMAP_LANG_KEY] === 'en' ? 'en' : 'zh';
  applyStaticI18n();
  refresh();
});
