import * as Dialog from '@radix-ui/react-dialog'
import { useStore } from '../stores/useStore'
import { translate } from '../lib/i18n'

export function ConfirmModal() {
  const confirmDialog = useStore(s => s.confirmDialog)
  const setConfirmDialog = useStore(s => s.setConfirmDialog)
  const lang = useStore(s => s.language)

  return (
    <Dialog.Root open={!!confirmDialog} onOpenChange={(open) => { if (!open) setConfirmDialog(null) }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[10000] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card/95 p-6 shadow-2xl backdrop-blur-xl focus:outline-none">
          <Dialog.Description className="mb-5 text-[13px] leading-relaxed text-foreground">
            {confirmDialog?.message}
          </Dialog.Description>
          <div className="flex justify-end gap-2">
            <Dialog.Close asChild>
              <button className="cursor-pointer rounded-lg border border-border bg-hover px-4 py-1.5 text-xs text-foreground-secondary transition-colors hover:text-foreground">
                {translate('confirm.cancel', lang)}
              </button>
            </Dialog.Close>
            <button
              onClick={confirmDialog?.onConfirm}
              className="cursor-pointer rounded-lg bg-danger px-4 py-1.5 text-xs font-medium text-white shadow-md shadow-danger/25 transition-all hover:shadow-lg hover:shadow-danger/30"
            >
              {translate('confirm.ok', lang)}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
