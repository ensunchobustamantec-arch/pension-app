const RESEND_API_KEY = 're_8sHNVYwP_NrSdEFZZMcnrx7HW1DdiVfwh'
const FROM = 'Pensión <onboarding@resend.dev>'

async function enviarCorreo(to, subject, html) {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html })
    })
  } catch (e) {
    console.error('Error enviando correo:', e)
  }
}

export async function correoBienvenida(nombre, email) {
  await enviarCorreo(email, '¡Bienvenido/a a la pensión!', `
    <h2>¡Hola ${nombre}!</h2>
    <p>Tu registro en el sistema de la pensión fue exitoso.</p>
    <p>Ya puedes iniciar sesión para ver tu estado de pagos, horario de aseo y notificaciones.</p>
    <br/>
    <p><strong>Administración de la Pensión</strong></p>
  `)
}

export async function correoPagado(nombre, email, mes, monto) {
  await enviarCorreo(email, `✅ Pago confirmado - ${mes}`, `
    <h2>¡Hola ${nombre}!</h2>
    <p>Tu pago del mes de <strong>${mes}</strong> ha sido registrado exitosamente.</p>
    <table style="border-collapse:collapse;margin-top:10px;">
      <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Mes</strong></td><td style="padding:8px;border:1px solid #ddd;">${mes}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Monto</strong></td><td style="padding:8px;border:1px solid #ddd;">$ ${Number(monto).toLocaleString('es-CO')}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Estado</strong></td><td style="padding:8px;border:1px solid #ddd;color:green;">✅ Pagado</td></tr>
    </table>
    <br/><p>Gracias por tu pago puntual.</p>
    <p><strong>Administración de la Pensión</strong></p>
  `)
}

export async function correoVencido(nombre, email, mes, monto) {
  await enviarCorreo(email, `⚠️ Pago vencido - ${mes}`, `
    <h2>¡Hola ${nombre}!</h2>
    <p>Te informamos que tienes un pago <strong>vencido</strong> pendiente.</p>
    <table style="border-collapse:collapse;margin-top:10px;">
      <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Mes</strong></td><td style="padding:8px;border:1px solid #ddd;">${mes}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Monto</strong></td><td style="padding:8px;border:1px solid #ddd;">$ ${Number(monto).toLocaleString('es-CO')}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Estado</strong></td><td style="padding:8px;border:1px solid #ddd;color:red;">⚠️ Vencido</td></tr>
    </table>
    <br/><p>Por favor realiza tu pago lo antes posible.</p>
    <p><strong>Administración de la Pensión</strong></p>
  `)
}
