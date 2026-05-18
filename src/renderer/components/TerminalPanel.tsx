import { useEffect, useRef, useCallback } from 'react'
import { useStore } from '../stores/useStore'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

function getTermTheme(isLight: boolean) {
  return {
    background: isLight ? '#f5f6f8' : '#0d0d1a',
    foreground: isLight ? '#1a1a2e' : '#e0e0e0',
    cursor: isLight ? '#3b7dd8' : '#4a9eff',
    selectionBackground: isLight ? '#3b7dd833' : '#4a9eff44',
    black: '#555555',
    red: '#ef4444',
    green: '#4ade80',
    yellow: '#fbbf24',
    blue: '#4a9eff',
    magenta: '#c084fc',
    cyan: '#22d3ee',
    white: isLight ? '#1a1a2e' : '#e0e0e0',
    brightBlack: '#888888',
    brightRed: '#f87171',
    brightGreen: '#6ee7a0',
    brightYellow: '#fcd34d',
    brightBlue: '#6ab0ff',
    brightMagenta: '#d8b4fe',
    brightCyan: '#67e8f9',
    brightWhite: isLight ? '#000000' : '#ffffff'
  }
}

function TerminalInstance({ tabId }: { tabId: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const { activeTabId, theme } = useStore()
  const isActive = activeTabId === tabId
  const isLight = theme === 'light'

  const initTerminal = useCallback(() => {
    if (!ref.current) return
    if (termRef.current) return

    const term = new Terminal({
      fontSize: 13,
      fontFamily: '"SF Mono", Menlo, Monaco, "Courier New", monospace',
      theme: getTermTheme(isLight),
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 5000,
      allowTransparency: true,
      allowProposedApi: true
    })

    const fit = new FitAddon()
    const webLinks = new WebLinksAddon()
    term.loadAddon(fit)
    term.loadAddon(webLinks)
    term.open(ref.current)
    try { fit.fit() } catch {}

    term.onData(data => { window.api.ptyWrite(tabId, data) })

    termRef.current = term
    fitRef.current = fit
  }, [tabId])

  useEffect(() => { initTerminal() }, [initTerminal])

  useEffect(() => {
    return () => {
      if (termRef.current) {
        termRef.current.dispose()
        termRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (termRef.current) {
      termRef.current.options.theme = getTermTheme(isLight)
    }
  }, [isLight])

  useEffect(() => {
    const unsub = window.api.onPtyData(({ tabId: tid, data }) => {
      if (tid === tabId && termRef.current) termRef.current.write(data)
    })
    return unsub
  }, [tabId])

  useEffect(() => {
    const unsub = window.api.onPtyExit(({ tabId: tid }) => {
      if (tid === tabId && termRef.current) {
        termRef.current.write('\r\n\x1b[90m[Process exited]\x1b[0m\r\n')
      }
    })
    return unsub
  }, [tabId])

  useEffect(() => {
    if (isActive && termRef.current && fitRef.current) {
      setTimeout(() => {
        try {
          fitRef.current!.fit()
          termRef.current!.focus()
          const dims = fitRef.current!.proposeDimensions()
          if (dims) window.api.ptyResize(tabId, dims.cols, dims.rows)
        } catch {}
      }, 50)
    }
  }, [isActive, tabId])

  useEffect(() => {
    const handleResize = () => {
      if (fitRef.current && termRef.current) {
        try {
          fitRef.current.fit()
          const dims = fitRef.current.proposeDimensions()
          if (dims) window.api.ptyResize(tabId, dims.cols, dims.rows)
        } catch {}
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [tabId])

  return (
    <div
      ref={ref}
      style={{
        width: '100%', height: '100%',
        display: isActive ? 'block' : 'none',
        padding: '4px 0 0 4px'
      }}
    />
  )
}

export function TerminalPanel({ fullscreen = false }: { fullscreen?: boolean }) {
  const { terminalTabs, activeTabId, setActiveTab, closeTab, spawnTerminal, setTerminalFullscreen } = useStore()

  useEffect(() => {
    if (!fullscreen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTerminalFullscreen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [fullscreen, setTerminalFullscreen])

  if (terminalTabs.length === 0) return null

  return (
    <div style={{
      height: fullscreen ? '100vh' : 300,
      minHeight: fullscreen ? '100vh' : 200,
      borderTop: fullscreen ? 'none' : '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      background: 'var(--terminal-bg)'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '0 8px', height: 32, gap: 2, flexShrink: 0
      }}>
        {terminalTabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '4px 10px', fontSize: 11,
              borderRadius: '4px 4px 0 0', cursor: 'pointer',
              background: activeTabId === tab.id ? 'var(--bg-primary)' : 'transparent',
              color: activeTabId === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: 6,
              border: activeTabId === tab.id ? '1px solid var(--border)' : '1px solid transparent',
              borderBottom: 'none', maxWidth: 160, overflow: 'hidden', whiteSpace: 'nowrap'
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab.title}</span>
            <span
              onClick={e => { e.stopPropagation(); closeTab(tab.id) }}
              style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1, padding: '0 2px' }}
            >×</span>
          </div>
        ))}
        <button
          onClick={spawnTerminal}
          style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            fontSize: 16, cursor: 'pointer', padding: '0 6px', lineHeight: '32px'
          }}
        >+</button>
        <button
          onClick={() => setTerminalFullscreen(!fullscreen)}
          title={fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
          style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            color: fullscreen ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer', fontSize: 14, padding: '4px 6px'
          }}
        >
          {fullscreen ? '⬒' : '⬓'}
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {terminalTabs.map(tab => <TerminalInstance key={tab.id} tabId={tab.id} />)}
      </div>
    </div>
  )
}
