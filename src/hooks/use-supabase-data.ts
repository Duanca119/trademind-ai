'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { 
  Trade, 
  TradeInsert, 
  TradeUpdate,
  TradingSession,
  TradingSessionInsert,
  TradingSessionUpdate,
  UserSettings,
  UserSettingsInsert,
  UserSettingsUpdate,
  WatchlistItem,
  WatchlistItemInsert,
  WatchlistItemUpdate,
  TradingNote,
  TradingNoteInsert,
  TradingNoteUpdate,
  TradingStats,
  WeeklyPerformance
} from '@/types/database'

// ============================================
// TRADES HOOK
// ============================================

export interface UseTradesReturn {
  trades: Trade[]
  openTrades: Trade[]
  closedTrades: Trade[]
  isLoading: boolean
  error: string | null
  
  // Stats
  stats: {
    totalTrades: number
    wins: number
    losses: number
    breakeven: number
    winRate: number
    totalProfit: number
    avgProfit: number
    largestWin: number
    largestLoss: number
    avgScore: number
  }
  
  // Actions
  addTrade: (trade: TradeInsert) => Promise<Trade | null>
  updateTrade: (id: string, updates: TradeUpdate) => Promise<boolean>
  closeTrade: (id: string, exitPrice: number, pnl?: number, notes?: string) => Promise<boolean>
  deleteTrade: (id: string) => Promise<boolean>
  refresh: () => Promise<void>
}

export function useTrades(): UseTradesReturn {
  const [trades, setTrades] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch trades
  const fetchTrades = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('trades')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (fetchError) {
        // Don't throw, just log and set empty data
        console.warn('Trades table not accessible:', fetchError.message)
        setTrades([])
        return
      }
      
      setTrades(data || [])
    } catch (err) {
      console.warn('Error fetching trades:', err)
      setTrades([])
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  useEffect(() => {
    fetchTrades()
  }, [fetchTrades])
  
  // Separate open and closed trades
  const openTrades = useMemo(() => 
    trades.filter(t => t.status === 'open'),
    [trades]
  )
  
  const closedTrades = useMemo(() => 
    trades.filter(t => t.status === 'closed'),
    [trades]
  )
  
  // Calculate stats
  const stats = useMemo(() => {
    const closed = closedTrades
    
    const wins = closed.filter(t => (t.pnl || 0) > 0).length
    const losses = closed.filter(t => (t.pnl || 0) < 0).length
    const breakeven = closed.filter(t => (t.pnl || 0) === 0).length
    
    const totalProfit = closed.reduce((sum, t) => sum + (t.pnl || 0), 0)
    const avgProfit = closed.length > 0 ? totalProfit / closed.length : 0
    
    const pnls = closed.map(t => t.pnl || 0)
    const largestWin = Math.max(...pnls, 0)
    const largestLoss = Math.min(...pnls, 0)
    
    const avgScore = closed.length > 0 
      ? closed.reduce((sum, t) => sum + (t.decision_score || 0), 0) / closed.length 
      : 0
    
    return {
      totalTrades: trades.length,
      wins,
      losses,
      breakeven,
      winRate: closed.length > 0 ? (wins / closed.length) * 100 : 0,
      totalProfit,
      avgProfit,
      largestWin,
      largestLoss,
      avgScore
    }
  }, [trades, closedTrades])
  
  // Add trade
  const addTrade = useCallback(async (trade: TradeInsert): Promise<Trade | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('trades')
        .insert(trade)
        .select()
        .single()
      
      if (insertError) throw insertError
      
      setTrades(prev => [data, ...prev])
      return data
    } catch (err) {
      console.error('Error adding trade:', err)
      setError('Error al agregar trade')
      return null
    }
  }, [])
  
  // Update trade
  const updateTrade = useCallback(async (id: string, updates: TradeUpdate): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('trades')
        .update(updates)
        .eq('id', id)
      
      if (updateError) throw updateError
      
      setTrades(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
      return true
    } catch (err) {
      console.error('Error updating trade:', err)
      setError('Error al actualizar trade')
      return false
    }
  }, [])
  
  // Close trade
  const closeTrade = useCallback(async (
    id: string, 
    exitPrice: number, 
    pnl?: number, 
    notes?: string
  ): Promise<boolean> => {
    try {
      const trade = trades.find(t => t.id === id)
      if (!trade) return false
      
      // Calculate PnL if not provided
      let calculatedPnl = pnl
      let pnlPercentage = 0
      
      if (calculatedPnl === undefined) {
        if (trade.direction === 'long') {
          calculatedPnl = (exitPrice - trade.entry_price) * (trade.position_size || 1)
          pnlPercentage = ((exitPrice - trade.entry_price) / trade.entry_price) * 100
        } else {
          calculatedPnl = (trade.entry_price - exitPrice) * (trade.position_size || 1)
          pnlPercentage = ((trade.entry_price - exitPrice) / trade.entry_price) * 100
        }
      } else {
        pnlPercentage = trade.entry_price > 0 
          ? (calculatedPnl / trade.entry_price) * 100 
          : 0
      }
      
      const updates: TradeUpdate = {
        status: 'closed',
        exit_price: exitPrice,
        pnl: calculatedPnl,
        pnl_percentage: pnlPercentage,
        notes: notes || trade.notes
      }
      
      const { error: updateError } = await supabase
        .from('trades')
        .update(updates)
        .eq('id', id)
      
      if (updateError) throw updateError
      
      setTrades(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
      return true
    } catch (err) {
      console.error('Error closing trade:', err)
      setError('Error al cerrar trade')
      return false
    }
  }, [trades])
  
  // Delete trade
  const deleteTrade = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('trades')
        .delete()
        .eq('id', id)
      
      if (deleteError) throw deleteError
      
      setTrades(prev => prev.filter(t => t.id !== id))
      return true
    } catch (err) {
      console.error('Error deleting trade:', err)
      setError('Error al eliminar trade')
      return false
    }
  }, [])
  
  return {
    trades,
    openTrades,
    closedTrades,
    isLoading,
    error,
    stats,
    addTrade,
    updateTrade,
    closeTrade,
    deleteTrade,
    refresh: fetchTrades
  }
}

// ============================================
// TRADING SESSIONS HOOK
// ============================================

export interface UseSessionsReturn {
  sessions: TradingSession[]
  currentSession: TradingSession | null
  isLoading: boolean
  error: string | null
  
  createSession: (goal?: number) => Promise<TradingSession | null>
  updateSession: (id: string, updates: TradingSessionUpdate) => Promise<boolean>
  endSession: (id: string, notes?: { dailyNotes?: string; lessons?: string; mistakes?: string }) => Promise<boolean>
  refresh: () => Promise<void>
}

export function useSessions(): UseSessionsReturn {
  const [sessions, setSessions] = useState<TradingSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const { data, error: fetchError } = await supabase
        .from('trading_sessions')
        .select('*')
        .order('session_date', { ascending: false })
        .limit(30)
      
      if (fetchError) {
        console.warn('Sessions table not accessible:', fetchError.message)
        setSessions([])
        return
      }
      
      setSessions(data || [])
    } catch (err) {
      console.warn('Error fetching sessions:', err)
      setSessions([])
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])
  
  // Get current session (today)
  const currentSession = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return sessions.find(s => s.session_date === today && !s.end_time) || null
  }, [sessions])
  
  const createSession = useCallback(async (goal?: number): Promise<TradingSession | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('trading_sessions')
        .insert({ 
          session_date: new Date().toISOString().split('T')[0],
          daily_goal: goal 
        })
        .select()
        .single()
      
      if (insertError) throw insertError
      
      setSessions(prev => [data, ...prev])
      return data
    } catch (err) {
      console.error('Error creating session:', err)
      setError('Error al crear sesión')
      return null
    }
  }, [])
  
  const updateSession = useCallback(async (id: string, updates: TradingSessionUpdate): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('trading_sessions')
        .update(updates)
        .eq('id', id)
      
      if (updateError) throw updateError
      
      setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
      return true
    } catch (err) {
      console.error('Error updating session:', err)
      setError('Error al actualizar sesión')
      return false
    }
  }, [])
  
  const endSession = useCallback(async (
    id: string, 
    notes?: { dailyNotes?: string; lessons?: string; mistakes?: string }
  ): Promise<boolean> => {
    try {
      const updates: TradingSessionUpdate = {
        end_time: new Date().toISOString(),
        ...(notes?.dailyNotes && { daily_notes: notes.dailyNotes }),
        ...(notes?.lessons && { lessons_learned: notes.lessons }),
        ...(notes?.mistakes && { mistakes: notes.mistakes })
      }
      
      return updateSession(id, updates)
    } catch (err) {
      console.error('Error ending session:', err)
      return false
    }
  }, [updateSession])
  
  return {
    sessions,
    currentSession,
    isLoading,
    error,
    createSession,
    updateSession,
    endSession,
    refresh: fetchSessions
  }
}

// ============================================
// USER SETTINGS HOOK
// ============================================

export interface UseUserSettingsReturn {
  settings: UserSettings | null
  isLoading: boolean
  error: string | null
  
  updateSettings: (updates: UserSettingsUpdate) => Promise<boolean>
  resetSettings: () => Promise<boolean>
}

export function useUserSettings(): UseUserSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const { data, error: fetchError } = await supabase
        .from('user_settings')
        .select('*')
        .limit(1)
        .single()
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.warn('Settings table not accessible:', fetchError.message)
        setSettings(null)
        return
      }
      
      if (!data) {
        // Create default settings
        const { data: newSettings, error: insertError } = await supabase
          .from('user_settings')
          .insert({})
          .select()
          .single()
        
        if (insertError) {
          console.warn('Could not create settings:', insertError.message)
          setSettings(null)
          return
        }
        setSettings(newSettings)
      } else {
        setSettings(data)
      }
    } catch (err) {
      console.warn('Error fetching settings:', err)
      setSettings(null)
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])
  
  const updateSettings = useCallback(async (updates: UserSettingsUpdate): Promise<boolean> => {
    try {
      if (!settings) return false
      
      const { error: updateError } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('id', settings.id)
      
      if (updateError) throw updateError
      
      setSettings(prev => prev ? { ...prev, ...updates } : null)
      return true
    } catch (err) {
      console.error('Error updating settings:', err)
      setError('Error al guardar configuración')
      return false
    }
  }, [settings])
  
  const resetSettings = useCallback(async (): Promise<boolean> => {
    return updateSettings({
      default_timeframe: '1H',
      default_asset_type: 'crypto',
      theme: 'dark',
      language: 'es',
      default_position_size: 0.01,
      risk_per_trade: 2,
      max_daily_trades: 5,
      max_daily_loss: 100,
      show_preparing_assets: false,
      auto_refresh_interval: 30,
      push_notifications: true,
      sound_alerts: true
    })
  }, [updateSettings])
  
  return {
    settings,
    isLoading,
    error,
    updateSettings,
    resetSettings
  }
}

// ============================================
// WATCHLIST HOOK
// ============================================

export interface UseWatchlistReturn {
  items: WatchlistItem[]
  isLoading: boolean
  error: string | null
  
  isInWatchlist: (symbol: string, assetType: string) => boolean
  addToWatchlist: (item: WatchlistItemInsert) => Promise<boolean>
  removeFromWatchlist: (symbol: string, assetType: string) => Promise<boolean>
  updateWatchlistItem: (id: string, updates: WatchlistItemUpdate) => Promise<boolean>
  refresh: () => Promise<void>
}

export function useWatchlist(): UseWatchlistReturn {
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const { data, error: fetchError } = await supabase
        .from('watchlist')
        .select('*')
        .order('priority', { ascending: false })
      
      if (fetchError) {
        console.warn('Watchlist table not accessible:', fetchError.message)
        setItems([])
        return
      }
      
      setItems(data || [])
    } catch (err) {
      console.warn('Error fetching watchlist:', err)
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  useEffect(() => {
    fetchItems()
  }, [fetchItems])
  
  const isInWatchlist = useCallback((symbol: string, assetType: string) => {
    return items.some(item => item.symbol === symbol && item.asset_type === assetType)
  }, [items])
  
  const addToWatchlist = useCallback(async (item: WatchlistItemInsert): Promise<boolean> => {
    try {
      const { error: insertError } = await supabase
        .from('watchlist')
        .insert(item)
      
      if (insertError) throw insertError
      
      await fetchItems()
      return true
    } catch (err) {
      console.error('Error adding to watchlist:', err)
      setError('Error al agregar a watchlist')
      return false
    }
  }, [fetchItems])
  
  const removeFromWatchlist = useCallback(async (symbol: string, assetType: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('watchlist')
        .delete()
        .eq('symbol', symbol)
        .eq('asset_type', assetType)
      
      if (deleteError) throw deleteError
      
      setItems(prev => prev.filter(item => !(item.symbol === symbol && item.asset_type === assetType)))
      return true
    } catch (err) {
      console.error('Error removing from watchlist:', err)
      setError('Error al eliminar de watchlist')
      return false
    }
  }, [])
  
  const updateWatchlistItem = useCallback(async (id: string, updates: WatchlistItemUpdate): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('watchlist')
        .update(updates)
        .eq('id', id)
      
      if (updateError) throw updateError
      
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ))
      return true
    } catch (err) {
      console.error('Error updating watchlist:', err)
      return false
    }
  }, [])
  
  return {
    items,
    isLoading,
    error,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    updateWatchlistItem,
    refresh: fetchItems
  }
}

// ============================================
// TRADING NOTES (DIARY) HOOK
// ============================================

export interface UseTradingNotesReturn {
  notes: TradingNote[]
  todayNote: TradingNote | null
  isLoading: boolean
  error: string | null
  
  getNoteByDate: (date: string) => TradingNote | undefined
  saveNote: (content: string, title?: string, category?: string) => Promise<boolean>
  updateNote: (id: string, updates: TradingNoteUpdate) => Promise<boolean>
  deleteNote: (id: string) => Promise<boolean>
  refresh: () => Promise<void>
}

export function useTradingNotes(): UseTradingNotesReturn {
  const [notes, setNotes] = useState<TradingNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchNotes = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const { data, error: fetchError } = await supabase
        .from('trading_notes')
        .select('*')
        .order('note_date', { ascending: false })
        .limit(30)
      
      if (fetchError) {
        console.warn('Notes table not accessible:', fetchError.message)
        setNotes([])
        return
      }
      
      setNotes(data || [])
    } catch (err) {
      console.warn('Error fetching notes:', err)
      setNotes([])
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])
  
  const todayNote = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return notes.find(n => n.note_date === today) || null
  }, [notes])
  
  const getNoteByDate = useCallback((date: string) => {
    return notes.find(n => n.note_date === date)
  }, [notes])
  
  const saveNote = useCallback(async (
    content: string, 
    title?: string, 
    category?: string
  ): Promise<boolean> => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Check if today's note exists
      const existing = notes.find(n => n.note_date === today)
      
      if (existing) {
        // Update existing note
        const { error: updateError } = await supabase
          .from('trading_notes')
          .update({ content, title, category })
          .eq('id', existing.id)
        
        if (updateError) throw updateError
        
        setNotes(prev => prev.map(n => 
          n.id === existing.id ? { ...n, content, title, category } : n
        ))
      } else {
        // Create new note
        const { data, error: insertError } = await supabase
          .from('trading_notes')
          .insert({ 
            note_date: today, 
            content, 
            title,
            category 
          })
          .select()
          .single()
        
        if (insertError) throw insertError
        
        setNotes(prev => [data, ...prev])
      }
      
      return true
    } catch (err) {
      console.error('Error saving note:', err)
      setError('Error al guardar nota')
      return false
    }
  }, [notes])
  
  const updateNote = useCallback(async (id: string, updates: TradingNoteUpdate): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('trading_notes')
        .update(updates)
        .eq('id', id)
      
      if (updateError) throw updateError
      
      setNotes(prev => prev.map(n => 
        n.id === id ? { ...n, ...updates } : n
      ))
      return true
    } catch (err) {
      console.error('Error updating note:', err)
      return false
    }
  }, [])
  
  const deleteNote = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('trading_notes')
        .delete()
        .eq('id', id)
      
      if (deleteError) throw deleteError
      
      setNotes(prev => prev.filter(n => n.id !== id))
      return true
    } catch (err) {
      console.error('Error deleting note:', err)
      return false
    }
  }, [])
  
  return {
    notes,
    todayNote,
    isLoading,
    error,
    getNoteByDate,
    saveNote,
    updateNote,
    deleteNote,
    refresh: fetchNotes
  }
}

// ============================================
// STATS HOOK
// ============================================

export interface UseStatsReturn {
  tradingStats: TradingStats[]
  weeklyPerformance: WeeklyPerformance[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useStats(): UseStatsReturn {
  const [tradingStats, setTradingStats] = useState<TradingStats[]>([])
  const [weeklyPerformance, setWeeklyPerformance] = useState<WeeklyPerformance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Fetch trading stats
      const { data: statsData, error: statsError } = await supabase
        .from('trading_stats')
        .select('*')
      
      if (statsError) {
        console.warn('Trading stats view not accessible:', statsError.message)
      } else {
        setTradingStats(statsData || [])
      }
      
      // Fetch weekly performance
      const { data: weeklyData, error: weeklyError } = await supabase
        .from('weekly_performance')
        .select('*')
      
      if (weeklyError) {
        console.warn('Weekly performance view not accessible:', weeklyError.message)
      } else {
        setWeeklyPerformance(weeklyData || [])
      }
      
    } catch (err) {
      console.warn('Error fetching stats:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  useEffect(() => {
    fetchStats()
  }, [fetchStats])
  
  return {
    tradingStats,
    weeklyPerformance,
    isLoading,
    error,
    refresh: fetchStats
  }
}

// ============================================
// EXPORT ALL
// ============================================

export default {
  useTrades,
  useSessions,
  useUserSettings,
  useWatchlist,
  useTradingNotes,
  useStats
}
