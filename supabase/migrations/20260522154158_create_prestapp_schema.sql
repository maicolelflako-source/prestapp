/*
  # PrestaApp — Full Schema

  ## Tables
  - `profiles` — user profiles linked to auth.users (cobrador info, ruta, codigo)
  - `clientes` — loan clients with contact/address info
  - `creditos` — loan records per client
  - `abonos` — daily payment records
  - `gastos` — daily expense records per route
  - `rutas` — route definitions

  ## Security
  - RLS enabled on all tables
  - Users can only access data for their assigned route
*/

-- Rutas
CREATE TABLE IF NOT EXISTS rutas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  descripcion text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Profiles (cobrador)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  email text,
  codigo text NOT NULL DEFAULT '',
  ruta_id uuid REFERENCES rutas(id),
  rol text NOT NULL DEFAULT 'cobrador',
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ruta_id uuid NOT NULL REFERENCES rutas(id),
  cedula text NOT NULL,
  nombre text NOT NULL,
  direccion text DEFAULT '',
  telefono text DEFAULT '',
  email text DEFAULT '',
  garante text DEFAULT '',
  prioridad integer DEFAULT 999,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Creditos
CREATE TABLE IF NOT EXISTS creditos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  ruta_id uuid NOT NULL REFERENCES rutas(id),
  credito_no text NOT NULL,
  fecha_ini date NOT NULL,
  fecha_fin date,
  capital numeric(14,2) NOT NULL DEFAULT 0,
  cuota numeric(14,2) NOT NULL DEFAULT 0,
  cuotas_pactadas integer DEFAULT 0,
  fecha_cuota date,
  forma_pago text DEFAULT 'DIARIA',
  estado text DEFAULT 'Activo',
  saldo_capital numeric(14,2) DEFAULT 0,
  saldo_utilidad numeric(14,2) DEFAULT 0,
  cuotas_pend integer DEFAULT 0,
  cuotas_canc integer DEFAULT 0,
  color_type text DEFAULT 'yellow',
  notas text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Abonos
CREATE TABLE IF NOT EXISTS abonos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credito_id uuid NOT NULL REFERENCES creditos(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES clientes(id),
  ruta_id uuid NOT NULL REFERENCES rutas(id),
  cobrador_id uuid REFERENCES profiles(id),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  valor numeric(14,2) NOT NULL DEFAULT 0,
  aplicado boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Gastos
CREATE TABLE IF NOT EXISTS gastos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ruta_id uuid NOT NULL REFERENCES rutas(id),
  cobrador_id uuid REFERENCES profiles(id),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  nombre text NOT NULL,
  concepto text DEFAULT '',
  tipo text DEFAULT 'OPERACIONAL',
  valor numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE rutas ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE creditos ENABLE ROW LEVEL SECURITY;
ALTER TABLE abonos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

-- Rutas: anyone can read (needed for registration form)
DROP POLICY IF EXISTS "Anyone can view rutas" ON rutas;
CREATE POLICY "Anyone can view rutas"
  ON rutas FOR SELECT
  TO public
  USING (true);

-- Profiles: user reads/updates own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Clientes: users can manage clients in their ruta
DROP POLICY IF EXISTS "Users can view clients in their ruta" ON clientes;
CREATE POLICY "Users can view clients in their ruta"
  ON clientes FOR SELECT
  TO authenticated
  USING (
    ruta_id IN (
      SELECT ruta_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert clients in their ruta" ON clientes;
CREATE POLICY "Users can insert clients in their ruta"
  ON clientes FOR INSERT
  TO authenticated
  WITH CHECK (
    ruta_id IN (
      SELECT ruta_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update clients in their ruta" ON clientes;
CREATE POLICY "Users can update clients in their ruta"
  ON clientes FOR UPDATE
  TO authenticated
  USING (ruta_id IN (SELECT ruta_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (ruta_id IN (SELECT ruta_id FROM profiles WHERE id = auth.uid()));

-- Creditos
DROP POLICY IF EXISTS "Users can view creditos in their ruta" ON creditos;
CREATE POLICY "Users can view creditos in their ruta"
  ON creditos FOR SELECT
  TO authenticated
  USING (ruta_id IN (SELECT ruta_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert creditos in their ruta" ON creditos;
CREATE POLICY "Users can insert creditos in their ruta"
  ON creditos FOR INSERT
  TO authenticated
  WITH CHECK (ruta_id IN (SELECT ruta_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update creditos in their ruta" ON creditos;
CREATE POLICY "Users can update creditos in their ruta"
  ON creditos FOR UPDATE
  TO authenticated
  USING (ruta_id IN (SELECT ruta_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (ruta_id IN (SELECT ruta_id FROM profiles WHERE id = auth.uid()));

-- Abonos
DROP POLICY IF EXISTS "Users can view abonos in their ruta" ON abonos;
CREATE POLICY "Users can view abonos in their ruta"
  ON abonos FOR SELECT
  TO authenticated
  USING (ruta_id IN (SELECT ruta_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert abonos in their ruta" ON abonos;
CREATE POLICY "Users can insert abonos in their ruta"
  ON abonos FOR INSERT
  TO authenticated
  WITH CHECK (ruta_id IN (SELECT ruta_id FROM profiles WHERE id = auth.uid()));

-- Gastos
DROP POLICY IF EXISTS "Users can view gastos in their ruta" ON gastos;
CREATE POLICY "Users can view gastos in their ruta"
  ON gastos FOR SELECT
  TO authenticated
  USING (ruta_id IN (SELECT ruta_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert gastos in their ruta" ON gastos;
CREATE POLICY "Users can insert gastos in their ruta"
  ON gastos FOR INSERT
  TO authenticated
  WITH CHECK (ruta_id IN (SELECT ruta_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete own gastos" ON gastos;
CREATE POLICY "Users can delete own gastos"
  ON gastos FOR DELETE
  TO authenticated
  USING (cobrador_id = auth.uid());

-- Default rutas seed
INSERT INTO rutas (nombre, descripcion) VALUES
  ('YULIANPLAYA', 'Ruta principal zona playa'),
  ('NORTE', 'Ruta zona norte'),
  ('SUR', 'Ruta zona sur'),
  ('CENTRO', 'Ruta centro ciudad')
ON CONFLICT (nombre) DO NOTHING;

-- Suscripciones
CREATE TABLE IF NOT EXISTS suscripciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'mensual',
  activa boolean DEFAULT false,
  fecha_inicio timestamptz DEFAULT now(),
  fecha_fin timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own suscripcion" ON suscripciones;
CREATE POLICY "Users can view own suscripcion"
  ON suscripciones FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own suscripcion" ON suscripciones;
CREATE POLICY "Users can insert own suscripcion"
  ON suscripciones FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own suscripcion" ON suscripciones;
CREATE POLICY "Users can update own suscripcion"
  ON suscripciones FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function: create_profile (called on sign-up)
CREATE OR REPLACE FUNCTION create_profile(
  p_id uuid,
  p_nombre text,
  p_email text,
  p_codigo text,
  p_ruta_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO profiles (id, nombre, email, codigo, ruta_id, rol, activo)
  VALUES (p_id, p_nombre, p_email, p_codigo, p_ruta_id, 'cobrador', true);
END;
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clientes_ruta ON clientes(ruta_id);
CREATE INDEX IF NOT EXISTS idx_creditos_cliente ON creditos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_creditos_ruta ON creditos(ruta_id);
CREATE INDEX IF NOT EXISTS idx_abonos_credito ON abonos(credito_id);
CREATE INDEX IF NOT EXISTS idx_abonos_fecha ON abonos(fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha);
