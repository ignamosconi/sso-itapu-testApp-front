import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { completeSsoLogin, getMe, logout, type SessionUserDto } from '../api/auth.api'
import { setUnauthorizedHandler } from '../api/http'
import { requestSsoAuthorization, SsoLoginCancelledError } from '../sso/ssoLogin'

type AuthStatus = 'loading' | 'anonymous' | 'authenticated'

interface AuthContextValue {
  status: AuthStatus
  user: SessionUserDto | null
  /** Hay un login en curso (popup abierto) */
  signingIn: boolean
  /** Mensaje para mostrar en el login (cancelación, sesión vencida, error del SSO…) */
  notice: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<SessionUserDto | null>(null)
  const [signingIn, setSigningIn] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  // ¿Ya hay sesión? (cookie HttpOnly de una visita anterior)
  useEffect(() => {
    let active = true
    getMe()
      .then((me) => {
        if (!active) return
        setUser(me)
        setStatus('authenticated')
      })
      .catch(() => {
        if (active) setStatus('anonymous')
      })
    return () => {
      active = false
    }
  }, [])

  // Si a mitad de uso el backend responde 401 (sesión revocada o vencida), volvemos al login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      setStatus('anonymous')
      setNotice('Tu sesión venció. Iniciá sesión de nuevo.')
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  const signIn = useCallback(async () => {
    setNotice(null)
    setSigningIn(true)
    try {
      const authorization = await requestSsoAuthorization() // Pasos 1 y 2
      const me = await completeSsoLogin(authorization) // Pasos 3 y 4 (en el backend)
      setUser(me)
      setStatus('authenticated')
    } catch (error) {
      if (error instanceof SsoLoginCancelledError) {
        setNotice(error.message)
      } else {
        setNotice(error instanceof Error ? error.message : 'No se pudo iniciar sesión.')
      }
    } finally {
      setSigningIn(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await logout() // Paso 6
    } finally {
      setUser(null)
      setStatus('anonymous')
      setNotice(null)
    }
  }, [])

  const value = useMemo(
    () => ({ status, user, signingIn, notice, signIn, signOut }),
    [status, user, signingIn, notice, signIn, signOut],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return context
}
