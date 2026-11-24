import { useEffect, useState } from 'react'
import { getDirectory, type DirectoryDto } from '../api/directory.api'
import { Header } from '../components/Header'
import { LibraryBrowser } from '../components/LibraryBrowser'

type View = 'manage' | 'student'

/** Vista del personal: por defecto el panel de administración, con opción de pasar a la vista de alumno. */
export function StaffHome() {
  const [view, setView] = useState<View>('manage')
  const [directory, setDirectory] = useState<DirectoryDto | null>(null)
  const [directoryError, setDirectoryError] = useState<string | null>(null)
  const [previewSpecialty, setPreviewSpecialty] = useState('')

  // Cargos y especialidades vigentes en el SSO (nada hardcodeado).
  useEffect(() => {
    getDirectory()
      .then(setDirectory)
      .catch((e: Error) => setDirectoryError(e.message))
  }, [])

  const controls = (
    <>
      <div className="segmented" role="tablist" aria-label="Vista">
        <button type="button" role="tab" aria-selected={view === 'manage'} onClick={() => setView('manage')}>
          Administrar
        </button>
        <button type="button" role="tab" aria-selected={view === 'student'} onClick={() => setView('student')}>
          Vista de alumno
        </button>
      </div>

      {view === 'student' && (
        <label className="preview-select">
          <span>Ver como alumno de</span>
          <select value={previewSpecialty} onChange={(event) => setPreviewSpecialty(event.target.value)}>
            <option value="">Sin especialidad</option>
            {directory?.specialties.map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  )

  return (
    <>
      <Header>{controls}</Header>
      <main className="page">
        <h1 className="page__title">{view === 'manage' ? 'Administración de PDFs' : 'Así lo ve un alumno'}</h1>
        {directoryError && (
          <p className="banner banner--warn">
            No se pudieron cargar las especialidades desde el SSO ({directoryError}). Podés seguir administrando, pero no
            podrás restringir carpetas por especialidad hasta que responda.
          </p>
        )}
        {view === 'student' && (
          <p className="banner banner--info">
            Vista previa de solo lectura: se aplican exactamente las reglas de visibilidad de un alumno.
          </p>
        )}
        <LibraryBrowser
          key={view === 'manage' ? 'manage' : `student:${previewSpecialty}`}
          mode={view === 'manage' ? 'manage' : 'view'}
          asStudent={view === 'student'}
          previewSpecialty={view === 'student' ? previewSpecialty || undefined : undefined}
          directory={directory}
        />
      </main>
    </>
  )
}
