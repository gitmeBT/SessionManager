import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { DatabaseManager } from './database'
import { Indexer } from './indexer'
import { PtyManager } from './pty-manager'
import { registerIpcHandlers } from './ipc-handlers'

const mainWindowRef = { current: null as BrowserWindow | null }
let db: DatabaseManager
let indexer: Indexer
let ptyManager: PtyManager

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'SessionManager',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  mainWindowRef.current = win

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  const dbPath = join(app.getPath('userData'), 'session-manager.db')
  db = new DatabaseManager(dbPath)
  db.initialize()

  indexer = new Indexer(db)
  await indexer.indexAll()

  ptyManager = new PtyManager()

  createWindow()
  registerIpcHandlers(db, indexer, ptyManager, mainWindowRef)

  setInterval(() => {
    indexer.indexAll()
  }, 5 * 60 * 1000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  ptyManager?.killAll()
  if (process.platform !== 'darwin') app.quit()
})
