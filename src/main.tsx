import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { AuthProvider } from './auth/AuthContext'
import { relaySsoCallbackIfPresent } from './sso/popupRelay'

// Si esta carga es la que el SSO abrió dentro del popup (redirect_uri con ?code&state), solo reenvía el
// resultado a la ventana principal y se cierra: no se monta la app. Ver src/sso/README.md.
if (!relaySsoCallbackIfPresent()) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>,
  )
}
