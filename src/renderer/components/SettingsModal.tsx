import { useState, useRef, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, ChevronDown } from 'lucide-react'
import { useStore } from '../stores/useStore'
import { cn } from '../lib/utils'
import { translate, LANGUAGES, Lang } from '../lib/i18n'

const TERMINAL_OPTIONS = [
  { value: '', label: 'System Default' },
  { value: 'Warp', label: 'Warp' },
  { value: 'iTerm', label: 'iTerm2' },
  { value: 'Terminal', label: 'Terminal.app' },
  { value: 'Alacritty', label: 'Alacritty' },
  { value: 'Hyper', label: 'Hyper' },
  { value: 'kitty', label: 'kitty' },
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
    <div ref={ref} className="relative w-full">
      <div
        onClick={() => setOpen(!open)}
        className={cn(
          'flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-xs transition-colors select-none',
          open ? 'border-primary bg-hover text-foreground' : 'border-border bg-background text-foreground'
        )}
      >
        {current.label}
        <ChevronDown size={13} className={cn('text-foreground-muted transition-transform', open && 'rotate-180')} />
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-[240px] overflow-y-auto rounded-md border border-border bg-background-secondary shadow-xl">
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={cn(
                'cursor-pointer px-3 py-2 text-xs transition-colors',
                opt.value === value
                  ? 'bg-hover font-medium text-primary'
                  : 'text-foreground hover:bg-hover'
              )}
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
  const showSettings = useStore(s => s.showSettings)
  const setShowSettings = useStore(s => s.setShowSettings)
  const resumeAction = useStore(s => s.resumeAction)
  const setResumeAction = useStore(s => s.setResumeAction)
  const terminalApp = useStore(s => s.terminalApp)
  const setTerminalApp = useStore(s => s.setTerminalApp)
  const language = useStore(s => s.language)
  const setLanguage = useStore(s => s.setLanguage)

  return (
    <Dialog.Root open={showSettings} onOpenChange={setShowSettings}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background-secondary/95 shadow-2xl backdrop-blur-xl focus:outline-none">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <Dialog.Title className="text-sm font-semibold text-foreground">{translate('settings.title', language)}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="cursor-pointer rounded-md p-1 text-foreground-muted transition-colors hover:bg-hover hover:text-foreground">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex flex-col gap-5 px-5 py-5">
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                {translate('settings.language', language)}
              </div>
              <CustomSelect
                value={language}
                onChange={v => setLanguage(v as Lang)}
                options={LANGUAGES}
              />
            </div>

            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                {translate('settings.resume', language)}
              </div>
              <CustomSelect
                value={resumeAction}
                onChange={v => setResumeAction(v as 'system' | 'builtin')}
                options={[
                  { value: 'system', label: translate('settings.resume.system', language) },
                  { value: 'builtin', label: translate('settings.resume.builtin', language) },
                ]}
              />
              <div className="mt-1.5 text-[10px] text-foreground-muted">
                {resumeAction === 'system'
                  ? translate('settings.resume.system.desc', language)
                  : translate('settings.resume.builtin.desc', language)}
              </div>
            </div>

            {resumeAction === 'system' && (
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                  {translate('settings.terminal', language)}
                </div>
                <CustomSelect
                  value={terminalApp}
                  onChange={setTerminalApp}
                  options={TERMINAL_OPTIONS}
                />
                <div className="mt-1.5 text-[10px] text-foreground-muted">
                  {terminalApp
                    ? `${translate('settings.terminal.with', language)} ${terminalApp}`
                    : translate('settings.terminal.defaultDesc', language)}
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
