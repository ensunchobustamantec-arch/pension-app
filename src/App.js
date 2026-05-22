import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Estudiantes from './pages/Estudiantes'
import Habitaciones from './pages/Habitaciones'
import Pagos from './pages/Pagos'
import Aseo from './pages/Aseo'
import Alertas from './pages/Alertas'
import EstudianteDashboard from './pages/EstudianteDashboard'

const NAV_ADMIN = [
  { id: 'dashboard', label: 'Panel General', icon: '🏠' },
  { id: 'estudiantes', label: 'Estudiantes', icon: '👥' },
  { id: 'habitaciones', label: 'Habitaciones', icon: '🚪' },
  { id: 'pagos', label: 'Pagos', icon: '💳' },
  { id: 'aseo', label: 'Aseo', icon: '🧹' },
  { id: 'alertas', label: 'Alertas', icon: '🔔' },
  { id: 'salir', label: 'Salir', icon: '↪️' },
]

export default function App() {
  const { user, profile, loading, signOut } = useAuth()
  const [pagina, setPagina] = useState('dashboard')

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) return <AuthPage />

  const isAdmin = profile.rol === 'admin'

  function renderPagina() {
    if (!isAdmin) return <EstudianteDashboard />
    switch (pagina) {
      case 'dashboard': return <Dashboard />
      case 'estudiantes': return <Estudiantes />
      case 'habitaciones': return <Habitaciones />
      case 'pagos': return <Pagos />
      case 'aseo': return <Aseo />
      case 'alertas': return <Alertas />
      default: return <Dashboard />
    }
  }

  const iniciales = profile.nombre?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Pensión<br />Ensuncho</h1>
          <p>{isAdmin ? 'Panel Admin' : 'Mi Pensión'}</p>
        </div>

        <nav className="sidebar-nav">
          {isAdmin ? (
            NAV_ADMIN.map(item => (
              <button
  key={item.id}
  className={`nav-item ${pagina === item.id ? 'active' : ''}`}
  onClick={() => item.id === 'salir' ? signOut() : setPagina(item.id)}
>
                <span className="icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))
          ) : (
            <div className="nav-item active">
              <span className="icon">🏠</span>
              <span>Mi Panel</span>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{iniciales}</div>
            <div className="user-info">
              <div className="user-name">{profile.nombre}</div>
              <div className="user-role">{isAdmin ? 'Administrador' : 'Estudiante'}</div>
            </div>
            <button className="btn-signout" onClick={signOut} title="Cerrar sesión">↪</button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {renderPagina()}
      </main>
    </div>
  )
}
