# SessionManager vs cc-switch — 多维度 UI 对比

> 对比日期：2025-05-21
> 对比项目：SessionManager（本地） vs [cc-switch](https://github.com/farion1231/cc-switch)

---

## 1. 框架 & 构建工具

| 维度 | SessionManager | cc-switch |
|---|---|---|
| 桌面框架 | **Electron 36** (Chromium 内核, ~150MB+) | **Tauri 2.8** (系统 WebView, ~10MB) |
| 前端框架 | React 19 + Zustand 5 | React 18 + TanStack Query 5 |
| 构建工具 | electron-vite 3 | Vite 7 |

**影响：** Tauri 的原生窗口渲染让 cc-switch 在窗口拖拽、resize、启动速度上天然更流畅。Electron 的 Chromium 层带来额外开销，窗口动画和过渡会有微小卡顿感。

---

## 2. CSS 方案

| 维度 | SessionManager | cc-switch |
|---|---|---|
| CSS 框架 | Tailwind 4 **已安装但未使用** | Tailwind 3 **全面使用** |
| 实际写法 | 全部 `style={{}}` 行内样式 | `className` + `cn()` 工具函数 |
| 变量格式 | Hex 色值 `#1a1a2e` | HSL 色值 `240 5% 12%` (shadcn 规范) |

**关键差距：** 行内样式的问题在于——无法使用伪类（`:hover`、`:focus`、`:active`）、无法使用媒体查询、无法做 class 条件组合。cc-switch 用 `cn()` (clsx + tailwind-merge) 轻松实现条件样式切换，代码也更简洁。

SessionManager 的 `index.css` 已经定义了完整的 CSS 变量体系，但组件里没用到 Tailwind class，等于这套设计 token 被浪费了。

---

## 3. 组件库 & UI 原语

| 维度 | SessionManager | cc-switch |
|---|---|---|
| 组件库 | **无** — 全部手写 | **shadcn/ui** (Radix UI 原语) |
| 弹窗/对话框 | 自定义实现 | Radix Dialog (无障碍访问 + 动画) |
| 下拉菜单 | 自定义实现 | Radix DropdownMenu |
| 滚动区域 | 原生 div | Radix ScrollArea |
| 工具提示 | 无 | Radix Tooltip |
| 命令面板 | 无 | cmdk |
| Toast 通知 | 无 | sonner |
| 表单 | 无 | react-hook-form + zod |

**影响：** shadcn/ui 提供了开箱即用的无障碍支持（键盘导航、焦点管理、ARIA 属性）和精细的动画。手写组件要达到同样质量需要大量额外工作。

---

## 4. 动画系统

| 维度 | SessionManager | cc-switch |
|---|---|---|
| 动画库 | **无** | **framer-motion** |
| 视图切换 | CSS `@keyframes` (280ms translateX 60px) | `AnimatePresence` + `motion.div` |
| 主题切换 | 无动画 | `::view-transition` 圆形扩展动画 |
| 上下文菜单 | CSS `@keyframes` (150ms scale) | framer-motion |
| 列表排序 | 无 | dnd-kit (拖拽排序动画) |

**这是"流畅度"差距的最大来源。** framer-motion 的 `AnimatePresence` 能自动处理组件挂载/卸载的过渡动画，退出动画、布局动画（layout animation）都是声明式的。CSS keyframes 只能处理固定路径的动画，无法做到元素自动归位、列表重排等效果。

---

## 5. 视觉效果 & 设计语言

| 维度 | SessionManager | cc-switch |
|---|---|---|
| 风格 | **扁平实色** — 纯色块 + 边框 | **玻璃拟态 (Glass Morphism)** — 模糊 + 半透明 |
| 卡片背景 | 实色 `#1e2a4a` | `backdrop-filter: blur(20px)` + 渐变边框 |
| 滚动条 | 半透明滚动条 (hover 显示) | 完全隐藏滚动条 |
| 阴影 | 无 | `shadow-lg shadow-orange-500/30` (带色彩的阴影) |
| 边框 | 实线 `#2a2a4a` | 渐变边框 + hover 发光效果 |
| 圆角 | 不统一 | 统一 `rounded-xl` / `rounded-full` |

**视觉差距的本质：** SessionManager 的设计是"功能性 UI"——能看到信息，但没有视觉层次。cc-switch 通过毛玻璃、带色彩的阴影、渐变边框营造了**空间感和层次感**，这是让人觉得"舒服"的核心原因。

---

## 6. 图标系统

| 维度 | SessionManager | cc-switch |
|---|---|---|
| 图标方案 | 内联 SVG / 无图标 | **lucide-react** (200+ 图标) |
| 按钮样式 | 纯文字 / 简单色块 | 图标 + 圆形按钮 + hover 动效 |

---

## 7. 总结：为什么 cc-switch 看起来更舒服

三个核心原因：

1. **动画层** — framer-motion 带来了丝滑的页面切换、列表动画、退出动画，这是"流畅度"的直接来源
2. **视觉层次** — 毛玻璃 + HSL 色彩体系 + 带色彩阴影，让界面有纵深感和呼吸感，不再是扁平色块堆叠
3. **设计一致性** — Tailwind utilities + cn() + shadcn/ui 确保了间距、圆角、颜色的全局统一

---

## 8. 改进建议（优先级排序）

| 优先级 | 改动 | 收益 | 工作量 |
|---|---|---|---|
| **P0** | 启用 Tailwind — 把行内样式迁移到 className | 打开整个 Tailwind 生态，统一设计语言 | 中（逐组件迁移） |
| **P0** | 引入 **framer-motion**，用 `AnimatePresence` 替换 CSS keyframes | 直接提升流畅度 | 小（API 简单） |
| **P1** | 引入 **lucide-react** 图标库 | 按钮和操作更直观 | 小 |
| **P1** | CSS 变量改 HSL 格式，加入毛玻璃效果 | 视觉层次感大幅提升 | 小 |
| **P2** | 引入 **shadcn/ui** 组件库 | Dialog/Menu/Toast 等开箱即用 | 中 |
| **P2** | 引入 **sonner** 做 Toast 通知 | 操作反馈 | 小 |
