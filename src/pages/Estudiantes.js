import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Estudiantes() {
  const [estudiantes, setEstudiantes] = useState([])
  const [habitaciones, setHabitaciones] = useState([])
  const [perfiles, setPerfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'nuevo' | 'editar' | 'tarifa'
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ user_id: '', habitacion_id: '', tarifa: 300000, fecha_ingreso: '', contacto_emergencia: '', telefono_emergencia: '' })
  const [tarifa, setTarifa] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: est }, { data: habs }, { data: profs }] = await Promise.all([
      supabase.from('estudiantes').select('*, profiles(nombre, email, telefono), habitaciones(numero, tipo)').eq('activo', true).order('created_at'),
      supabase.from('habitaciones').select('*').eq('activa', true).order('numero'),
      supabase.from('profiles').select('*').eq('rol', 'estudiante').order('nombre')
    ])
    setEstudiantes(est || [])
    setHabitaciones(habs || [])
    setPerfiles(profs || [])
    setLoading(false)
  }

  function formatCOP(n) { return '$ ' + Number(n).toLocaleString('es-CO') }

  function abrirNuevo() {
    setForm({ user_id: '', habitacion_id: '', tarifa: 300000, fecha_ingreso: new Date().toISOString().slice(0, 10), contacto_emergencia: '', telefono_emergencia: '' })
    setModal('nuevo')
  }

  function abrirEditar(est) {
    setSelected(est)
    setForm({ user_id: est.user_id, habitacion_id: est.habitacion_id || '', tarifa: est.tarifa, fecha_ingreso: est.fecha_ingreso, contacto_emergencia: est.contacto_emergencia || '', telefono_emergencia: est.telefono_emergencia || '' })
    setModal('editar')
  }

  function abrirTarifa(est) {
    setSelected(est)
    setTarifa(est.tarifa)
    setModal('tarifa')
  }

  async function guardar() {
    if (!form.user_id) return alert('Selecciona un estudiante')
    setSaving(true)
    if (modal === 'nuevo') {
      await supabase.from('estudiantes').insert({ ...form, habitacion_id: form.habitacion_id || null })
    } else {
      await supabase.from('estudiantes').update({ ...form, habitacion_id: form.habitacion_id || null }).eq('id', selected.id)
    }
    await load()
    setSaving(false)
    setModal(null)
  }

  async function guardarTarifa() {
    setSaving(true)
    await supabase.from('estudiantes').update({ tarifa: Number(tarifa) }).eq('id', selected.id)
    await load()
    setSaving(false)
    setModal(null)
  }

  async function darDeBaja(id) {
    if (!window.confirm('¿Confirmas dar de baja a este estudiante?')) return
    await supabase.from('estudiantes').update({ activo: false }).eq('id', id)
    await load()
  }

  const perfisDisponibles = perfiles.filter(p => !estudiantes.find(e => e.user_id === p.id) || (modal === 'editar' && selected?.user_id === p.id))

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Estudiantes</h1>
          <p className="page-subtitle">{estudiantes.length} estudiantes activos</p>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevo}>+ Agregar estudiante</button>
      </div>

      {estudiantes.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p className="empty-text">No hay estudiantes activos.<br />Primero deben registrarse en la app y luego tú los asignas aquí.</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Habitación</th>
                  <th>Tarifa / mes</th>
                  <th>Teléfono</th>
                  <th>Ingreso</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {estudiantes.map(e => (
                  <tr key={e.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{e.profiles?.nombre || '—'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{e.profiles?.email}</div>
                    </td>
                    <td>
                      {e.habitaciones ? (
                        <span className="badge badge-blue">Hab. {e.habitaciones.numero} — {e.habitaciones.tipo}</span>
                      ) : (
                        <span className="badge badge-gray">Sin asignar</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--terracotta)' }}>{formatCOP(e.tarifa)}</td>
                    <td style={{ color: 'var(--muted)' }}>{e.profiles?.telefono || '—'}</td>
                    <td style={{ color: 'var(--muted)' }}>{e.fecha_ingreso ? new Date(e.fecha_ingreso).toLocaleDateString('es-CO') : '—'}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => abrirTarifa(e)}>💰 Tarifa</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(e)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => darDeBaja(e.id)}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal nuevo/editar */}
      {(modal === 'nuevo' || modal === 'editar') && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{modal === 'nuevo' ? 'Agregar Estudiante' : 'Editar Estudiante'}</h3>
              <button className="btn-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Estudiante (usuario registrado)</label>
                <select className="form-select" value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })}>
                  <option value="">— Selecciona —</option>
                  {perfisDisponibles.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.email})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Habitación</label>
                <select className="form-select" value={form.habitacion_id} onChange={e => setForm({ ...form, habitacion_id: e.target.value })}>
                  <option value="">— Sin asignar —</option>
                  {habitaciones.map(h => <option key={h.id} value={h.id}>Hab. {h.numero} — {h.tipo}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tarifa mensual (COP)</label>
                <input className="form-input" type="number" value={form.tarifa} onChange={e => setForm({ ...form, tarifa: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha de ingreso</label>
                <input className="form-input" type="date" value={form.fecha_ingreso} onChange={e => setForm({ ...form, fecha_ingreso: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Contacto de emergencia</label>
                <input className="form-input" value={form.contacto_emergencia} onChange={e => setForm({ ...form, contacto_emergencia: e.target.value })} placeholder="Nombre del acudiente" />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono de emergencia</label>
                <input className="form-input" value={form.telefono_emergencia} onChange={e => setForm({ ...form, telefono_emergencia: e.target.value })} placeholder="3001234567" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal tarifa */}
      {modal === 'tarifa' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Cambiar Tarifa</h3>
              <button className="btn-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 16, color: 'var(--muted)', fontSize: '0.9rem' }}>
                Estudiante: <strong style={{ color: 'var(--ink)' }}>{selected?.profiles?.nombre}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">Nueva tarifa mensual (COP)</label>
                <input className="form-input" type="number" value={tarifa} onChange={e => setTarifa(e.target.value)} placeholder="300000" />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Tarifa actual: ${Number(selected?.tarifa).toLocaleString('es-CO')}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarTarifa} disabled={saving}>{saving ? 'Guardando...' : 'Actualizar tarifa'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
