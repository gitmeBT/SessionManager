import { useState, useRef, useEffect } from 'react'
import { useStore } from '../stores/useStore'

const TERMINAL_OPTIONS = [
  { value: '', label: 'System Default' },
  { value: 'Warp', label: 'Warp' },
  { value: 'iTerm', label: 'iTerm2' },
  { value: 'Terminal', label: 'Terminal.app' },
  { value: 'Alacritty', label: 'Alacritty' },
  { value: 'Hyper', label: 'Hyper' },
  { value: 'kitty', label: 'kitty' },
]

const RESUME_OPTIONS = [
  { value: 'system', label: 'System Terminal' },
  { value: 'builtin', label: 'Built-in Terminal' },
]

function CustomSelect({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const current = options.find(o => o.value === value) || options[0]

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '8px 32px 8px 12px',
          fontSize: 12,
          borderRadius: 6,
          border: '1px solid var(--border)',
          background: open ? 'var(--bg-hover)' : 'var(--bg-primary)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          position: 'relative',
          userSelect: 'none'
        }}
      >
        {current.label}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{
          position: 'absolute', right: 10, top: '50%', transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
          transition: 'transform 0.15s'
        }}>
          <polyline points="6 9 12 15 18 9" stroke="var(--text-muted)" strokeWidth="2" fill="none" />
        </svg>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          marginTop: 4, borderRadius: 6,
          border: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          zIndex: 10, overflow: 'hidden'
        }}>
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              style={{
                padding: '7px 12px',
                fontSize: 12,
                cursor: 'pointer',
                background: opt.value === value ? 'var(--bg-hover)' : 'transparent',
                color: opt.value === value ? 'var(--accent)' : 'var(--text-primary)',
                fontWeight: opt.value === value ? 500 : 400,
                transition: 'background 0.1s'
              }}
              onMouseEnter={e => { if (opt.value !== value) e.currentTarget.style.background = 'var(--bg-hover)' }}
              onMouseLeave={e => { if (opt.value !== value) e.currentTarget.style.background = 'transparent' }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function SettingsModal() {
  const { showSettings, setShowSettings, resumeAction, setResumeAction, terminalApp, setTerminalApp } = useStore()

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

        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Resume Behavior
            </div>
            <CustomSelect
              value={resumeAction}
              onChange={v => setResumeAction(v as 'system' | 'builtin')}
              options={RESUME_OPTIONS}
            />
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
              {resumeAction === 'system'
                ? 'Open session resume command in an external terminal'
                : 'Open in the terminal panel at the bottom of this app'}
            </div>
          </div>

          {resumeAction === 'system' && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Terminal Application
              </div>
              <CustomSelect
                value={terminalApp}
                onChange={setTerminalApp}
                options={TERMINAL_OPTIONS}
              />
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                {terminalApp
                  ? `Will open with ${terminalApp}`
                  : 'Uses macOS default handler for .command files'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
