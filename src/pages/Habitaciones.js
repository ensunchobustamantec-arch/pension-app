import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Habitaciones() {
  const [habitaciones, setHabitaciones] = useState([])
  const [ocupantes, setOcupantes] = useState({})
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ numero: '', tipo: 'Estándar', descripcion: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const { data: habs } = await supabase.from('habitaciones').select('*').eq('activa', true).order('numero')
    const { data: ests } = await supabase.from('estudiantes').select('habitacion_id, profiles(nombre)').eq('activo', true)
    const ocupMap = {}
    ests?.forEach(e => { if (e.habitacion_id) ocupMap[e.habitacion_id] = e.profiles?.nombre })
    setHabitaciones(habs || [])
    setOcupantes(ocupMap)
    setLoading(false)
  }

  function abrirNueva() {
    setEditing(null)
    setForm({ numero: '', tipo: 'Estándar', descripcion: '' })
    setModal(true)
  }

  function abrirEditar(h) {
    setEditing(h)
    setForm({ numero: h.numero, tipo: h.tipo, descripcion: h.descripcion || '' })
    setModal(true)
  }

  async function guardar() {
    setSaving(true)
    if (editing) {
      await supabase.from('habitaciones').update(form).eq('id', editing.id)
    } else {
      await supabase.from('habitaciones').insert(form)
    }
    await load()
    setSaving(false)
    setModal(false)
  }

  async function eliminar(id) {
    if (ocupantes[id]) return alert('Esta habitación tiene un estudiante asignado. Primero cambia su habitación.')
    if (!window.confirm('¿Eliminar habitación?')) return
    await supabase.from('habitaciones').update({ activa: false }).eq('id', id)
    await load()
  }

  const tipoColor = { Estándar: '#D6EAF8', Premium: '#FCF3CF', Compartida: '#D5F5E3' }
  const tipoText = { Estándar: '#1A4A7A', Premium: '#7A5C00', Compartida: '#1A6B35' }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Habitaciones</h1>
          <p className="page-subtitle">{habitaciones.length} habitaciones · {Object.keys(ocupantes).length} ocupadas</p>
        </div>
        <button className="btn btn-primary" onClick={abrirNueva}>+ Nueva habitación</button>
      </div>

      <div className="hab-grid">
        {habitaciones.map(h => (
          <div key={h.id} className="hab-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p className="hab-number">{h.numero}</p>
              <span className="badge" style={{ background: tipoColor[h.tipo], color: tipoText[h.tipo] }}>{h.tipo}</span>
            </div>
            <p className="hab-tipo">Habitación</p>
            {h.descripcion && <p className="hab-desc">{h.descripcion}</p>}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
              {ocupantes[h.id]
                ? <p className="hab-ocupante">🧑‍🎓 {ocupantes[h.id]}</p>
                : <p className="hab-libre">Disponible</p>
              }
            </div>
            <div className="row-actions" style={{ marginTop: 14 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(h)}>✏️ Editar</button>
              <button className="btn btn-danger btn-sm" onClick={() => eliminar(h.id)}>🗑️</button>
            </div>
          </div>
        ))}

        {habitaciones.length === 0 && (
          <div className="card" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state">
              <div className="empty-icon">🚪</div>
              <p className="empty-text">No hay habitaciones registradas.<br />Agrega las habitaciones de tu pensión.</p>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Editar Habitación' : 'Nueva Habitación'}</h3>
              <button className="btn-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Número / nombre</label>
                <input className="form-input" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} placeholder="Ej: 101, A1, Principal" />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select className="form-select" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                  <option>Estándar</option>
                  <option>Premium</option>
                  <option>Compartida</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Descripción (opcional)</label>
                <textarea className="form-textarea" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Baño privado, ventana al patio..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar} disabled={saving || !form.numero}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
