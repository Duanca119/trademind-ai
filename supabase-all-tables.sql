-- ============================================
-- SQL COMPLETO PARA SUPABASE
-- TradeMind AI - Todas las tablas necesarias
-- ============================================

-- EJECUTAR TODO ESTE ARCHIVO EN EL EDITOR SQL DE SUPABASE

-- ============================================
-- 1. PAR SELECCIONADO GLOBAL
-- ============================================

CREATE TABLE IF NOT EXISTS user_selected_pair (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT DEFAULT 'default_user' UNIQUE,
  symbol TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_selected_pair_user ON user_selected_pair(user_id);

-- ============================================
-- 2. PARES SELECCIONADOS PARA VIGILANCIA
-- ============================================

CREATE TABLE IF NOT EXISTS user_selected_pairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT DEFAULT 'default_user',
  symbol TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_user_selected_pairs_user ON user_selected_pairs(user_id);

-- ============================================
-- 3. SEGUIMIENTO DE ALERTAS (ANTI-SPAM)
-- ============================================

CREATE TABLE IF NOT EXISTS alert_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT DEFAULT 'default_user',
  symbol TEXT NOT NULL,
  status TEXT DEFAULT 'watching',
  trend_1d TEXT,
  trend_1h TEXT,
  is_aligned BOOLEAN DEFAULT false,
  current_price DECIMAL(20, 8),
  ema50_1h DECIMAL(20, 8),
  distance_to_ema_pct DECIMAL(10, 4),
  last_alert_time TIMESTAMP WITH TIME ZONE,
  last_alert_distance DECIMAL(10, 4),
  cooldown_until TIMESTAMP WITH TIME ZONE,
  alert_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_alert_tracking_user ON alert_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_tracking_status ON alert_tracking(status);
CREATE INDEX IF NOT EXISTS idx_alert_tracking_symbol ON alert_tracking(symbol);

-- ============================================
-- 4. HISTORIAL DE ALERTAS
-- ============================================

CREATE TABLE IF NOT EXISTS alert_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT DEFAULT 'default_user',
  symbol TEXT NOT NULL,
  alert_type TEXT DEFAULT 'ema_proximity',
  message TEXT,
  price DECIMAL(20, 8),
  ema50 DECIMAL(20, 8),
  distance_pct DECIMAL(10, 4),
  trend_1d TEXT,
  trend_1h TEXT,
  was_viewed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_history_user ON alert_history(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_symbol ON alert_history(symbol);
CREATE INDEX IF NOT EXISTS idx_alert_history_created ON alert_history(created_at DESC);

-- ============================================
-- 5. PERFIL DE TRADER
-- ============================================

CREATE TABLE IF NOT EXISTS user_trader_profile (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT DEFAULT 'default_user' UNIQUE,
  profile_type TEXT DEFAULT 'dayTrader',
  ema_distance DECIMAL(10, 4) DEFAULT 0.2,
  alerts_enabled BOOLEAN DEFAULT true,
  favorite_pairs TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_trader_profile_user ON user_trader_profile(user_id);

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE user_selected_pair IS 'Par seleccionado globalmente - sincroniza todas las pestañas';
COMMENT ON TABLE user_selected_pairs IS 'Pares seleccionados para vigilancia en Mercado en Vivo';
COMMENT ON TABLE alert_tracking IS 'Seguimiento de alertas por par - Sistema anti-spam';
COMMENT ON TABLE alert_history IS 'Historial de todas las alertas enviadas';
COMMENT ON TABLE user_trader_profile IS 'Perfil de trading con configuración personalizada';

-- ============================================
-- LISTO!
-- ============================================

-- Después de ejecutar este SQL:
-- 1. Haz redeploy en Vercel
-- 2. La app estará lista para usar
