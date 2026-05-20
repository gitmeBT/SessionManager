import { useStore } from '../stores/useStore'

export function SettingsModal() {
  const { showSettings, setShowSettings, resumeAction, setResumeAction } = useStore()

  if (!showSettings) return null

  return (
    <div
      onClick={() => setShowSettings(false)}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          width: 400,
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Settings</span>
          <button
            onClick={() => setShowSettings(false)}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4
            }}
          >×</button>
        </div>

        <div style={{ padding: '18px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
            Resume Behavior
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
            Where to open sessions when clicking Resume
          </div>
          <select
            value={resumeAction}
            onChange={e => setResumeAction(e.target.value as 'system' | 'builtin')}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 12,
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23888\' stroke-width=\'2\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
              backgroundSize: 16
            }}
          >
            <option value="system">System Default Terminal</option>
            <option value="builtin">Built-in Terminal</option>
          </select>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
            {resumeAction === 'system'
              ? 'Will open in your default terminal app (e.g. Warp, iTerm2, Terminal)'
              : 'Will open in the terminal panel at the bottom of this app'}
          </div>
        </div>
      </div>
    </div>
  )
}
