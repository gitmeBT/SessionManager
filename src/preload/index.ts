import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getSessions: (filter: unknown) => ipcRenderer.invoke('get-sessions', filter),
  getMessagePreviews: (sessionId: string) => ipcRenderer.invoke('get-message-previews', sessionId),
  getProjectNames: () => ipcRenderer.invoke('get-project-names'),
  getSessionCount: () => ipcRenderer.invoke('get-session-count'),
  getCounts: () => ipcRenderer.invoke('get-counts'),
  listProjectFiles: (projectName: string) => ipcRenderer.invoke('list-project-files', projectName),
  toggleStar: (sessionId: string) => ipcRenderer.invoke('toggle-star', sessionId),
  toggleArchive: (sessionId: string) => ipcRenderer.invoke('toggle-archive', sessionId),
  togglePin: (sessionId: string) => ipcRenderer.invoke('toggle-pin', sessionId),
  deleteSession: (sessionId: string) => ipcRenderer.invoke('delete-session', sessionId),
  updateTags: (sessionId: string, tags: string) => ipcRenderer.invoke('update-tags', sessionId, tags),
  refreshIndex: () => ipcRenderer.invoke('refresh-index'),
  getSessionMessages: (session: unknown) => ipcRenderer.invoke('get-session-messages', session),

  resumeSession: (session: unknown) => ipcRenderer.invoke('resume-session', session),
  openSystemTerminal: (command: string, cwd?: string, terminalApp?: string) => ipcRenderer.invoke('open-system-terminal', command, cwd, terminalApp),
  spawnTerminal: (cwd?: string) => ipcRenderer.invoke('spawn-terminal', cwd),

  ptyWrite: (tabId: string, data: string) => ipcRenderer.send('pty-write', tabId, data),
  ptyResize: (tabId: string, cols: number, rows: number) => ipcRenderer.send('pty-resize', tabId, cols, rows),
  ptyKill: (tabId: string) => ipcRenderer.invoke('pty-kill', tabId),

  onPtyData: (cb: (data: { tabId: string; data: string }) => void) => {
    const handler = (_e: unknown, d: unknown) => cb(d as { tabId: string; data: string })
    ipcRenderer.on('pty-data', handler)
    return () => ipcRenderer.removeListener('pty-data', handler)
  },
  onPtyExit: (cb: (data: { tabId: string; exitCode: number }) => void) => {
    const handler = (_e: unknown, d: unknown) => cb(d as { tabId: string; exitCode: number })
    ipcRenderer.on('pty-exit', handler)
    return () => ipcRenderer.removeListener('pty-exit', handler)
  }
})
