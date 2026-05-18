import { IPty, spawn } from 'node-pty'
import { EventEmitter } from 'events'

interface ManagedPty {
  pty: IPty
  tabId: string
  cols: number
  rows: number
}

export class PtyManager extends EventEmitter {
  private ptys: Map<string, ManagedPty> = new Map()

  spawn(tabId: string, cwd: string, cols = 120, rows = 30): string {
    const shell = process.env.SHELL || '/bin/zsh'
    const pty = spawn(shell, [], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor'
      } as Record<string, string>
    })

    const managed: ManagedPty = { pty, tabId, cols, rows }
    this.ptys.set(tabId, managed)

    pty.onData((data: string) => {
      this.emit('data', { tabId, data })
    })

    pty.onExit(({ exitCode }) => {
      this.emit('exit', { tabId, exitCode })
      this.ptys.delete(tabId)
    })

    return tabId
  }

  write(tabId: string, data: string) {
    const managed = this.ptys.get(tabId)
    if (managed) {
      managed.pty.write(data)
    }
  }

  resize(tabId: string, cols: number, rows: number) {
    const managed = this.ptys.get(tabId)
    if (managed) {
      managed.pty.resize(cols, rows)
      managed.cols = cols
      managed.rows = rows
    }
  }

  kill(tabId: string) {
    const managed = this.ptys.get(tabId)
    if (managed) {
      managed.pty.kill()
      this.ptys.delete(tabId)
    }
  }

  killAll() {
    for (const [id] of this.ptys) {
      this.kill(id)
    }
  }

  sendCommand(tabId: string, command: string) {
    this.write(tabId, command + '\r')
  }

  has(tabId: string): boolean {
    return this.ptys.has(tabId)
  }
}
