import { useAuth } from '../auth/AuthContext'
import { LockIcon } from '../components/Icons'

export function LoginPage() {
  const { signIn, signingIn, notice } = useAuth()

  return (
    <main className="login">
      <div className="login__card">
        <span className="login__mark">
          <LockIcon width={26} height={26} />
        </span>
        <h1>Fechas de exámenes</h1>
        <p className="login__lead">
          Consultá cuándo y dónde rendís tus exámenes finales. El acceso es solo para la comunidad de ITAPU.
        </p>

        <button type="button" className="btn btn--primary btn--lg" onClick={() => void signIn()} disabled={signingIn}>
          {signingIn ? 'Esperando el inicio de sesión…' : 'Ingresar con ITAPU SSO'}
        </button>

        {signingIn && <p className="hint">Se abrió una ventana de ITAPU. Se cerrará sola al terminar.</p>}
        {notice && !signingIn && <p className="banner banner--warn">{notice}</p>}

        <p className="login__fine">
          Los horarios ya no son públicos: solo los ven quienes inician sesión con su cuenta institucional.
        </p>
      </div>
    </main>
  )
}
