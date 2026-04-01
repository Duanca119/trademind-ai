-- ============================================
-- TABLA DE PAR SELECCIONADO GLOBAL
-- ============================================

-- Esta tabla guarda el par actualmente seleccionado por el usuario
-- Se usa para sincronizar todas las pestañas de la app

CREATE TABLE IF NOT EXISTS user_selected_pair (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT DEFAULT 'default_user' UNIQUE,
  symbol TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_user_selected_pair_user ON user_selected_pair(user_id);

-- Función para obtener el par seleccionado
CREATE OR REPLACE FUNCTION get_selected_pair(p_user_id TEXT DEFAULT 'default_user')
RETURNS TEXT AS $$
DECLARE
  v_symbol TEXT;
BEGIN
  SELECT symbol INTO v_symbol 
  FROM user_selected_pair 
  WHERE user_id = p_user_id;
  
  RETURN v_symbol;
END;
$$ LANGUAGE plpgsql;

-- Función para establecer el par seleccionado (upsert)
CREATE OR REPLACE FUNCTION set_selected_pair(p_symbol TEXT, p_user_id TEXT DEFAULT 'default_user')
RETURNS void AS $$
BEGIN
  INSERT INTO user_selected_pair (user_id, symbol, updated_at)
  VALUES (p_user_id, p_symbol, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET symbol = p_symbol, updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Comentar para el usuario
COMMENT ON TABLE user_selected_pair IS 'Par seleccionado globalmente por el usuario - sincroniza todas las pestañas';
