import { useState, useEffect } from 'react'

export default function InstallBanner() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    const yaInstalada = window.matchMedia('(display-mode: standalone)').matches
    const yaVisto = localStorage.getItem('installBannerClosed')
    if (yaInstalada || yaVisto) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)

    if (ios) {
      setShow(true)
    } else {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setShow(true)
      })
    }
  }, [])

  function cerrar() {
    localStorage.setItem('installBannerClosed', 'true')
    setShow(false)
  }

  async function instalar() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') cerrar()
    }
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: 12, right: 12, zIndex: 999,
      background: '#1B4332', color: 'white', borderRadius: 16,
      padding: '14px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', gap: 12
    }}>
      <span style={{ fontSize: '1.8rem' }}>📲</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>
          Instala la app
        </div>
        {isIOS ? (
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
            Toca <strong>compartir</strong> (⬆️) y luego <strong>"Añadir a pantalla de inicio"</strong>
          </div>
        ) : (
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)' }}>
            Agrégala a tu pantalla de inicio
          </div>
        )}
      </div>
      {!isIOS && (
        <button onClick={instalar} style={{
          background: '#D4AF37', color: '#1B4332', border: 'none',
          borderRadius: 8, padding: '6px 12px', fontWeight: 600,
          fontSize: '0.8rem', cursor: 'pointer'
        }}>
          Instalar
        </button>
      )}
      <button onClick={cerrar} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
        fontSize: '1.1rem', cursor: 'pointer', padding: 4
      }}>✕</button>
    </div>
  )
}
