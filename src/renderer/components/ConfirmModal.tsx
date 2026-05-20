import { createPortal } from 'react-dom'
import { useStore } from '../stores/useStore'

export function ConfirmModal() {
  const { confirmDialog, setConfirmDialog } = useStore()
  if (!confirmDialog) return null

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)'
    }}
      onClick={() => setConfirmDialog(null)}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '20px 24px', minWidth: 280, maxWidth: 380,
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)'
        }}
      >
        <div style={{
          fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5,
          marginBottom: 20
        }}>
          {confirmDialog.message}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={() => setConfirmDialog(null)}
            style={{
              padding: '6px 16px', fontSize: 12, borderRadius: 6,
              border: '1px solid var(--border)', background: 'var(--bg-hover)',
              color: 'var(--text-secondary)', cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={confirmDialog.onConfirm}
            style={{
              padding: '6px 16px', fontSize: 12, borderRadius: 6,
              border: 'none', background: '#f87171', color: '#fff',
              cursor: 'pointer', fontWeight: 500
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
