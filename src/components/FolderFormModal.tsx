import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { DirectoryDto } from '../api/directory.api'
import { createFolder, listFolders, updateFolder, type FolderDto } from '../api/folders.api'
import { buildFolderOptions } from '../lib/folderTree'
import { Modal } from './Modal'

interface FolderFormModalProps {
  /** Si viene, se edita; si no, se crea. */
  folder?: FolderDto
  /** Carpeta donde se crea (la que se está mirando) */
  defaultParentId: string | null
  /** Especialidades del SSO (null si el SSO no respondió) */
  directory: DirectoryDto | null
  onClose: () => void
  onSaved: () => void
}

export function FolderFormModal({ folder, defaultParentId, directory, onClose, onSaved }: FolderFormModalProps) {
  const [name, setName] = useState(folder?.name ?? '')
  const [parentId, setParentId] = useState<string | null>(folder ? folder.parentId : defaultParentId)
  const [specialties, setSpecialties] = useState<string[]>(folder?.allowedSpecialties ?? [])
  const [allFolders, setAllFolders] = useState<FolderDto[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listFolders()
      .then(setAllFolders)
      .catch((e: Error) => setError(e.message))
  }, [])

  const options = useMemo(() => buildFolderOptions(allFolders, folder?.id), [allFolders, folder?.id])
  // Si la carpeta ya tiene una especialidad que el SSO dejó de listar, se muestra igual para poder quitarla.
  const specialtyChoices = useMemo(
    () => [...new Set([...(directory?.specialties ?? []), ...specialties])],
    [directory, specialties],
  )

  const toggleSpecialty = (value: string) =>
    setSpecialties((current) => (current.includes(value) ? current.filter((s) => s !== value) : [...current, value]))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (folder) {
        await updateFolder(folder.id, { name: name.trim(), parentId, allowedSpecialties: specialties })
      } else {
        await createFolder({
          name: name.trim(),
          parentId: parentId ?? undefined,
          allowedSpecialties: specialties,
        })
      }
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar')
      setBusy(false)
    }
  }

  return (
    <Modal title={folder ? 'Editar carpeta' : 'Nueva carpeta'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="modal__body">
          <label className="field">
            <span>Nombre</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej.: 2026, Matemática, Diciembre…"
              maxLength={120}
              required
              autoFocus
            />
          </label>

          <label className="field">
            <span>Ubicación</span>
            <select
              value={parentId ?? ''}
              onChange={(event) => setParentId(event.target.value || null)}
              disabled={options.length <= 1 && allFolders.length === 0 && !error}
            >
              {options.map((option) => (
                <option key={option.id ?? 'root'} value={option.id ?? ''}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="field">
            <legend>Visible para las especialidades</legend>
            {specialtyChoices.length === 0 ? (
              <p className="hint">
                {directory
                  ? 'El SSO no tiene especialidades cargadas.'
                  : 'No se pudieron cargar las especialidades desde el SSO.'}
              </p>
            ) : (
              <div className="checks">
                {specialtyChoices.map((specialty) => (
                  <label key={specialty} className="check">
                    <input
                      type="checkbox"
                      checked={specialties.includes(specialty)}
                      onChange={() => toggleSpecialty(specialty)}
                    />
                    {specialty}
                  </label>
                ))}
              </div>
            )}
            <p className="hint">
              Sin ninguna marcada, la ven todos los alumnos. La restricción se aplica también a las subcarpetas y PDFs.
            </p>
          </fieldset>

          {error && <p className="form-error">{error}</p>}
        </div>
        <footer className="modal__footer">
          <button type="button" className="btn" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={busy || !name.trim()}>
            {busy ? 'Guardando…' : 'Guardar'}
          </button>
        </footer>
      </form>
    </Modal>
  )
}
