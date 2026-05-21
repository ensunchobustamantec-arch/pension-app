# 🏠 Guía completa — Pensión EnsunchoPro

## PASO 1: Crear las tablas en Supabase

1. Ve a **https://supabase.com** → inicia sesión
2. Abre tu proyecto **PensionEnsunchoProject1**
3. En el menú izquierdo, clic en **"SQL Editor"**
4. Copia TODO el contenido del archivo `SUPABASE_SQL.sql`
5. Pégalo en el editor y clic en **"Run"** (botón verde)
6. Debe aparecer "Success" en verde ✅

---

## PASO 2: Crear tu cuenta de Administrador

1. En Supabase, ve a **Authentication → Users**
2. Clic en **"Invite user"** o crea el usuario con tu correo
3. Después de crear el usuario, ve a **SQL Editor** y ejecuta esto
   (reemplaza el correo con el tuyo):

```sql
UPDATE profiles
SET rol = 'admin'
WHERE email = 'TU_CORREO@aqui.com';
```

---

## PASO 3: Subir la aplicación a GitHub

1. Ve a **https://github.com** y crea una cuenta si no tienes
2. Crea un repositorio nuevo llamado `pension-app`
3. En tu computador, abre la terminal (o PowerShell en Windows)
4. Ejecuta estos comandos:

```bash
cd pension-app
git init
git add .
git commit -m "Pensión app inicial"
git remote add origin https://github.com/TU_USUARIO/pension-app.git
git push -u origin main
```

---

## PASO 4: Publicar en Vercel (gratis)

1. Ve a **https://vercel.com** y crea cuenta con GitHub
2. Clic en **"Add New Project"**
3. Selecciona tu repositorio `pension-app`
4. En **"Framework Preset"** selecciona **Create React App**
5. Clic en **"Deploy"** y espera ~2 minutos
6. Vercel te dará una URL tipo: `pension-app-xyz.vercel.app`

🎉 ¡Ya está publicada! Tu papá y los estudiantes acceden desde el celular con esa URL.

---

## PASO 5: Cómo usar la app

### Tu papá (Administrador):
- Entra a la URL → inicia sesión con su correo de admin
- Ve a **Habitaciones** → agrega las 6 habitaciones de la pensión
- Cuando un estudiante se registre, va a **Estudiantes** → lo agrega, asigna habitación y tarifa personalizada
- Cada mes va a **Pagos** → clic en "Generar cobros del mes" y aparecen todos los cobros automáticamente
- Cuando el estudiante pague, marca el pago como ✓ Pagado
- En **Aseo** → asigna los turnos y manda recordatorios con un clic

### Estudiantes:
- Entran a la misma URL desde el celular
- Se registran con su correo y contraseña
- El admin los activa y asigna habitación
- Desde su panel ven: su tarifa, estado del pago del mes, turno de aseo y notificaciones

---

## Funciones incluidas

✅ Login y registro de usuarios  
✅ Panel admin vs panel estudiante (automático según rol)  
✅ Habitaciones (Estándar / Premium / Compartida)  
✅ Tarifas individuales por estudiante  
✅ Control de pagos con estados (pendiente / pagado / vencido)  
✅ Generación automática de cobros del mes  
✅ Horario de aseo semanal por zonas  
✅ Recordatorios de aseo individuales o masivos  
✅ Sistema de alertas/notificaciones  
✅ Todos los datos guardados en la nube (Supabase) — nunca se borran  
✅ Funciona desde cualquier celular sin descargar nada  

---

## ¿Problemas?

- **"Permission denied"** en Supabase → revisa que ejecutaste el SQL completo
- **Pantalla en blanco** → abre la consola del navegador (F12) y comparte el error
- **El estudiante no ve su info** → el admin debe agregarlo en la sección Estudiantes

---

Hecho con ❤️ para la Pensión Ensuncho
