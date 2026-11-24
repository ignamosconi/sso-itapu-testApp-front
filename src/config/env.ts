/**
 * Única variable de entorno del front. Todo lo del SSO (URL, client_id, redirect_uri) lo configura el
 * BACKEND en su .env y se lo entrega al front en tiempo de ejecución: si cambia, no hay que tocar el front.
 */
const apiUrl = import.meta.env.VITE_API_URL as string | undefined

if (!apiUrl) {
  throw new Error('Falta VITE_API_URL. Copiá .env.example a .env.')
}

export const env = {
  apiUrl: apiUrl.replace(/\/+$/, ''),
}
