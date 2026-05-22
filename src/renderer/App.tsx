import { useEffect } from 'react'
import 'sonner/dist/styles.css'
import { Toaster } from 'sonner'
import { useStore } from './stores/useStore'
import { Sidebar } from './components/Sidebar'
import { SessionList } from './components/SessionList'
import { SessionDetail } from './components/SessionDetail'
import { TerminalPanel } from './components/TerminalPanel'
import { SettingsModal } from './components/SettingsModal'
import { ConfirmModal } from './components/ConfirmModal'

export function App() {
  const loadSessions = useStore(s => s.loadSessions)
  const loadProjectNames = useStore(s => s.loadProjectNames)
  const loadInstalledTerminals = useStore(s => s.loadInstalledTerminals)
  const showTerminal = useStore(s => s.showTerminal)
  const terminalFullscreen = useStore(s => s.terminalFullscreen)
  const theme = useStore(s => s.theme)
  const detailSession = useStore(s => s.detailSession)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  useEffect(() => {
    loadSessions()
    loadProjectNames()
    loadInstalledTerminals()

    const unsub = window.api.onIndexReady(() => {
      loadSessions()
      loadProjectNames()
    })
    return unsub
  }, [])

  return (
    <>
      {terminalFullscreen && showTerminal ? (
        <div className="flex h-screen flex-col">
          <TerminalPanel fullscreen />
          <SettingsModal />
          <ConfirmModal />
        </div>
      ) : (
        <div className="flex h-screen flex-col">
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <div className="relative flex-1 overflow-hidden">
              <div
                className="absolute inset-0 flex flex-col transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ transform: detailSession ? 'translateX(-30px)' : 'translateX(0)', opacity: detailSession ? 0 : 1, pointerEvents: detailSession ? 'none' : 'auto', zIndex: detailSession ? 0 : 1 }}
              >
                <SessionList />
              </div>
              {detailSession && (
                <div
                  key={detailSession.id}
                  className="absolute inset-0 flex flex-col animate-slide-in"
                  style={{ zIndex: 2 }}
                >
                  <SessionDetail />
                </div>
              )}
            </div>
          </div>

          {showTerminal && <TerminalPanel />}
          <SettingsModal />
          <ConfirmModal />
        </div>
      )}
      <Toaster position="top-center" richColors duration={2000} visibleToasts={3} offset="80px" />
    </>
  )
}
