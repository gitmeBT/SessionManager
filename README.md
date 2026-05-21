<div align="center">
  <img src="docs/icon.png" width="128" height="128" alt="SessionManager Icon">

  # SessionManager

  A macOS desktop app that unifies session management for AI coding agents — find, browse, and resume sessions from OpenCode, Claude Code, and Codex in one place.
</div>

## Features

- **Unified session index** — automatically scans and indexes sessions from multiple AI agents into a single SQLite database
- **Fast search** — find any session by title, project, or content in seconds
- **Built-in terminal** — resume a session with one click and continue working directly in the app
- **Pin & archive** — pin important sessions, archive completed ones
- **Dark & light themes** — matches your system appearance
- **Bilingual UI** — English and Chinese (可在设置中切换语言)

## Supported Agents

| Agent | Data Source |
|---|---|
| [OpenCode](https://github.com/opencode-ai/opencode) | SQLite (`~/.local/share/opencode/opencode.db`) |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | JSONL (`~/.claude/projects/`) |
| [Codex](https://github.com/openai/codex) | SQLite (`~/.codex/state_5.sqlite`) |

## Screenshots

> TODO: Add screenshots

## Installation

Download the latest DMG from [Releases](https://github.com/gitmeBT/SessionManager/releases).

- **Apple Silicon (M1/M2/M3/M4)** → download the `arm64` version
- **Intel Mac** → download the `x64` version

On first launch, right-click the app → **Open** to bypass Gatekeeper (the app is unsigned).

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build locally
npm run pack

# Package DMG
npm run dist
```

### Tech Stack

- [Electron](https://www.electronjs.org/) + [electron-vite](https://electron-vite.org/)
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Zustand](https://zustand.docs.pmnd.rs/) for state management
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) for database
- [xterm.js](https://xtermjs.org/) for integrated terminal

## License

[Apache-2.0](LICENSE)
