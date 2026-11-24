import { getLoginUrl } from '../api/auth.api'
import {
  SSO_BROADCAST_CHANNEL,
  SSO_CLOSED_GRACE_MS,
  SSO_LOGIN_TIMEOUT_MS,
  SSO_POPUP_FEATURES,
  SSO_POPUP_NAME,
} from './constants'

/** Resultado del popup: lo que el backend necesita para canjear el code (Paso 3). */
export interface SsoAuthorization {
  code: string
  state: string
}

export class SsoPopupBlockedError extends Error {
  constructor() {
    super('El navegador bloqueó la ventana de inicio de sesión. Habilitá los popups para este sitio e intentá de nuevo.')
    this.name = 'SsoPopupBlockedError'
  }
}

export class SsoLoginCancelledError extends Error {
  constructor(message = 'Se canceló el inicio de sesión.') {
    super(message)
    this.name = 'SsoLoginCancelledError'
  }
}

interface RelayPayload {
  state: string
  code?: string
  error?: string
}

/** El mensaje puede venir plano ({code,state}) o envuelto ({type,payload:{code,state}}). */
const readPayload = (data: unknown): RelayPayload | null => {
  if (!data || typeof data !== 'object') return null
  const wrapped = (data as { payload?: unknown }).payload
  const source = (wrapped && typeof wrapped === 'object' ? wrapped : data) as Record<string, unknown>
  if (typeof source.state !== 'string') return null
  return {
    state: source.state,
    code: typeof source.code === 'string' ? source.code : undefined,
    error: typeof source.error === 'string' ? source.error : undefined,
  }
}

/**
 * PASOS 1 y 2 del mail del SSO.
 *
 *  1. Abrir popup de login → se abre una ventana en blanco SINCRÓNICAMENTE (dentro del clic, para que el
 *     navegador no la bloquee), se le pide al backend la URL del SSO + state y se navega el popup hacia allá.
 *  2. Escuchar postMessage → se verifica event.origin === origen del SSO y el state. "Nunca omitas estas
 *     verificaciones". Cuando llega el code válido, el popup SE CIERRA SOLO.
 *
 * El popup puede terminar en nuestra redirect_uri (http://localhost:5173/?code=...&state=...); esa página
 * (ver popupRelay.ts) reenvía el code a esta ventana y se cierra sola. Por eso también se acepta un mensaje
 * que venga de NUESTRO propio origen (siempre con el state verificado).
 */
export async function requestSsoAuthorization(): Promise<SsoAuthorization> {
  const popup = window.open('about:blank', SSO_POPUP_NAME, SSO_POPUP_FEATURES)
  if (!popup) throw new SsoPopupBlockedError()

  const closePopup = () => {
    try {
      if (!popup.closed) popup.close()
    } catch {
      /* ya no hay acceso a la ventana */
    }
  }

  let login: Awaited<ReturnType<typeof getLoginUrl>>
  try {
    login = await getLoginUrl()
    popup.location.href = login.url
  } catch (error) {
    closePopup()
    throw error
  }

  // Orígenes confiables: el SSO y nosotros mismos (página de retorno dentro del popup).
  const trustedOrigins = new Set([login.ssoOrigin, window.location.origin])

  return new Promise<SsoAuthorization>((resolve, reject) => {
    let settled = false
    let closedTimer: number | undefined
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(SSO_BROADCAST_CHANNEL) : null

    const cleanup = () => {
      window.removeEventListener('message', onMessage)
      window.clearInterval(pollTimer)
      window.clearTimeout(closedTimer)
      window.clearTimeout(timeoutTimer)
      channel?.close()
    }

    const settle = (action: () => void) => {
      if (settled) return
      settled = true
      cleanup()
      closePopup() // ← cierre automático del popup
      action()
    }

    const handle = (origin: string, data: unknown) => {
      if (!trustedOrigins.has(origin)) return // verificación de event.origin
      const payload = readPayload(data)
      if (!payload || payload.state !== login.state) return // verificación del state
      if (payload.error) {
        settle(() => reject(new SsoLoginCancelledError(`El SSO informó un error: ${payload.error}`)))
      } else if (payload.code) {
        const authorization = { code: payload.code, state: payload.state }
        settle(() => resolve(authorization))
      }
    }

    const onMessage = (event: MessageEvent) => handle(event.origin, event.data)
    window.addEventListener('message', onMessage)

    // Respaldo: si el popup perdió su `opener` (COOP), la página de retorno avisa por BroadcastChannel.
    if (channel) channel.onmessage = (event) => handle(window.location.origin, event.data)

    // Si el usuario cierra el popup a mano, se cancela (con una pequeña gracia por si el mensaje está en camino).
    const pollTimer = window.setInterval(() => {
      if (popup.closed && closedTimer === undefined) {
        closedTimer = window.setTimeout(
          () => settle(() => reject(new SsoLoginCancelledError('Cerraste la ventana de inicio de sesión.'))),
          SSO_CLOSED_GRACE_MS,
        )
      }
    }, 400)

    const timeoutTimer = window.setTimeout(
      () => settle(() => reject(new SsoLoginCancelledError('Pasó demasiado tiempo sin completar el inicio de sesión.'))),
      SSO_LOGIN_TIMEOUT_MS,
    )
  })
}
