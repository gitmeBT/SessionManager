import { useMemo } from 'react'
import { useStore } from '../stores/useStore'
import { ToolIcon } from './Sidebar'

const SORT_OPTIONS = [
  { key: 'updatedAt', label: 'Updated' },
  { key: 'createdAt', label: 'Created' },
  { key: 'messageCount', label: 'Rounds' },
  { key: 'tokensTotal', label: 'Tokens' },
  { key: 'cost', label: 'Cost' },
] as const

const GROUP_LABELS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Past Week' },
  { key: 'month', label: 'Past Month' },
  { key: 'older', label: 'Older' },
] as const

function formatTokens(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function formatCost(n: number): string {
  if (n === 0) return ''
  if (n < 0.01) return '<$0.01'
  return '$' + n.toFixed(2)
}

function getTimeGroup(ts: number | null): string {
  if (!ts) return 'older'
  const now = Date.now() / 1000
  const diff = now - ts
  if (diff < 86400) return 'today'
  if (diff < 604800) return 'week'
  if (diff < 2592000) return 'month'
  return 'older'
}

export function SessionList() {
  const {
    sessions, searchQuery, setSearch,
    sortBy, setSortBy, openDetail
  } = useStore()

  const sortedSessions = useMemo(() => {
    let list = [...(sessions || [])]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(s =>
        (s.title || '').toLowerCase().includes(q) ||
        (s.projectName || '').toLowerCase().includes(q) ||
        (s.model || '').toLowerCase().includes(q)
      )
    }

    list.sort((a, b) => {
      const aVal = (a as any)[sortBy] || 0
      const bVal = (b as any)[sortBy] || 0
      return (bVal as number) - (aVal as number)
    })

    return list
  }, [sessions, searchQuery, sortBy])

  const grouped = useMemo(() => {
    const groups: Record<string, typeof sortedSessions> = { today: [], week: [], month: [], older: [] }
    for (const s of sortedSessions) {
      const g = getTimeGroup(s.updatedAt)
      groups[g].push(s)
    }
    return groups
  }, [sortedSessions])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        flexShrink: 0
      }}>
        <input
          type="text"
          placeholder="Search sessions..."
          value={searchQuery}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 10px',
            fontSize: 12,
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)'
          }}
        />
        <div style={{ display: 'flex', gap: 4 }}>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              style={{
                padding: '3px 8px',
                fontSize: 10,
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                background: sortBy === opt.key ? 'var(--bg-hover)' : 'transparent',
                color: sortBy === opt.key ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: sortBy === opt.key ? 600 : 400
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {sortedSessions.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            No sessions found
          </div>
        )}
        {GROUP_LABELS.map(({ key, label }) => {
          const items = grouped[key]
          if (!items || items.length === 0) return null
          return (
            <div key={key}>
              <div style={{
                padding: '8px 16px 4px',
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span>{label}</span>
                <span style={{ fontSize: 9, opacity: 0.6 }}>{items.length}</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)', opacity: 0.5 }} />
              </div>
              {items.map(session => (
                <SessionCard key={session.id} session={session} openDetail={openDetail} />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SessionCard({ session, openDetail }: { session: any; openDetail: (s: any) => void }) {
  const tokensStr = session.tokensTotal > 0 ? formatTokens(session.tokensTotal) : ''
  const costStr = formatCost(session.cost)
  const isHot = session.tokensTotal > 50000
  const isEmpty = session.messageCount === 0
  const dimStyle: React.CSSProperties = isEmpty ? { opacity: 0.45 } : {}

  return (
    <div
      onClick={() => openDetail(session)}
      style={{
        padding: '12px 14px',
        margin: '3px 12px',
        borderRadius: 8,
        cursor: 'pointer',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        transition: 'border-color 0.15s',
        ...dimStyle
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, ...dimStyle }}>
        <div style={{ paddingTop: 2 }}>
          <ToolIcon tool={session.tool} size={18} />
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{
            fontSize: 12, fontWeight: 500, color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {session.title || 'Untitled'}
            {isEmpty && (
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginLeft: 6 }}>(empty)</span>
            )}
          </div>
          <div style={{
            fontSize: 10, color: 'var(--text-muted)', marginTop: 4,
            display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center'
          }}>
            {session.projectName && (
              <span style={{
                background: 'var(--bg-hover)', padding: '1px 6px',
                borderRadius: 3, border: '1px solid var(--border)',
                fontSize: 9, color: 'var(--text-secondary)',
                maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>{session.projectName}</span>
            )}
            {session.updatedAt && (
              <span>{new Date(session.updatedAt * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            )}
            {session.messageCount > 0 && (
              <span>{session.messageCount} rounds</span>
            )}
            {tokensStr && (
              <span style={{ color: isHot ? '#f87171' : 'var(--accent)' }}>
                {isHot ? '🔥 ' : ''}{tokensStr} tok
              </span>
            )}
            {costStr && <span style={{ color: 'var(--orange)' }}>{costStr}</span>}
          </div>
        </div>
        <button
          onClick={e => {
            e.stopPropagation()
            useStore.getState().resumeSession(session)
          }}
          style={{
            padding: '4px 10px', fontSize: 10, borderRadius: 5,
            border: '1px solid var(--border)', background: 'var(--bg-hover)',
            color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0,
            marginTop: 2, transition: 'all 0.15s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          Resume
        </button>
      </div>
    </div>
  )
}
