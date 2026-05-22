import { memo, useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GroupedVirtuoso } from 'react-virtuoso'
import { Pin, Star, Archive, Trash2, Play, Search, Flame, Eye } from 'lucide-react'
import { useStore } from '../stores/useStore'
import { ToolIcon } from './Sidebar'
import { cn } from '../lib/utils'
import { translate } from '../lib/i18n'

const SORT_KEYS = ['updatedAt', 'createdAt', 'messageCount', 'tokensTotal', 'cost'] as const
const SORT_LABEL_KEYS: Record<string, string> = {
  updatedAt: 'list.sort.updated',
  createdAt: 'list.sort.created',
  messageCount: 'list.sort.rounds',
  tokensTotal: 'list.sort.tokens',
  cost: 'list.sort.cost',
}

const GROUP_KEYS = ['today', 'week', 'month', 'older'] as const
const GROUP_LABEL_KEYS: Record<string, string> = {
  today: 'list.group.today',
  week: 'list.group.week',
  month: 'list.group.month',
  older: 'list.group.older',
}

function formatTokens(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function formatRelativeTime(ts: number): string {
  const now = Date.now()
  const date = new Date(ts * 1000)
  const diffMs = now - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffH < 24) return `${diffH}h ago`
  if (diffD < 30) return `${diffD}d ago`
  const y = date.getFullYear() % 100
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

function formatCost(n: number): string {
  if (n === 0) return ''
  if (n < 0.01) return '<$0.01'
  return '$' + n.toFixed(2)
}

type CtxMenuState = { x: number; y: number; sessionId: string; session: any } | null

const ContextMenu = memo(function ContextMenu({ ctx, onClose, togglePin, toggleStar, toggleArchive, deleteSession, openDetail }: {
  ctx: CtxMenuState
  onClose: () => void
  togglePin: (id: string) => void
  toggleStar: (id: string) => void
  toggleArchive: (id: string) => void
  deleteSession: (id: string) => void
  openDetail: (s: any) => void
}) {
  const lang = useStore(s => s.language)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ctx) return
    const close = (e: MouseEvent) => {
      if (ref.current && ref.current.contains(e.target as Node)) return
      e.stopImmediatePropagation()
      e.preventDefault()
      onClose()
    }
    const closeCtx = (e: MouseEvent) => {
      if (ref.current && ref.current.contains(e.target as Node)) return
      e.preventDefault()
      onClose()
    }
    const closeKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const closeWheel = () => onClose()
    document.addEventListener('click', close, true)
    document.addEventListener('contextmenu', closeCtx, true)
    document.addEventListener('keydown', closeKey)
    window.addEventListener('wheel', closeWheel, { passive: true })
    return () => {
      document.removeEventListener('click', close, true)
      document.removeEventListener('contextmenu', closeCtx, true)
      document.removeEventListener('keydown', closeKey)
      window.removeEventListener('wheel', closeWheel)
    }
  }, [ctx, onClose])

  useEffect(() => {
    if (!ctx || !ref.current) return
    const el = ref.current
    const raf = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect()
      let x = parseFloat(el.style.left), y = parseFloat(el.style.top)
      if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - 8
      if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 8
      if (x < 4) x = 4
      if (y < 4) y = 4
      el.style.left = x + 'px'
      el.style.top = y + 'px'
    })
    return () => cancelAnimationFrame(raf)
  }, [ctx])

  if (!ctx) return null

  const s = ctx.session
  const items = [
    { icon: Eye, label: translate('ctx.viewDetail', lang), action: () => { onClose(); openDetail(s) } },
    { icon: Pin, label: s.pinned ? translate('ctx.unpin', lang) : translate('ctx.pin', lang), action: () => togglePin(ctx.sessionId) },
    { icon: Star, label: s.starred ? translate('ctx.unstar', lang) : translate('ctx.star', lang), action: () => toggleStar(ctx.sessionId) },
    { icon: Archive, label: translate('ctx.archive', lang), action: () => { onClose(); useStore.getState().confirm(translate('confirm.archive', lang)).then(ok => { if (ok) toggleArchive(ctx.sessionId) }) } },
    { icon: Trash2, label: translate('ctx.delete', lang), danger: true, action: () => { onClose(); useStore.getState().confirm(translate('confirm.delete', lang)).then(ok => { if (ok) deleteSession(ctx.sessionId) }) } },
  ]

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'fixed', zIndex: 9999, left: ctx.x, top: ctx.y, minWidth: 150 }}
        className="rounded-lg border border-border bg-card/80 p-1 shadow-2xl backdrop-blur-xl"
      >
        {items.map(({ icon: Icon, label, danger, action }) => (
          <div
            key={label}
            onClick={() => { action(); onClose() }}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors',
              danger ? 'text-danger hover:bg-danger/10' : 'text-foreground hover:bg-hover'
            )}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <Icon size={13} />
            {label}
          </div>
        ))}
      </motion.div>
    </AnimatePresence>,
    document.body
  )
})

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
  const sessions = useStore(s => s.sessions)
  const searchQuery = useStore(s => s.searchQuery)
  const setSearch = useStore(s => s.setSearch)
  const sortBy = useStore(s => s.sortBy)
  const setSortBy = useStore(s => s.setSortBy)
  const openDetail = useStore(s => s.openDetail)
  const togglePin = useStore(s => s.togglePin)
  const toggleStar = useStore(s => s.toggleStar)
  const toggleArchive = useStore(s => s.toggleArchive)
  const deleteSession = useStore(s => s.deleteSession)
  const lang = useStore(s => s.language)

  const [ctxMenu, setCtxMenu] = useState<CtxMenuState>(null)
  const closeCtx = useCallback(() => setCtxMenu(null), [])
  const [selectedIndex, setSelectedIndex] = useState(0)

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
      if (a.pinned !== b.pinned) return (b.pinned || 0) - (a.pinned || 0)
      const aVal = (a as any)[sortBy] || 0
      const bVal = (b as any)[sortBy] || 0
      return (bVal as number) - (aVal as number)
    })

    return list
  }, [sessions, searchQuery, sortBy])

  const visibleGroups = useMemo(() => {
    const groups: Record<string, typeof sortedSessions> = { today: [], week: [], month: [], older: [] }
    for (const s of sortedSessions) {
      const g = getTimeGroup(s.updatedAt)
      groups[g].push(s)
    }
    return GROUP_KEYS
      .filter(key => groups[key] && groups[key].length > 0)
      .map(key => ({ key, label: translate(GROUP_LABEL_KEYS[key] as any, lang), items: groups[key] }))
  }, [sortedSessions, lang])

  const groupCounts = useMemo(() => visibleGroups.map(g => g.items.length), [visibleGroups])

  const itemData = useMemo(() => {
    const flat: { session: any; groupIndex: number }[] = []
    visibleGroups.forEach((g, gi) => {
      for (const session of g.items) {
        flat.push({ session, groupIndex: gi })
      }
    })
    return flat
  }, [visibleGroups])

  useEffect(() => {
    setSelectedIndex(0)
  }, [sortedSessions])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, itemData.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if ((e.key === 'Enter' || e.key === 'ArrowRight') && itemData[selectedIndex]) {
        e.preventDefault()
        openDetail(itemData[selectedIndex].session)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [itemData, selectedIndex, openDetail])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Search + sort bar — top portion is draggable */}
      <div
        className="flex shrink-0 flex-col gap-3 border-b border-border px-6 py-4"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="relative" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder={translate('list.search', lang)}
            value={searchQuery}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2.5 pr-3 pl-9 text-xs text-foreground transition-colors focus:border-primary"
          />
        </div>
        <div className="flex gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {SORT_KEYS.map(key => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={cn(
                'cursor-pointer rounded px-2 py-0.5 text-[10px] transition-colors',
                sortBy === key
                  ? 'bg-hover font-semibold text-foreground'
                  : 'text-foreground-muted hover:text-foreground-secondary'
              )}
            >
              {translate(SORT_LABEL_KEYS[key] as any, lang)}
            </button>
          ))}
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-hidden">
        {sortedSessions.length === 0 ? (
          <div className="px-5 py-10 text-center text-xs text-foreground-muted">
            {translate('list.noSessions', lang)}
          </div>
        ) : (
          <GroupedVirtuoso
            groupCounts={groupCounts}
            groupContent={(index) => {
              const g = visibleGroups[index]
              return (
                <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background-secondary/80 px-6 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted backdrop-blur-sm">
                  <span>{g.label}</span>
                  <span className="text-[9px] opacity-60">{g.items.length}</span>
                  <div className="h-px flex-1 bg-border/50" />
                </div>
              )
            }}
            itemContent={(index) => {
              const { session } = itemData[index]
              return (
                <SessionCard
                  session={session}
                  openDetail={openDetail}
                  setCtxMenu={setCtxMenu}
                  selected={index === selectedIndex}
                />
              )
            }}
          />
        )}
      </div>
      <ContextMenu ctx={ctxMenu} onClose={closeCtx} togglePin={togglePin} toggleStar={toggleStar} toggleArchive={toggleArchive} deleteSession={deleteSession} openDetail={openDetail} />
    </div>
  )
}

const SessionCard = memo(function SessionCard({ session, openDetail, setCtxMenu, selected }: { session: any; openDetail: (s: any) => void; setCtxMenu: (v: CtxMenuState) => void; selected?: boolean }) {
  const resumeAction = useStore(s => s.resumeAction)
  const terminalApp = useStore(s => s.terminalApp)
  const lang = useStore(s => s.language)
  const tokensStr = session.tokensTotal > 0 ? formatTokens(session.tokensTotal) : ''
  const costStr = formatCost(session.cost)
  const isHot = session.tokensTotal > 50000
  const isEmpty = session.messageCount === 0

  const handleResume = (s: any) => {
    const cmd = s.tool === 'opencode'
      ? `opencode --session ${s.originalId} "${s.projectPath || ''}"`
      : s.tool === 'claude'
        ? `claude --resume ${s.originalId}`
        : `codex --resume ${s.originalId}`

    if (resumeAction === 'system') {
      window.api.openSystemTerminal(cmd, s.projectPath || undefined, terminalApp || undefined)
    } else {
      useStore.getState().resumeSession(s)
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCtxMenu({ x: e.clientX, y: e.clientY, sessionId: session.id, session })
  }

  return (
    <div
      onClick={() => openDetail(session)}
      onContextMenu={handleContextMenu}
      className={cn(
        'glass-card mx-5 my-2 cursor-pointer rounded-xl border px-5 py-4 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5',
        selected ? 'border-primary/50 bg-primary/10 shadow-md shadow-primary/10' : 'border-border/50',
        isEmpty && 'opacity-45'
      )}
    >
      <div className={cn('flex items-start gap-3.5', isEmpty && 'opacity-45')}>
        <div className="pt-1">
          <ToolIcon tool={session.tool} size={20} />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center gap-1.5 overflow-hidden text-[13px] font-medium text-foreground">
            {session.pinned && <Pin size={12} fill="currentColor" className="shrink-0 text-primary" />}
            <span className="truncate">{session.title || translate('list.untitled', lang)}</span>
            {isEmpty && (
              <span className="ml-1.5 italic text-foreground-muted">{translate('list.empty', lang)}</span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-foreground-muted">
            {session.projectName && (
              <span className="max-w-[160px] truncate rounded-md border border-border/50 bg-hover/50 px-2 py-0.5 text-[10px] text-foreground-secondary">
                {session.projectName}
              </span>
            )}
            {session.updatedAt && (
              <span>{formatRelativeTime(session.updatedAt)}</span>
            )}
            {session.messageCount > 0 && (
              <span>{session.messageCount} {translate('list.rounds', lang)}</span>
            )}
            {tokensStr && (
              <span className={cn('flex items-center gap-0.5', isHot ? 'text-danger' : 'text-primary')}>
                {isHot && <Flame size={9} />}
                {tokensStr} {translate('list.tok', lang)}
              </span>
            )}
            {costStr && <span className="text-orange">{costStr}</span>}
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); handleResume(session) }}
          className="mt-1 flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border/50 bg-hover/50 px-3 py-2 text-[11px] text-foreground-secondary transition-all duration-150 hover:border-primary hover:bg-primary hover:text-white hover:shadow-md hover:shadow-primary/25"
        >
          <Play size={9} />
          {translate('list.resume', lang)}
        </button>
      </div>
    </div>
  )
})
