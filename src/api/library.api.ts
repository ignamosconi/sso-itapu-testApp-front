import type { FolderDto } from './folders.api'
import type { PdfFileDto } from './files.api'
import { request } from './http'

// ── DTOs (espejo de back/src/library/dto) ───────────────────────────────────

/** BrowseQueryDto */
export interface BrowseQueryDto {
  folderId?: string | null
  /** Solo personal: ver lo mismo que vería un alumno */
  asStudent?: boolean
  /** Solo personal en vista de alumno: especialidad (del SSO) a previsualizar */
  previewSpecialty?: string
}

/** LibraryBrowseDto */
export interface LibraryBrowseDto {
  viewMode: 'staff' | 'student'
  currentFolder: FolderDto | null
  breadcrumbs: FolderDto[]
  folders: FolderDto[]
  files: PdfFileDto[]
}

/** GET /library/browse */
export const browseLibrary = (query: BrowseQueryDto = {}) =>
  request<LibraryBrowseDto>('/library/browse', {
    query: {
      folderId: query.folderId,
      asStudent: query.asStudent ? true : undefined,
      previewSpecialty: query.previewSpecialty,
    },
  })
