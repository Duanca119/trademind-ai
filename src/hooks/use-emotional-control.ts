'use client'

import { useState, useEffect, useCallback } from 'react'

export interface TradeRecord {
  id: string
  timestamp: Date
  type: 'buy' | 'sell'
  result: 'win' | 'loss' | 'pending'
  profit?: number
}

export interface EmotionalState {
  consecutiveTrades: number
  consecutiveLosses: number
  consecutiveWins: number
  todayTrades: number
  todayPL: number
  lastTradeTime: Date | null
  isImpulsiveRisk: boolean
  shouldTakeBreak: boolean
  warnings: string[]
  recommendations: string[]
}

export interface EmotionalCheck {
  asked: boolean
  response: boolean | null
  timestamp: Date | null
}

const MAX_TRADES_PER_SESSION = 5
const MAX_CONSECUTIVE_LOSSES = 3
const BREAK_DURATION_MS = 30 * 60 * 1000 // 30 minutes
const STORAGE_KEY = 'trademind_emotional_state'
const TRADES_KEY = 'trademind_trades'

const defaultState: EmotionalState = {
  consecutiveTrades: 0,
  consecutiveLosses: 0,
  consecutiveWins: 0,
  todayTrades: 0,
  todayPL: 0,
  lastTradeTime: null,
  isImpulsiveRisk: false,
  shouldTakeBreak: false,
  warnings: [],
  recommendations: []
}

export function useEmotionalControl() {
  const [state, setState] = useState<EmotionalState>(defaultState)
  const [trades, setTrades] = useState<TradeRecord[]>([])
  const [emotionalCheck, setEmotionalCheck] = useState<EmotionalCheck>({
    asked: false,
    response: null,
    timestamp: null
  })
  const [showBreakModal, setShowBreakModal] = useState(false)
  
  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY)
      const savedTrades = localStorage.getItem(TRADES_KEY)
      
      if (savedState) {
        const parsed = JSON.parse(savedState)
        // Check if it's a new day - reset daily counters
        const lastDate = parsed.lastTradeTime ? new Date(parsed.lastTradeTime).toDateString() : null
        const today = new Date().toDateString()
        
        if (lastDate !== today) {
          // New day - reset daily counters
          setState({
            ...defaultState,
            consecutiveTrades: parsed.consecutiveTrades || 0,
            consecutiveLosses: parsed.consecutiveLosses || 0,
            consecutiveWins: parsed.consecutiveWins || 0
          })
        } else {
          setState(parsed)
        }
      }
      
      if (savedTrades) {
        setTrades(JSON.parse(savedTrades))
      }
    } catch (error) {
      console.error('Error loading emotional state:', error)
    }
  }, [])
  
  // Save state to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      localStorage.setItem(TRADES_KEY, JSON.stringify(trades))
    } catch (error) {
      console.error('Error saving emotional state:', error)
    }
  }, [state, trades])
  
  // Analyze emotional state and generate warnings
  const analyzeState = useCallback(() => {
    const warnings: string[] = []
    const recommendations: string[] = []
    let shouldTakeBreak = false
    let isImpulsiveRisk = false
    
    // Check consecutive trades
    if (state.consecutiveTrades >= 3) {
      warnings.push(`⚠️ ${state.consecutiveTrades} operaciones consecutivas`)
      recommendations.push('Considera hacer una pausa de 15 minutos')
      isImpulsiveRisk = true
    }
    
    // Check consecutive losses
    if (state.consecutiveLosses >= 2) {
      warnings.push(`🔴 ${state.consecutiveLosses} pérdidas consecutivas`)
      recommendations.push('Reduce el tamaño de posición')
    }
    
    if (state.consecutiveLosses >= MAX_CONSECUTIVE_LOSSES) {
      warnings.push('🚫 LÍMITE DE PÉRDIDAS ALCANZADO')
      recommendations.push('OBLIGATORIO: Toma un descanso de 30 minutos')
      shouldTakeBreak = true
      setShowBreakModal(true)
    }
    
    // Check daily trades
    if (state.todayTrades >= MAX_TRADES_PER_SESSION) {
      warnings.push('📊 Límite diario de operaciones alcanzado')
      recommendations.push('Vuelve mañana con mente fresca')
      shouldTakeBreak = true
    }
    
    // Check time since last trade (impulsive trading)
    if (state.lastTradeTime) {
      const timeSinceLastTrade = Date.now() - new Date(state.lastTradeTime).getTime()
      const minutesSinceLastTrade = timeSinceLastTrade / 60000
      
      if (minutesSinceLastTrade < 5 && state.consecutiveTrades >= 2) {
        warnings.push('⚡ Operando muy rápido')
        recommendations.push('Espera al menos 5 minutos entre operaciones')
        isImpulsiveRisk = true
      }
    }
    
    // Positive reinforcement
    if (state.consecutiveWins >= 3) {
      recommendations.push('✅ Excelente racha! Mantén la disciplina')
    }
    
    setState(prev => ({
      ...prev,
      warnings,
      recommendations,
      shouldTakeBreak,
      isImpulsiveRisk
    }))
  }, [state.consecutiveTrades, state.consecutiveLosses, state.consecutiveWins, state.todayTrades, state.lastTradeTime])
  
  // Run analysis when state changes
  useEffect(() => {
    analyzeState()
  }, [analyzeState])
  
  // Register a new trade
  const registerTrade = useCallback((type: 'buy' | 'sell', result: 'win' | 'loss' | 'pending', profit?: number) => {
    const newTrade: TradeRecord = {
      id: `trade-${Date.now()}`,
      timestamp: new Date(),
      type,
      result,
      profit
    }
    
    setTrades(prev => [newTrade, ...prev].slice(0, 50)) // Keep last 50 trades
    
    setState(prev => {
      const newState = {
        ...prev,
        consecutiveTrades: prev.consecutiveTrades + 1,
        todayTrades: prev.todayTrades + 1,
        lastTradeTime: new Date(),
        todayPL: profit ? prev.todayPL + profit : prev.todayPL
      }
      
      if (result === 'win') {
        newState.consecutiveWins = prev.consecutiveWins + 1
        newState.consecutiveLosses = 0
      } else if (result === 'loss') {
        newState.consecutiveLosses = prev.consecutiveLosses + 1
        newState.consecutiveWins = 0
      }
      
      return newState
    })
  }, [])
  
  // Request emotional check before trading
  const requestEmotionalCheck = useCallback(() => {
    setEmotionalCheck({
      asked: true,
      response: null,
      timestamp: new Date()
    })
  }, [])
  
  // Respond to emotional check
  const respondToCheck = useCallback((followingStrategy: boolean) => {
    setEmotionalCheck(prev => ({
      ...prev,
      response: followingStrategy
    }))
  }, [])
  
  // Reset emotional check
  const resetEmotionalCheck = useCallback(() => {
    setEmotionalCheck({
      asked: false,
      response: null,
      timestamp: null
    })
  }, [])
  
  // Take a break
  const takeBreak = useCallback(() => {
    setShowBreakModal(false)
    setState(prev => ({
      ...prev,
      consecutiveTrades: 0,
      shouldTakeBreak: false
    }))
  }, [])
  
  // Force reset (for testing)
  const forceReset = useCallback(() => {
    setState(defaultState)
    setTrades([])
    setShowBreakModal(false)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TRADES_KEY)
  }, [])
  
  // Can trade check
  const canTrade = !state.shouldTakeBreak && !state.isImpulsiveRisk
  
  return {
    state,
    trades,
    emotionalCheck,
    showBreakModal,
    canTrade,
    registerTrade,
    requestEmotionalCheck,
    respondToCheck,
    resetEmotionalCheck,
    takeBreak,
    forceReset,
    setShowBreakModal
  }
}

export default useEmotionalControl
