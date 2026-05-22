export async function pedirPermisoNotificaciones() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const permiso = await Notification.requestPermission()
  return permiso === 'granted'
}

export function enviarNotificacion(titulo, mensaje, tipo = 'info') {
  if (Notification.permission !== 'granted') return
  const iconos = {
    info: '📢', pago: '💰', aseo: '🧹', urgente: '🚨'
  }
  new Notification(`${iconos[tipo] || '📢'} ${titulo}`, {
    body: mensaje,
    icon: '/logo192.png',
    badge: '/favicon.png'
  })
}
