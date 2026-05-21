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
| Claude Code | `~/.claude/projects/{encoded-path}/{uuid}.jsonl` | sessionId (filename), firstPrompt, projectPath (dir name), created/modified |
| Codex | `~/.codex/state_5.sqlite` (SQLite) | id, title, cwd, model, tokens_used, archived, archived_at, created_at, updated_at |

**统一数据模型：**

```sql
CREATE TABLE unified_session (
  id TEXT PRIMARY KEY,           -- {tool}:{original_id}
  tool TEXT NOT NULL,            -- opencode / claude / codex
  original_id TEXT NOT NULL,
  project_path TEXT,
  project_name TEXT,             -- 路径最后一段
  title TEXT,
  summary TEXT,
  model TEXT,
  message_count INTEGER DEFAULT 0,
  tokens_total INTEGER DEFAULT 0,
  cost REAL DEFAULT 0,
  git_branch TEXT,
  created_at INTEGER,            -- Unix seconds
  updated_at INTEGER,            -- Unix seconds
  is_active INTEGER DEFAULT 0,
  starred INTEGER DEFAULT 0,
  archived INTEGER DEFAULT 0,    -- 归档标记（索引层）
  pinned INTEGER DEFAULT 0,      -- 置顶标记（索引层）
  tags TEXT,                     -- JSON array
  indexed_at INTEGER
);

CREATE TABLE session_message_preview (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES unified_session(id),
  role TEXT NOT NULL,            -- user / assistant
  content_preview TEXT,
  seq INTEGER,
  timestamp INTEGER
);

CREATE VIRTUAL TABLE session_fts USING fts5(
  id, title, summary, project_name,
  content=unified_session,
  content_rowid=rowid
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
│ Tool      │  [搜索框]  [Updated|Created|...]   │
│ · All     │                                   │
│ · OpenCode│  Today ─────────────────── 5      │
│ · Claude  │  ┌─────────────────────────────┐  │
│ · Codex   │  │ 📌 修复登录 webhook handler  │  │
│          │  │ OCoder · 12条消息 · 50k tok  │  │
│ Project   │  │                   [Resume ▶] │  │
│ · All     │  ├─────────────────────────────┤  │
│ · OCoder  │  │ 🟢 添加日志功能              │  │
│ · ...    │  │ ...                          │  │
│          │  └─────────────────────────────┘  │
│ Status    │                                   │
│ · All     │  Past Week ──────────────── 12    │
│ · Active  │  ...                              │
│ · Starred │                                   │
│ · Pinned  │                                   │
│ · Archived│                                   │
└──────────┴───────────────────────────────────┘
```

**功能点：**
- 时间分组：Today / Past Week / Past Month / Older，带 sticky header
- Pinned session 置顶显示，带 📌 标记
- 侧边栏按 Tool / Project / Status 筛选（可叠加）
- 顶部搜索框：全文搜索 title + summary + project_name（FTS5）
- 客户端排序：Updated / Created / Rounds / Tokens / Cost
- 每个 session 卡片：工具图标、标题、项目名、时间、消息数、token/cost
- 右键上下文菜单：Pin/Unpin、Star/Unstar、Archive、Delete（自定义确认弹窗）
- 点击卡片进入 session 详情页（带滑入动画）

### F3: Session 详情页

**功能点：**
- 完整对话浏览：User/AI 消息气泡 + Tool Call 标记
- 消息超长自动截断，"Show all" 展开按钮
- 标题栏：← Back、工具图标、标题、Star/Pin/Archive/Delete（SVG 图标按钮）、▶ Resume
- 元数据 pills：项目名、模型、git branch、消息数、token、cost
- 滑入/滑出动画（280ms cubic-bezier）

### F4: 内嵌终端 (xterm.js)

**核心功能：**
- 支持内置终端（xterm.js + node-pty）和系统终端两种 resume 方式
- 系统终端：生成 temp .command 文件，支持指定终端应用（Warp/iTerm2/Terminal.app 等）
- 内置终端：多 Tab，xterm.js 渲染，主题跟随 dark/light 切换
- 全屏模式（Esc 退出）

**Resume 命令映射：**

| 工具 | 命令 |
|---|---|
| opencode | `opencode --session {original_id} "{project_path}"` |
| Claude Code | `claude --resume {original_id}` |
| Codex | `codex --resume {original_id}` |

### F5: Session 管理

- **Pin/Unpin**：置顶 session，排序始终在最前（通过右键菜单或详情页按钮）
- **Star/Unstar**：收藏 session
- **Archive**：从主列表隐藏（标记 `archived=1`，可在 Archived 筛选器中查看）
- **Delete**：从索引 DB 中删除（原始数据不受影响）
- **自定义确认弹窗**：Archive/Delete 操作使用应用内弹窗，不使用系统原生 confirm()

### F6: 设置

- Dark/Light 主题切换
- Resume 行为：System Terminal / Built-in
- 终端应用选择：Warp / iTerm2 / Terminal.app / Alacritty / Hyper / kitty
- 设置持久化在 localStorage

---

## V1.1 UI 品质升级

基于与 [cc-switch](https://github.com/farion1231/cc-switch) 的对比分析（详见 `docs/ui-comparison-cc-switch.md`），对 V1 的 UI 进行品质升级，目标是达到同等水平的视觉层次感和交互流畅度。

### U1: 启用 Tailwind CSS + 迁移行内样式

将所有 `style={{}}` 行内样式迁移为 Tailwind className，利用已有的 CSS 变量体系。引入 `cn()` 工具函数（clsx + tailwind-merge）实现条件样式组合。

### U2: 引入 framer-motion 动画

- 用 `AnimatePresence` + `motion.div` 替换现有 CSS `@keyframes` 视图切换动画
- 为列表项、卡片、弹窗添加 mount/unmount 过渡动画
- 为交互元素添加 hover/press 微动效

### U3: 视觉效果升级

- CSS 变量从 Hex 迁移到 HSL 格式（便于透明度调节）
- 卡片/面板加入毛玻璃效果（`backdrop-filter: blur`）
- 添加带色彩的阴影（如 `shadow-{color}/30`）
- 统一圆角规范（`rounded-xl` 卡片，`rounded-full` 按钮）
- 边框改用半透明/渐变样式

### U4: 引入 lucide-react 图标库

替换所有内联 SVG 和 emoji 图标为 lucide-react 组件，统一图标风格。

### U5: 引入 shadcn/ui 组件库（按需）

优先引入高频使用的组件：
- Dialog（替换自定义确认弹窗）
- DropdownMenu（替换自定义右键菜单）
- Tooltip（操作提示）
- sonner（Toast 通知，替代当前无反馈状态）

### 技术依赖新增

```
framer-motion
lucide-react
clsx
tailwind-merge
@radix-ui/react-dialog
@radix-ui/react-dropdown-menu
@radix-ui/react-tooltip
sonner
class-variance-authority
```

---

## V2 功能（后续迭代）

- 半自动任务归组（AI 建议合并相关 session，用户确认）
- Token/Cost 统计仪表盘
- `cd` 项目目录时自动弹出相关 session（需集成到 shell）
- 每日工作报告生成
- 自定义标签（输入框 + tag pills）与标签筛选
- 批量操作：多选 session 批量归档/删除

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
│   │   ├── Sidebar — Tool/Project/Status 筛选 + 计数
│   │   ├── SessionList — 搜索、排序、时间分组、右键菜单
│   │   ├── SessionDetail — 完整对话浏览、操作按钮
│   │   ├── TerminalPanel — xterm.js 多 Tab 终端
│   │   ├── SettingsModal — 主题、Resume 行为、终端应用
│   │   └── ConfirmModal — 自定义确认弹窗
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
│   │   ├── database.ts          # SQLite 操作 + 统一数据模型
│   │   ├── pty-manager.ts       # 终端进程管理
│   │   └── ipc-handlers.ts      # IPC 接口
│   ├── preload/
│   │   └── index.ts             # contextBridge
│   ├── renderer/                # React 前端
│   │   ├── App.tsx              # 根布局 + 视图切换动画
│   │   ├── components/
│   │   │   ├── Sidebar.tsx      # 侧边栏筛选
│   │   │   ├── SessionList.tsx  # 列表 + 右键菜单
│   │   │   ├── SessionDetail.tsx # 详情页
│   │   │   ├── TerminalPanel.tsx # 终端面板
│   │   │   ├── SettingsModal.tsx # 设置弹窗
│   │   │   └── ConfirmModal.tsx  # 确认弹窗
│   │   ├── stores/
│   │   │   └── useStore.ts      # Zustand 全局状态
│   │   └── styles/
│   │       └── index.css        # CSS 变量 + 动画
│   └── shared/
│       └── types.ts             # 共享类型定义
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
- 所有管理操作（Archive/Delete/Pin/Star）只影响索引 DB，不修改原始数据
- 重新索引时保留 archived/pinned 状态

## 各工具原生能力备注

| 功能 | opencode | Claude Code | Codex |
|---|---|---|---|
| 删除 | ✅ `opencode session delete <id>` | ❌ 手动删文件 | ❌ |
| 归档 | DB 有 `time_archived` 字段（TUI 未暴露） | ❌ | DB 有 `archived`/`archived_at` 字段 |
| Pin | ❌ | ❌ | ❌ |
| Star | ❌ | ❌ | ❌ |
| 列表 | ✅ `opencode session list` | ✅ `claude conversation list` | ❌ |
