import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { updatePdf, uploadPdf, type PdfFileDto } from '../api/files.api'
import { listFolders, type FolderDto } from '../api/folders.api'
import { buildFolderOptions } from '../lib/folderTree'
import { formatBytes } from '../lib/format'
import { Modal } from './Modal'

interface PdfFormModalProps {
  /** Si viene, se edita (renombrar / mover); si no, se sube uno nuevo. */
  file?: PdfFileDto
  defaultFolderId: string | null
  onClose: () => void
  onSaved: () => void
}

export function PdfFormModal({ file, defaultFolderId, onClose, onSaved }: PdfFormModalProps) {
  const [title, setTitle] = useState(file?.title ?? '')
  const [folderId, setFolderId] = useState<string | null>(file ? file.folderId : defaultFolderId)
  const [picked, setPicked] = useState<File | null>(null)
  const [allFolders, setAllFolders] = useState<FolderDto[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listFolders()
      .then(setAllFolders)
      .catch((e: Error) => setError(e.message))
  }, [])
  const options = useMemo(() => buildFolderOptions(allFolders), [allFolders])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (file) {
        await updatePdf(file.id, { title: title.trim(), folderId })
      } else if (picked) {
        await uploadPdf(picked, { title: title.trim() || undefined, folderId: folderId ?? undefined })
      }
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar')
      setBusy(false)
    }
  }

  const canSubmit = file ? title.trim().length > 0 : picked !== null

  return (
    <Modal title={file ? 'Editar PDF' : 'Subir PDF'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="modal__body">
          {!file && (
            <label className="field">
              <span>Archivo PDF</span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => {
                  const next = event.target.files?.[0] ?? null
                  setPicked(next)
                  if (next && !title) setTitle(next.name.replace(/\.pdf$/i, ''))
                }}
                required
              />
              {picked && <small className="hint">{formatBytes(picked.size)}</small>}
            </label>
          )}

          <label className="field">
            <span>Título</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ej.: Mesas de examen — diciembre"
              maxLength={200}
              required={!!file}
            />
          </label>

          <label className="field">
            <span>Carpeta</span>
            <select value={folderId ?? ''} onChange={(event) => setFolderId(event.target.value || null)}>
              {options.map((option) => (
                <option key={option.id ?? 'root'} value={option.id ?? ''}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {error && <p className="form-error">{error}</p>}
        </div>
        <footer className="modal__footer">
          <button type="button" className="btn" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={busy || !canSubmit}>
            {busy ? (file ? 'Guardando…' : 'Subiendo…') : file ? 'Guardar' : 'Subir'}
          </button>
        </footer>
      </form>
    </Modal>
  )
}
