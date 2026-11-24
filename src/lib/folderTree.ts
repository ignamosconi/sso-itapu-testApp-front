import type { FolderDto } from '../api/folders.api'

export interface FolderOption {
  /** null = raíz */
  id: string | null
  label: string
}

/**
 * Convierte la lista plana de carpetas en opciones de <select> con sangría por nivel.
 * `excludeId` saca esa carpeta y todo su subárbol (no se puede mover una carpeta dentro de sí misma).
 */
export function buildFolderOptions(folders: FolderDto[], excludeId?: string): FolderOption[] {
  const childrenOf = new Map<string | null, FolderDto[]>()
  for (const folder of folders) {
    const siblings = childrenOf.get(folder.parentId) ?? []
    siblings.push(folder)
    childrenOf.set(folder.parentId, siblings)
  }

  const options: FolderOption[] = [{ id: null, label: 'Inicio (raíz)' }]
  const walk = (parentId: string | null, depth: number) => {
    const siblings = (childrenOf.get(parentId) ?? []).sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { numeric: true }),
    )
    for (const folder of siblings) {
      if (folder.id === excludeId) continue
      options.push({ id: folder.id, label: `${'   '.repeat(depth)}${depth > 0 ? '↳ ' : ''}${folder.name}` })
      walk(folder.id, depth + 1)
    }
  }
  walk(null, 0)
  return options
}
