import { request } from './http'

// ── DTOs (espejo de back/src/folders/dto) ───────────────────────────────────

/** FolderDto */
export interface FolderDto {
  id: string
  name: string
  /** null = carpeta raíz */
  parentId: string | null
  /** Especialidades del SSO que la ven. Vacío = todos los alumnos. */
  allowedSpecialties: string[]
  createdAt: string
  updatedAt: string
}

/** CreateFolderDto */
export interface CreateFolderDto {
  name: string
  parentId?: string
  allowedSpecialties?: string[]
}

/** UpdateFolderDto — parentId: null mueve a la raíz; omitirlo no mueve. */
export interface UpdateFolderDto {
  name?: string
  parentId?: string | null
  allowedSpecialties?: string[]
}

// ── Endpoints (solo personal) ───────────────────────────────────────────────

export const listFolders = () => request<FolderDto[]>('/folders')
export const createFolder = (dto: CreateFolderDto) => request<FolderDto>('/folders', { method: 'POST', body: dto })
export const updateFolder = (id: string, dto: UpdateFolderDto) =>
  request<FolderDto>(`/folders/${id}`, { method: 'PATCH', body: dto })
export const deleteFolder = (id: string) => request<void>(`/folders/${id}`, { method: 'DELETE' })
