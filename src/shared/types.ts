export interface UnifiedSession {
  id: string
  tool: 'opencode' | 'claude' | 'codex'
  originalId: string
  projectPath: string | null
  projectName: string | null
  title: string | null
  summary: string | null
  model: string | null
  messageCount: number
  tokensTotal: number
  cost: number
  gitBranch: string | null
  createdAt: number | null
  updatedAt: number | null
  isActive: number
  starred: number
  tags: string | null
}

export interface SessionMessagePreview {
  id: number
  sessionId: string
  role: 'user' | 'assistant'
  contentPreview: string | null
  seq: number
  timestamp: number | null
}

export interface TerminalTab {
  id: string
  sessionId: string
  tool: string
  projectPath: string
  title: string
  active: boolean
}

export type ToolFilter = 'all' | 'opencode' | 'claude' | 'codex'
export type StatusFilter = 'all' | 'active' | 'starred'
