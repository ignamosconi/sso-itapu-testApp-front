import { request } from './http'

/** DirectoryDto — cargos y especialidades vigentes en el SSO (nunca hardcodeados en el front). */
export interface DirectoryDto {
  domainRoles: string[]
  specialties: string[]
  staffCargos: string[]
}

/** GET /directory (solo personal) */
export const getDirectory = () => request<DirectoryDto>('/directory')
