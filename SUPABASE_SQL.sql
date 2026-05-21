-- =============================================
-- PENSIÓN APP - Script de Base de Datos
-- Ejecuta esto en Supabase > SQL Editor
-- =============================================

-- Tabla de perfiles de usuario (admin y estudiantes)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  rol TEXT NOT NULL DEFAULT 'estudiante' CHECK (rol IN ('admin', 'estudiante')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de habitaciones
CREATE TABLE habitaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL CHECK (tipo IN ('Estándar', 'Premium', 'Compartida')),
  descripcion TEXT,
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de estudiantes (información adicional)
CREATE TABLE estudiantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  habitacion_id UUID REFERENCES habitaciones(id),
  tarifa NUMERIC(12,0) NOT NULL DEFAULT 300000,
  fecha_ingreso DATE DEFAULT CURRENT_DATE,
  fecha_salida DATE,
  contacto_emergencia TEXT,
  telefono_emergencia TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de pagos
CREATE TABLE pagos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estudiante_id UUID REFERENCES estudiantes(id) ON DELETE CASCADE,
  monto NUMERIC(12,0) NOT NULL,
  mes TEXT NOT NULL, -- formato: "2025-01"
  fecha_pago DATE,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'vencido')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de aseo
CREATE TABLE aseo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estudiante_id UUID REFERENCES estudiantes(id) ON DELETE CASCADE,
  zona TEXT NOT NULL,
  dia_semana TEXT NOT NULL CHECK (dia_semana IN ('Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo')),
  hora TEXT DEFAULT '08:00',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de alertas/notificaciones
CREATE TABLE alertas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  destinatario_id UUID REFERENCES profiles(id),
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  tipo TEXT DEFAULT 'info' CHECK (tipo IN ('info', 'pago', 'aseo', 'urgente')),
  leida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- POLÍTICAS DE SEGURIDAD (Row Level Security)
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE aseo ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;

-- Profiles: cada quien ve el suyo, admin ve todos
CREATE POLICY "Ver perfil propio" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin ve todos los perfiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
);
CREATE POLICY "Insertar perfil propio" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Actualizar perfil propio" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Habitaciones: todos las pueden ver, solo admin modifica
CREATE POLICY "Todos ven habitaciones" ON habitaciones FOR SELECT USING (TRUE);
CREATE POLICY "Admin gestiona habitaciones" ON habitaciones FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
);

-- Estudiantes: admin ve todos, estudiante ve el suyo
CREATE POLICY "Admin ve todos estudiantes" ON estudiantes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
);
CREATE POLICY "Estudiante ve su info" ON estudiantes FOR SELECT USING (
  user_id = auth.uid()
);

-- Pagos: admin ve todos, estudiante ve los suyos
CREATE POLICY "Admin gestiona pagos" ON pagos FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
);
CREATE POLICY "Estudiante ve sus pagos" ON pagos FOR SELECT USING (
  EXISTS (SELECT 1 FROM estudiantes WHERE id = estudiante_id AND user_id = auth.uid())
);

-- Aseo: todos ven, admin modifica
CREATE POLICY "Todos ven aseo" ON aseo FOR SELECT USING (TRUE);
CREATE POLICY "Admin gestiona aseo" ON aseo FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
);

-- Alertas: cada quien ve las suyas
CREATE POLICY "Ver alertas propias" ON alertas FOR SELECT USING (
  destinatario_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
);
CREATE POLICY "Admin crea alertas" ON alertas FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
);
CREATE POLICY "Marcar alerta leida" ON alertas FOR UPDATE USING (destinatario_id = auth.uid());

-- =============================================
-- DATOS INICIALES DE EJEMPLO
-- =============================================

-- Habitaciones de ejemplo
INSERT INTO habitaciones (numero, tipo, descripcion) VALUES
  ('101', 'Estándar', 'Habitación individual con ventana al patio'),
  ('102', 'Estándar', 'Habitación individual con closet'),
  ('103', 'Premium', 'Habitación amplia con baño privado'),
  ('104', 'Premium', 'Habitación con balcón y vista a la calle'),
  ('105', 'Compartida', 'Habitación para dos personas'),
  ('106', 'Compartida', 'Habitación para dos personas con estudio');
