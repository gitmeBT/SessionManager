# SessionManager PRD

## 产品定位

一个 macOS Electron 桌面应用，统一管理 opencode / Claude Code / Codex 等 AI Agent 的 session，提供**查找 → 恢复 → 工作**的一站式体验。

## 目标用户

同时使用多个 AI coding agent 的开发者。

## 核心痛点

1. Session 散落在不同工具、不同项目目录中，难以查找
2. 回到之前的工作上下文成本高（要先回忆工具 → 项目 → session ID）
3. 需要频繁在多个终端窗口间切换

## 产品目标

- 打开应用，3 秒内找到想要的 session
- 一键恢复 session 并直接在应用内继续工作
- 不移动/不修改任何原工具的 session 文件（只读索引）

---

## V1 功能范围（MVP）

### F1: Session 索引引擎 (Indexer)

定时扫描各 AI 工具的原生存储，提取元数据写入统一 SQLite 数据库。

**支持的工具及数据源：**

| 工具 | 数据源 | 关键字段 |
|---|---|---|
| opencode | `~/.local/share/opencode/opencode.db` (SQLite) | id, title, directory, model, cost, tokens, time_created/updated |
| Claude Code | `~/.claude/projects/{project}/sessions-index.json` | sessionId, firstPrompt, summary, projectPath, gitBranch, created, modified, messageCount |
| Codex | `~/.codex/state_5.sqlite` (SQLite) | id, title, cwd, model, tokens_used, first_user_message, created_at, updated_at |

**统一数据模型：**

```sql
CREATE TABLE unified_session (
  id TEXT PRIMARY KEY,           -- {tool}:{original_id}
  tool TEXT NOT NULL,            -- opencode / claude / codex
  original_id TEXT NOT NULL,
  project_path TEXT,
  project_name TEXT,             -- 路径最后一段
  title TEXT,                    -- firstPrompt / first_user_message / title
  summary TEXT,
  model TEXT,
  message_count INTEGER DEFAULT 0,
  tokens_total INTEGER DEFAULT 0,
  cost REAL DEFAULT 0,
  git_branch TEXT,
  created_at INTEGER,
  updated_at INTEGER,
  is_active INTEGER DEFAULT 0,
  starred INTEGER DEFAULT 0,
  tags TEXT,                     -- JSON array
  indexed_at INTEGER
);

CREATE TABLE session_message_preview (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES unified_session(id),
  role TEXT NOT NULL,            -- user / assistant
  content_preview TEXT,          -- 前 300 字
  seq INTEGER,
  timestamp INTEGER
);

CREATE VIRTUAL TABLE session_search USING fts5(
  id, title, summary, project_name, content,
  content=session_search_content
);
```

**扫描策略：**
- 应用启动时扫描一次
- 每 5 分钟增量扫描（对比 updated_at 判断是否需要更新）
- 手动刷新按钮

### F2: Session 列表与搜索

**主界面布局：**

```
┌──────────┬───────────────────────────────────┐
│ 侧边栏    │  主区域                            │
│          │                                   │
│ [搜索框]  │  Session 列表                     │
│          │  ┌─────────────────────────────┐  │
│ 项目      │  │ 🟢 opencode · 2分钟前       │  │
│ · 全部    │  │ 修复登录 webhook handler     │  │
│ · OCoder │  │ OCoder · main · 12条消息     │  │
│ · OMSys  │  │ [▶ 恢复] [⭐]               │  │
│ · ...    │  ├─────────────────────────────┤  │
│          │  │ ⚪ claude · 昨天             │  │
│ 工具      │  │ 添加日志功能                 │  │
│ · 全部    │  │ OCoder · dev · 8条消息       │  │
│ · open   │  │ [▶ 恢复] [⭐]               │  │
│ · claude │  └─────────────────────────────┘  │
│ · codex  │                                   │
│          │                                   │
│ 状态      │                                   │
│ · 活跃    │                                   │
│ · 收藏    │                                   │
└──────────┴───────────────────────────────────┘
```

**功能点：**
- 默认按 updated_at 降序排列
- 侧边栏按项目/工具/状态筛选（可叠加）
- 顶部搜索框：全文搜索 title + summary + firstPrompt
- 每个 session 卡片显示：工具图标、时间（相对时间+绝对时间）、标题、项目名、git branch、消息数、token/cost
- 活跃 session（最近 1 小时内有更新）带绿色标记
- 点击卡片展开/折叠消息预览（最近 5 条）

### F3: 内嵌终端 (xterm.js)

**核心功能：**
- 点击 session 的 "▶ 恢复" 按钮，在界面下方（或新 Tab）打开终端
- 自动执行：`cd {project_path} && {tool} resume {session_id}`
- 支持多 Tab，可同时运行多个 agent
- 完整的终端体验：256 色、快捷键、复制粘贴

**Resume 命令映射：**

| 工具 | 命令 |
|---|---|
| opencode | `opencode resume {original_id}` |
| Claude Code | `claude --resume {original_id}` |
| Codex | `codex --resume {original_id}` |

### F4: 收藏与标签

- 点击 ⭐ 收藏 session
- 自定义标签（输入框 + tag pills）
- 筛选器支持按标签过滤

---

## V2 功能（后续迭代）

- 半自动任务归组（AI 建议合并相关 session，用户确认）
- Session 详情页（完整对话浏览）
- Token/Cost 统计仪表盘
- `cd` 项目目录时自动弹出相关 session（需集成到 shell）
- 每日工作报告生成

---

## 技术架构

```
Electron App
├── Main Process (Node.js)
│   ├── SQLite (better-sqlite3) — 统一索引数据库
│   ├── Indexer — 扫描各工具 session 数据
│   ├── IPC Handlers — 暴露给渲染进程的 API
│   └── PTY Manager (node-pty) — 管理终端进程
│
├── Renderer Process (React + TypeScript + Vite)
│   ├── UI 组件
│   │   ├── Sidebar — 项目/工具/状态筛选
│   │   ├── SessionList — session 卡片列表
│   │   ├── SearchBar — 全文搜索
│   │   ├── SessionDetail — 消息预览
│   │   ├── TerminalTabs — xterm.js 多终端
│   │   └── TagManager — 标签管理
│   └── State (Zustand)
│
└── Preload (contextBridge)
    └── 暴露 IPC 方法给渲染进程
```

**依赖：**
- electron + electron-builder
- react + typescript + vite (electron-vite)
- better-sqlite3
- node-pty
- xterm.js + @xterm/addon-fit + @xterm/addon-web-links
- zustand
- tailwindcss

---

## 数据流

```
1. 启动 → Indexer 扫描 → 写入 SQLite
2. 渲染进程通过 IPC 查询 → 展示列表
3. 用户点击恢复 → IPC → 主进程 spawn PTY
4. PTY 数据通过 IPC → 渲染进程写入 xterm
5. xterm 用户输入通过 IPC → 主进程写入 PTY
```

---

## 文件结构

```
SessionManager/
├── PRD.md
├── package.json
├── electron.vite.config.ts
├── tsconfig.json
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── index.ts             # 入口
│   │   ├── indexer/             # Session 索引引擎
│   │   │   ├── index.ts         # Indexer 主类
│   │   │   ├── opencode.ts      # opencode 数据源
│   │   │   ├── claude.ts        # Claude Code 数据源
│   │   │   └── codex.ts         # Codex 数据源
│   │   ├── database.ts          # SQLite 操作
│   │   ├── pty-manager.ts       # 终端进程管理
│   │   └── ipc-handlers.ts      # IPC 接口
│   ├── preload/
│   │   └── index.ts             # contextBridge
│   └── renderer/                # React 前端
│       ├── index.html
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/
│       ├── stores/
│       └── styles/
└── resources/                   # Electron 打包资源
    └── icon.png
```

---

## 非功能需求

- 启动时间 < 2 秒
- 索引 500 个 session < 3 秒
- 搜索响应 < 100ms
- 内存占用 < 200MB（不含终端进程）
- 仅支持 macOS（V1）
