-- ============================================
-- TRADEMIND AI - SUPABASE SCHEMA
-- ============================================
-- Ejecutar este SQL en el SQL Editor de Supabase
-- ============================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TRADES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'demo-user-001',
  symbol TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  entry_price DECIMAL(18, 8) NOT NULL,
  exit_price DECIMAL(18, 8),
  stop_loss DECIMAL(18, 8),
  take_profit DECIMAL(18, 8),
  quantity DECIMAL(18, 8) DEFAULT 1,
  profit DECIMAL(18, 8),
  profit_percent DECIMAL(10, 4),
  fees DECIMAL(18, 8) DEFAULT 0,
  notes TEXT,
  strategy TEXT,
  timeframe TEXT DEFAULT '1H',
  confidence INTEGER DEFAULT 0,
  entry_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exit_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_entry_time ON trades(entry_time DESC);

-- ============================================
-- TRADING SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trading_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'demo-user-001',
  session_date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  pairs_traded TEXT[] DEFAULT '{}',
  total_trades INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  breakeven INTEGER DEFAULT 0,
  profit_total DECIMAL(18, 8) DEFAULT 0,
  profit_percent DECIMAL(10, 4) DEFAULT 0,
  largest_win DECIMAL(18, 8),
  largest_loss DECIMAL(18, 8),
  emotion_start INTEGER DEFAULT 5 CHECK (emotion_start BETWEEN 1 AND 10),
  emotion_end INTEGER CHECK (emotion_end BETWEEN 1 AND 10),
  notes TEXT,
  lessons TEXT,
  mistakes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON trading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON trading_sessions(session_date DESC);

-- ============================================
-- USER SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE DEFAULT 'demo-user-001',
  capital DECIMAL(18, 2) DEFAULT 10000,
  risk_percent DECIMAL(5, 2) DEFAULT 1.0 CHECK (risk_percent BETWEEN 0.1 AND 10),
  max_daily_loss DECIMAL(5, 2) DEFAULT 3.0,
  max_trades_per_day INTEGER DEFAULT 5,
  default_stop_loss DECIMAL(5, 2) DEFAULT 1.5,
  default_take_profit DECIMAL(5, 2) DEFAULT 3.0,
  alerts_enabled BOOLEAN DEFAULT TRUE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  timezone TEXT DEFAULT 'America/Bogota',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- WATCHLIST TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'demo-user-001',
  asset_id TEXT NOT NULL,
  notes TEXT,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);

-- ============================================
-- TRADING NOTES (DIARY) TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trading_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'demo-user-001',
  note_date DATE NOT NULL,
  emotion_level INTEGER DEFAULT 5 CHECK (emotion_level BETWEEN 1 AND 10),
  market_condition TEXT,
  lesson_learned TEXT,
  mistakes TEXT,
  wins TEXT,
  goals_tomorrow TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, note_date)
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON trading_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_date ON trading_notes(note_date DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS on all tables
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for demo user (allows all operations)
CREATE POLICY "Allow all for demo user" ON trades FOR ALL USING (user_id = 'demo-user-001');
CREATE POLICY "Allow all for demo user" ON trading_sessions FOR ALL USING (user_id = 'demo-user-001');
CREATE POLICY "Allow all for demo user" ON user_settings FOR ALL USING (user_id = 'demo-user-001');
CREATE POLICY "Allow all for demo user" ON watchlist FOR ALL USING (user_id = 'demo-user-001');
CREATE POLICY "Allow all for demo user" ON trading_notes FOR ALL USING (user_id = 'demo-user-001');

-- ============================================
-- INSERT DEFAULT USER SETTINGS
-- ============================================
INSERT INTO user_settings (user_id, capital, risk_percent)
VALUES ('demo-user-001', 10000, 1.0)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- UPDATE TRIGGER FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
DROP TRIGGER IF EXISTS update_trades_updated_at ON trades;
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON trading_sessions;
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON trading_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON user_settings;
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notes_updated_at ON trading_notes;
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON trading_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE!
-- ============================================
-- Execute this SQL in Supabase SQL Editor
-- Then the app will be ready to store data
