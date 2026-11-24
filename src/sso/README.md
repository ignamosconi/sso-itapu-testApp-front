# Carpeta `sso/` — acoplamiento con ITAPU SSO (frontend)

El front **no conoce** la URL del SSO, el `client_id`, la `redirect_uri` ni el secret: los configura el backend
(`.env` del back) y se los entrega a esta carpeta en tiempo de ejecución con `GET /api/auth/sso/login-url`.
La única variable del front es `VITE_API_URL`.

## Mapa: pasos del mail → código

| Paso del mail | Archivo | Qué pasa |
|---|---|---|
| **1. Abrir popup de login** (`width=480,height=560`) | `ssoLogin.ts` → `requestSsoAuthorization()` | Se abre el popup **dentro del clic** (para que no lo bloqueen), se pide al backend la URL (`client_id`, `redirect_uri`, `state` aleatorio, `theme`) y se navega el popup hacia el SSO |
| **2. Escuchar postMessage** | `ssoLogin.ts` (`handle`) | Verifica `event.origin` (== origen del SSO que informa el backend) **y** `state`. Si algo no cierra, el mensaje se ignora |
| **Cierre automático del popup** | `ssoLogin.ts` (`settle`) y `popupRelay.ts` | Al llegar el code válido la ventana principal hace `popup.close()`. Además, si el SSO redirige el popup a nuestra `redirect_uri`, la página de retorno reenvía el code y ejecuta `window.close()` |
| **3. Canjear code por tokens** | `../api/auth.api.ts` → `completeSsoLogin()` | Se manda `{code, state}` al backend, que hace `POST /sso/token` con el `client_secret`. El front nunca ve tokens |
| **4. Identificar al usuario** | `../auth/AuthContext.tsx` | El backend responde con `sub`, `cargo`, `especialidad` y `isStaff`; el front solo los muestra |
| **5. Renovar tokens** | *(backend)* | Transparente: lo hace el backend en cada pedido si el access_token está por vencer. Si falla, el front recibe 401 y vuelve al login |
| **6. Cerrar sesión** | `../auth/AuthContext.tsx` → `signOut()` | `POST /auth/logout`; el backend revoca en el SSO y borra la cookie |
| **Seguridad: nada en localStorage** | `../api/http.ts` | Todo viaja con `credentials: 'include'` (cookie HttpOnly) |

## Por qué el popup se cierra solo

Antes el popup podía quedar abierto porque nadie lo cerraba una vez recibido el code. Acá hay tres cierres, de más
a menos habitual (el primero que ocurra gana, los demás son inofensivos):

1. **Ventana principal**: al validar origin + state, llama `popup.close()` (es la ventana que lo abrió, así que puede).
2. **Página de retorno** (`popupRelay.ts`): si el popup termina en `http://localhost:5173/?code=…&state=…`, `main.tsx`
   no monta la app: reenvía el resultado (`opener.postMessage` **y** `BroadcastChannel`) y hace `window.close()`.
3. **Cancelación**: si el usuario cierra el popup a mano, o pasan 5 minutos, la promesa se rechaza y se limpian los listeners.

> Si el SSO sirviera su página con el header `Cross-Origin-Opener-Policy: same-origin`, el navegador cortaría la
> relación con la ventana principal y el popup no podría avisar por `postMessage`. El `BroadcastChannel` cubre ese
> caso para la página de retorno; el `postMessage` directo desde el SSO, en cambio, requeriría quitar ese header.

## Formato del mensaje

`ssoLogin.ts` acepta tanto `{ code, state }` como `{ type, payload: { code, state } }` (y `{ error, state }`).
Si el SSO usa otra forma, se ajusta **solo** en `readPayload()`.
