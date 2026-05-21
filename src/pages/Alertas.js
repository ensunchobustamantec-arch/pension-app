import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const TIPOS = { info: { emoji: 'ℹ️', bg: '#D6EAF8', color: '#1A4A7A' }, pago: { emoji: '💰', bg: '#FCF3CF', color: '#7A5C00' }, aseo: { emoji: '🧹', bg: '#D5F5E3', color: '#1A6B35' }, urgente: { emoji: '🚨', bg: '#FDDEDE', color: '#8B1A1A' } }

export default function Alertas() {
  const [alertas, setAlertas] = useState([])
  const [perfiles, setPerfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ destinatario_id: '', titulo: '', mensaje: '', tipo: 'info' })
  const [masivo, setMasivo] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: al }, { data: profs }] = await Promise.all([
      supabase.from('alertas').select('*, profiles(nombre)').order('created_at', { ascending: false }).limit(50),
      supabase.from('profiles').select('id, nombre').eq('rol', 'estudiante').order('nombre')
    ])
    setAlertas(al || [])
    setPerfiles(profs || [])
    setLoading(false)
  }

  async function enviar() {
    if (!form.titulo || !form.mensaje) return alert('Completa el título y el mensaje')
    setSaving(true)
    if (masivo) {
      await Promise.all(perfiles.map(p =>
        supabase.from('alertas').insert({ ...form, destinatario_id: p.id })
      ))
    } else {
      if (!form.destinatario_id) { setSaving(false); return alert('Selecciona un destinatario') }
      await supabase.from('alertas').insert(form)
    }
    await load()
    setSaving(false)
    setModal(false)
    setForm({ destinatario_id: '', titulo: '', mensaje: '', tipo: 'info' })
    setMasivo(false)
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `hace ${mins} min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `hace ${hrs}h`
    return `hace ${Math.floor(hrs / 24)} días`
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Alertas</h1>
          <p className="page-subtitle">Envía notificaciones a tus estudiantes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Enviar alerta</button>
      </div>

      <div className="card">
        {alertas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <p className="empty-text">No hay alertas enviadas aún.</p>
          </div>
        ) : (
          alertas.map(a => {
            const t = TIPOS[a.tipo] || TIPOS.info
            return (
              <div key={a.id} className={`alerta-item ${!a.leida ? 'alerta-unread' : ''}`}>
                <div className="alerta-icon" style={{ background: t.bg, color: t.color }}>{t.emoji}</div>
                <div className="alerta-info">
                  <div className="alerta-titulo">
                    {a.titulo}
                    {!a.leida && <span style={{ fontSize: '0.7rem', marginLeft: 8, background: 'var(--terracotta)', color: 'white', borderRadius: 20, padding: '1px 7px' }}>Nueva</span>}
                  </div>
                  <div className="alerta-msg">{a.mensaje}</div>
                  <div className="alerta-time">Para: {a.profiles?.nombre || 'Desconocido'} · {timeAgo(a.created_at)}</div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Enviar Alerta</h3>
              <button className="btn-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={masivo} onChange={e => setMasivo(e.target.checked)} />
                  <span className="form-label" style={{ margin: 0 }}>Enviar a TODOS los estudiantes</span>
                </label>
              </div>
              {!masivo && (
                <div className="form-group">
                  <label className="form-label">Destinatario</label>
                  <select className="form-select" value={form.destinatario_id} onChange={e => setForm({ ...form, destinatario_id: e.target.value })}>
                    <option value="">— Selecciona —</option>
                    {perfiles.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select className="form-select" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                  <option value="info">ℹ️ Información</option>
                  <option value="pago">💰 Pago</option>
                  <option value="aseo">🧹 Aseo</option>
                  <option value="urgente">🚨 Urgente</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Título</label>
                <input className="form-input" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Recordatorio de pago" />
              </div>
              <div className="form-group">
                <label className="form-label">Mensaje</label>
                <textarea className="form-textarea" value={form.mensaje} onChange={e => setForm({ ...form, mensaje: e.target.value })} rows={4} placeholder="Escribe el mensaje que recibirán los estudiantes..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={enviar} disabled={saving}>{saving ? 'Enviando...' : `Enviar${masivo ? ' a todos' : ''}`}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
