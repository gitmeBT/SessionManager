import { create } from 'zustand'
import { UnifiedSession, ToolFilter, StatusFilter, TerminalTab } from '../../shared/types'
import { Lang } from '../lib/i18n'

export interface ChatMessage {
  role: 'user' | 'assistant'
  type: 'text' | 'tool'
  content: string
  toolName?: string
  timestamp: number | null
}

declare global {
  interface Window {
    api: {
      getSessions: (filter: unknown) => Promise<UnifiedSession[]>
      getMessagePreviews: (sessionId: string) => Promise<unknown[]>
      getProjectNames: () => Promise<string[]>
      getSessionCount: () => Promise<number>
      getCounts: () => Promise<{ byTool: Record<string, number>; byProject: Record<string, number>; total: number; active: number; starred: number; pinned: number; archived: number }>
      openInFinder: (projectName: string) => Promise<void>
      listProjectFiles: (projectName: string) => Promise<Array<{ name: string; isDir: boolean }>>
      toggleStar: (sessionId: string) => Promise<number>
      toggleArchive: (sessionId: string) => Promise<number>
      togglePin: (sessionId: string) => Promise<number>
      deleteSession: (sessionId: string) => Promise<boolean>
      updateTags: (sessionId: string, tags: string) => Promise<void>
      refreshIndex: () => Promise<boolean>
      getSessionMessages: (session: UnifiedSession) => Promise<ChatMessage[]>
      resumeSession: (session: UnifiedSession) => Promise<{ tabId: string; command: string }>
      openSystemTerminal: (command: string, cwd?: string, terminalApp?: string) => Promise<boolean>
      spawnTerminal: (cwd?: string) => Promise<string>
      ptyWrite: (tabId: string, data: string) => void
      ptyResize: (tabId: string, cols: number, rows: number) => void
      ptyKill: (tabId: string) => Promise<void>
      onPtyData: (cb: (data: { tabId: string; data: string }) => void) => () => void
      onPtyExit: (cb: (data: { tabId: string; exitCode: number }) => void) => () => void
    }
  }
}

interface AppState {
  sessions: UnifiedSession[]
  projectNames: string[]
  selectedTool: ToolFilter
  selectedProject: string
  selectedStatus: StatusFilter
  searchQuery: string
  detailSession: UnifiedSession | null
  detailMessages: ChatMessage[]
  detailLoading: boolean
  counts: { byTool: Record<string, number>; byProject: Record<string, number>; total: number; active: number; starred: number; pinned: number; archived: number }
  loading: boolean
  sortBy: string
  terminalTabs: TerminalTab[]
  activeTabId: string | null
  showTerminal: boolean
  expandedProject: string | null
  projectFiles: Record<string, Array<{ name: string; isDir: boolean }>>
  terminalFullscreen: boolean
  theme: 'dark' | 'light'
  resumeAction: 'system' | 'builtin'
  terminalApp: string
  showSettings: boolean
  confirmDialog: { message: string; onConfirm: () => void } | null
  language: Lang

  loadSessions: () => Promise<void>
  loadProjectNames: () => Promise<void>
  setFilter: (key: string, value: string) => void
  setSearch: (query: string) => void
  openDetail: (session: UnifiedSession) => void
  closeDetail: () => void
  setSortBy: (sort: string) => void
  toggleStar: (sessionId: string) => Promise<void>
  toggleArchive: (sessionId: string) => Promise<void>
  togglePin: (sessionId: string) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  resumeSession: (session: UnifiedSession) => Promise<void>
  spawnTerminal: () => Promise<void>
  closeTab: (tabId: string) => Promise<void>
  setActiveTab: (tabId: string) => void
  toggleProjectExpand: (projectName: string) => void
  setTerminalFullscreen: (v: boolean) => void
  toggleTheme: () => void
  setResumeAction: (v: 'system' | 'builtin') => void
  setTerminalApp: (v: string) => void
  setShowSettings: (v: boolean) => void
  setConfirmDialog: (v: { message: string; onConfirm: () => void } | null) => void
  confirm: (message: string) => Promise<boolean>
  setLanguage: (v: Lang) => void
}

export const useStore = create<AppState>((set, get) => ({
  sessions: [],
  projectNames: [],
  selectedTool: 'all',
  selectedProject: 'all',
  selectedStatus: 'all',
  searchQuery: '',
  detailSession: null,
  detailMessages: [],
  detailLoading: false,
  counts: { byTool: {}, byProject: {}, total: 0, active: 0, starred: 0, pinned: 0, archived: 0 },
  loading: false,
  sortBy: 'updatedAt',
  terminalTabs: [],
  activeTabId: null,
  showTerminal: false,
  expandedProject: null,
  projectFiles: {},
  terminalFullscreen: false,
  theme: (localStorage.getItem('theme') as 'dark' | 'light') || 'dark',
  resumeAction: (localStorage.getItem('resumeAction') as 'system' | 'builtin') || 'system',
  terminalApp: localStorage.getItem('terminalApp') || '',
  showSettings: false,
  confirmDialog: null,
  language: (localStorage.getItem('language') as Lang) || 'en',

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    set({ theme: next })
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
  },

  loadSessions: async () => {
    set({ loading: true })
    const { selectedTool, selectedProject, selectedStatus, searchQuery } = get()
    const sessions = await window.api.getSessions({
      tool: selectedTool,
      projectName: selectedProject,
      status: selectedStatus,
      search: searchQuery || undefined
    })
    set({ sessions, loading: false })
  },

  loadProjectNames: async () => {
    const names = await window.api.getProjectNames()
    const counts = await window.api.getCounts()
    set({ projectNames: names, counts: { ...counts, pinned: counts.pinned || 0, archived: counts.archived || 0 } })
  },

  setFilter: async (key: string, value: string) => {
    set({ [key]: value } as Partial<AppState>)
    get().loadSessions()
  },

  setSearch: (query: string) => {
    set({ searchQuery: query })
  },

  openDetail: async (session: UnifiedSession) => {
    set({ detailSession: session, detailMessages: [], detailLoading: true })
    try {
      const messages = await window.api.getSessionMessages(session)
      if (get().detailSession?.id !== session.id) return
      set({ detailMessages: messages, detailLoading: false })
    } catch {
      set({ detailLoading: false })
    }
  },

  closeDetail: () => {
    set({ detailSession: null, detailMessages: [] })
  },

  setSortBy: (sort: string) => {
    set({ sortBy: sort })
  },

  toggleStar: async (sessionId: string) => {
    await window.api.toggleStar(sessionId)
    const sessions = get().sessions.map(s =>
      s.id === sessionId ? { ...s, starred: s.starred ? 0 : 1 } : s
    )
    const detailSession = get().detailSession
    set({
      sessions,
      detailSession: detailSession?.id === sessionId
        ? { ...detailSession, starred: detailSession.starred ? 0 : 1 }
        : detailSession
    })
  },

  toggleArchive: async (sessionId: string) => {
    await window.api.toggleArchive(sessionId)
    await get().loadSessions()
    await get().loadProjectNames()
    if (get().detailSession?.id === sessionId) {
      set({ detailSession: null, detailMessages: [] })
    }
  },

  togglePin: async (sessionId: string) => {
    await window.api.togglePin(sessionId)
    const sessions = get().sessions.map(s =>
      s.id === sessionId ? { ...s, pinned: s.pinned ? 0 : 1 } : s
    )
    const detailSession = get().detailSession
    set({
      sessions,
      detailSession: detailSession?.id === sessionId
        ? { ...detailSession, pinned: detailSession.pinned ? 0 : 1 }
        : detailSession
    })
    await get().loadProjectNames()
  },

  deleteSession: async (sessionId: string) => {
    await window.api.deleteSession(sessionId)
    await get().loadSessions()
    await get().loadProjectNames()
    if (get().detailSession?.id === sessionId) {
      set({ detailSession: null, detailMessages: [] })
    }
  },

  resumeSession: async (session: UnifiedSession) => {
    const { terminalTabs } = get()
    const result = await window.api.resumeSession(session)
    const newTab: TerminalTab = {
      id: result.tabId,
      sessionId: session.id,
      tool: session.tool,
      projectPath: session.projectPath || '~',
      title: session.title || 'Terminal',
      active: true
    }
    const updatedTabs = terminalTabs.map(t => ({ ...t, active: false })).concat(newTab)
    set({ terminalTabs: updatedTabs, activeTabId: newTab.id, showTerminal: true })
  },

  spawnTerminal: async () => {
    const { terminalTabs } = get()
    const tabId = await window.api.spawnTerminal()
    const newTab: TerminalTab = {
      id: tabId,
      sessionId: '',
      tool: '',
      projectPath: '~',
      title: 'Terminal',
      active: true
    }
    const updatedTabs = terminalTabs.map(t => ({ ...t, active: false })).concat(newTab)
    set({ terminalTabs: updatedTabs, activeTabId: newTab.id, showTerminal: true })
  },

  closeTab: async (tabId: string) => {
    await window.api.ptyKill(tabId)
    const { terminalTabs, activeTabId } = get()
    const newTabs = terminalTabs.filter(t => t.id !== tabId)
    const newActive = activeTabId === tabId
      ? (newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null)
      : activeTabId
    set({ terminalTabs: newTabs, activeTabId: newActive, showTerminal: newTabs.length > 0 })
  },

  setActiveTab: (tabId: string) => {
    const { terminalTabs } = get()
    set({
      activeTabId: tabId,
      terminalTabs: terminalTabs.map(t => ({ ...t, active: t.id === tabId }))
    })
  },

  toggleProjectExpand: async (projectName: string) => {
    const { expandedProject, projectFiles } = get()
    if (expandedProject === projectName) {
      set({ expandedProject: null })
      return
    }
    if (!projectFiles[projectName]) {
      const files = await window.api.listProjectFiles(projectName)
      set({ projectFiles: { ...projectFiles, [projectName]: files } })
    }
    set({ expandedProject: projectName })
  },

  setTerminalFullscreen: (v: boolean) => {
    set({ terminalFullscreen: v })
  },

  setResumeAction: (v: 'system' | 'builtin') => {
    set({ resumeAction: v })
    localStorage.setItem('resumeAction', v)
  },

  setTerminalApp: (v: string) => {
    set({ terminalApp: v })
    localStorage.setItem('terminalApp', v)
  },

  setShowSettings: (v: boolean) => {
    set({ showSettings: v })
  },

  setConfirmDialog: (v) => {
    set({ confirmDialog: v })
  },

  confirm: (message: string) => {
    return new Promise<boolean>((resolve) => {
      set({
        confirmDialog: {
          message,
          onConfirm: () => { set({ confirmDialog: null }); resolve(true) }
        }
      })
    })
  },

  setLanguage: (v: Lang) => {
    set({ language: v })
    localStorage.setItem('language', v)
  }
}))
