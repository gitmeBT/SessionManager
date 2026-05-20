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
          width: 380,
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

        <div style={{ padding: '16px 18px' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Resume Button
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
              Choose where to open sessions when clicking Resume
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8,
                background: resumeAction === 'system' ? 'var(--bg-hover)' : 'transparent',
                border: `1px solid ${resumeAction === 'system' ? 'var(--accent)' : 'var(--border)'}`,
                cursor: 'pointer', transition: 'all 0.15s'
              }}>
                <input
                  type="radio"
                  name="resumeAction"
                  checked={resumeAction === 'system'}
                  onChange={() => setResumeAction('system')}
                  style={{ accentColor: 'var(--accent)' }}
                />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>System Terminal</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Open in macOS Terminal.app</div>
                </div>
              </label>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8,
                background: resumeAction === 'builtin' ? 'var(--bg-hover)' : 'transparent',
                border: `1px solid ${resumeAction === 'builtin' ? 'var(--accent)' : 'var(--border)'}`,
                cursor: 'pointer', transition: 'all 0.15s'
              }}>
                <input
                  type="radio"
                  name="resumeAction"
                  checked={resumeAction === 'builtin'}
                  onChange={() => setResumeAction('builtin')}
                  style={{ accentColor: 'var(--accent)' }}
                />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>Built-in Terminal</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Open in app terminal panel</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
