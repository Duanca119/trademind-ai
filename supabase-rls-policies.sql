-- ============================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- TradeMind AI - Políticas de Seguridad
-- ============================================
-- 
-- EJECUTAR ESTE SQL EN EL EDITOR SQL DE SUPABASE
-- Esto resolverá la advertencia de seguridad
--
-- ============================================

-- ============================================
-- 1. ALERT_HISTORY
-- ============================================

-- Habilitar RLS
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones (la app usa anon key)
CREATE POLICY "Allow all operations for anon users" ON alert_history
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- También para usuarios autenticados (si en el futuro se implementa auth)
CREATE POLICY "Allow all operations for authenticated users" ON alert_history
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 2. ALERT_TRACKING
-- ============================================

ALTER TABLE alert_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for anon users" ON alert_tracking
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON alert_tracking
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 3. USER_SELECTED_PAIR
-- ============================================

ALTER TABLE user_selected_pair ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for anon users" ON user_selected_pair
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON user_selected_pair
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 4. USER_SELECTED_PAIRS
-- ============================================

ALTER TABLE user_selected_pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for anon users" ON user_selected_pairs
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON user_selected_pairs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 5. USER_TRADER_PROFILE
-- ============================================

ALTER TABLE user_trader_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for anon users" ON user_trader_profile
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON user_trader_profile
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- VERIFICAR RLS HABILITADO
-- ============================================

-- Esta consulta muestra el estado de RLS en todas las tablas
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- LISTO!
-- ============================================
-- 
-- Después de ejecutar este SQL:
-- 1. Ve a "Table Editor" en Supabase
-- 2. Selecciona cada tabla
-- 3. Verifica que "RLS enabled" esté en verde
-- 4. La advertencia de seguridad desaparecerá
--
-- ============================================
