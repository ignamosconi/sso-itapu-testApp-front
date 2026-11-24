import { SSO_BROADCAST_CHANNEL, SSO_RELAY_TYPE } from './constants'

/**
 * Página de retorno del popup.
 *
 * Si el SSO redirige el popup a nuestra redirect_uri con ?code=...&state=..., esta página (que corre DENTRO del
 * popup) le pasa el resultado a la ventana principal y se cierra sola. No canjea el code ni lo guarda: solo lo
 * reenvía; el canje lo hace el backend (Paso 3) cuando la ventana principal se lo pide.
 *
 * @returns true si esta carga es la de retorno del popup (en ese caso NO hay que montar la app).
 */
export function relaySsoCallbackIfPresent(): boolean {
  const params = new URLSearchParams(window.location.search)
  const state = params.get('state')
  const code = params.get('code')
  const error = params.get('error')
  if (!state || (!code && !error)) return false

  const message = { type: SSO_RELAY_TYPE, code, state, error }

  // 1) A la ventana que abrió el popup. El destino es NUESTRO origen: nunca se manda a un tercero.
  try {
    window.opener?.postMessage(message, window.location.origin)
  } catch {
    /* sin opener */
  }

  // 2) Respaldo por BroadcastChannel (funciona aunque el SSO haya cortado la relación con el opener).
  try {
    const channel = new BroadcastChannel(SSO_BROADCAST_CHANNEL)
    channel.postMessage(message)
    window.setTimeout(() => channel.close(), 1000)
  } catch {
    /* navegador sin BroadcastChannel */
  }

  // El code es de un solo uso: lo sacamos de la URL y del historial.
  window.history.replaceState(null, '', window.location.pathname)
  document.body.textContent = 'Inicio de sesión completado. Ya podés cerrar esta ventana.'
  document.body.style.cssText = 'font-family:system-ui,sans-serif;padding:2rem;text-align:center;color:#1b2a41'

  // Cierre automático del popup.
  window.setTimeout(() => window.close(), 50)
  return true
}
