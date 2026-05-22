import { ipcMain, BrowserWindow, shell } from 'electron'
import { DatabaseManager } from './database'
import { Indexer } from './indexer'
import { PtyManager } from './pty-manager'
import { UnifiedSession } from '../shared/types'
import { getOpencodeMessages } from './indexer/opencode'
import { getClaudeMessages } from './indexer/claude'
import { getCodexMessages } from './indexer/codex'

export function registerIpcHandlers(
  db: DatabaseManager,
  indexer: Indexer,
  ptyManager: PtyManager,
  mainWindowRef: { current: BrowserWindow | null }
) {
  ipcMain.handle('get-sessions', async (_e, filter) => {
    return db.getSessions(filter)
  })

  ipcMain.handle('get-message-previews', async (_e, sessionId) => {
    return db.getMessagePreviews(sessionId)
  })

  ipcMain.handle('get-project-names', async () => {
    return db.getProjectNames()
  })

  ipcMain.handle('get-session-count', async () => {
    return db.getSessionCount()
  })

  ipcMain.handle('get-counts', async () => {
    return { ...db.getCounts(), ...db.getStatusCounts() }
  })

  ipcMain.handle('open-in-finder', async (_e, projectName: string) => {
    const path = db.getProjectPath(projectName)
    if (path) shell.showItemInFolder(path)
  })

  ipcMain.handle('list-project-files', async (_e, projectName: string) => {
    const path = db.getProjectPath(projectName)
    if (!path) return []
    try {
      const fs = await import('fs')
      const entries = fs.readdirSync(path, { withFileTypes: true })
      return entries
        .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules')
        .slice(0, 50)
        .map(e => ({ name: e.name, isDir: e.isDirectory() }))
    } catch {
      return []
    }
  })

  ipcMain.handle('toggle-star', async (_e, sessionId) => {
    return db.toggleStar(sessionId)
  })

  ipcMain.handle('toggle-archive', async (_e, sessionId) => {
    return db.toggleArchive(sessionId)
  })

  ipcMain.handle('toggle-pin', async (_e, sessionId) => {
    return db.togglePin(sessionId)
  })

  ipcMain.handle('delete-session', async (_e, sessionId) => {
    db.deleteSession(sessionId)
    return true
  })

  ipcMain.handle('update-tags', async (_e, sessionId, tags) => {
    db.updateTags(sessionId, tags)
  })

  ipcMain.handle('get-session-messages', async (_e, session: UnifiedSession) => {
    try {
      if (session.tool === 'opencode') {
        return getOpencodeMessages(session.originalId)
      } else if (session.tool === 'claude') {
        return getClaudeMessages(session.originalId, session.projectPath)
      } else if (session.tool === 'codex') {
        return getCodexMessages(session.originalId)
      }
    } catch (e) {
      console.error('[IPC] get-session-messages failed:', e)
    }
    return []
  })

  ipcMain.handle('refresh-index', async () => {
    await indexer.indexAll()
    return true
  })

  ipcMain.handle('resume-session', async (_e, session: UnifiedSession) => {
    const tabId = `pty-${Date.now()}`
    const cwd = session.projectPath || process.env.HOME || '/'

    ptyManager.spawn(tabId, cwd)

    let command = ''
    if (session.tool === 'opencode') {
      command = `opencode --session ${session.originalId} "${cwd}"`
    } else if (session.tool === 'claude') {
      command = `claude --resume ${session.originalId}`
    } else if (session.tool === 'codex') {
      command = `codex --resume ${session.originalId}`
    }

    if (command) {
      setTimeout(() => {
        ptyManager.sendCommand(tabId, command)
      }, 800)
    }

    return { tabId, command }
  })

  ipcMain.handle('spawn-terminal', async (_e, cwd?: string) => {
    const tabId = `pty-${Date.now()}`
    ptyManager.spawn(tabId, cwd || process.env.HOME || '/')
    return tabId
  })

  ipcMain.handle('open-system-terminal', async (_e, command: string, cwd?: string, terminalApp?: string) => {
    const fs = await import('fs')
    const path = await import('path')
    const os = await import('os')
    const { exec } = await import('child_process')
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sm-resume-'))
    const scriptPath = path.join(tmpDir, 'resume.command')
    const workDir = cwd || process.env.HOME || '/'
    fs.writeFileSync(scriptPath, `#!/bin/bash\ncd "${workDir}"\n${command}\n`)
    fs.chmodSync(scriptPath, 0o755)

    if (terminalApp) {
      exec(`open -a "${terminalApp}" "${scriptPath}"`)
    } else {
      shell.openPath(scriptPath)
    }

    setTimeout(() => {
      try { fs.rmSync(tmpDir, { recursive: true }) } catch {}
    }, 10000)
    return true
  })

  ipcMain.on('pty-write', (_e, tabId: string, data: string) => {
    ptyManager.write(tabId, data)
  })

  ipcMain.on('pty-resize', (_e, tabId: string, cols: number, rows: number) => {
    ptyManager.resize(tabId, cols, rows)
  })

  ipcMain.handle('pty-kill', async (_e, tabId: string) => {
    ptyManager.kill(tabId)
  })

  ptyManager.on('data', ({ tabId, data }) => {
    mainWindowRef.current?.webContents.send('pty-data', { tabId, data })
  })

  ptyManager.on('exit', ({ tabId, exitCode }) => {
    mainWindowRef.current?.webContents.send('pty-exit', { tabId, exitCode })
  })
}
