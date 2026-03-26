-- SQL para crear la tabla de dibujos en Supabase
-- Ejecuta esto en el SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS chart_drawings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT DEFAULT 'default_user',
  symbol TEXT NOT NULL,
  interval TEXT NOT NULL,
  drawing_type TEXT NOT NULL, -- 'line', 'hline', 'vline', 'fibonacci', 'rectangle', 'text', 'trendline'
  drawing_data JSONB NOT NULL, -- {points: [{x, y}], color, lineWidth, style, etc}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas rápidas por símbolo
CREATE INDEX IF NOT EXISTS idx_chart_drawings_symbol ON chart_drawings(symbol);
CREATE INDEX IF NOT EXISTS idx_chart_drawings_user_symbol ON chart_drawings(user_id, symbol);

-- Habilitar RLS (Row Level Security)
ALTER TABLE chart_drawings ENABLE ROW LEVEL SECURITY;

-- Política para permitir todo (ajusta según necesites autenticación)
CREATE POLICY "Allow all operations" ON chart_drawings
  FOR ALL USING (true) WITH CHECK (true);
