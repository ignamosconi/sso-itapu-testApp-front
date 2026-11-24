import type { FolderDto } from '../api/folders.api'
import { ChevronIcon } from './Icons'

interface BreadcrumbsProps {
  trail: FolderDto[]
  onNavigate: (folderId: string | null) => void
}

export function Breadcrumbs({ trail, onNavigate }: BreadcrumbsProps) {
  return (
    <nav className="breadcrumbs" aria-label="Ubicación">
      <button type="button" onClick={() => onNavigate(null)} disabled={trail.length === 0}>
        Inicio
      </button>
      {trail.map((folder, index) => (
        <span key={folder.id} className="breadcrumbs__item">
          <ChevronIcon width={16} height={16} />
          <button type="button" onClick={() => onNavigate(folder.id)} disabled={index === trail.length - 1}>
            {folder.name}
          </button>
        </span>
      ))}
    </nav>
  )
}
