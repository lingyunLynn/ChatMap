// i18n.js
// 共享的中英文文案表。这个文件会被 content.js、sidepanel.html、welcome.html 分别加载，
// 跟它们运行在同一个全局作用域里，所以这里定义的常量和函数对它们都是可见的。

const CHATMAP_LANG_KEY = 'chatmap:lang';

const CHATMAP_STRINGS = {
  zh: {
    rootLabel: '🏁 对话起点',

    markOff: '🖊 手动标记：关',
    markOn: '🖊 手动标记：开',
    autoOff: '🤖 自动记录：关',
    autoOn: '🤖 自动记录：开',
    branchSibling: '🔀 下一条：并列',
    branchChild: '🔀 下一条：子问题',
    undo: '↶ 撤销',
    undoTitle: '撤销上一步操作（标记/删除/改名/清空）',
    redo: '↷ 重做',
    redoTitle: '重做（取消撤销）',
    reset: '🗑 清空',
    resetTitle: '清空当前对话的导图',

    autoHint: '自动记录已开启：在输入框按Enter发送问题，会自动记一笔。',
    hint:
      '点击"手动标记：开"，然后去页面里点你想记录的那条消息，它就会出现在下面的图里。' +
      '之后再点图里的某个节点，就能跳回那条消息，并把它设为新的"当前位置"。',
    emptyState: '当前页面还没有导图，切到支持的AI对话页面试试（或刷新一下页面）。',

    currentPos: '当前位置：',
    nextWillGo: '下一条将归入：',
    modeSibling: '（并列，主线继续）',
    modeChild: '（子问题/分支）',

    foldedCount: (n) => `(折叠了${n}条)`,
    deleteTitle: '删除这个节点',
    confirmDeleteWithChildren: (n) => `这个节点下面还有${n}条子节点，要一起删除吗？`,
    confirmDeleteSimple: '删除这个节点？',
    confirmReset: '清空当前对话的整张导图？',
    nodeTitleHint: '\n点击跳转，双击重命名',

    editorTitle: '给这个节点起个简短标题',
    editorWillGo: '将归入：',
    editorModeChild: '（作为子问题/分支）',
    editorModeSibling: '（跟当前位置并列）',
    editorOk: '✓ 加入导图',
    editorCancel: '✕ 取消',
    editorUnnamed: '（未命名）'
  },

  en: {
    rootLabel: '🏁 Conversation start',

    markOff: '🖊 Manual Mark: Off',
    markOn: '🖊 Manual Mark: On',
    autoOff: '🤖 Auto Record: Off',
    autoOn: '🤖 Auto Record: On',
    branchSibling: '🔀 Next: Sibling',
    branchChild: '🔀 Next: Sub-question',
    undo: '↶ Undo',
    undoTitle: 'Undo last action (mark / delete / rename / clear)',
    redo: '↷ Redo',
    redoTitle: 'Redo (cancel undo)',
    reset: '🗑 Clear',
    resetTitle: 'Clear the map for this conversation',

    autoHint: 'Auto record is on: press Enter in the input box to record a node automatically.',
    hint:
      'Click "Manual Mark: On", then click the message on the page you want to record. It will show up in the map below. ' +
      'Click a node later to jump back to that message and set it as the new "current position".',
    emptyState: 'No map yet on this page. Try a supported AI chat page (or refresh the page).',

    currentPos: 'Current position: ',
    nextWillGo: 'Next node goes under: ',
    modeSibling: '(sibling, main line continues)',
    modeChild: '(sub-question / branch)',

    foldedCount: (n) => `(${n} collapsed)`,
    deleteTitle: 'Delete this node',
    confirmDeleteWithChildren: (n) => `This node has ${n} child node(s) below it. Delete them all?`,
    confirmDeleteSimple: 'Delete this node?',
    confirmReset: 'Clear the entire map for this conversation?',
    nodeTitleHint: '\nClick to jump, double-click to rename',

    editorTitle: 'Give this node a short title',
    editorWillGo: 'Will go under: ',
    editorModeChild: '(as a sub-question / branch)',
    editorModeSibling: '(sibling of current position)',
    editorOk: '✓ Add to map',
    editorCancel: '✕ Cancel',
    editorUnnamed: '(untitled)'
  }
};

function chatmapGetStrings(lang) {
  return CHATMAP_STRINGS[lang === 'en' ? 'en' : 'zh'];
}
