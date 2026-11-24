import { useState } from 'react'
import { Modal } from './Modal'

interface ConfirmModalProps {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => Promise<void>
  onClose: () => void
}

export function ConfirmModal({ title, message, confirmLabel, onConfirm, onClose }: ConfirmModalProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar la acción')
      setBusy(false)
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className="modal__body">
        <p>{message}</p>
        {error && <p className="form-error">{error}</p>}
      </div>
      <footer className="modal__footer">
        <button type="button" className="btn" onClick={onClose} disabled={busy}>
          Cancelar
        </button>
        <button type="button" className="btn btn--danger" onClick={run} disabled={busy}>
          {busy ? 'Eliminando…' : confirmLabel}
        </button>
      </footer>
    </Modal>
  )
}
