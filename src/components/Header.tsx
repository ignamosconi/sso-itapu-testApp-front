import type { ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { FolderIcon } from './Icons'

export function Header({ children }: { children?: ReactNode }) {
  const { user, signOut } = useAuth()
  // Ej.: "Preceptor, Profesor · Sistemas"
  const subtitle = [user?.cargos.join(', '), user?.especialidades.join(', ')].filter(Boolean).join(' · ')

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div className="brand">
          <span className="brand__mark">
            <FolderIcon width={20} height={20} />
          </span>
          <div>
            <strong>Fechas de exámenes</strong>
            <small>ITAPU</small>
          </div>
        </div>

        {children && <div className="topbar__controls">{children}</div>}

        <div className="topbar__user">
          <div className="topbar__who">
            <strong>{user?.displayName}</strong>
            {subtitle && <small title={subtitle}>{subtitle}</small>}
          </div>
          <button type="button" className="btn btn--ghost topbar__logout" onClick={() => void signOut()}>
            Salir
          </button>
        </div>
      </div>
    </header>
  )
}