# ChatMap

*A visual map for long AI conversations.*

[中文说明](README_CN.md)

## Why?

AI conversations rarely stay linear.

You start with one topic, branch into a related question, then another. A few minutes later, you want to continue the original discussion but have no idea where it was.

The longer the conversation gets, the harder it becomes to find previous topics.

ChatMap solves this problem by turning your questions into a visual conversation tree. Instead of scrolling through hundreds of messages, you can jump directly back to any previous question with a single click.

## Example

Instead of:

```text
Question A
 ↓
Question B
 ↓
Question C
 ↓
Random side question
 ↓
Another side question
 ↓
Where was I?
```

You get:

```text
Question A
├─ Question B
├─ Question C
│  ├─ Side question
│  └─ Another side question
└─ Next main topic
```

Click any node to jump back to that point in the conversation.

## Use Cases

### Research & Writing
Keep your main line of inquiry moving while exploring side questions without losing context.

### Coding & Debugging
Investigate related APIs or implementation details without losing track of the original bug.

### Decision Making
Compare options, branch into detailed discussions, and return to the bigger picture instantly.

### Long-Term AI Conversations
Use ChatGPT, Claude, or Gemini as a long-term assistant without getting lost in massive chat histories.

### Learning & Studying
Follow a topic, ask spontaneous questions, and return to where you left off.

## Features

### Automatic Recording
Every question you send is automatically added to the map.

### Main Thread & Branches
Continue along the main discussion or create temporary branches for side questions.

### One-Click Navigation
Jump back to any previous question instantly.

### Manual Nodes
Add important messages manually whenever needed.

### Editing Tools
- Rename nodes
- Delete nodes
- Undo / Redo
- Collapse branches

### Bilingual Interface
Choose Chinese or English during installation.

### Supported Platforms
- ChatGPT
- Claude
- Gemini

More platforms may be added in the future.

## Installation

### Developer Mode
1. Open `chrome://extensions`
2. Enable Developer Mode
3. Click Load unpacked
4. Select the project folder
5. Choose your preferred language
6. Open a supported AI chat page
7. Click the extension icon

## Known Limitations
- Automatic recording currently detects messages sent via the Enter key
- Refreshing the page may reduce jump accuracy for older nodes
- Undo / Redo history exists only for the current browser session
- Language selection is currently available only during initial setup

## Roadmap

Planned improvements include:
- Better persistence across page refreshes
- Additional AI platforms
- Export and import functionality
- Search within conversation maps
- Custom themes

## License

MIT
