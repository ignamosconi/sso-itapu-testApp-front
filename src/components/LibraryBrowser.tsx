import { useCallback, useEffect, useState } from 'react'
import type { DirectoryDto } from '../api/directory.api'
import { deletePdf, type PdfFileDto } from '../api/files.api'
import { deleteFolder, type FolderDto } from '../api/folders.api'
import { ApiError } from '../api/http'
import { browseLibrary, type LibraryBrowseDto } from '../api/library.api'
import { formatBytes, formatDate } from '../lib/format'
import { Breadcrumbs } from './Breadcrumbs'
import { ConfirmModal } from './ConfirmModal'
import { FolderFormModal } from './FolderFormModal'
import { EditIcon, FileIcon, FolderIcon, LockIcon, PlusIcon, TrashIcon, UploadIcon } from './Icons'
import { PdfFormModal } from './PdfFormModal'
import { PdfViewerModal } from './PdfViewerModal'

type Modal =
  | { type: 'folder-form'; folder?: FolderDto }
  | { type: 'pdf-form'; file?: PdfFileDto }
  | { type: 'delete-folder'; folder: FolderDto }
  | { type: 'delete-pdf'; file: PdfFileDto }
  | { type: 'viewer'; file: PdfFileDto }
  | null

interface LibraryBrowserProps {
  /** manage: CRUD de carpetas y PDFs (admin). view: solo lectura (alumno / vista de alumno). */
  mode: 'manage' | 'view'
  /** Solo personal: mostrar lo mismo que vería un alumno */
  asStudent?: boolean
  previewSpecialty?: string
  directory?: DirectoryDto | null
}

export function LibraryBrowser({ mode, asStudent, previewSpecialty, directory = null }: LibraryBrowserProps) {
  const [folderId, setFolderId] = useState<string | null>(null)
  const [data, setData] = useState<LibraryBrowseDto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<Modal>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Identifica el pedido actual; cambia cuando cambia cualquier parámetro o se fuerza un reload
  const requestKey = JSON.stringify([folderId, asStudent ?? false, previewSpecialty ?? null, reloadKey])
  // Último pedido que terminó (bien o con error)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const loading = loadedKey !== requestKey

  const manage = mode === 'manage'

  useEffect(() => {
    let active = true
    browseLibrary({ folderId, asStudent, previewSpecialty })
      .then((result) => {
        if (!active) return
        setData(result)
        setError(null)
        setLoadedKey(requestKey)
      })
      .catch((e: unknown) => {
        if (!active) return
        // La carpeta ya no existe (la borraron o dejó de ser visible): volvemos al inicio.
        if (e instanceof ApiError && e.status === 404 && folderId) {
          setFolderId(null) // cambia requestKey → sigue "cargando" hasta que llegue la raíz
          return
        }
        setError(e instanceof Error ? e.message : 'No se pudo cargar el contenido')
        setLoadedKey(requestKey)
      })
    return () => {
      active = false
    }
  }, [requestKey, folderId, asStudent, previewSpecialty])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])
  const closeModal = useCallback(() => setModal(null), [])
  const saved = useCallback(() => {
    setModal(null)
    reload()
  }, [reload])

  const isEmpty = data && data.folders.length === 0 && data.files.length === 0

  return (
    <section className="browser">
      <div className="browser__bar">
        <Breadcrumbs trail={data?.breadcrumbs ?? []} onNavigate={setFolderId} />
        {manage && (
          <div className="browser__actions">
            <button type="button" className="btn" onClick={() => setModal({ type: 'folder-form' })}>
              <PlusIcon width={18} height={18} /> Nueva carpeta
            </button>
            <button type="button" className="btn btn--primary" onClick={() => setModal({ type: 'pdf-form' })}>
              <UploadIcon width={18} height={18} /> Subir PDF
            </button>
          </div>
        )}
      </div>

      {error && <p className="banner banner--error">{error}</p>}
      {loading && !data && <p className="hint">Cargando…</p>}

      {data && (
        <div className={loading ? 'is-loading' : undefined}>
          {data.folders.length > 0 && (
            <ul className="folder-grid">
              {data.folders.map((folder) => (
                <li key={folder.id} className="folder-card">
                  <button type="button" className="folder-card__main" onClick={() => setFolderId(folder.id)}>
                    <FolderIcon width={28} height={28} />
                    <span className="folder-card__name">{folder.name}</span>
                    {manage && (
                      <span className={`tag${folder.allowedSpecialties.length ? ' tag--restricted' : ''}`}>
                        {folder.allowedSpecialties.length > 0 && <LockIcon width={13} height={13} />}
                        {folder.allowedSpecialties.length > 0
                          ? folder.allowedSpecialties.join(' · ')
                          : 'Todas las especialidades'}
                      </span>
                    )}
                  </button>
                  {manage && (
                    <div className="folder-card__tools">
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Editar ${folder.name}`}
                        onClick={() => setModal({ type: 'folder-form', folder })}
                      >
                        <EditIcon width={18} height={18} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn--danger"
                        aria-label={`Eliminar ${folder.name}`}
                        onClick={() => setModal({ type: 'delete-folder', folder })}
                      >
                        <TrashIcon width={18} height={18} />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {data.files.length > 0 && (
            <ul className="file-list">
              {data.files.map((file) => (
                <li key={file.id} className="file-row">
                  <button type="button" className="file-row__main" onClick={() => setModal({ type: 'viewer', file })}>
                    <FileIcon width={24} height={24} />
                    <span className="file-row__title">{file.title}</span>
                    <span className="file-row__meta">
                      {formatBytes(file.sizeBytes)} · {formatDate(file.createdAt)}
                    </span>
                  </button>
                  {manage && (
                    <div className="file-row__tools">
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Editar ${file.title}`}
                        onClick={() => setModal({ type: 'pdf-form', file })}
                      >
                        <EditIcon width={18} height={18} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn--danger"
                        aria-label={`Eliminar ${file.title}`}
                        onClick={() => setModal({ type: 'delete-pdf', file })}
                      >
                        <TrashIcon width={18} height={18} />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {isEmpty && (
            <div className="empty">
              <FolderIcon width={40} height={40} />
              <p>{manage ? 'Esta carpeta está vacía. Creá una carpeta o subí un PDF.' : 'Todavía no hay nada publicado acá.'}</p>
            </div>
          )}
        </div>
      )}

      {modal?.type === 'folder-form' && (
        <FolderFormModal
          folder={modal.folder}
          defaultParentId={folderId}
          directory={directory}
          onClose={closeModal}
          onSaved={saved}
        />
      )}
      {modal?.type === 'pdf-form' && (
        <PdfFormModal file={modal.file} defaultFolderId={folderId} onClose={closeModal} onSaved={saved} />
      )}
      {modal?.type === 'viewer' && <PdfViewerModal file={modal.file} onClose={closeModal} />}
      {modal?.type === 'delete-folder' && (
        <ConfirmModal
          title="Eliminar carpeta"
          message={`Se eliminará "${modal.folder.name}" junto con sus subcarpetas y todos los PDFs que contienen. No se puede deshacer.`}
          confirmLabel="Eliminar carpeta"
          onClose={closeModal}
          onConfirm={async () => {
            await deleteFolder(modal.folder.id)
            saved()
          }}
        />
      )}
      {modal?.type === 'delete-pdf' && (
        <ConfirmModal
          title="Eliminar PDF"
          message={`Se eliminará "${modal.file.title}". No se puede deshacer.`}
          confirmLabel="Eliminar PDF"
          onClose={closeModal}
          onConfirm={async () => {
            await deletePdf(modal.file.id)
            saved()
          }}
        />
      )}
    </section>
  )
}