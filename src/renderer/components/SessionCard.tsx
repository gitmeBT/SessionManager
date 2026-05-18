import { useStore } from '../stores/useStore'
import { UnifiedSession } from '../../shared/types'
import { ToolIcon } from './Sidebar'

const TOOL_COLORS: Record<string, string> = {
  opencode: 'var(--accent-opencode)',
  claude: 'var(--accent-claude)',
  codex: 'var(--accent-codex)'
}

function formatTime(ts: number | null): string {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}h ago`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTokens(n: number): string {
  if (n < 1000) return `${n}`
  if (n < 1000000) return `${(n / 1000).toFixed(1)}k`
  return `${(n / 1000000).toFixed(1)}M`
}

function isEmpty(s: UnifiedSession): boolean {
  return s.messageCount <= 1 && !s.title?.trim()
}

export function SessionCard({ session }: { session: UnifiedSession }) {
  const { toggleStar, resumeSession, openDetail } = useStore()
  const toolColor = TOOL_COLORS[session.tool] || '#888'
  const empty = isEmpty(session)

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 8,
        padding: 12,
        cursor: 'pointer',
        border: `1px solid var(--border)`,
        opacity: empty ? 0.55 : 1,
        transition: 'border-color 0.15s, opacity 0.15s'
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = toolColor; if (empty) e.currentTarget.style.opacity = '0.85' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; if (empty) e.currentTarget.style.opacity = '0.55' }}
      onClick={() => openDetail(session)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 6,
          background: toolColor + '22',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <ToolIcon tool={session.tool} size={20} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            {session.isActive ? (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
            ) : null}
            <span style={{
              fontSize: 13, fontWeight: 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              color: empty ? 'var(--text-muted)' : 'var(--text-primary)'
            }}>
              {empty ? '(empty session)' : (session.title || 'Untitled Session')}
            </span>
            {empty && (
              <span style={{
                fontSize: 9, padding: '1px 5px', borderRadius: 3,
                background: '#ef444422', color: '#ef4444', flexShrink: 0
              }}>EMPTY</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
            {session.projectName && (
              <span style={{ padding: '1px 6px', borderRadius: 3, background: 'var(--bg-hover)', fontSize: 10 }}>
                {session.projectName}
              </span>
            )}
            {session.gitBranch && <span style={{ fontSize: 10 }}>{session.gitBranch}</span>}
            <span>{formatTime(session.updatedAt)}</span>
            {session.messageCount > 1 && (
              <span style={{ fontSize: 10, color: session.messageCount >= 20 ? '#ef4444' : session.messageCount >= 10 ? '#f59e0b' : 'var(--text-secondary)', fontWeight: session.messageCount >= 10 ? 600 : 400 }}>
                {session.messageCount} rounds{session.messageCount >= 20 ? ' 🔥' : ''}
              </span>
            )}
            {session.tokensTotal > 0 && <span>{formatTokens(session.tokensTotal)} tok</span>}
            {session.cost > 0 && <span style={{ color: 'var(--orange)' }}>${session.cost.toFixed(2)}</span>}
          </div>

          {session.summary && !empty && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session.summary}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); toggleStar(session.id) }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, color: session.starred ? '#fbbf24' : 'var(--text-muted)', padding: '2px 4px'
            }}
          >
            {session.starred ? '★' : '☆'}
          </button>
          <button
            onClick={e => { e.stopPropagation(); resumeSession(session) }}
            style={{
              background: toolColor, border: 'none', cursor: 'pointer',
              fontSize: 11, color: '#fff', padding: '4px 10px', borderRadius: 4, fontWeight: 500
            }}
          >
            ▶ Resume
          </button>
        </div>
      </div>
    </div>
  )
}
