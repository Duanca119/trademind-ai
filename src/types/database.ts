// ============================================
// DATABASE TYPES FOR SUPABASE
// Matches the schema created in Supabase
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      trades: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          symbol: string
          asset_type: string
          direction: string
          entry_price: number
          exit_price: number | null
          position_size: number | null
          status: string
          pnl: number | null
          pnl_percentage: number | null
          decision_status: string | null
          decision_score: number | null
          conditions_met: number | null
          timeframe: string | null
          notes: string | null
          tags: string[] | null
          session_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          symbol: string
          asset_type: string
          direction: string
          entry_price: number
          exit_price?: number | null
          position_size?: number | null
          status?: string
          pnl?: number | null
          pnl_percentage?: number | null
          decision_status?: string | null
          decision_score?: number | null
          conditions_met?: number | null
          timeframe?: string | null
          notes?: string | null
          tags?: string[] | null
          session_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          symbol?: string
          asset_type?: string
          direction?: string
          entry_price?: number
          exit_price?: number | null
          position_size?: number | null
          status?: string
          pnl?: number | null
          pnl_percentage?: number | null
          decision_status?: string | null
          decision_score?: number | null
          conditions_met?: number | null
          timeframe?: string | null
          notes?: string | null
          tags?: string[] | null
          session_id?: string | null
        }
      }
      trading_sessions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          session_date: string
          start_time: string
          end_time: string | null
          total_trades: number
          winning_trades: number
          losing_trades: number
          total_pnl: number
          win_rate: number
          best_trade: number | null
          worst_trade: number | null
          mood: string | null
          focus_level: number | null
          energy_level: number | null
          daily_notes: string | null
          lessons_learned: string | null
          mistakes: string | null
          daily_goal: number | null
          goal_achieved: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          session_date?: string
          start_time?: string
          end_time?: string | null
          total_trades?: number
          winning_trades?: number
          losing_trades?: number
          total_pnl?: number
          win_rate?: number
          best_trade?: number | null
          worst_trade?: number | null
          mood?: string | null
          focus_level?: number | null
          energy_level?: number | null
          daily_notes?: string | null
          lessons_learned?: string | null
          mistakes?: string | null
          daily_goal?: number | null
          goal_achieved?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          session_date?: string
          start_time?: string
          end_time?: string | null
          total_trades?: number
          winning_trades?: number
          losing_trades?: number
          total_pnl?: number
          win_rate?: number
          best_trade?: number | null
          worst_trade?: number | null
          mood?: string | null
          focus_level?: number | null
          energy_level?: number | null
          daily_notes?: string | null
          lessons_learned?: string | null
          mistakes?: string | null
          daily_goal?: number | null
          goal_achieved?: boolean
        }
      }
      user_settings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          default_timeframe: string
          default_asset_type: string
          theme: string
          language: string
          default_position_size: number
          risk_per_trade: number
          max_daily_trades: number
          max_daily_loss: number
          show_preparing_assets: boolean
          auto_refresh_interval: number
          push_notifications: boolean
          sound_alerts: boolean
          favorite_crypto: string[]
          favorite_forex: string[]
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          default_timeframe?: string
          default_asset_type?: string
          theme?: string
          language?: string
          default_position_size?: number
          risk_per_trade?: number
          max_daily_trades?: number
          max_daily_loss?: number
          show_preparing_assets?: boolean
          auto_refresh_interval?: number
          push_notifications?: boolean
          sound_alerts?: boolean
          favorite_crypto?: string[]
          favorite_forex?: string[]
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          default_timeframe?: string
          default_asset_type?: string
          theme?: string
          language?: string
          default_position_size?: number
          risk_per_trade?: number
          max_daily_trades?: number
          max_daily_loss?: number
          show_preparing_assets?: boolean
          auto_refresh_interval?: number
          push_notifications?: boolean
          sound_alerts?: boolean
          favorite_crypto?: string[]
          favorite_forex?: string[]
        }
      }
      watchlist: {
        Row: {
          id: string
          created_at: string
          symbol: string
          asset_type: string
          alert_above: number | null
          alert_below: number | null
          notes: string | null
          priority: number
        }
        Insert: {
          id?: string
          created_at?: string
          symbol: string
          asset_type: string
          alert_above?: number | null
          alert_below?: number | null
          notes?: string | null
          priority?: number
        }
        Update: {
          id?: string
          created_at?: string
          symbol?: string
          asset_type?: string
          alert_above?: number | null
          alert_below?: number | null
          notes?: string | null
          priority?: number
        }
      }
      trading_notes: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          note_date: string
          title: string | null
          content: string
          category: string | null
          symbol: string | null
          asset_type: string | null
          tags: string[] | null
          importance: number
          is_favorite: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          note_date?: string
          title?: string | null
          content: string
          category?: string | null
          symbol?: string | null
          asset_type?: string | null
          tags?: string[] | null
          importance?: number
          is_favorite?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          note_date?: string
          title?: string | null
          content?: string
          category?: string | null
          symbol?: string | null
          asset_type?: string | null
          tags?: string[] | null
          importance?: number
          is_favorite?: boolean
        }
      }
      learn_progress: {
        Row: {
          id: string
          user_id: string
          module_id: string
          lessons_completed: Json
          completed: boolean
          completed_at: string | null
          quiz_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_id: string
          lessons_completed?: Json
          completed?: boolean
          completed_at?: string | null
          quiz_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          module_id?: string
          lessons_completed?: Json
          completed?: boolean
          completed_at?: string | null
          quiz_score?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      trading_stats: {
        Row: {
          symbol: string | null
          asset_type: string | null
          total_trades: number | null
          wins: number | null
          losses: number | null
          total_pnl: number | null
          avg_pnl: number | null
          win_rate: number | null
        }
      }
      weekly_performance: {
        Row: {
          week_start: string | null
          total_trades: number | null
          winning_trades: number | null
          weekly_pnl: number | null
          win_rate: number | null
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// ============================================
// CONVENIENCE TYPES
// ============================================

export type Trade = Database['public']['Tables']['trades']['Row']
export type TradeInsert = Database['public']['Tables']['trades']['Insert']
export type TradeUpdate = Database['public']['Tables']['trades']['Update']

export type TradingSession = Database['public']['Tables']['trading_sessions']['Row']
export type TradingSessionInsert = Database['public']['Tables']['trading_sessions']['Insert']
export type TradingSessionUpdate = Database['public']['Tables']['trading_sessions']['Update']

export type UserSettings = Database['public']['Tables']['user_settings']['Row']
export type UserSettingsInsert = Database['public']['Tables']['user_settings']['Insert']
export type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update']

export type WatchlistItem = Database['public']['Tables']['watchlist']['Row']
export type WatchlistItemInsert = Database['public']['Tables']['watchlist']['Insert']
export type WatchlistItemUpdate = Database['public']['Tables']['watchlist']['Update']

export type TradingNote = Database['public']['Tables']['trading_notes']['Row']
export type TradingNoteInsert = Database['public']['Tables']['trading_notes']['Insert']
export type TradingNoteUpdate = Database['public']['Tables']['trading_notes']['Update']

export type LearnProgress = Database['public']['Tables']['learn_progress']['Row']
export type LearnProgressInsert = Database['public']['Tables']['learn_progress']['Insert']
export type LearnProgressUpdate = Database['public']['Tables']['learn_progress']['Update']

// View types
export type TradingStats = Database['public']['Views']['trading_stats']['Row']
export type WeeklyPerformance = Database['public']['Views']['weekly_performance']['Row']
