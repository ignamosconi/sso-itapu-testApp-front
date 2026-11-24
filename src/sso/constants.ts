/** Tamaño recomendado por el mail: width=480,height=560 */
export const SSO_POPUP_FEATURES = 'popup=yes,width=480,height=560'

/** Nombre de la ventana: si el usuario hace clic dos veces, se reutiliza el mismo popup. */
export const SSO_POPUP_NAME = 'itapu-sso-login'

/** Canal para que la página de retorno (dentro del popup) avise a la ventana principal. */
export const SSO_BROADCAST_CHANNEL = 'itapu-sso-callback'

/** Etiqueta de los mensajes que reenvía nuestra propia página de retorno. */
export const SSO_RELAY_TYPE = 'itapu-sso:relay'

/** Si el usuario no completa el login en este tiempo, se cancela. */
export const SSO_LOGIN_TIMEOUT_MS = 5 * 60 * 1000

/** Tras detectar que el popup se cerró, se espera un instante por si el mensaje todavía viene en camino. */
export const SSO_CLOSED_GRACE_MS = 1500
