import Database from 'better-sqlite3'
import { UnifiedSession } from '../../shared/types'
import type { ChatMessage } from './opencode'
import { homedir } from 'os'
import { join, basename } from 'path'
import { existsSync, readdirSync, readFileSync } from 'fs'

function extractProjectName(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith('/private/var/folders/') || path.startsWith('/var/folders/')) return null
  const parts = path.replace(/\/$/, '').split('/')
  return parts[parts.length - 1] || null
}

export async function scanCodex(): Promise<UnifiedSession[]> {
  const dbPath = join(homedir(), '.codex', 'state_5.sqlite')
  if (!existsSync(dbPath)) return []

  const codexDb = new Database(dbPath, { readonly: true })
  const sessions: UnifiedSession[] = []

  try {
    let tableExists = false
    const tables = codexDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>
    tableExists = tables.some(t => t.name === 'threads')

    if (!tableExists) return []

    const rows = codexDb.prepare(`
      SELECT
        id, title, cwd, model, tokens_used, first_user_message,
        git_branch, created_at, updated_at, preview,
        (SELECT COUNT(*) FROM thread_goals tg WHERE tg.thread_id = t.id) as goal_count
      FROM threads t
      ORDER BY updated_at DESC
    `).all() as Array<{
      id: string; title: string | null; cwd: string | null;
      model: string | null; tokens_used: number | null;
      first_user_message: string | null; git_branch: string | null;
      created_at: number | null; updated_at: number | null;
      preview: string | null; goal_count: number
    }>

    for (const row of rows) {
      sessions.push({
        id: `codex:${row.id}`,
        tool: 'codex',
        originalId: row.id,
        projectPath: row.cwd,
        projectName: extractProjectName(row.cwd),
        title: row.first_user_message || row.title,
        summary: row.preview || null,
        model: row.model,
        messageCount: row.goal_count || 0,
        tokensTotal: row.tokens_used || 0,
        cost: 0,
        gitBranch: row.git_branch,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isActive: 0,
        starred: 0,
        tags: null
      })
    }
  } finally {
    codexDb.close()
  }

  return sessions
}

export function getCodexMessages(sessionId: string): ChatMessage[] {
  const dbPath = join(homedir(), '.codex', 'state_5.sqlite')
  if (!existsSync(dbPath)) return []

  const codexDb = new Database(dbPath, { readonly: true })
  try {
    const row = codexDb.prepare('SELECT rollout_path FROM threads WHERE id = ?').get(sessionId) as { rollout_path: string | null } | undefined
    if (!row?.rollout_path) return []

    const sessionsDir = join(homedir(), '.codex', 'sessions')
    let jsonlPath: string | null = null

    if (existsSync(row.rollout_path)) {
      jsonlPath = row.rollout_path
    } else {
      const filename = basename(row.rollout_path)
      const searchDir = (dir: string) => {
        if (!existsSync(dir)) return
        const entries = readdirSync(dir, { withFileTypes: true })
        for (const e of entries) {
          const full = join(dir, e.name)
          if (e.isDirectory()) {
            const found = searchDir(full)
            if (found) return found
          } else if (e.name === filename || e.name === `${sessionId}.jsonl`) {
            return full
          }
        }
        return null
      }
      jsonlPath = searchDir(sessionsDir)
    }

    if (!jsonlPath || !existsSync(jsonlPath)) return []

    const content = readFileSync(jsonlPath, 'utf-8')
    const lines = content.split('\n')
    const messages: ChatMessage[] = []

    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const obj = JSON.parse(line)

        if (obj.type === 'response_item') {
          const msg = obj.item
          if (!msg?.content) continue

          const role = msg.role
          let text = ''
          if (typeof msg.content === 'string') {
            text = msg.content
          } else if (Array.isArray(msg.content)) {
            text = msg.content
              .filter((b: { type: string }) => b.type === 'output_text' || b.type === 'input_text')
              .map((b: { text: string }) => b.text)
              .join('\n')
          }

          text = text.trim()
          if (!text) continue

          messages.push({
            role: role === 'user' ? 'user' : 'assistant',
            type: 'text',
            content: text,
            timestamp: null
          })
        }
      } catch {}
    }

    return messages
  } finally {
    codexDb.close()
  }
}

export function getCodexResumeCmd(originalId: string, projectPath: string): string {
  return `cd "${projectPath}" && codex --resume ${originalId}`
}
