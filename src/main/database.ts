import Database from 'better-sqlite3'
import { UnifiedSession, SessionMessagePreview } from '../shared/types'

export class DatabaseManager {
  private db: Database.Database

  getDb(): Database.Database {
    return this.db
  }

  constructor(dbPath: string) {
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
  }

  initialize() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS unified_session (
        id TEXT PRIMARY KEY,
        tool TEXT NOT NULL,
        original_id TEXT NOT NULL,
        project_path TEXT,
        project_name TEXT,
        title TEXT,
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
        tags TEXT,
        indexed_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS session_message_preview (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL REFERENCES unified_session(id),
        role TEXT NOT NULL,
        content_preview TEXT,
        seq INTEGER,
        timestamp INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_session_tool ON unified_session(tool);
      CREATE INDEX IF NOT EXISTS idx_session_project ON unified_session(project_name);
      CREATE INDEX IF NOT EXISTS idx_session_updated ON unified_session(updated_at);
      CREATE INDEX IF NOT EXISTS idx_session_starred ON unified_session(starred);
      CREATE INDEX IF NOT EXISTS idx_session_archived ON unified_session(archived);
      CREATE INDEX IF NOT EXISTS idx_session_pinned ON unified_session(pinned);
      CREATE INDEX IF NOT EXISTS idx_msg_session ON session_message_preview(session_id);

      CREATE VIRTUAL TABLE IF NOT EXISTS session_fts USING fts5(
        id, title, summary, project_name,
        content=unified_session,
        content_rowid=rowid
      );

      CREATE TRIGGER IF NOT EXISTS session_ai AFTER INSERT ON unified_session BEGIN
        INSERT INTO session_fts(rowid, id, title, summary, project_name)
        VALUES (new.rowid, new.id, new.title, new.summary, new.project_name);
      END;

      CREATE TRIGGER IF NOT EXISTS session_ad AFTER DELETE ON unified_session BEGIN
        INSERT INTO session_fts(session_fts, rowid, id, title, summary, project_name)
        VALUES ('delete', old.rowid, old.id, old.title, old.summary, old.project_name);
      END;

      CREATE TRIGGER IF NOT EXISTS session_au AFTER UPDATE ON unified_session BEGIN
        INSERT INTO session_fts(session_fts, rowid, id, title, summary, project_name)
        VALUES ('delete', old.rowid, old.id, old.title, old.summary, old.project_name);
        INSERT INTO session_fts(rowid, id, title, summary, project_name)
        VALUES (new.rowid, new.id, new.title, new.summary, new.project_name);
      END;
    `)

    const cols = this.db.prepare("PRAGMA table_info(unified_session)").all() as Array<{ name: string }>
    if (!cols.some(c => c.name === 'archived')) {
      this.db.exec(`ALTER TABLE unified_session ADD COLUMN archived INTEGER DEFAULT 0`)
    }
    if (!cols.some(c => c.name === 'pinned')) {
      this.db.exec(`ALTER TABLE unified_session ADD COLUMN pinned INTEGER DEFAULT 0`)
    }
  }

  upsertSession(session: UnifiedSession) {
    const existing = this.db
      .prepare('SELECT updated_at, archived, pinned, message_count FROM unified_session WHERE id = ?')
      .get(session.id) as { updated_at: number | null; archived: number; pinned: number; message_count: number } | undefined

    if (existing && existing.updated_at && session.updatedAt && existing.updated_at >= session.updatedAt) {
      if (!session.messageCount || existing.message_count >= session.messageCount) return
    }

    if (existing && existing.archived) {
      return
    }

    const pinnedVal = existing?.pinned || 0

    this.db.prepare(`
      INSERT INTO unified_session (id, tool, original_id, project_path, project_name, title, summary, model, message_count, tokens_total, cost, git_branch, created_at, updated_at, is_active, starred, pinned, tags, indexed_at)
      VALUES (@id, @tool, @originalId, @projectPath, @projectName, @title, @summary, @model, @messageCount, @tokensTotal, @cost, @gitBranch, @createdAt, @updatedAt, @isActive, @starred, @pinned, @tags, @indexedAt)
      ON CONFLICT(id) DO UPDATE SET
        project_path=@projectPath, project_name=@projectName, title=@title, summary=@summary,
        model=@model, message_count=@messageCount, tokens_total=@tokensTotal, cost=@cost,
        git_branch=@gitBranch, updated_at=@updatedAt, is_active=@isActive, indexed_at=@indexedAt
    `).run({
      id: session.id,
      tool: session.tool,
      originalId: session.originalId,
      projectPath: session.projectPath,
      projectName: session.projectName,
      title: session.title,
      summary: session.summary,
      model: session.model,
      messageCount: session.messageCount,
      tokensTotal: session.tokensTotal,
      cost: session.cost,
      gitBranch: session.gitBranch,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      isActive: session.isActive,
      starred: session.starred,
      pinned: pinnedVal,
      tags: session.tags,
      indexedAt: Math.floor(Date.now() / 1000)
    })
  }

  upsertMessagePreviews(sessionId: string, messages: SessionMessagePreview[]) {
    const del = this.db.prepare('DELETE FROM session_message_preview WHERE session_id = ?')
    const ins = this.db.prepare(`
      INSERT INTO session_message_preview (session_id, role, content_preview, seq, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `)

    const txn = this.db.transaction(() => {
      del.run(sessionId)
      for (const m of messages) {
        ins.run(m.sessionId, m.role, m.contentPreview, m.seq, m.timestamp)
      }
    })
    txn()
  }

  private rowToSession(row: Record<string, unknown>): UnifiedSession {
    return {
      id: row.id as string,
      tool: row.tool as 'opencode' | 'claude' | 'codex',
      originalId: row.original_id as string,
      projectPath: (row.project_path as string) || null,
      projectName: (row.project_name as string) || null,
      title: (row.title as string) || null,
      summary: (row.summary as string) || null,
      model: (row.model as string) || null,
      messageCount: (row.message_count as number) || 0,
      tokensTotal: (row.tokens_total as number) || 0,
      cost: (row.cost as number) || 0,
      gitBranch: (row.git_branch as string) || null,
      createdAt: (row.created_at as number) || null,
      updatedAt: (row.updated_at as number) || null,
      isActive: (row.is_active as number) || 0,
      starred: (row.starred as number) || 0,
      archived: (row.archived as number) || 0,
      pinned: (row.pinned as number) || 0,
      tags: (row.tags as string) || null
    }
  }

  getSessions(filter: {
    tool?: string
    projectName?: string
    status?: string
    search?: string
    limit?: number
    offset?: number
  }): UnifiedSession[] {
    let sql = 'SELECT * FROM unified_session WHERE 1=1'
    const params: unknown[] = []

    if (filter.tool && filter.tool !== 'all') {
      sql += ' AND tool = ?'
      params.push(filter.tool)
    }
    if (filter.projectName && filter.projectName !== 'all') {
      sql += ' AND project_name = ?'
      params.push(filter.projectName)
    }
    if (filter.status === 'active') {
      sql += ' AND updated_at > ? AND archived = 0'
      params.push(Math.floor(Date.now() / 1000) - 86400)
    } else if (filter.status === 'starred') {
      sql += ' AND starred = 1 AND archived = 0'
    } else if (filter.status === 'pinned') {
      sql += ' AND pinned = 1 AND archived = 0'
    } else if (filter.status === 'archived') {
      sql += ' AND archived = 1'
    } else {
      sql += ' AND archived = 0'
    }
    if (filter.search) {
      sql += ' AND id IN (SELECT id FROM session_fts WHERE session_fts MATCH ?)'
      params.push(filter.search)
    }

    sql += ' ORDER BY updated_at DESC NULLS LAST'

    const limit = filter.limit || 5000
    const offset = filter.offset || 0
    sql += ' LIMIT ? OFFSET ?'
    params.push(limit, offset)

    return (this.db.prepare(sql).all(...params) as Record<string, unknown>[]).map(r => this.rowToSession(r))
  }

  getMessagePreviews(sessionId: string): SessionMessagePreview[] {
    return this.db.prepare(
      'SELECT * FROM session_message_preview WHERE session_id = ? ORDER BY seq LIMIT 10'
    ).all(sessionId) as SessionMessagePreview[]
  }

  getProjectNames(): string[] {
    const rows = this.db.prepare(
      "SELECT DISTINCT project_name FROM unified_session WHERE project_name IS NOT NULL ORDER BY project_name"
    ).all() as { project_name: string }[]
    return rows.map(r => r.project_name)
  }

  getProjectPath(projectName: string): string | null {
    const row = this.db.prepare(
      "SELECT project_path FROM unified_session WHERE project_name = ? AND project_path IS NOT NULL LIMIT 1"
    ).get(projectName) as { project_path: string } | undefined
    return row?.project_path || null
  }

  getSessionCount(): number {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM unified_session').get() as { count: number }
    return row.count
  }

  toggleStar(sessionId: string): number {
    const row = this.db.prepare('SELECT starred FROM unified_session WHERE id = ?').get(sessionId) as { starred: number } | undefined
    const newStar = row ? (row.starred ? 0 : 1) : 0
    this.db.prepare('UPDATE unified_session SET starred = ? WHERE id = ?').run(newStar, sessionId)
    return newStar
  }

  updateTags(sessionId: string, tags: string) {
    this.db.prepare('UPDATE unified_session SET tags = ? WHERE id = ?').run(tags, sessionId)
  }

  getCounts(): { byTool: Record<string, number>, byProject: Record<string, number>, total: number } {
    const byTool: Record<string, number> = {}
    const byProject: Record<string, number> = {}
    const toolRows = this.db.prepare('SELECT tool, COUNT(*) as cnt FROM unified_session WHERE archived = 0 GROUP BY tool').all() as Array<{ tool: string; cnt: number }>
    for (const r of toolRows) byTool[r.tool] = r.cnt
    const projRows = this.db.prepare('SELECT project_name, COUNT(*) as cnt FROM unified_session WHERE archived = 0 AND project_name IS NOT NULL GROUP BY project_name').all() as Array<{ project_name: string; cnt: number }>
    for (const r of projRows) byProject[r.project_name] = r.cnt
    const total = this.db.prepare('SELECT COUNT(*) as cnt FROM unified_session WHERE archived = 0').get() as { cnt: number }
    return { byTool, byProject, total: total.cnt }
  }

  getStatusCounts(): { active: number; starred: number; pinned: number; archived: number } {
    const cutoff = Math.floor(Date.now() / 1000) - 86400
    const r = this.db.prepare(`
      SELECT
        SUM(CASE WHEN updated_at > ? AND archived = 0 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN starred = 1 AND archived = 0 THEN 1 ELSE 0 END) as starred,
        SUM(CASE WHEN pinned = 1 AND archived = 0 THEN 1 ELSE 0 END) as pinned,
        SUM(CASE WHEN archived = 1 THEN 1 ELSE 0 END) as archived
      FROM unified_session
    `).get(cutoff) as { active: number; starred: number; pinned: number; archived: number }
    return { active: r.active || 0, starred: r.starred || 0, pinned: r.pinned || 0, archived: r.archived || 0 }
  }

  toggleArchive(sessionId: string): number {
    const row = this.db.prepare('SELECT archived FROM unified_session WHERE id = ?').get(sessionId) as { archived: number } | undefined
    const newVal = row ? (row.archived ? 0 : 1) : 1
    this.db.prepare('UPDATE unified_session SET archived = ? WHERE id = ?').run(newVal, sessionId)
    return newVal
  }

  togglePin(sessionId: string): number {
    const row = this.db.prepare('SELECT pinned FROM unified_session WHERE id = ?').get(sessionId) as { pinned: number } | undefined
    const newVal = row ? (row.pinned ? 0 : 1) : 1
    this.db.prepare('UPDATE unified_session SET pinned = ? WHERE id = ?').run(newVal, sessionId)
    return newVal
  }

  deleteSession(sessionId: string) {
    this.db.prepare('DELETE FROM session_message_preview WHERE session_id = ?').run(sessionId)
    this.db.prepare('DELETE FROM unified_session WHERE id = ?').run(sessionId)
  }
}
