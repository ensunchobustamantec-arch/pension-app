import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const ZONAS = ['Cocina', 'Baño principal', 'Sala', 'Patio', 'Pasillo', 'Comedor', 'Zona lavandería']

export default function Aseo() {
  const [turnos, setTurnos] = useState([])
  const [estudiantes, setEstudiantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ estudiante_id: '', zona: 'Cocina', dia_semana: 'Lunes', hora: '08:00' })

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: t }, { data: e }] = await Promise.all([
      supabase.from('aseo').select('*, estudiantes(profiles(nombre))').eq('activo', true),
      supabase.from('estudiantes').select('id, profiles(nombre)').eq('activo', true)
    ])
    setTurnos(t || [])
    setEstudiantes(e || [])
    setLoading(false)
  }

  async function guardar() {
    if (!form.estudiante_id) return alert('Selecciona un estudiante')
    setSaving(true)
    await supabase.from('aseo').insert(form)
    await load()
    setSaving(false)
    setModal(false)
  }

  async function eliminar(id) {
    await supabase.from('aseo').update({ activo: false }).eq('id', id)
    await load()
  }

  async function enviarRecordatorio(est) {
    // Crea alerta en la BD para que el estudiante la vea
    await supabase.from('alertas').insert({
      destinatario_id: est.estudiantes.user_id,
      titulo: '🧹 Recordatorio de aseo',
      mensaje: `Recuerda que tienes aseo asignado. Zona: ${est.zona} — ${est.dia_semana} a las ${est.hora}. ¡Gracias por colaborar!`,
      tipo: 'aseo'
    })
    alert(`Recordatorio enviado a ${est.estudiantes?.profiles?.nombre}`)
  }

  async function enviarTodos() {
    if (!window.confirm('¿Enviar recordatorio a TODOS los estudiantes con turno de aseo?')) return
    for (const t of turnos) {
      if (t.estudiantes?.user_id) {
        await supabase.from('alertas').insert({
          destinatario_id: t.estudiantes.user_id,
          titulo: '🧹 Recordatorio de aseo',
          mensaje: `Recuerda que tienes aseo asignado. Zona: ${t.zona} — ${t.dia_semana} a las ${t.hora}. ¡Gracias por colaborar!`,
          tipo: 'aseo'
        })
      }
    }
    alert('Recordatorios enviados a todos')
  }

  // Agrupa por día
  const porDia = {}
  DIAS.forEach(d => { porDia[d] = turnos.filter(t => t.dia_semana === d) })

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Horario de Aseo</h1>
          <p className="page-subtitle">Gestiona los turnos de limpieza de la pensión</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={enviarTodos}>📣 Recordar a todos</button>
          <button className="btn btn-primary" onClick={() => setModal(true)}>+ Agregar turno</button>
        </div>
      </div>

      {/* Vista semanal */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <h3 style={{ marginBottom: 20, fontSize: '1rem' }}>Vista semanal</h3>
        <div style={{ minWidth: 700 }}>
          <div className="aseo-grid">
            {DIAS.map(d => <div key={d} className="aseo-day-header">{d.slice(0, 3)}</div>)}
            {DIAS.map(d => (
              <div key={d} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {porDia[d].length === 0
                  ? <div className="aseo-slot aseo-empty">—</div>
                  : porDia[d].map(t => (
                    <div key={t.id} className="aseo-slot aseo-assigned">
                      <div className="aseo-name">{t.estudiantes?.profiles?.nombre?.split(' ')[0]}</div>
                      <div className="aseo-zona">{t.zona}</div>
                      <div className="aseo-zona" style={{ marginTop: 4 }}>⏰ {t.hora}</div>
                    </div>
                  ))
                }
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lista detallada */}
      <div className="card" style={{ marginTop: 20, padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1rem' }}>Lista de turnos</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Día</th>
                <th>Zona</th>
                <th>Hora</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {turnos.length === 0 && (
                <tr><td colSpan={5}><div className="empty-state"><div className="empty-icon">🧹</div><p className="empty-text">No hay turnos asignados</p></div></td></tr>
              )}
              {turnos.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500 }}>{t.estudiantes?.profiles?.nombre || '—'}</td>
                  <td><span className="badge badge-blue">{t.dia_semana}</span></td>
                  <td>{t.zona}</td>
                  <td style={{ color: 'var(--muted)' }}>⏰ {t.hora}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => enviarRecordatorio(t)}>📱 Recordar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => eliminar(t.id)}>🗑️</button>
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
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Nuevo Turno de Aseo</h3>
              <button className="btn-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Estudiante</label>
                <select className="form-select" value={form.estudiante_id} onChange={e => setForm({ ...form, estudiante_id: e.target.value })}>
                  <option value="">— Selecciona —</option>
                  {estudiantes.map(e => <option key={e.id} value={e.id}>{e.profiles?.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Día</label>
                <select className="form-select" value={form.dia_semana} onChange={e => setForm({ ...form, dia_semana: e.target.value })}>
                  {DIAS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Zona a limpiar</label>
                <select className="form-select" value={form.zona} onChange={e => setForm({ ...form, zona: e.target.value })}>
                  {ZONAS.map(z => <option key={z}>{z}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Hora</label>
                <input className="form-input" type="time" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} />
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
