import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { correoPagado, correoVencido } from '../lib/correos'

export default function Pagos() {
  const [pagos, setPagos] = useState([])
  const [estudiantes, setEstudiantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ estudiante_id: '', mes: new Date().toISOString().slice(0, 7), monto: '', fecha_pago: '', estado: 'pendiente', notas: '' })

  const mesActual = new Date().toISOString().slice(0, 7)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: pags }, { data: ests }] = await Promise.all([
      supabase.from('pagos').select('*, estudiantes(id, tarifa, profiles(nombre, email))').order('created_at', { ascending: false }),
      supabase.from('estudiantes').select('id, tarifa, profiles(nombre, email)').eq('activo', true)
    ])
    setPagos(pags || [])
    setEstudiantes(ests || [])
    setLoading(false)
  }

  function formatCOP(n) { return '$ ' + Number(n).toLocaleString('es-CO') }

  function abrirNuevo() {
    setForm({ estudiante_id: '', mes: mesActual, monto: '', fecha_pago: '', estado: 'pendiente', notas: '' })
    setModal(true)
  }

  function seleccionarEst(id) {
    const est = estudiantes.find(e => e.id === id)
    setForm(f => ({ ...f, estudiante_id: id, monto: est ? est.tarifa : f.monto }))
  }

  async function generarMes() {
    if (!window.confirm(`¿Generar pagos pendientes para TODOS los estudiantes activos del mes ${mesActual}?`)) return
    setSaving(true)
    const promesas = estudiantes.map(e =>
      supabase.from('pagos').insert({ estudiante_id: e.id, mes: mesActual, monto: e.tarifa, estado: 'pendiente' })
    )
    await Promise.all(promesas)
    await load()
    setSaving(false)
  }

  async function marcarPagado(pago) {
    await supabase.from('pagos').update({ estado: 'pagado', fecha_pago: new Date().toISOString().slice(0, 10) }).eq('id', pago.id)

    // Enviar correo de confirmación
    const nombre = pago.estudiantes?.profiles?.nombre
    const email = pago.estudiantes?.profiles?.email
    if (nombre && email) {
      await correoPagado(nombre, email, pago.mes, pago.monto)
    }

    await load()
  }

  async function marcarVencido(id) {
    await supabase.from('pagos').update({ estado: 'vencido' }).eq('id', id)

    // Enviar correo de aviso de vencimiento
    const pago = pagos.find(p => p.id === id)
    const nombre = pago?.estudiantes?.profiles?.nombre
    const email = pago?.estudiantes?.profiles?.email
    if (nombre && email) {
      await correoVencido(nombre, email, pago.mes, pago.monto)
    }

    await load()
  }

  async function guardar() {
    if (!form.estudiante_id || !form.monto) return alert('Completa los campos requeridos')
    setSaving(true)
    await supabase.from('pagos').insert({ ...form, fecha_pago: form.fecha_pago || null })
    await load()
    setSaving(false)
    setModal(false)
  }

  async function eliminar(id) {
    if (!window.confirm('¿Eliminar este pago?')) return
    await supabase.from('pagos').delete().eq('id', id)
    await load()
  }

  const pagosFiltrados = filtro === 'todos' ? pagos : pagos.filter(p => p.estado === filtro)
  const totales = { pagado: pagos.filter(p => p.estado === 'pagado' && p.mes === mesActual).reduce((s, p) => s + Number(p.monto), 0) }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Pagos</h1>
          <p className="page-subtitle">Control de cobros y recaudos</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={generarMes} disabled={saving}>📋 Generar cobros del mes</button>
          <button className="btn btn-primary" onClick={abrirNuevo}>+ Registrar pago</button>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ '--accent': 'var(--green)' }}>
          <p className="stat-label">Recaudado este mes</p>
          <p className="stat-value" style={{ fontSize: '1.3rem' }}>{formatCOP(totales.pagado)}</p>
        </div>
        <div className="stat-card" style={{ '--accent': 'var(--yellow, #D4A843)' }}>
          <p className="stat-label">Pendientes este mes</p>
          <p className="stat-value">{pagos.filter(p => p.estado === 'pendiente' && p.mes === mesActual).length}</p>
        </div>
        <div className="stat-card" style={{ '--accent': 'var(--red)' }}>
          <p className="stat-label">Vencidos este mes</p>
          <p className="stat-value">{pagos.filter(p => p.estado === 'vencido' && p.mes === mesActual).length}</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          {['todos', 'pendiente', 'pagado', 'vencido'].map(f => (
            <button key={f} className={`btn btn-sm ${filtro === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFiltro(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Mes</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Fecha pago</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagosFiltrados.length === 0 && (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">💳</div><p className="empty-text">No hay pagos en esta categoría</p></div></td></tr>
              )}
              {pagosFiltrados.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.estudiantes?.profiles?.nombre || '—'}</td>
                  <td>{p.mes}</td>
                  <td style={{ fontWeight: 600 }}>{formatCOP(p.monto)}</td>
                  <td>
                    <span className={`badge ${p.estado === 'pagado' ? 'badge-green' : p.estado === 'vencido' ? 'badge-red' : 'badge-yellow'}`}>
                      {p.estado.charAt(0).toUpperCase() + p.estado.slice(1)}
                    </span>
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString('es-CO') : '—'}</td>
                  <td>
                    <div className="row-actions">
                      {p.estado !== 'pagado' && <button className="btn btn-success btn-sm" onClick={() => marcarPagado(p)}>✓ Pagado</button>}
                      {p.estado === 'pendiente' && <button className="btn btn-secondary btn-sm" onClick={() => marcarVencido(p.id)}>⚠️</button>}
                      <button className="btn btn-danger btn-sm" onClick={() => eliminar(p.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Pago</h3>
              <button className="btn-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Estudiante</label>
                <select className="form-select" value={form.estudiante_id} onChange={e => seleccionarEst(e.target.value)}>
                  <option value="">— Selecciona —</option>
                  {estudiantes.map(e => <option key={e.id} value={e.id}>{e.profiles?.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Mes (AAAA-MM)</label>
                <input className="form-input" type="month" value={form.mes} onChange={e => setForm({ ...form, mes: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Monto (COP)</label>
                <input className="form-input" type="number" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} placeholder="300000" />
              </div>
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select className="form-select" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                  <option value="pendiente">Pendiente</option>
                  <option value="pagado">Pagado</option>
                  <option value="vencido">Vencido</option>
                </select>
              </div>
              {form.estado === 'pagado' && (
                <div className="form-group">
                  <label className="form-label">Fecha de pago</label>
                  <input className="form-input" type="date" value={form.fecha_pago} onChange={e => setForm({ ...form, fecha_pago: e.target.value })} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Notas (opcional)</label>
                <textarea className="form-textarea" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Observaciones..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
