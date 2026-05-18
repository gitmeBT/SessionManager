import { UnifiedSession, SessionMessagePreview } from '../../shared/types'
import { scanOpencode } from './opencode'
import { scanClaude } from './claude'
import { scanCodex } from './codex'
import { DatabaseManager } from '../database'

export class Indexer {
  private db: DatabaseManager

  constructor(db: DatabaseManager) {
    this.db = db
  }

  async indexAll() {
    console.log('[Indexer] Starting full index...')
    const now = Math.floor(Date.now() / 1000)
    const activeThreshold = now - 3600

    try {
      const opencodeSessions = await scanOpencode()
      for (const s of opencodeSessions) {
        this.db.upsertSession(s)
      }
      console.log(`[Indexer] opencode: ${opencodeSessions.length} sessions`)
    } catch (e) {
      console.error('[Indexer] opencode scan failed:', e)
    }

    try {
      const claudeSessions = await scanClaude()
      for (const s of claudeSessions) {
        this.db.upsertSession(s)
      }
      console.log(`[Indexer] claude: ${claudeSessions.length} sessions`)
    } catch (e) {
      console.error('[Indexer] claude scan failed:', e)
    }

    try {
      const codexSessions = await scanCodex()
      for (const s of codexSessions) {
        this.db.upsertSession(s)
      }
      console.log(`[Indexer] codex: ${codexSessions.length} sessions`)
    } catch (e) {
      console.error('[Indexer] codex scan failed:', e)
    }

    this.markActiveSessions(activeThreshold)
    console.log('[Indexer] Done')
  }

  private markActiveSessions(threshold: number) {
    this.db.getDb().prepare(
      'UPDATE unified_session SET is_active = CASE WHEN updated_at > ? THEN 1 ELSE 0 END'
    ).run(threshold)
  }
}
