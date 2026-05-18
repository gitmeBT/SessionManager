import { useStore } from '../stores/useStore'

const TOOL_LABELS: Record<string, string> = {
  opencode: 'OpenCode',
  claude: 'Claude',
  codex: 'Codex'
}

export function ToolIcon({ tool, size = 14 }: { tool: string; size?: number }) {
  if (tool === 'opencode') {
    return (
      <svg width={size} height={size} viewBox="0 0 512 512" style={{ flexShrink: 0 }}>
        <rect width="512" height="512" rx="96" fill="#131010" />
        <path d="M320 224V352H192V224H320Z" fill="#5A5858" />
        <path fillRule="evenodd" clipRule="evenodd" d="M384 416H128V96H384V416ZM320 160H192V352H320V160Z" fill="white" />
      </svg>
    )
  }
  if (tool === 'claude') {
    return (
      <svg width={size} height={size} viewBox="0 0 26 27" fill="none" style={{ flexShrink: 0 }}>
        <path d="M5.07306 17.7192L9.99106 14.9614L10.0721 14.7199L9.99106 14.5854H9.74786L8.92369 14.5352L6.11341 14.46L3.68143 14.3597L1.31701 14.2344L0.722529 14.109L0.168579 13.3694L0.222623 13.0059L0.722529 12.6675L1.43861 12.7301L3.0194 12.843L5.39733 13.0059L7.11322 13.1062L9.66679 13.3694H10.0721L10.1262 13.2065L9.99106 13.1062L9.88297 13.0059L7.42397 11.3387L4.76231 9.58378L3.37068 8.56843L2.62758 8.05448L2.24927 7.57814L2.08714 6.52518L2.76269 5.77306L3.68143 5.83574L3.91112 5.89842L4.84338 6.61293L6.82949 8.15476L9.4236 10.0601L9.80191 10.3735L9.95424 10.2707L9.97755 10.198L9.80191 9.9097L8.39676 7.36504L6.89705 4.77024L6.2215 3.69221L6.04585 3.05291C5.97781 2.78463 5.93777 2.56267 5.93777 2.28826L6.70789 1.2353L7.14024 1.09741L8.18059 1.2353L8.61294 1.61136L9.26147 3.09052L10.3018 5.40954L11.9231 8.56843L12.396 9.50857L12.6527 10.3735L12.7473 10.6367H12.9094V10.4863L13.0445 8.70631L13.2877 6.52518L13.5309 3.71728L13.612 2.92756L14.0038 1.97488L14.7875 1.46093L15.3954 1.74925L15.8954 2.46376L15.8278 2.92756L15.5306 4.85799L14.9496 7.87899L14.5713 9.9097H14.7875L15.0442 9.64646L16.071 8.29265L17.7869 6.13659L18.5435 5.28419L19.4352 4.34404L20.0027 3.89277H21.0836L21.8672 5.07109L21.5159 6.28701L20.408 7.69096L19.4893 8.88181L18.172 10.6467L17.3545 12.0658L17.4278 12.1828L17.6248 12.166L20.5972 11.5267L22.205 11.2384L24.1235 10.9125L24.9882 11.3136L25.0828 11.7273L24.745 12.5672L22.6914 13.0686L20.2864 13.5575L16.7051 14.4005L16.6655 14.4324L16.7123 14.5018L18.3273 14.648L19.0164 14.6856H20.7053L23.8533 14.9238L24.6775 15.4628L25.1639 16.1272L25.0828 16.6411L23.8128 17.2804L22.1104 16.8793L18.1247 15.9266L16.7601 15.5882H16.5709V15.701L17.7058 16.8166L19.8 18.6969L22.4076 21.1288L22.5428 21.7304L22.205 22.2068L21.8537 22.1566L19.5568 20.4268L18.6651 19.6496L16.6655 17.9573H16.5304V18.1328L16.9897 18.8097L19.4352 22.4826L19.5568 23.6107L19.3812 23.9743L18.7462 24.1999L18.0571 24.0745L16.6114 22.0564L15.1387 19.8L13.9498 17.7693L13.8062 17.86L13.0986 25.4158L12.7743 25.8044L12.0177 26.0927L11.3827 25.6164L11.0449 24.8392L11.3827 23.2974L11.788 21.2917L12.1123 19.6997L12.4095 17.7192L12.5911 17.0575L12.575 17.0133L12.43 17.0376L10.9368 19.0855L8.66698 22.1566L6.87002 24.0745L6.43767 24.25L5.69457 23.8614L5.76212 23.162L6.18096 22.5578L8.66698 19.3989L10.1667 17.4309L11.1333 16.3012L11.1239 16.1378L11.0705 16.1332L4.46507 20.4393L3.28961 20.5897L2.7762 20.1134L2.84375 19.3362L3.08695 19.0855L5.07306 17.7192Z" fill="#D97757" />
      </svg>
    )
  }
  if (tool === 'codex') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" fill="currentColor" />
      </svg>
    )
  }
  return null
}

const itemStyle = (active: boolean): React.CSSProperties => ({
  padding: '4px 8px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 12,
  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
  background: active ? 'var(--bg-hover)' : 'transparent',
  marginBottom: 2,
  display: 'flex',
  alignItems: 'center',
  gap: 6
})

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
  marginBottom: 6
}

export function Sidebar() {
  const {
    counts, projectNames, selectedTool, selectedProject, selectedStatus,
    setFilter, loadSessions, expandedProject, projectFiles, toggleProjectExpand,
    theme, toggleTheme
  } = useStore()

  return (
    <div style={{
      width: 220,
      minWidth: 220,
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      userSelect: 'none'
    }}>
      <div style={{
        height: 52,
        minHeight: 52,
        paddingLeft: 12,
        paddingRight: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        WebkitAppRegion: 'drag'
      } as React.CSSProperties}>
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          style={{
            background: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
            width: 26, height: 26,
            borderRadius: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13,
            color: 'var(--text-secondary)',
            WebkitAppRegion: 'no-drag'
          } as React.CSSProperties}
        >
          {theme === 'dark' ? '◐' : '◑'}
        </button>
      </div>

      <div style={{ padding: '0 12px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={labelStyle}>Tool</div>
        {(['all', 'opencode', 'claude', 'codex'] as const).map(tool => (
          <div
            key={tool}
            onClick={() => setFilter('selectedTool', tool)}
            style={itemStyle(selectedTool === tool)}
          >
            {tool !== 'all' && <ToolIcon tool={tool} />}
            {tool === 'all' ? 'All Tools' : TOOL_LABELS[tool]}
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>
              {tool === 'all' ? counts.total : (counts.byTool[tool] || 0)}
            </span>
          </div>
        ))}
      </div>

      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={labelStyle}>Project</div>
        <div
          onClick={() => setFilter('selectedProject', 'all')}
          style={itemStyle(selectedProject === 'all')}
        >
          <span style={{ fontSize: 14 }}>📁</span>
          All Projects
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>{counts.total}</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {projectNames.map(name => {
            const isExpanded = expandedProject === name
            const files = projectFiles[name]
            return (
              <div key={name}>
                <div
                  onClick={() => setFilter('selectedProject', name)}
                  onDoubleClick={() => toggleProjectExpand(name)}
                  title="Double-click to expand files"
                  style={{ ...itemStyle(selectedProject === name), marginTop: 1 }}
                >
                  <span style={{ fontSize: 14 }}>{isExpanded ? '📂' : '📁'}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{name}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>{counts.byProject[name] || 0}</span>
                </div>
                {isExpanded && files && (
                  <div style={{ paddingLeft: 28, paddingBottom: 4 }}>
                    {files.map(f => (
                      <div key={f.name} style={{
                        fontSize: 11, color: 'var(--text-muted)', padding: '1px 4px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        📄 {f.name}
                      </div>
                    ))}
                    {files.length === 0 && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', padding: '2px 4px', fontStyle: 'italic' }}>empty</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ padding: '8px 12px' }}>
        <div style={labelStyle}>Status</div>
        {(['all', 'active', 'starred'] as const).map(status => (
          <div
            key={status}
            onClick={() => setFilter('selectedStatus', status)}
            style={itemStyle(selectedStatus === status)}
          >
            {status === 'all' && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="9" stroke="var(--text-muted)" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="3" fill="var(--text-muted)" />
              </svg>
            )}
            {status === 'active' && (
              <svg width="12" height="12" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="5" fill="var(--green)" />
                <circle cx="12" cy="12" r="8" fill="none" stroke="var(--green)" strokeWidth="1.5" opacity="0.4" />
              </svg>
            )}
            {status === 'starred' && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="var(--text-muted)" />
              </svg>
            )}
            <span>{status === 'all' ? 'All' : status === 'active' ? 'Active' : 'Starred'}</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>
              {status === 'all' ? counts.total : status === 'active' ? counts.active : counts.starred}
            </span>
          </div>
        ))}
      </div>

      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => { loadSessions() }}
          style={{
            width: '100%', padding: '6px 0', fontSize: 11, borderRadius: 4,
            border: '1px solid var(--border)', background: 'var(--bg-hover)',
            color: 'var(--text-secondary)', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontWeight: 500
          }}
        >
          ↻ Refresh
        </button>
      </div>
    </div>
  )
}
