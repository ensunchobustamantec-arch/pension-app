import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { correoBienvenida } from '../lib/correos'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Register
  const [regNombre, setRegNombre] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regTel, setRegTel] = useState('')
  const [regPass, setRegPass] = useState('')
  const [regPass2, setRegPass2] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await signIn(email, password)
    if (error) setError('Correo o contraseña incorrectos.')
    setLoading(false)
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (regPass !== regPass2) return setError('Las contraseñas no coinciden.')
    if (regPass.length < 6) return setError('La contraseña debe tener mínimo 6 caracteres.')
    setLoading(true)
    const { error } = await signUp(regEmail, regPass, regNombre, regTel)
    if (error) {
      setError(error.message)
    } else {
      // Enviar correo de bienvenida
      await correoBienvenida(regNombre, regEmail)
      setSuccess('¡Cuenta creada! Revisa tu correo para confirmar y luego inicia sesión.')
    }
    setLoading(false)
  }

  return (
    <div className="auth-screen">
      <div className="auth-left">
        <h1>Pensión<br />EnsunchoPro</h1>
        <p>Gestiona tu pensión estudiantil de forma sencilla, segura y profesional.</p>
      </div>

      <div className="auth-right">
        <h2>Bienvenido</h2>
        <p className="auth-sub">Ingresa para continuar</p>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); setSuccess('') }}>
            Iniciar sesión
          </button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError(''); setSuccess('') }}>
            Registrarme
          </button>
        </div>

        {error && <div className="error-msg">⚠️ {error}</div>}
        {success && <div className="success-msg">✅ {success}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input className="form-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="ejemplo@correo.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input className="form-input" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Nombre completo</label>
              <input className="form-input" required value={regNombre} onChange={e => setRegNombre(e.target.value)} placeholder="Juan Pérez" />
            </div>
            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input className="form-input" type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="ejemplo@correo.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input className="form-input" value={regTel} onChange={e => setRegTel(e.target.value)} placeholder="3001234567" />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input className="form-input" type="password" required value={regPass} onChange={e => setRegPass(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar contraseña</label>
              <input className="form-input" type="password" required value={regPass2} onChange={e => setRegPass2(e.target.value)} placeholder="Repite la contraseña" />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
