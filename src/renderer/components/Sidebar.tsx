import { memo, useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Sun, Moon, RefreshCw, FolderOpen, Folder, FileText, Star, Pin, Archive, CircleDot, Layers, Settings, ChevronRight, Search, FolderSearch } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../stores/useStore'
import { cn } from '../lib/utils'
import { translate } from '../lib/i18n'

const TOOL_LABELS: Record<string, string> = {
  opencode: 'OpenCode',
  claude: 'Claude',
  codex: 'Codex'
}

export const ToolIcon = memo(function ToolIcon({ tool, size = 14 }: { tool: string; size?: number }) {
  if (tool === 'opencode') {
    return (
      <svg width={size} height={size} viewBox="0 0 512 512" className="shrink-0">
        <rect width="512" height="512" rx="96" fill="#131010" />
        <path d="M320 224V352H192V224H320Z" fill="#5A5858" />
        <path fillRule="evenodd" clipRule="evenodd" d="M384 416H128V96H384V416ZM320 160H192V352H320V160Z" fill="white" />
      </svg>
    )
  }
  if (tool === 'claude') {
    return (
      <svg width={size} height={size} viewBox="0 0 26 27" fill="none" className="shrink-0">
        <path d="M5.07306 17.7192L9.99106 14.9614L10.0721 14.7199L9.99106 14.5854H9.74786L8.92369 14.5352L6.11341 14.46L3.68143 14.3597L1.31701 14.2344L0.722529 14.109L0.168579 13.3694L0.222623 13.0059L0.722529 12.6675L1.43861 12.7301L3.0194 12.843L5.39733 13.0059L7.11322 13.1062L9.66679 13.3694H10.0721L10.1262 13.2065L9.99106 13.1062L9.88297 13.0059L7.42397 11.3387L4.76231 9.58378L3.37068 8.56843L2.62758 8.05448L2.24927 7.57814L2.08714 6.52518L2.76269 5.77306L3.68143 5.83574L3.91112 5.89842L4.84338 6.61293L6.82949 8.15476L9.4236 10.0601L9.80191 10.3735L9.95424 10.2707L9.97755 10.198L9.80191 9.9097L8.39676 7.36504L6.89705 4.77024L6.2215 3.69221L6.04585 3.05291C5.97781 2.78463 5.93777 2.56267 5.93777 2.28826L6.70789 1.2353L7.14024 1.09741L8.18059 1.2353L8.61294 1.61136L9.26147 3.09052L10.3018 5.40954L11.9231 8.56843L12.396 9.50857L12.6527 10.3735L12.7473 10.6367H12.9094V10.4863L13.0445 8.70631L13.2877 6.52518L13.5309 3.71728L13.612 2.92756L14.0038 1.97488L14.7875 1.46093L15.3954 1.74925L15.8954 2.46376L15.8278 2.92756L15.5306 4.85799L14.9496 7.87899L14.5713 9.9097H14.7875L15.0442 9.64646L16.071 8.29265L17.7869 6.13659L18.5435 5.28419L19.4352 4.34404L20.0027 3.89277H21.0836L21.8672 5.07109L21.5159 6.28701L20.408 7.69096L19.4893 8.88181L18.172 10.6467L17.3545 12.0658L17.4278 12.1828L17.6248 12.166L20.5972 11.5267L22.205 11.2384L24.1235 10.9125L24.9882 11.3136L25.0828 11.7273L24.745 12.5672L22.6914 13.0686L20.2864 13.5575L16.7051 14.4005L16.6655 14.4324L16.7123 14.5018L18.3273 14.648L19.0164 14.6856H20.7053L23.8533 14.9238L24.6775 15.4628L25.1639 16.1272L25.0828 16.6411L23.8128 17.2804L22.1104 16.8793L18.1247 15.9266L16.7601 15.5882H16.5709V15.701L17.7058 16.8166L19.8 18.6969L22.4076 21.1288L22.5428 21.7304L22.205 22.2068L21.8537 22.1566L19.5568 20.4268L18.6651 19.6496L16.6655 17.9573H16.5304V18.1328L16.9897 18.8097L19.4352 22.4826L19.5568 23.6107L19.3812 23.9743L18.7462 24.1999L18.0571 24.0745L16.6114 22.0564L15.1387 19.8L13.9498 17.7693L13.8062 17.86L13.0986 25.4158L12.7743 25.8044L12.0177 26.0927L11.3827 25.6164L11.0449 24.8392L11.3827 23.2974L11.788 21.2917L12.1123 19.6997L12.4095 17.7192L12.5911 17.0575L12.575 17.0133L12.43 17.0376L10.9368 19.0855L8.66698 22.1566L6.87002 24.0745L6.43767 24.25L5.69457 23.8614L5.76212 23.162L6.18096 22.5578L8.66698 19.3989L10.1667 17.4309L11.1333 16.3012L11.1239 16.1378L11.0705 16.1332L4.46507 20.4393L3.28961 20.5897L2.7762 20.1134L2.84375 19.3362L3.08695 19.0855L5.07306 17.7192Z" fill="#D97757" />
      </svg>
    )
  }
  if (tool === 'codex') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" fill="currentColor" />
      </svg>
    )
  }
  return null
})

const STATUS_ICONS: Record<string, typeof Layers> = {
  all: Layers,
  active: CircleDot,
  starred: Star,
  pinned: Pin,
  archived: Archive,
}

function SectionHeader({ label, collapsed, onToggle }: { label: string; collapsed: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      className="mb-2 flex cursor-pointer items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted select-none hover:text-foreground-secondary"
    >
      <ChevronRight size={10} className={cn('transition-transform', !collapsed && 'rotate-90')} />
      {label}
    </div>
  )
}

export function Sidebar() {
  const counts = useStore(s => s.counts)
  const projectNames = useStore(s => s.projectNames)
  const selectedTool = useStore(s => s.selectedTool)
  const selectedProject = useStore(s => s.selectedProject)
  const selectedStatus = useStore(s => s.selectedStatus)
  const setFilter = useStore(s => s.setFilter)
  const loadSessions = useStore(s => s.loadSessions)
  const expandedProject = useStore(s => s.expandedProject)
  const projectFiles = useStore(s => s.projectFiles)
  const toggleProjectExpand = useStore(s => s.toggleProjectExpand)
  const theme = useStore(s => s.theme)
  const toggleTheme = useStore(s => s.toggleTheme)
  const lang = useStore(s => s.language)
  const setShowSettings = useStore(s => s.setShowSettings)

  const [collapsedTool, setCollapsedTool] = useState(false)
  const [collapsedProject, setCollapsedProject] = useState(false)
  const [collapsedStatus, setCollapsedStatus] = useState(false)
  const [projectSearch, setProjectSearch] = useState('')
  const [statusHeight, setStatusHeight] = useState(220)
  const resizeRef = useRef<{ startY: number; startH: number } | null>(null)

  // Status resize
  const handleResizeDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    resizeRef.current = { startY: e.clientY, startH: statusHeight }
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return
      const delta = resizeRef.current.startY - ev.clientY
      setStatusHeight(Math.max(80, Math.min(400, resizeRef.current.startH + delta)))
    }
    const onUp = () => {
      resizeRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [statusHeight])

  const itemCls = (active: boolean) =>
    cn(
      'flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-all',
      active
        ? 'border border-primary/30 bg-primary/10 font-medium text-primary'
        : 'border border-transparent text-foreground-secondary hover:bg-hover/50'
    )

  // Sort tools by count descending
  const sortedTools = useMemo(() => {
    const tools = ['opencode', 'claude', 'codex'] as const
    return [...tools].sort((a, b) => (counts.byTool[b] || 0) - (counts.byTool[a] || 0))
  }, [counts.byTool])

  const filteredProjects = useMemo(() => {
    if (!projectSearch) return projectNames
    const q = projectSearch.toLowerCase()
    return projectNames.filter(n => n.toLowerCase().includes(q))
  }, [projectNames, projectSearch])

  const [projCtx, setProjCtx] = useState<{ x: number; y: number; name: string } | null>(null)
  const projCtxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!projCtx) return
    const close = () => setProjCtx(null)
    const onClick = (e: MouseEvent) => {
      if (projCtxRef.current && projCtxRef.current.contains(e.target as Node)) return
      close()
    }
    document.addEventListener('click', onClick)
    document.addEventListener('contextmenu', onClick)
    document.addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Escape') close() })
    return () => { document.removeEventListener('click', onClick); document.removeEventListener('contextmenu', onClick) }
  }, [projCtx])

  return (
    <div className="flex w-[260px] min-w-[260px] flex-col overflow-hidden border-r border-border bg-background-secondary select-none">
      {/* Traffic light spacer + controls */}
      <div
        className="flex h-[52px] min-h-[52px] items-center justify-end pr-3"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center gap-1.5" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button
            onClick={() => loadSessions()}
            title={translate('sidebar.refresh', lang)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-border bg-hover text-foreground-secondary transition-colors hover:text-foreground"
          >
            <RefreshCw size={12} />
          </button>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? translate('sidebar.themeSwitch.light', lang) : translate('sidebar.themeSwitch.dark', lang)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-border bg-hover text-foreground-secondary transition-colors hover:text-foreground"
          >
            {theme === 'dark' ? <Moon size={13} /> : <Sun size={13} />}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-border bg-hover text-foreground-secondary transition-colors hover:text-foreground"
          >
            <Settings size={12} />
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="px-4" style={{ position: 'relative', top: -14 }}>
        <span className="text-lg font-bold tracking-tight text-foreground">
          SessionManager
        </span>
      </div>

      {/* Tool filter */}
      <div className="border-b border-border px-4 pb-2" style={{ marginTop: -6 }}>
        <SectionHeader label={translate('sidebar.tool', lang)} collapsed={collapsedTool} onToggle={() => setCollapsedTool(!collapsedTool)} />
        {!collapsedTool && (
          <div>
            <div onClick={() => setFilter('selectedTool', 'all')} className={itemCls(selectedTool === 'all')}>
              {translate('sidebar.allTools', lang)}
              <span className="ml-auto text-[10px] text-foreground-muted">{counts.total}</span>
            </div>
            {sortedTools.map(tool => (
              <div key={tool} onClick={() => setFilter('selectedTool', tool)} className={itemCls(selectedTool === tool)}>
                <ToolIcon tool={tool} />
                {TOOL_LABELS[tool]}
                <span className="ml-auto text-[10px] text-foreground-muted">{counts.byTool[tool] || 0}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project filter */}
      <div className="flex min-h-[120px] flex-1 flex-col overflow-hidden border-b border-border px-4 py-2">
        <div className="mb-2 flex items-center gap-2">
          <div onClick={() => setCollapsedProject(!collapsedProject)} className="flex cursor-pointer items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted select-none hover:text-foreground-secondary">
            <ChevronRight size={10} className={cn('transition-transform', !collapsedProject && 'rotate-90')} />
            {translate('sidebar.project', lang)}
          </div>
          {!collapsedProject && (
            <div className="relative ml-auto">
              <Search size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input
                type="text"
                value={projectSearch}
                onChange={e => setProjectSearch(e.target.value)}
                placeholder=""
                className="w-20 rounded border border-border bg-background py-0.5 pr-2 pl-6 text-[10px] text-foreground transition-all focus:w-28 focus:border-primary"
              />
            </div>
          )}
        </div>
        {!collapsedProject && (
          <>
            <div onClick={() => setFilter('selectedProject', 'all')} className={itemCls(selectedProject === 'all')}>
              <Folder size={14} className="shrink-0 text-foreground-muted" />
              {translate('sidebar.allProjects', lang)}
              <span className="ml-auto text-[10px] text-foreground-muted">{counts.total}</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredProjects.map(name => {
                const isExpanded = expandedProject === name
                const files = projectFiles[name]
                return (
                  <div key={name}>
                    <div
                      onClick={() => setFilter('selectedProject', name)}
                      onDoubleClick={() => toggleProjectExpand(name)}
                      onContextMenu={e => { e.preventDefault(); setProjCtx({ x: e.clientX, y: e.clientY, name }) }}
                      title={translate('sidebar.doubleClickExpand', lang)}
                      className={cn('mt-0.5', itemCls(selectedProject === name))}
                    >
                      {isExpanded
                        ? <FolderOpen size={14} className="shrink-0 text-foreground-muted" />
                        : <Folder size={14} className="shrink-0 text-foreground-muted" />
                      }
                      <span className="flex-1 truncate">{name}</span>
                      <span className="shrink-0 text-[10px] text-foreground-muted">{counts.byProject[name] || 0}</span>
                    </div>
                    {isExpanded && files && (
                      <div className="pb-1 pl-9">
                        {files.map(f => (
                          <div key={f.name} className="flex items-center gap-1.5 truncate px-1 py-1 text-[11px] text-foreground-muted">
                            <FileText size={11} className="shrink-0" />
                            {f.name}
                          </div>
                        ))}
                        {files.length === 0 && (
                          <div className="px-1 py-1 text-[10px] italic text-foreground-muted">{translate('sidebar.empty', lang)}</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Status filter with resize */}
      <div className="shrink-0 flex flex-col" style={{ height: collapsedStatus ? 'auto' : statusHeight }}>
        <div className="px-4 pt-2">
          <SectionHeader label={translate('sidebar.status', lang)} collapsed={collapsedStatus} onToggle={() => setCollapsedStatus(!collapsedStatus)} />
        </div>
        {!collapsedStatus && (
          <div className="flex-1 overflow-y-auto px-4 pb-2">
            {(['all', 'active', 'starred', 'pinned', 'archived'] as const).map(status => {
              const Icon = STATUS_ICONS[status]
              const count = status === 'all' ? counts.total
                : status === 'active' ? counts.active
                : status === 'starred' ? counts.starred
                : status === 'pinned' ? (counts as any).pinned || 0
                : counts.archived
              return (
                <div key={status} onClick={() => setFilter('selectedStatus', status)} className={itemCls(selectedStatus === status)}>
                  <Icon size={13} className={cn('shrink-0', status === 'active' && 'text-green', status === 'starred' && 'text-orange')} />
                  <span>{translate(`sidebar.status.${status}` as any, lang)}</span>
                  <span className="ml-auto text-[10px] text-foreground-muted">{count}</span>
                </div>
              )
            })}
          </div>
        )}
        {!collapsedStatus && (
          <div
            onMouseDown={handleResizeDown}
            className="cursor-row-resize border-t border-border px-4 py-1 text-center"
          >
            <div className="mx-auto h-0.5 w-8 rounded-full bg-border" />
          </div>
        )}
      </div>
      {projCtx && (
        <div
          ref={projCtxRef}
          style={{ position: 'fixed', zIndex: 9999, left: projCtx.x, top: projCtx.y, minWidth: 150 }}
          className="rounded-lg border border-border bg-card/80 p-1 shadow-2xl backdrop-blur-xl"
        >
          <div
            onClick={() => { window.api.openInFinder(projCtx.name); setProjCtx(null) }}
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-hover"
          >
            <FolderSearch size={13} />
            {translate('sidebar.openInFinder', lang)}
          </div>
        </div>
      )}
    </div>
  )
}
