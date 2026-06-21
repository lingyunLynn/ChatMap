# ChatMap

[English ↓](#english)

跟AI聊天最烦的一件事：聊到一半，突然想到一个相关但岔开的问题，问完之后想接着刚才没问完的话题往下聊，结果要往上翻一大段聊天记录才能找到自己刚才问的是哪一句。聊得越久，越难翻。

ChatMap就是为了解决这件事做的。给ChatGPT / Claude / Gemini这类AI对话页面加一个侧边栏，把你问的每个问题变成地图上的一个点。主线问题接着往下排成一排，岔开问的单独挂一支分支。想接着刚才的话题往下问，点一下地图上对应的点，直接跳回去，不用翻聊天记录。

## 适合用在哪些场景

- 跟AI做研究、写论文，主线问题一直往下推，中途想深挖某个细节，问完接着主线往下问
- 调试代码，主线在排查bug，中途好奇问了个相关API用法，问完接着排查
- 做决定（选offer、选方案、买东西），主线在比较几个选项，中途深入聊某一个选项的细节
- 长期把AI当助手用，一个对话开很久，过了几天想找回之前问过的某个具体问题
- 备考、学习，主线在过知识点，中途冒出"这个词到底什么意思"的疑问

## 功能

- 手动标记：点哪条消息，哪条就上图，标的时候自己写一句简短标题
- 自动记录：开了之后，每次按Enter发问就自动记一笔，不用自己点
- 主线/分支：默认接着主线并列往下排，想分岔时点一下开关，下一条单独挂一支，标完自动恢复
- 点地图上的节点，直接跳回页面里对应的那条消息
- 撤销 / 重做、双击改名、删除节点、折叠分支
- 装的时候选一次中文还是English，界面跟着走

## 怎么用

1. 装好插件，打开ChatGPT / Claude / Gemini，点插件图标打开侧边栏
2. 开"自动记录"，正常聊天，每次发问都会自动记到地图上
3. 想问岔开的问题：先点"下一条：子问题"，问完它单独分一支，之后自动恢复成接着主线排
4. 想回某个之前问的问题：点地图上对应的点，自动跳回去

## 安装（开发者模式）

1. 打开 `chrome://extensions`，右上角开"开发者模式"
2. 点"加载已解压的扩展程序"，选这个文件夹
3. 第一次装上会自动弹一个页面，选中文还是English
4. 打开支持的AI对话页面，点插件图标，侧边栏就出来了

## 已知限制

- 自动记录只认"在输入框按Enter发送"，靠点鼠标发送的网站会漏记，手动标一下就行
- 刷新页面后，旧的标记点会失效，跳转会用浏览器自带的文字查找去兜底，不保证100%准确
- 撤销/重做记录只存在这次打开页面的内存里，刷新页面会清空
- 语言目前只在装的时候选一次，没有常驻切换开关

## License

MIT

---

<a name="english"></a>

# ChatMap (English)

The most annoying thing about chatting with an AI: you're mid-conversation, a related but tangential question pops into your head, you ask it, then try to get back to what you were actually asking before, and end up scrolling through a wall of chat history just to find it. The longer the chat, the worse it gets.

ChatMap fixes that. It adds a sidebar to ChatGPT / Claude / Gemini that turns every question you ask into a node on a map. Main-line questions line up in a row; side questions branch off on their own. Want to pick up where you left off? Click the node, jump straight back. No scrolling.

## Good for

- Research and writing with AI: keep the main thread moving, dive into a detail, come back without losing the thread
- Debugging code: stay on the bug, branch off to ask about a related API, then return to debugging
- Making decisions (job offers, purchases, plans): compare options on the main line, dig into one option on a branch
- Long-running AI assistant chats: find a question you asked days ago without endless scrolling
- Studying or exam prep: stay on the main topic, branch off for "wait, what does this term mean"

## Features

- Manual marking: click any message to add it to the map, write your own short title
- Auto record: turn it on and every question you send (press Enter) gets added automatically
- Main line / branch: new nodes default to sibling of the current one (main line keeps going); flip a switch to make the next one a branch instead, resets automatically after
- Click a node on the map to jump straight back to that message on the page
- Undo / redo, double-click to rename, delete nodes, collapse branches
- Pick Chinese or English once at install, the whole UI follows

## How it works

1. Install the extension, open ChatGPT / Claude / Gemini, click the icon to open the sidebar
2. Turn on "Auto Record" and chat normally, every question gets added to the map
3. Asking a side question: click "Next: Sub-question" first, it branches off, then resets to sibling mode automatically
4. Want to revisit something: click its node on the map, jump straight back

## Install (developer mode)

1. Open `chrome://extensions`, turn on "Developer mode" top right
2. Click "Load unpacked", select this folder
3. A language picker opens automatically on first install, pick Chinese or English
4. Open a supported AI chat page, click the extension icon, the sidebar opens

## Known limitations

- Auto record only catches "pressing Enter to send"; sites that send by clicking a button will be missed, mark those manually
- Refreshing the page invalidates old marker links; jumping falls back to the browser's built-in text search, not 100% accurate
- Undo/redo history only lives in memory for this page session, clears on refresh
- Language is chosen once at install, no toggle yet

## License

MIT
