-- ============================================
-- TABLA DE PERFIL DE TRADER
-- ============================================

-- Esta tabla guarda el perfil de trading del usuario
-- y su configuración personalizada

CREATE TABLE IF NOT EXISTS user_trader_profile (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT DEFAULT 'default_user' UNIQUE,
  
  -- Profile type: 'scalper' | 'dayTrader' | 'swingTrader'
  profile_type TEXT DEFAULT 'dayTrader',
  
  -- Custom settings
  ema_distance DECIMAL(10, 4) DEFAULT 0.2, -- Percentage threshold
  alerts_enabled BOOLEAN DEFAULT true,
  
  -- Favorite pairs (array)
  favorite_pairs TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_user_trader_profile_user ON user_trader_profile(user_id);

-- Función para obtener el perfil
CREATE OR REPLACE FUNCTION get_trader_profile(p_user_id TEXT DEFAULT 'default_user')
RETURNS TABLE (
  profile_type TEXT,
  ema_distance DECIMAL,
  alerts_enabled BOOLEAN,
  favorite_pairs TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    utp.profile_type,
    utp.ema_distance,
    utp.alerts_enabled,
    utp.favorite_pairs
  FROM user_trader_profile utp
  WHERE utp.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Función para establecer el perfil
CREATE OR REPLACE FUNCTION set_trader_profile(
  p_profile_type TEXT, 
  p_user_id TEXT DEFAULT 'default_user'
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_trader_profile (user_id, profile_type, updated_at)
  VALUES (p_user_id, p_profile_type, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    profile_type = p_profile_type,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar configuración
CREATE OR REPLACE FUNCTION set_trader_settings(
  p_ema_distance DECIMAL,
  p_alerts_enabled BOOLEAN,
  p_user_id TEXT DEFAULT 'default_user'
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_trader_profile (user_id, ema_distance, alerts_enabled, updated_at)
  VALUES (p_user_id, p_ema_distance, p_alerts_enabled, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    ema_distance = p_ema_distance,
    alerts_enabled = p_alerts_enabled,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Función para agregar par favorito
CREATE OR REPLACE FUNCTION add_favorite_pair(
  p_symbol TEXT,
  p_user_id TEXT DEFAULT 'default_user'
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_trader_profile (user_id, favorite_pairs, updated_at)
  VALUES (p_user_id, ARRAY[p_symbol], NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    favorite_pairs = array_append(
      CASE WHEN user_trader_profile.favorite_pairs IS NULL THEN ARRAY[]::TEXT[] 
           ELSE user_trader_profile.favorite_pairs END,
      p_symbol
    ),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Función para quitar par favorito
CREATE OR REPLACE FUNCTION remove_favorite_pair(
  p_symbol TEXT,
  p_user_id TEXT DEFAULT 'default_user'
)
RETURNS void AS $$
BEGIN
  UPDATE user_trader_profile
  SET favorite_pairs = array_remove(
    CASE WHEN favorite_pairs IS NULL THEN ARRAY[]::TEXT[] ELSE favorite_pairs END,
    p_symbol
  ),
  updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Comentar para el usuario
COMMENT ON TABLE user_trader_profile IS 'Perfil de trading del usuario con configuración personalizada';
COMMENT ON COLUMN user_trader_profile.profile_type IS 'Tipo de perfil: scalper, dayTrader, swingTrader';
COMMENT ON COLUMN user_trader_profile.ema_distance IS 'Distancia porcentual a EMA para activar alertas';
COMMENT ON COLUMN user_trader_profile.alerts_enabled IS 'Si las alertas están activadas';
COMMENT ON COLUMN user_trader_profile.favorite_pairs IS 'Array de pares favoritos del usuario';
