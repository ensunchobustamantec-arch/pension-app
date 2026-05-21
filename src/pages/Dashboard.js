import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [stats, setStats] = useState({ totalEstudiantes: 0, habitacionesOcupadas: 0, recaudado: 0, pendientes: 0, vencidos: 0 })
  const [pagosRecientes, setPagosRecientes] = useState([])
  const [loading, setLoading] = useState(true)
  const mesActual = new Date().toISOString().slice(0, 7)

  useEffect(() => {
    async function load() {
      const [{ count: totalEst }, { count: habOcup }, { data: pagos }] = await Promise.all([
        supabase.from('estudiantes').select('*', { count: 'exact', head: true }).eq('activo', true),
        supabase.from('estudiantes').select('*', { count: 'exact', head: true }).eq('activo', true).not('habitacion_id', 'is', null),
        supabase.from('pagos').select('*, estudiantes(profiles(nombre))').order('created_at', { ascending: false }).limit(8)
      ])

      const pagosMes = pagos?.filter(p => p.mes === mesActual) || []
      const recaudado = pagosMes.filter(p => p.estado === 'pagado').reduce((s, p) => s + Number(p.monto), 0)
      const pendientes = pagosMes.filter(p => p.estado === 'pendiente').length
      const vencidos = pagosMes.filter(p => p.estado === 'vencido').length

      setStats({ totalEstudiantes: totalEst || 0, habitacionesOcupadas: habOcup || 0, recaudado, pendientes, vencidos })
      setPagosRecientes(pagos?.slice(0, 6) || [])
      setLoading(false)
    }
    load()
  }, [])

  function formatCOP(n) { return '$ ' + Number(n).toLocaleString('es-CO') }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Panel General</h1>
        <p className="page-subtitle">Resumen del mes — {new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ '--accent': 'var(--terracotta)' }}>
          <p className="stat-label">Estudiantes activos</p>
          <p className="stat-value">{stats.totalEstudiantes}</p>
          <p className="stat-sub">{stats.habitacionesOcupadas} habitaciones ocupadas</p>
        </div>
        <div className="stat-card" style={{ '--accent': 'var(--green)' }}>
          <p className="stat-label">Recaudado este mes</p>
          <p className="stat-value" style={{ fontSize: '1.4rem' }}>{formatCOP(stats.recaudado)}</p>
          <p className="stat-sub">Pagos confirmados</p>
        </div>
        <div className="stat-card" style={{ '--accent': 'var(--gold)' }}>
          <p className="stat-label">Pagos pendientes</p>
          <p className="stat-value">{stats.pendientes}</p>
          <p className="stat-sub">Por cobrar este mes</p>
        </div>
        <div className="stat-card" style={{ '--accent': 'var(--red)' }}>
          <p className="stat-label">Pagos vencidos</p>
          <p className="stat-value" style={{ color: stats.vencidos > 0 ? 'var(--red)' : 'inherit' }}>{stats.vencidos}</p>
          <p className="stat-sub">Requieren atención</p>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 20, fontSize: '1.1rem' }}>Últimos movimientos</h3>
        {pagosRecientes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p className="empty-text">No hay pagos registrados aún.<br />Ve a Pagos para generar los cobros del mes.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Mes</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Fecha pago</th>
                </tr>
              </thead>
              <tbody>
                {pagosRecientes.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.estudiantes?.profiles?.nombre || '—'}</td>
                    <td>{p.mes}</td>
                    <td>{formatCOP(p.monto)}</td>
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
    </div>
  )
}
