-- SQL para crear la tabla de zonas en Supabase
-- Ejecuta esto en el SQL Editor de Supabase

-- Tabla para zonas de soporte/resistencia/demanda/oferta
CREATE TABLE IF NOT EXISTS chart_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT DEFAULT 'default_user',
  symbol TEXT NOT NULL,
  interval TEXT NOT NULL DEFAULT '15',
  zone_type TEXT NOT NULL CHECK (zone_type IN ('support', 'resistance', 'demand', 'supply')),
  price_top NUMERIC(20, 10) NOT NULL,
  price_bottom NUMERIC(20, 10) NOT NULL,
  color TEXT DEFAULT '#22c55e',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_chart_zones_symbol ON chart_zones(symbol);
CREATE INDEX IF NOT EXISTS idx_chart_zones_user_symbol ON chart_zones(user_id, symbol, interval);

-- Habilitar RLS (Row Level Security)
ALTER TABLE chart_zones ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones
CREATE POLICY "Allow all operations on chart_zones" ON chart_zones
  FOR ALL USING (true) WITH CHECK (true);

-- Tabla para dibujos generales (líneas, fibonacci, etc.)
CREATE TABLE IF NOT EXISTS chart_drawings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT DEFAULT 'default_user',
  symbol TEXT NOT NULL,
  interval TEXT NOT NULL,
  drawing_type TEXT NOT NULL, -- 'line', 'hline', 'vline', 'fibonacci', 'rectangle', 'text', 'trendline'
  drawing_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para dibujos
CREATE INDEX IF NOT EXISTS idx_chart_drawings_symbol ON chart_drawings(symbol);
CREATE INDEX IF NOT EXISTS idx_chart_drawings_user_symbol ON chart_drawings(user_id, symbol);

-- Habilitar RLS
ALTER TABLE chart_drawings ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones
CREATE POLICY "Allow all operations on chart_drawings" ON chart_drawings
  FOR ALL USING (true) WITH CHECK (true);
