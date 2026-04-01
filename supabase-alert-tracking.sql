-- ============================================
-- TABLA DE SEGUIMIENTO DE ALERTAS (Anti-Spam)
-- ============================================

-- Esta tabla guarda el estado de cada par monitoreado
-- para evitar alertas repetidas y spam

CREATE TABLE IF NOT EXISTS alert_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT DEFAULT 'default_user', -- Para futuras multi-cuenta
  symbol TEXT NOT NULL,
  
  -- Estado del par
  status TEXT DEFAULT 'watching', -- 'watching' | 'in_zone' | 'cooldown'
  
  -- Datos del último análisis
  trend_1d TEXT, -- 'bullish' | 'bearish' | 'sideways'
  trend_1h TEXT, -- 'bullish' | 'bearish' | 'sideways'
  is_aligned BOOLEAN DEFAULT false,
  
  -- Datos de EMA
  current_price DECIMAL(20, 8),
  ema50_1h DECIMAL(20, 8),
  distance_to_ema_pct DECIMAL(10, 4), -- Porcentaje de distancia a EMA
  
  -- Sistema anti-spam
  last_alert_time TIMESTAMP WITH TIME ZONE,
  last_alert_distance DECIMAL(10, 4), -- Distancia cuando se envió la alerta
  cooldown_until TIMESTAMP WITH TIME ZONE, -- Hasta cuándo no alertar
  alert_count INTEGER DEFAULT 0, -- Total de alertas enviadas
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, symbol)
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_alert_tracking_user ON alert_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_tracking_status ON alert_tracking(status);
CREATE INDEX IF NOT EXISTS idx_alert_tracking_symbol ON alert_tracking(symbol);

-- ============================================
-- TABLA DE PARES SELECCIONADOS POR USUARIO
-- ============================================

CREATE TABLE IF NOT EXISTS user_selected_pairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT DEFAULT 'default_user',
  symbol TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true, -- Si está activo para monitoreo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, symbol)
);

-- ============================================
-- TABLA DE HISTORIAL DE ALERTAS
-- ============================================

CREATE TABLE IF NOT EXISTS alert_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT DEFAULT 'default_user',
  symbol TEXT NOT NULL,
  
  -- Datos de la alerta
  alert_type TEXT DEFAULT 'ema_proximity', -- 'ema_proximity' | 'trend_alignment'
  message TEXT,
  
  -- Datos del mercado al momento de la alerta
  price DECIMAL(20, 8),
  ema50 DECIMAL(20, 8),
  distance_pct DECIMAL(10, 4),
  trend_1d TEXT,
  trend_1h TEXT,
  
  -- Estado
  was_viewed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_history_user ON alert_history(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_symbol ON alert_history(symbol);
CREATE INDEX IF NOT EXISTS idx_alert_history_created ON alert_history(created_at DESC);

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función para verificar si un par está en cooldown
CREATE OR REPLACE FUNCTION is_in_cooldown(p_symbol TEXT, p_user_id TEXT DEFAULT 'default_user')
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM alert_tracking 
    WHERE symbol = p_symbol 
    AND user_id = p_user_id
    AND status = 'cooldown'
    AND cooldown_until > NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar cooldowns expirados
CREATE OR REPLACE FUNCTION clear_expired_cooldowns()
RETURNS void AS $$
BEGIN
  UPDATE alert_tracking
  SET status = 'watching', cooldown_until = NULL
  WHERE status = 'cooldown' 
  AND cooldown_until <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Comentar para el usuario
COMMENT ON TABLE alert_tracking IS 'Seguimiento de estado de alertas por par - Sistema anti-spam';
COMMENT ON TABLE user_selected_pairs IS 'Pares seleccionados manualmente por el usuario para monitorear';
COMMENT ON TABLE alert_history IS 'Historial de todas las alertas enviadas';
