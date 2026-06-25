# 📋 Daily Task Planner & Roller

A sleek, dark-themed daily task planner vibe coded using Antigravity with vanilla HTML, CSS, and JavaScript. Designed for developers and teams who track JIRA tickets, sprint deliverables, and discovery work — with automatic rollover of unfinished tasks.

**No frameworks. No backend. No accounts.** Just open `index.html` and start planning.

---

## ✨ Features

- **Daily Task Tracking** — Add, complete, edit, and delete tasks for any day
- **Automatic Rollover** — Unfinished tasks from past days automatically roll forward to today on launch
- **Smart Tag Parsing** — Type naturally and the app detects JIRA keys, sprint/discovery tags, and assignees
- **Bulk Import** — Paste an entire day's task list (one per line) to import all at once
- **Postpone Tasks** — Reschedule tasks to tomorrow, in 2 days, next Monday, or a custom date
- **Date Navigation** — Switch between Yesterday / Today / Tomorrow or jump to any date via the date picker
- **Progress Ring** — Visual circular progress indicator showing daily completion percentage
- **Inline Editing** — Click any task title to edit it in place
- **JIRA Sorting** — Tasks with JIRA keys are auto-sorted by project and issue number
- **Export / Import** — Back up your entire task database as JSON and restore it anytime
- **Glassmorphism UI** — Modern dark theme with glass panels, subtle gradients, and micro-animations
- **Fully Offline** — All data stored in browser `localStorage`, no server required
- **Responsive** — Works on desktop and mobile browsers

---

## 🚀 Getting Started

### Option 1: Just Open It (Recommended)

Simply open `index.html` in your browser. That's it — no build step, no install.

```bash
# Linux / macOS
xdg-open index.html    # or: open index.html (macOS)

# Windows
start index.html
```

### Quick Start (Recommended)

```bash
npm install       # one-time setup
npm run dev       # starts server at http://localhost:3000
```

This runs a tiny Node.js server that serves the app and saves your tasks to a local `data/tasks.json` file. Your data persists across browser restarts and clears.

### Alternative: Open as Static File

You can also open `index.html` directly in your browser with no server. In this mode the app falls back to `localStorage` (data is tied to the browser).

```bash
# Linux / macOS
xdg-open index.html    # or: open index.html (macOS)

# Windows
start index.html
```

### Desktop Shortcut

Create a desktop shortcut that starts the server and opens the planner:

| OS      | Command                                        |
|---------|-------------------------------------------------|
| Linux   | `bash create-shortcut.sh`                       |
| Windows | `powershell -ExecutionPolicy Bypass -File create-shortcut.ps1` |

---

## 📝 How to Use

### Adding Tasks

Type a task in the input field and press **Add Task** (or hit Enter). The app automatically detects special tags:

| Syntax                    | Result                          |
|---------------------------|---------------------------------|
| `AUTH-102: Fix login bug` | Extracts JIRA badge `AUTH-102`  |
| `#sprint`                 | Adds a green **Sprint** badge   |
| `#discovery` or `#research` | Adds a purple **Discovery** badge |
| `@alice`                  | Adds a red **Assignee** badge   |

**Example input:**
```
AUTH-102: Implement logout endpoint #sprint @alice
```
This creates a task titled *"Implement logout endpoint"* with badges for `AUTH-102`, `Sprint`, and `alice`.

### Completing Tasks

Click the checkbox next to any task to mark it complete. Completed tasks move to the **Completed Today** section with a strikethrough.

### Editing Tasks

Click on any task title to edit it inline. Press **Enter** to save or **Escape** to cancel.

### Postponing Tasks

Hover over an active task and click the calendar icon to postpone. Choose from:
- **Tomorrow**
- **In 2 Days**
- **Next Monday**
- **Custom date** (date picker)

### Bulk Import

Switch to the **Bulk Daily Import** tab and paste multiple tasks, one per line:

```
AUTH-102: Implement user login #sprint
Research secure storage options #discovery
Check cloudwatch logs for errors
CORE-55: Update API rate limiter
```

### Automatic Rollover

When you open the app, any **incomplete tasks from past days** are automatically moved to today and marked with a red **Rolled Over** badge. You never lose track of unfinished work.

---

## 💾 Data Management

When running with the server (`npm run dev`), tasks are saved to `data/tasks.json` on disk. This file is `.gitignore`'d so your personal task data never gets committed.

If opened as a static file (no server), the app falls back to browser `localStorage`.

| Action            | How                                                     |
|-------------------|---------------------------------------------------------|
| **Export Backup**  | Click *Export Backup* in the footer → downloads a `.json` file |
| **Import Backup**  | Click *Import Backup* in the footer → select a `.json` file   |
| **Reset Database** | Click *Reset Database* in the footer → restores demo tasks    |

> **Tip:** The `data/tasks.json` file is a plain JSON array — you can version it separately, back it up, or sync it across machines.

---

## 🗂 Project Structure

```
DailyPlanner/
├── index.html            # Main HTML page
├── styles.css            # All styling (glassmorphism dark theme)
├── app.js                # Application logic (parsing, rendering, storage)
├── server.js             # Express server for local file persistence
├── package.json          # Dependencies and dev script
├── .gitignore            # Ignores data/ and node_modules/
├── run-planner.sh        # Linux launcher script
├── run-planner.bat       # Windows launcher script
├── create-shortcut.sh    # Creates Linux desktop shortcut
├── create-shortcut.ps1   # Creates Windows desktop shortcut
└── data/
    └── tasks.json        # Your task data (auto-created, git-ignored)
```

---

## 🛠 Tech Stack

- **HTML5** — Semantic markup
- **Vanilla CSS** — Custom properties, glassmorphism, responsive design
- **Vanilla JavaScript** — No frontend framework
- **Node.js + Express** — Tiny server for local file persistence
- **localStorage** — Offline fallback when no server is running
- **Google Fonts** — [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)

---

## 📄 License

This project is open source. Feel free to use, modify, and share it.
