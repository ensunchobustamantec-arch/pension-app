import { supabase } from './supabase'

async function llamarFuncion(nombreFuncion, body) {
  try {
    const { error } = await supabase.functions.invoke(nombreFuncion, { body })
    if (error) console.error(`Error en ${nombreFuncion}:`, error)
  } catch (e) {
    console.error('Error enviando correo:', e)
  }
}

export async function correoBienvenida(nombre, email) {
  await llamarFuncion('correo-bienvenida', { nombre, email })
}

export async function correoPagado(nombre, email, mes, monto) {
  await llamarFuncion('correo-pago-confirmado', { nombre, email, mes, monto })
}

export async function correoVencido(nombre, email, mes, monto) {
  await llamarFuncion('correo-pago-vencido', { nombre, email, mes, monto })
}
