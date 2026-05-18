import { UnifiedSession } from '../../shared/types'
import type { ChatMessage } from './opencode'
import { homedir } from 'os'
import { join } from 'path'
import { existsSync, readdirSync, statSync, readFileSync } from 'fs'

function projectDirToPath(dirName: string): string {
  return '/' + dirName.replace(/^-/, '').replace(/-/g, '/')
}

function extractProjectName(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith('/private/var/folders/') || path.startsWith('/var/folders/')) return null
  if (path.includes('/T/') && path.includes('cc-connect')) return null
  const parts = path.replace(/\/$/, '').split('/')
  return parts[parts.length - 1] || null
}

interface ClaudeSessionMeta {
  sessionId: string
  firstPrompt: string | null
  summary: string | null
  cwd: string | null
  gitBranch: string | null
  createdAt: string | null
  messageCount: number
}

function parseJsonlHead(filePath: string, maxLines = 200): ClaudeSessionMeta | null {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const lines = content.split('\n').slice(0, maxLines)

    let sessionId: string | null = null
    let firstPrompt: string | null = null
    let summary: string | null = null
    let cwd: string | null = null
    let gitBranch: string | null = null
    let createdAt: string | null = null
    let messageCount = 0

    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const obj = JSON.parse(line)

        if (obj.type === 'user' && !firstPrompt) {
          const content = obj.message?.content
          if (typeof content === 'string') {
            firstPrompt = content.slice(0, 500)
          } else if (Array.isArray(content)) {
            const textBlock = content.find((b: { type: string }) => b.type === 'text')
            if (textBlock?.text) firstPrompt = textBlock.text.slice(0, 500)
          }
          sessionId = obj.sessionId || null
          cwd = obj.cwd || null
          gitBranch = obj.gitBranch || null
          createdAt = obj.timestamp || null
        }

        if (obj.type === 'summary' && !summary) {
          summary = typeof obj.summary === 'string' ? obj.summary.slice(0, 500) : (obj.message || '').slice(0, 500)
        }

        if (obj.type === 'user' || obj.type === 'assistant') {
          messageCount++
        }
      } catch {}
    }

    if (!sessionId) {
      const match = filePath.match(/([0-9a-f-]{36})\.jsonl$/)
      sessionId = match ? match[1] : null
    }

    return { sessionId: sessionId!, firstPrompt, summary, cwd, gitBranch, createdAt, messageCount }
  } catch {
    return null
  }
}

export async function scanClaude(): Promise<UnifiedSession[]> {
  const projectsDir = join(homedir(), '.claude', 'projects')
  if (!existsSync(projectsDir)) return []

  const sessions: UnifiedSession[] = []
  const projectDirs = readdirSync(projectsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())

  for (const projDir of projectDirs) {
    const projectPath = projectDirToPath(projDir.name)
    const fullDir = join(projectsDir, projDir.name)

    let files: string[]
    try {
      files = readdirSync(fullDir)
    } catch { continue }

    const jsonlFiles = files.filter(f => f.endsWith('.jsonl'))

    for (const file of jsonlFiles) {
      const filePath = join(fullDir, file)
      let fileTime: number
      try {
        fileTime = Math.floor(statSync(filePath).mtimeMs / 1000)
      } catch { continue }

      const meta = parseJsonlHead(filePath)
      if (!meta || !meta.sessionId) continue

      const createdAt = meta.createdAt
        ? Math.floor(new Date(meta.createdAt).getTime() / 1000)
        : fileTime

      sessions.push({
        id: `claude:${meta.sessionId}`,
        tool: 'claude',
        originalId: meta.sessionId,
        projectPath: meta.cwd || projectPath,
        projectName: extractProjectName(meta.cwd || projectPath),
        title: meta.firstPrompt,
        summary: meta.summary,
        model: null,
        messageCount: meta.messageCount,
        tokensTotal: 0,
        cost: 0,
        gitBranch: meta.gitBranch || null,
        createdAt,
        updatedAt: fileTime,
        isActive: 0,
        starred: 0,
        tags: null
      })
    }
  }

  return sessions
}

export function getClaudeMessages(sessionId: string, projectPath: string | null): ChatMessage[] {
  const projectsDir = join(homedir(), '.claude', 'projects')
  if (!existsSync(projectsDir)) return []

  let jsonlPath: string | null = null
  const projectDirs = readdirSync(projectsDir, { withFileTypes: true }).filter(d => d.isDirectory())

  for (const projDir of projectDirs) {
    const candidate = join(projectsDir, projDir.name, `${sessionId}.jsonl`)
    if (existsSync(candidate)) {
      jsonlPath = candidate
      break
    }
  }

  if (!jsonlPath) return []

  const messages: ChatMessage[] = []
  try {
    const content = readFileSync(jsonlPath, 'utf-8')
    const lines = content.split('\n')

    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const obj = JSON.parse(line)
        if (obj.type !== 'user' && obj.type !== 'assistant') continue

        const msgContent = obj.message?.content
        if (!msgContent) continue

        const ts = obj.timestamp ? Math.floor(new Date(obj.timestamp).getTime() / 1000) : null
        const role = obj.type === 'user' ? 'user' : 'assistant'

        if (typeof msgContent === 'string') {
          const text = msgContent.trim()
          if (text) messages.push({ role, type: 'text', content: text, timestamp: ts })
        } else if (Array.isArray(msgContent)) {
          for (const block of msgContent) {
            if (block.type === 'text' && block.text?.trim()) {
              messages.push({ role, type: 'text', content: block.text.trim(), timestamp: ts })
            } else if (block.type === 'tool_use') {
              const toolName = block.name || 'tool'
              const input = block.input ? JSON.stringify(block.input, null, 2).trim() : ''
              if (input) {
                messages.push({ role: 'assistant', type: 'tool', content: input, toolName, timestamp: ts })
              }
            }
          }
        }
      } catch {}
    }
  } catch {}

  return messages
}

export function getClaudeResumeCmd(originalId: string, projectPath: string): string {
  return `cd "${projectPath}" && claude --resume ${originalId}`
}
