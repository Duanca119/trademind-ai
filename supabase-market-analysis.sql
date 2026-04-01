-- ============================================
-- TradeMind AI - Tablas de Análisis de Mercado
-- ============================================
-- Ejecutar en el SQL Editor de Supabase

-- 1. Tabla de historial de análisis
CREATE TABLE IF NOT EXISTS market_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  signal TEXT NOT NULL CHECK (signal IN ('BUY', 'SELL', 'WAIT')),
  confidence TEXT NOT NULL CHECK (confidence IN ('Alta', 'Media', 'Baja')),
  trend_1d TEXT NOT NULL,
  trend_1h TEXT NOT NULL,
  ema50_5m NUMERIC(20, 10),
  current_price NUMERIC(20, 10),
  price_above_ema BOOLEAN,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Índice para búsquedas por símbolo
CREATE INDEX IF NOT EXISTS idx_market_analysis_symbol ON market_analysis(symbol);

-- 3. Índice para búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_market_analysis_created ON market_analysis(created_at DESC);

-- 4. Habilitar RLS
ALTER TABLE market_analysis ENABLE ROW LEVEL SECURITY;

-- 5. Política de acceso público (ajustar según necesidades)
CREATE POLICY "Allow all operations on market_analysis" ON market_analysis
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Tabla de señales guardadas
-- ============================================

-- 6. Tabla de señales favoritas del usuario
CREATE TABLE IF NOT EXISTS saved_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT DEFAULT 'default_user',
  symbol TEXT NOT NULL,
  signal TEXT NOT NULL,
  confidence TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_saved_signals_user ON saved_signals(user_id);

-- 8. Habilitar RLS
ALTER TABLE saved_signals ENABLE ROW LEVEL SECURITY;

-- 9. Política de acceso
CREATE POLICY "Allow all operations on saved_signals" ON saved_signals
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Función para limpiar análisis antiguos
-- ============================================

-- 10. Función para eliminar análisis mayores a 7 días
CREATE OR REPLACE FUNCTION clean_old_analysis()
RETURNS void AS $$
BEGIN
  DELETE FROM market_analysis WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Vista de mejores señales del día
-- ============================================

-- 11. Vista para obtener las mejores señales de hoy
CREATE OR REPLACE VIEW today_best_signals AS
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
