import { useEffect, useState, useRef } from 'react'
import { useStore } from './stores/useStore'
import { Sidebar } from './components/Sidebar'
import { SessionList } from './components/SessionList'
import { SessionDetail } from './components/SessionDetail'
import { TerminalPanel } from './components/TerminalPanel'

type View = 'list' | 'detail'

const ANIM_MS = 280

export function App() {
  const { loadSessions, loadProjectNames, showTerminal, terminalFullscreen, theme, detailSession } = useStore()

  const [currentView, setCurrentView] = useState<View>('list')
  const [exitingView, setExitingView] = useState<View | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const prevDetail = useRef(!!detailSession)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  useEffect(() => {
    loadSessions()
    loadProjectNames()
  }, [])

  useEffect(() => {
    const nowDetail = !!detailSession
    if (nowDetail !== prevDetail.current) {
      prevDetail.current = nowDetail
      const target: View = nowDetail ? 'detail' : 'list'
      const leaving: View = nowDetail ? 'list' : 'detail'

      if (timerRef.current) clearTimeout(timerRef.current)

      setExitingView(leaving)
      setCurrentView(target)

      timerRef.current = setTimeout(() => setExitingView(null), ANIM_MS)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [detailSession])

  if (terminalFullscreen && showTerminal) {
    return (
      <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
        <TerminalPanel fullscreen />
      </div>
    )
  }

  const showList = currentView === 'list' || exitingView === 'list'
  const showDetail = currentView === 'detail' || exitingView === 'detail'

  const getListClass = () => {
    if (exitingView === 'list') return 'exiting'
    if (currentView === 'list' && exitingView === 'detail') return 'entering-back'
    return ''
  }

  const getDetailClass = () => {
    if (exitingView === 'detail') return 'exiting-right'
    return 'entering'
  }

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <div style={{
        height: 52, minHeight: 52,
        paddingLeft: 78, paddingRight: 16,
        display: 'flex', alignItems: 'center',
        WebkitAppRegion: 'drag'
      } as React.CSSProperties}>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', letterSpacing: -0.3 }}>
          SessionManager
        </span>
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <div className="view-container">
          {showList && (
            <div className={`view-slide ${getListClass()}`}>
              <SessionList />
            </div>
          )}
          {showDetail && (
            <div className={`view-slide ${getDetailClass()}`}>
              <SessionDetail />
            </div>
          )}
        </div>
      </div>
      {showTerminal && <TerminalPanel />}
    </div>
  )
}
