import { request, requestBlob } from './http'

// ── DTOs (espejo de back/src/files/dto) ─────────────────────────────────────

/** PdfFileDto */
export interface PdfFileDto {
  id: string
  title: string
  originalName: string
  sizeBytes: number
  /** null = en la raíz */
  folderId: string | null
  createdAt: string
  updatedAt: string
}

/** UploadPdfDto (campos de texto del multipart; el archivo viaja en `file`) */
export interface UploadPdfDto {
  title?: string
  folderId?: string
}

/** UpdatePdfFileDto — folderId: null mueve a la raíz; omitirlo no mueve. */
export interface UpdatePdfFileDto {
  title?: string
  folderId?: string | null
}

// ── Endpoints ───────────────────────────────────────────────────────────────

/** POST /files (solo personal) */
export const uploadPdf = (file: File, dto: UploadPdfDto) => {
  const form = new FormData()
  form.append('file', file)
  if (dto.title) form.append('title', dto.title)
  if (dto.folderId) form.append('folderId', dto.folderId)
  return request<PdfFileDto>('/files', { method: 'POST', form })
}

export const updatePdf = (id: string, dto: UpdatePdfFileDto) =>
  request<PdfFileDto>(`/files/${id}`, { method: 'PATCH', body: dto })

export const deletePdf = (id: string) => request<void>(`/files/${id}`, { method: 'DELETE' })

/** GET /files/:id/content — el PDF como Blob (se pide con la cookie de sesión; no hay URLs públicas). */
export const fetchPdfBlob = (id: string) => requestBlob(`/files/${id}/content`)
