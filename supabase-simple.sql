-- Ejecuta UNO POR UNO en Supabase SQL Editor

-- 1. Crear tabla (copia y ejecuta esto primero)
CREATE TABLE chart_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT DEFAULT 'default_user',
  symbol TEXT NOT NULL,
  interval TEXT DEFAULT '15',
  zone_type TEXT NOT NULL,
  price_top NUMERIC NOT NULL,
  price_bottom NUMERIC NOT NULL,
  color TEXT DEFAULT '#22c55e',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear índice (ejecuta esto segundo)
CREATE INDEX idx_chart_zones_symbol ON chart_zones(symbol);

-- 3. Habilitar RLS (ejecuta esto tercero)
ALTER TABLE chart_zones ENABLE ROW LEVEL SECURITY;

-- 4. Crear política (ejecuta esto cuarto)
CREATE POLICY "Allow all" ON chart_zones FOR ALL USING (true) WITH CHECK (true);
