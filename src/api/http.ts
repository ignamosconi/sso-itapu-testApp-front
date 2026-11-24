import { env } from '../config/env'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type QueryValue = string | boolean | null | undefined

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  form?: FormData
  query?: Record<string, QueryValue>
  /** En los endpoints de login un 401 es esperable: no debe disparar el "tu sesión venció". */
  skipUnauthorizedHandler?: boolean
}

let onUnauthorized: (() => void) | null = null

/** El AuthContext se registra acá para enterarse si la sesión venció a mitad de uso. */
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler
}

const buildUrl = (path: string, query?: RequestOptions['query']): string => {
  const url = new URL(`${env.apiUrl}${path}`)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }
  return url.toString()
}

const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data: unknown = await response.json()
    const message = (data as { message?: unknown })?.message
    if (Array.isArray(message)) return message.join(', ')
    if (typeof message === 'string') return message
  } catch {
    /* sin cuerpo JSON */
  }
  return response.statusText || `Error ${response.status}`
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  let response: Response
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      // Cookie HttpOnly de sesión: el front nunca ve ni guarda tokens.
      credentials: 'include',
      headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: options.form ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. ¿Está levantado el backend?')
  }

  if (!response.ok) {
    if (response.status === 401 && !options.skipUnauthorizedHandler) onUnauthorized?.()
    throw new ApiError(response.status, await readErrorMessage(response))
  }
  return response
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(path, options)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export async function requestBlob(path: string): Promise<Blob> {
  return (await send(path, {})).blob()
}
