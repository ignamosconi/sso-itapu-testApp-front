import { request } from './http'

// ── DTOs (espejo de back/src/auth/dto) ──────────────────────────────────────

/** LoginUrlResponseDto */
export interface LoginUrlResponseDto {
  url: string
  state: string
  ssoOrigin: string
}

/** SsoCallbackDto */
export interface SsoCallbackDto {
  code: string
  state: string
}

/** SessionUserDto */
export interface SessionUserDto {
  sub: string
  displayName: string
  email: string | null
  cargo: string | null
  especialidad: string | null
  isStaff: boolean
}

// ── Endpoints ───────────────────────────────────────────────────────────────

/** GET /auth/sso/login-url — Paso 1: URL del popup + state + origen del SSO. */
export const getLoginUrl = () => request<LoginUrlResponseDto>('/auth/sso/login-url', { skipUnauthorizedHandler: true })

/** POST /auth/sso/callback — Pasos 3 y 4: el backend canjea el code y deja la cookie de sesión. */
export const completeSsoLogin = (dto: SsoCallbackDto) =>
  request<SessionUserDto>('/auth/sso/callback', { method: 'POST', body: dto, skipUnauthorizedHandler: true })

/** GET /auth/me */
export const getMe = () => request<SessionUserDto>('/auth/me', { skipUnauthorizedHandler: true })

/** POST /auth/logout — Paso 6 */
export const logout = () => request<void>('/auth/logout', { method: 'POST', skipUnauthorizedHandler: true })
