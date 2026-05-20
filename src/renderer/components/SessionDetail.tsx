import { useState } from 'react'
import { useStore, ChatMessage } from '../stores/useStore'
import { ToolIcon } from './Sidebar'

const COLLAPSE_LEN = 300

const TOOL_ICONS: Record<string, string> = {
  read: '📄', write: '✏️', edit: '✏️', bash: '⌨️',
  glob: '🔍', grep: '🔍', task: '🤖', webfetch: '🌐',
  skill: '🛠️', list: '📁', mkdir: '📁'
}

function CollapsibleContent({ content, mono = false }: { content: string; mono?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const needsCollapse = content.length > COLLAPSE_LEN

  return (
    <div>
      <div style={{
        whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6,
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        fontSize: mono ? 11 : 12,
        maxHeight: needsCollapse && !expanded ? 120 : 'none', overflow: 'hidden'
      }}>
        {needsCollapse && !expanded ? content.slice(0, COLLAPSE_LEN) + '...' : content}
      </div>
      {needsCollapse && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none', border: 'none', color: 'var(--accent)',
            cursor: 'pointer', fontSize: 10, padding: '2px 0', marginTop: 2
          }}
        >
          {expanded ? '▲ Show less' : `▼ Show all (${content.length} chars)`}
        </button>
      )}
    </div>
  )
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  const isTool = msg.type === 'tool'

  if (isTool) {
    const icon = TOOL_ICONS[msg.toolName?.toLowerCase() || ''] || '🔧'
    return (
      <div style={{
        margin: '0 24px 10px', padding: '8px 12px', borderRadius: 8,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderLeft: '3px solid var(--accent)', fontSize: 11
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 13 }}>{icon}</span>
          <span style={{
            fontWeight: 600, color: 'var(--accent)', fontSize: 10,
            textTransform: 'uppercase', letterSpacing: 0.5
          }}>
            {msg.toolName || 'Tool Call'}
          </span>
        </div>
        <CollapsibleContent content={msg.content} mono />
      </div>
    )
  }

  return (
    <div style={{
      marginBottom: 10, display: 'flex', flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start', padding: '0 24px'
    }}>
      <div style={{
        maxWidth: '82%', padding: '10px 14px',
        borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        background: isUser ? 'var(--bg-card)' : 'var(--bg-hover)',
        border: isUser ? '1px solid var(--border)' : 'none',
        borderLeft: isUser ? 'none' : '2px solid var(--accent)',
        borderRight: isUser ? '2px solid var(--accent)' : 'none'
      }}>
        <div style={{
          fontSize: 10, marginBottom: 4, fontWeight: 600,
          color: isUser ? 'var(--accent)' : 'var(--text-muted)',
          paddingBottom: 4,
          borderBottom: isUser ? '1px solid var(--border-soft)' : 'none'
        }}>
          {isUser ? 'You' : 'AI'}
        </div>
        <CollapsibleContent content={msg.content} />
      </div>
    </div>
  )
}

function formatTokens(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function formatCost(n: number): string {
  if (n < 0.01) return '<$0.01'
  return '$' + n.toFixed(2)
}

export function SessionDetail() {
  const { detailSession, detailMessages, detailLoading, closeDetail, toggleStar, resumeSession, resumeAction } = useStore()

  if (!detailSession) return null

  const s = detailSession
  const toolColor = s.tool === 'opencode' ? 'var(--accent-opencode)' : s.tool === 'claude' ? 'var(--accent-claude)' : 'var(--accent-codex)'
  const toolBgColor = s.tool === 'opencode' ? 'var(--accent-opencode-bg)' : s.tool === 'claude' ? 'var(--accent-claude-bg)' : 'var(--accent-codex-bg)'
  const textCount = detailMessages.filter(m => m.type === 'text').length
  const toolCount = detailMessages.filter(m => m.type === 'tool').length

  const handleResume = () => {
    const cmd = s.tool === 'opencode'
      ? `opencode --session ${s.originalId} "${s.projectPath || ''}"`
      : s.tool === 'claude'
        ? `claude --resume ${s.originalId}`
        : `codex --resume ${s.originalId}`

    if (resumeAction === 'system') {
      window.api.openSystemTerminal(cmd, s.projectPath || undefined)
    } else {
      resumeSession(s)
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <div style={{
        padding: '12px 20px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={closeDetail}
            style={{
              background: 'none', border: 'none', color: 'var(--accent)',
              cursor: 'pointer', fontSize: 14, padding: '4px 8px', borderRadius: 4
            }}
          >
            ← Back
          </button>

          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: toolBgColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <ToolIcon tool={s.tool} size={17} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {s.title || 'Untitled Session'}
            </div>
          </div>

          <button
            onClick={() => toggleStar(s.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 17, color: s.starred ? '#fbbf24' : 'var(--text-muted)', padding: 4
            }}
          >
            {s.starred ? '★' : '☆'}
          </button>
          <button
            onClick={handleResume}
            style={{
              background: toolColor, border: 'none', cursor: 'pointer',
              fontSize: 12, color: '#fff', padding: '6px 14px', borderRadius: 6, fontWeight: 500
            }}
          >
            ▶ Resume
          </button>
        </div>

        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10,
          marginLeft: 52
        }}>
          {s.projectName && (
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 4,
              background: 'var(--bg-hover)', color: 'var(--accent)',
              maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>{s.projectName}</span>
          )}
          {s.model && (
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>{s.model}</span>
          )}
          {s.gitBranch && (
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>{s.gitBranch}</span>
          )}
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>{textCount} msgs</span>
          {toolCount > 0 && (
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>{toolCount} tools</span>
          )}
          {s.tokensTotal > 0 && (
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-hover)', color: 'var(--accent)' }}>{formatTokens(s.tokensTotal)} tokens</span>
          )}
          {s.cost > 0 && (
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-hover)', color: 'var(--orange)' }}>{formatCost(s.cost)}</span>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        {detailLoading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
            Loading messages...
          </div>
        ) : detailMessages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40, fontSize: 13 }}>
            No messages found for this session
          </div>
        ) : (
          detailMessages.map((msg, i) => <MessageBubble key={i} msg={msg} />)
        )}
      </div>
    </div>
  )
}
