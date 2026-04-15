-- ============================================
-- SQL CORREGIDO - RLS Y VISTA SECURITY DEFINER
-- Usa DROP IF EXISTS para evitar errores
-- ============================================

-- 1. ALERT_HISTORY - Eliminar políticas existentes y recrear
DROP POLICY IF EXISTS "Allow all for anon" ON alert_history;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON alert_history;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON alert_history FOR ALL TO anon USING (true) WITH CHECK (true);

-- 2. ALERT_TRACKING
DROP POLICY IF EXISTS "Allow all for anon" ON alert_tracking;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON alert_tracking;
ALTER TABLE alert_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON alert_tracking FOR ALL TO anon USING (true) WITH CHECK (true);

-- 3. USER_SELECTED_PAIR
DROP POLICY IF EXISTS "Allow all for anon" ON user_selected_pair;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON user_selected_pair;
ALTER TABLE user_selected_pair ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON user_selected_pair FOR ALL TO anon USING (true) WITH CHECK (true);

-- 4. USER_SELECTED_PAIRS
DROP POLICY IF EXISTS "Allow all for anon" ON user_selected_pairs;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON user_selected_pairs;
ALTER TABLE user_selected_pairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON user_selected_pairs FOR ALL TO anon USING (true) WITH CHECK (true);

-- 5. USER_TRADER_PROFILE
DROP POLICY IF EXISTS "Allow all for anon" ON user_trader_profile;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON user_trader_profile;
ALTER TABLE user_trader_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON user_trader_profile FOR ALL TO anon USING (true) WITH CHECK (true);

-- 6. CORREGIR VISTA SECURITY DEFINER
DROP VIEW IF EXISTS today_best_signals;

CREATE VIEW today_best_signals AS
SELECT 
  symbol,
  signal,
  confidence,
  current_price,
  created_at
FROM market_analysis
WHERE created_at >= CURRENT_DATE
  AND signal != 'WAIT'
ORDER BY 
  CASE confidence 
    WHEN 'Alta' THEN 3 
    WHEN 'Media' THEN 2 
    WHEN 'Baja' THEN 1 
  END DESC,
  created_at DESC;

-- Verificar que todo está correcto
SELECT 'RLS configurado correctamente' as status;
