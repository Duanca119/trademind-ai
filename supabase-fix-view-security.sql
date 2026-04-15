-- ============================================
-- CORREGIR VISTA SECURITY DEFINER
-- TradeMind AI - Cambiar a SECURITY INVOKER
-- ============================================
-- 
-- EJECUTAR ESTE SQL EN EL EDITOR SQL DE SUPABASE
-- Esto resolverá la advertencia de seguridad
--
-- ============================================

-- Eliminar la vista existente y recrearla con SECURITY INVOKER
DROP VIEW IF EXISTS today_best_signals;

-- Recrear la vista con SECURITY INVOKER (opción por defecto segura)
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

-- Asegurar que usa SECURITY INVOKER (Postgres 15+)
-- Si tu versión de Postgres es 15 o mayor, descomenta esta línea:
-- ALTER VIEW today_best_signals SET (security_invoker = on);

-- ============================================
-- VERIFICAR LA CONFIGURACIÓN DE LA VISTA
-- ============================================

-- Esta consulta muestra si la vista usa security_definer
SELECT 
  schemaname,
  viewname,
  viewowner,
  definition
FROM pg_views 
WHERE viewname = 'today_best_signals';

-- ============================================
-- LISTO!
-- ============================================
-- 
-- Después de ejecutar:
-- 1. Ve a "Table Editor" → "Views" en Supabase
-- 2. Verifica que today_best_signals existe
-- 3. La advertencia debería desaparecer
--
-- ============================================
