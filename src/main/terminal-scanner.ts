import fs from 'fs'
import path from 'path'
import os from 'os'

const SCAN_DIRS = ['/Applications', '/System/Applications', '/System/Applications/Utilities', path.join(os.homedir(), 'Applications')]

const KNOWN_BUNDLE_IDS = [
  'com.apple.Terminal',
  'com.googlecode.iterm2',
  'dev.warp.Warp',
  'io.alacritty',
  'com.mitchellh.ghostty',
  'com.github.wez.wezterm',
  'org.hyper.Hyper',
  'net.kovidgoyal.kitty',
  'org.tabby',
]

const EXCLUDE_NAMES = new Set(['iTermBrowserPlugin'])

export function scanTerminals(): string[] {
  const found = new Set<string>()

  for (const dir of SCAN_DIRS) {
    let entries: string[]
    try { entries = fs.readdirSync(dir) } catch { continue }

    for (const entry of entries) {
      if (!entry.endsWith('.app')) continue
      const name = entry.replace('.app', '')
      if (EXCLUDE_NAMES.has(name)) continue

      const plistPath = path.join(dir, entry, 'Contents/Info.plist')
      let content: string
      try { content = fs.readFileSync(plistPath, 'utf-8') } catch { continue }

      const isTerminal =
        content.includes('<string>Shell</string>') ||
        KNOWN_BUNDLE_IDS.some(id => content.includes(id))

      if (isTerminal) found.add(name)
    }
  }

  if (!found.has('Terminal')) found.add('Terminal')

  return Array.from(found).sort((a, b) => a === 'Terminal' ? -1 : a.localeCompare(b))
}
