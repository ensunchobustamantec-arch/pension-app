import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { enviarNotificacion } from '../useNotifications'

export default function EstudianteDashboard() {
  const { profile } = useAuth()
  const [data, setData] = useState(null)
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)

  const mesActual = new Date().toISOString().slice(0, 7)

  useEffect(() => {
    if (profile) load()
  }, [profile])

  async function load() {
    const [{ data: est }, { data: als }] = await Promise.all([
      supabase.from('estudiantes').select('*, habitaciones(numero, tipo, descripcion), pagos(*)').eq('user_id', profile.id).eq('activo', true).maybeSingle(),
      supabase.from('alertas').select('*').eq('destinatario_id', profile.id).order('created_at', { ascending: false }).limit(10)
    ])

    if (est) {
      const { data: aseo } = await supabase.from('aseo').select('*').eq('estudiante_id', est.id).eq('activo', true)
      setData({ ...est, aseo: aseo || [] })
    }
    if (als) {
      const nuevas = als.filter(a => !a.leida)
      if (nuevas.length > 0) {
        enviarNotificacion(nuevas[0].titulo, nuevas[0].mensaje, nuevas[0].tipo)
      }
      setAlertas(als)
    }
    setLoading(false)
  }

  async function marcarLeida(id) {
    await supabase.from('alertas').update({ leida: true }).eq('id', id)
    setAlertas(prev => prev.map(a => a.id === id ? { ...a, leida: true } : a))
  }

  function formatCOP(n) { return '$ ' + Number(n).toLocaleString('es-CO') }

  const TIPOS = { info: { emoji: 'ℹ️', bg: '#D6EAF8', color: '#1A4A7A' }, pago: { emoji: '💰', bg: '#FCF3CF', color: '#7A5C00' }, aseo: { emoji: '🧹', bg: '#D5F5E3', color: '#1A6B35' }, urgente: { emoji: '🚨', bg: '#FDDEDE', color: '#8B1A1A' } }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  if (!data) return (
    <div className="card" style={{ textAlign: 'center', padding: 48 }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>⏳</div>
      <h3>Tu cuenta está pendiente de activación</h3>
      <p style={{ color: 'var(--muted)', marginTop: 8, maxWidth: 360, margin: '8px auto 0' }}>
        El administrador de la pensión aún no ha activado tu perfil. Comunícate con él para que te asigne tu habitación.
      </p>
    </div>
  )

  const pagoMes = data.pagos?.find(p => p.mes === mesActual)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Hola, {profile.nombre?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">Tu panel de inquilino</p>
      </div>

      <div className="stats-grid">
        {/* Habitación */}
        <div className="stat-card" style={{ '--accent': 'var(--terracotta)' }}>
          <p className="stat-label">Tu habitación</p>
          <p className="stat-value">{data.habitaciones?.numero || '—'}</p>
          <p className="stat-sub">{data.habitaciones?.tipo || 'Sin asignar'}</p>
        </div>

        {/* Tarifa */}
        <div className="stat-card" style={{ '--accent': 'var(--gold)' }}>
          <p className="stat-label">Tu tarifa mensual</p>
          <p className="stat-value" style={{ fontSize: '1.3rem' }}>{formatCOP(data.tarifa)}</p>
          <p className="stat-sub">Pago mensual</p>
        </div>

        {/* Estado pago mes */}
        <div className="stat-card" style={{ '--accent': pagoMes?.estado === 'pagado' ? 'var(--green)' : pagoMes?.estado === 'vencido' ? 'var(--red)' : 'var(--gold)' }}>
          <p className="stat-label">Pago de {new Date().toLocaleDateString('es-CO', { month: 'long' })}</p>
          <p className="stat-value" style={{ fontSize: '1rem', marginTop: 4 }}>
            {pagoMes ? (
              <span className={`badge ${pagoMes.estado === 'pagado' ? 'badge-green' : pagoMes.estado === 'vencido' ? 'badge-red' : 'badge-yellow'}`} style={{ fontSize: '0.9rem' }}>
                {pagoMes.estado.charAt(0).toUpperCase() + pagoMes.estado.slice(1)}
              </span>
            ) : '—'}
          </p>
          <p className="stat-sub">{pagoMes ? formatCOP(pagoMes.monto) : 'Sin cobro generado'}</p>
        </div>
      </div>

      {/* Turno de aseo */}
      {data.aseo?.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>🧹 Mis turnos de aseo</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {data.aseo.map(t => (
              <div key={t.id} style={{ background: '#D5F5E3', color: '#1A6B35', borderRadius: 10, padding: '10px 16px' }}>
                <div style={{ fontWeight: 600 }}>{t.dia_semana}</div>
                <div style={{ fontSize: '0.82rem' }}>{t.zona} — ⏰ {t.hora}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial de pagos */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>💳 Historial de pagos</h3>
        {data.pagos?.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No hay pagos registrados aún.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Fecha pago</th>
                </tr>
              </thead>
              <tbody>
                {data.pagos?.slice(0, 8).map(p => (
                  <tr key={p.id}>
                    <td>{p.mes}</td>
                    <td style={{ fontWeight: 600 }}>{formatCOP(p.monto)}</td>
                    <td>
                      <span className={`badge ${p.estado === 'pagado' ? 'badge-green' : p.estado === 'vencido' ? 'badge-red' : 'badge-yellow'}`}>
                        {p.estado.charAt(0).toUpperCase() + p.estado.slice(1)}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString('es-CO') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Alertas */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>
          🔔 Mis notificaciones
          {alertas.filter(a => !a.leida).length > 0 && (
            <span className="notif-dot" />
          )}
        </h3>
        {alertas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <p className="empty-text">No tienes notificaciones</p>
          </div>
        ) : (
          alertas.map(a => {
            const t = TIPOS[a.tipo] || TIPOS.info
            return (
              <div
                key={a.id}
                className={`alerta-item ${!a.leida ? 'alerta-unread' : ''}`}
                style={{ cursor: !a.leida ? 'pointer' : 'default' }}
                onClick={() => !a.leida && marcarLeida(a.id)}
              >
                <div className="alerta-icon" style={{ background: t.bg, color: t.color }}>{t.emoji}</div>
                <div className="alerta-info">
                  <div className="alerta-titulo">
                    {a.titulo}
                    {!a.leida && <span style={{ fontSize: '0.7rem', marginLeft: 8, background: 'var(--terracotta)', color: 'white', borderRadius: 20, padding: '1px 7px' }}>Nueva</span>}
                  </div>
                  <div className="alerta-msg">{a.mensaje}</div>
                  <div className="alerta-time">{new Date(a.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
