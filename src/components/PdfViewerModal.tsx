import { useEffect, useState } from 'react'
import { fetchPdfBlob, type PdfFileDto } from '../api/files.api'
import { Modal } from './Modal'

interface PdfViewerModalProps {
  file: PdfFileDto
  onClose: () => void
}

/** Visor embebido. El PDF se pide con la cookie de sesión y se muestra desde un blob: no hay URL pública que compartir. */
export function PdfViewerModal({ file, onClose }: PdfViewerModalProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null
    let active = true
    fetchPdfBlob(file.id)
      .then((blob) => {
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch((e: Error) => active && setError(e.message))
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [file.id])

  return (
    <Modal title={file.title} onClose={onClose} wide>
      <div className="viewer">
        {error && <p className="form-error">{error}</p>}
        {!url && !error && <p className="hint">Cargando PDF…</p>}
        {url && <iframe src={url} title={file.title} />}
      </div>
      {url && (
        <footer className="modal__footer">
          <a className="btn" href={url} download={file.originalName}>
            Descargar
          </a>
          <a className="btn" href={url} target="_blank" rel="noreferrer">
            Abrir en una pestaña
          </a>
        </footer>
      )}
    </Modal>
  )
}
