import Database from 'better-sqlite3'
import { UnifiedSession, SessionMessagePreview } from '../../shared/types'
import { homedir } from 'os'
import { join } from 'path'
import { existsSync } from 'fs'

function extractProjectName(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith('/private/var/folders/') || path.startsWith('/var/folders/')) return null
  const parts = path.replace(/\/$/, '').split('/')
  return parts[parts.length - 1] || null
}

export async function scanOpencode(): Promise<UnifiedSession[]> {
  const dbPath = join(homedir(), '.local', 'share', 'opencode', 'opencode.db')
  if (!existsSync(dbPath)) return []

  const openCodeDb = new Database(dbPath, { readonly: true })
  const sessions: UnifiedSession[] = []

  try {
    const rows = openCodeDb.prepare(`
      SELECT
        s.id, s.title, s.directory, s.model, s.cost,
        s.tokens_input, s.tokens_output, s.tokens_reasoning,
        s.time_created, s.time_updated,
        (SELECT COUNT(*) FROM message m WHERE m.session_id = s.id) as msg_count
      FROM session s
      ORDER BY s.time_updated DESC
    `).all() as Array<{
      id: string; title: string | null; directory: string | null;
      model: string | null; cost: number | null;
      tokens_input: number | null; tokens_output: number | null;
      tokens_reasoning: number | null;
      time_created: number | null; time_updated: number | null;
      msg_count: number
    }>

    for (const row of rows) {
      let modelStr: string | null = null
      if (row.model) {
        try {
          const parsed = JSON.parse(row.model)
          modelStr = parsed.id || parsed.name || row.model
        } catch {
          modelStr = row.model
        }
      }

      const tokens = (row.tokens_input || 0) + (row.tokens_output || 0) + (row.tokens_reasoning || 0)

      sessions.push({
        id: `opencode:${row.id}`,
        tool: 'opencode',
        originalId: row.id,
        projectPath: row.directory,
        projectName: extractProjectName(row.directory),
        title: row.title,
        summary: null,
        model: modelStr,
        messageCount: row.msg_count,
        tokensTotal: tokens,
        cost: row.cost || 0,
        gitBranch: null,
        createdAt: row.time_created ? Math.floor(row.time_created / 1000) : null,
        updatedAt: row.time_updated ? Math.floor(row.time_updated / 1000) : null,
        isActive: 0,
        starred: 0,
        tags: null,
        archived: 0
      })
    }
  } finally {
    openCodeDb.close()
  }

  return sessions
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  type: 'text' | 'tool'
  content: string
  toolName?: string
  timestamp: number | null
}

export function getOpencodeMessages(sessionId: string): ChatMessage[] {
  const dbPath = join(homedir(), '.local', 'share', 'opencode', 'opencode.db')
  if (!existsSync(dbPath)) return []

  const openCodeDb = new Database(dbPath, { readonly: true })
  try {
    const stmt = openCodeDb.prepare(`
      SELECT m.id, m.data as msg_data
      FROM message m
      WHERE m.session_id = ?
      ORDER BY m.time_created
    `)
    const msgRows = stmt.all(sessionId) as Array<{ id: string; msg_data: string }>

    const partStmt = openCodeDb.prepare(
      'SELECT data FROM part WHERE message_id = ? AND session_id = ? ORDER BY id'
    )

    const messages: ChatMessage[] = []

    for (const row of msgRows) {
      try {
        const msg = JSON.parse(row.msg_data)
        const role = msg.role
        if (!role) continue

        const partRows = partStmt.all(row.id, sessionId) as Array<{ data: string }>
        const ts = msg.time?.created ? Math.floor(msg.time.created / 1000) : null

        for (const pr of partRows) {
          try {
            const p = JSON.parse(pr.data)
            if (p.type === 'text' && p.text) {
              const content = p.text.trim()
              if (content) {
                messages.push({ role, type: 'text', content, timestamp: ts })
              }
            } else if (p.type === 'tool' && p.tool) {
              const toolName = p.tool
              let content = ''
              if (p.state?.input) {
                const input = p.state.input
                if (typeof input === 'string') content = input
                else content = JSON.stringify(input, null, 2)
              }
              content = content.trim()
              if (content) {
                messages.push({ role: 'assistant', type: 'tool', content, toolName, timestamp: ts })
              }
            }
          } catch {}
        }
      } catch {}
    }

    return messages
  } finally {
    openCodeDb.close()
  }
}

export function getOpencodeResumeCmd(originalId: string, projectPath: string): string {
  return `cd "${projectPath}" && opencode resume ${originalId}`
}
