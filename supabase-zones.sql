-- Ejecuta esto en el SQL Editor de Supabase

-- Crear tabla de zonas
CREATE TABLE IF NOT EXISTS chart_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT DEFAULT 'default_user',
  symbol TEXT NOT NULL,
  interval TEXT NOT NULL DEFAULT '15',
  zone_type TEXT NOT NULL,
  price_top NUMERIC(20, 10) NOT NULL,
  price_bottom NUMERIC(20, 10) NOT NULL,
  color TEXT DEFAULT '#22c55e',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_chart_zones_symbol ON chart_zones(symbol);

-- Habilitar RLS
ALTER TABLE chart_zones ENABLE ROW LEVEL SECURITY;

-- Crear política
CREATE POLICY "Allow all operations on chart_zones" ON chart_zones
  FOR ALL USING (true) WITH CHECK (true);
