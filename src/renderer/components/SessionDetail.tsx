import { memo, useCallback, useMemo, useState } from 'react'
import { ArrowLeft, Star, Pin, Archive, Trash2, Play, ChevronDown, ChevronUp } from 'lucide-react'
import { Virtuoso } from 'react-virtuoso'
import { useStore, ChatMessage } from '../stores/useStore'
import { ToolIcon } from './Sidebar'
import { cn } from '../lib/utils'
import { translate } from '../lib/i18n'

const COLLAPSE_LEN = 300

const TOOL_ICONS: Record<string, string> = {
  read: '📄', write: '✏️', edit: '✏️', bash: '⌨️',
  glob: '🔍', grep: '🔍', task: '🤖', webfetch: '🌐',
  skill: '🛠️', list: '📁', mkdir: '📁'
}

const CollapsibleContent = memo(function CollapsibleContent({ content, mono = false, lang }: { content: string; mono?: boolean; lang: string }) {
  const [expanded, setExpanded] = useState(false)
  const needsCollapse = content.length > COLLAPSE_LEN

  return (
    <div>
      <div
        className={cn(
          'whitespace-pre-wrap break-words leading-relaxed',
          mono ? 'font-mono text-[11px]' : 'text-xs'
        )}
        style={{ maxHeight: needsCollapse && !expanded ? 120 : 'none', overflow: 'hidden' }}
      >
        {needsCollapse && !expanded ? content.slice(0, COLLAPSE_LEN) + '...' : content}
      </div>
      {needsCollapse && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-0.5 flex cursor-pointer items-center gap-0.5 bg-transparent text-[10px] text-primary"
        >
          {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          {expanded ? translate('detail.showLess', lang as any) : `${translate('detail.showAll', lang as any)} (${content.length} ${translate('detail.chars', lang as any)})`}
        </button>
      )}
    </div>
  )
})

const MessageBubble = memo(function MessageBubble({ msg, index, lang }: { msg: ChatMessage; index: number; lang: string }) {
  const isUser = msg.role === 'user'
  const isTool = msg.type === 'tool'

  if (isTool) {
    const icon = TOOL_ICONS[msg.toolName?.toLowerCase() || ''] || '🔧'
    return (
      <div
        className="mx-6 mb-4 rounded-lg border border-border/50 bg-card/60 px-4 py-3.5 text-[11px] backdrop-blur-sm"
        style={{ borderLeft: '3px solid hsl(var(--primary))' }}
      >
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="text-[13px]">{icon}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            {msg.toolName || translate('detail.toolCall', lang as any)}
          </span>
        </div>
        <CollapsibleContent content={msg.content} mono lang={lang} />
      </div>
    )
  }

  return (
    <div
      className={cn('mb-4 flex flex-col px-6', isUser ? 'items-end' : 'items-start')}
    >
      <div
        className={cn(
          'max-w-[82%] rounded-2xl px-5 py-3.5',
          isUser
            ? 'rounded-br-sm border border-border/50 bg-card/60 backdrop-blur-sm'
            : 'bg-hover/60 backdrop-blur-sm'
        )}
        style={{
          borderLeft: isUser ? 'none' : '2px solid hsl(var(--primary))',
          borderRight: isUser ? '2px solid hsl(var(--primary))' : 'none',
        }}
      >
        <div className={cn(
          'mb-1 border-b pb-1 text-[10px] font-semibold',
          isUser ? 'border-border-soft text-primary' : 'border-transparent text-foreground-muted'
        )}>
          {isUser ? translate('detail.you', lang as any) : translate('detail.ai', lang as any)}
        </div>
        <CollapsibleContent content={msg.content} lang={lang} />
      </div>
    </div>
  )
})

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
  const detailSession = useStore(s => s.detailSession)
  const detailMessages = useStore(s => s.detailMessages)
  const detailLoading = useStore(s => s.detailLoading)
  const closeDetail = useStore(s => s.closeDetail)
  const toggleStar = useStore(s => s.toggleStar)
  const togglePin = useStore(s => s.togglePin)
  const toggleArchive = useStore(s => s.toggleArchive)
  const deleteSession = useStore(s => s.deleteSession)
  const resumeSession = useStore(s => s.resumeSession)
  const resumeAction = useStore(s => s.resumeAction)
  const terminalApp = useStore(s => s.terminalApp)
  const lang = useStore(s => s.language)

  const textCount = useMemo(() => detailMessages.filter(m => m.type === 'text').length, [detailMessages])
  const toolCount = useMemo(() => detailMessages.filter(m => m.type === 'tool').length, [detailMessages])

  const handleConfirm = useCallback(async (message: string, action: () => void) => {
    const ok = await useStore.getState().confirm(message)
    if (ok) action()
  }, [])

  if (!detailSession) return null

  const s = detailSession

  const toolColor = s.tool === 'opencode' ? 'accent-opencode' : s.tool === 'claude' ? 'accent-claude' : 'accent-codex'
  const toolBgColor = s.tool === 'opencode' ? 'accent-opencode-bg' : s.tool === 'claude' ? 'accent-claude-bg' : 'accent-codex-bg'

  const handleResume = () => {
    const cmd = s.tool === 'opencode'
      ? `opencode --session ${s.originalId} "${s.projectPath || ''}"`
      : s.tool === 'claude'
        ? `claude --resume ${s.originalId}`
        : `codex --resume ${s.originalId}`

    if (resumeAction === 'system') {
      window.api.openSystemTerminal(cmd, s.projectPath || undefined, terminalApp || undefined)
    } else {
      resumeSession(s)
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-background-secondary/80 px-5 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={closeDetail}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border/50 bg-hover/50 px-3 py-1.5 text-xs text-foreground-secondary transition-all hover:border-primary hover:bg-primary hover:text-white"
          >
            <ArrowLeft size={12} />
            {translate('detail.back', lang as any)}
          </button>

          <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', `bg-${toolBgColor}`)}>
            <ToolIcon tool={s.tool} size={17} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">
              {s.title || translate('detail.untitled', lang as any)}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleStar(s.id)}
              title={s.starred ? translate('detail.star', lang as any) : translate('detail.unstar', lang as any)}
              className={cn(
                'flex cursor-pointer items-center justify-center rounded-md p-1.5 transition-all active:scale-90 hover:[transform:rotateY(180deg)] [transform-style:preserve-3d] duration-300',
                s.starred
                  ? 'bg-orange/15 text-orange'
                  : 'text-foreground-muted hover:bg-hover hover:text-foreground'
              )}
            >
              <Star size={14} fill={s.starred ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => togglePin(s.id)}
              title={s.pinned ? translate('detail.pin', lang as any) : translate('detail.unpin', lang as any)}
              className={cn(
                'flex cursor-pointer items-center justify-center rounded-md p-1.5 transition-all active:scale-90 hover:[transform:rotateY(180deg)] [transform-style:preserve-3d] duration-300',
                s.pinned
                  ? 'bg-primary/15 text-primary'
                  : 'text-foreground-muted hover:bg-hover hover:text-foreground'
              )}
            >
              <Pin size={14} fill={s.pinned ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => handleConfirm(translate('detail.confirm.archive', lang as any), () => toggleArchive(s.id))}
              title={translate('detail.archive', lang as any)}
              className="flex cursor-pointer items-center justify-center rounded-md p-1.5 text-foreground-muted transition-all hover:bg-hover hover:text-foreground active:scale-90 hover:[transform:rotateY(180deg)] [transform-style:preserve-3d] duration-300"
            >
              <Archive size={14} />
            </button>
            <button
              onClick={() => handleConfirm(translate('detail.confirm.delete', lang as any), () => deleteSession(s.id))}
              title={translate('detail.delete', lang as any)}
              className="flex cursor-pointer items-center justify-center rounded-md p-1.5 text-foreground-muted transition-all hover:bg-hover hover:text-foreground active:scale-90 hover:[transform:rotateY(180deg)] [transform-style:preserve-3d] duration-300"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <button
            onClick={handleResume}
            className={cn(
              'ml-2 flex cursor-pointer items-center gap-1.5 rounded-lg border border-border/50 bg-hover/50 px-3 py-2 text-[11px] text-foreground-secondary transition-all duration-150 hover:border-primary hover:bg-primary hover:text-white',
            )}
          >
            <Play size={9} />
            {translate('detail.resume', lang as any)}
          </button>
        </div>

        {/* Metadata pills */}
        <div className="ml-[52px] mt-3 flex flex-wrap gap-2">
          {s.projectName && (
            <span className="max-w-[180px] truncate rounded-md bg-hover/50 px-2 py-0.5 text-[10px] text-primary">{s.projectName}</span>
          )}
          {s.model && (
            <span className="rounded-md bg-hover/50 px-2 py-0.5 text-[10px] text-foreground-secondary">{s.model}</span>
          )}
          {s.gitBranch && (
            <span className="rounded-md bg-hover/50 px-2 py-0.5 text-[10px] text-foreground-secondary">{s.gitBranch}</span>
          )}
          <span className="rounded-md bg-hover/50 px-2 py-0.5 text-[10px] text-foreground-secondary">{textCount} {translate('detail.msgs', lang as any)}</span>
          {toolCount > 0 && (
            <span className="rounded-md bg-hover/50 px-2 py-0.5 text-[10px] text-foreground-secondary">{toolCount} {translate('detail.tools', lang as any)}</span>
          )}
          {s.tokensTotal > 0 && (
            <span className="rounded-md bg-hover/50 px-2 py-0.5 text-[10px] text-primary">{formatTokens(s.tokensTotal)} {translate('detail.tokens', lang as any)}</span>
          )}
          {s.cost > 0 && (
            <span className="rounded-md bg-hover/50 px-2 py-0.5 text-[10px] text-orange">{formatCost(s.cost)}</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        {detailLoading ? (
          <div className="px-10 py-10 text-center text-foreground-muted">{translate('detail.loading', lang as any)}</div>
        ) : detailMessages.length === 0 ? (
          <div className="px-10 py-10 text-center text-[13px] text-foreground-muted">{translate('detail.noMessages', lang as any)}</div>
        ) : (
          <Virtuoso
            data={detailMessages}
            initialTopMostItemIndex={0}
            itemContent={(index, msg) => <MessageBubble msg={msg} index={index} lang={lang} />}
            components={{
              Header: () => <div style={{ height: 24 }} />,
              Footer: () => <div style={{ height: 24 }} />,
            }}
          />
        )}
      </div>
    </div>
  )
}
