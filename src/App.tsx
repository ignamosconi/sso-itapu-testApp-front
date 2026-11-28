import { useAuth } from './auth/AuthContext'
import { LoginPage } from './pages/LoginPage'
import { StaffHome } from './pages/StaffHome'
import { StudentHome } from './pages/StudentHome'

export default function App() {
  const { status, user } = useAuth()

  if (status === 'loading') return <p className="splash">Cargando…</p>
  if (!user) return <LoginPage />

  // El backend decide quién es personal (alguno de sus cargos ∈ STAFF_CARGOS); el front solo obedece `isStaff`.
  return user.isStaff ? <StaffHome /> : <StudentHome />
}
