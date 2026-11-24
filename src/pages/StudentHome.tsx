import { Header } from '../components/Header'
import { LibraryBrowser } from '../components/LibraryBrowser'

/** Vista que ve un alumno apenas inicia sesión: directamente las carpetas. */
export function StudentHome() {
  return (
    <>
      <Header />
      <main className="page">
        <h1 className="page__title">Fechas de exámenes</h1>
        <LibraryBrowser mode="view" />
      </main>
    </>
  )
}
