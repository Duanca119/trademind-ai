'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchCryptoNews, NewsArticle, NewsSummary, formatTimeAgo } from '@/lib/news-api'

export interface EmotionalState {
  consecutiveTrades: number
  consecutiveLosses: number
  totalTradesToday: number
  lastTradeTime: Date | null
  isImpulsiveRisk: boolean
  warnings: string[]
  recommendations: string[]
}

export interface TradeRecord {
  id: string
  timestamp: Date
  type: 'buy' | 'sell'
  result: 'win' | 'loss' | 'neutral'
  profit?: number
}

export interface NewsDataState {
  articles: NewsArticle[]
  summary: NewsSummary
  isLoading: boolean
  error: string | null
  lastUpdate: Date | null
}

const NEWS_REFRESH_INTERVAL = 300000 // 5 minutes

export function useTradingAssistant() {
  // News state
  const [newsState, setNewsState] = useState<NewsDataState>({
    articles: [],
    summary: {
      total: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
      alertLevel: 'low',
      alertMessage: ''
    },
    isLoading: true,
    error: null,
    lastUpdate: null
  })
  
  // Emotional state
  const [emotionalState, setEmotionalState] = useState<EmotionalState>({
    consecutiveTrades: 0,
    consecutiveLosses: 0,
    totalTradesToday: 0,
    lastTradeTime: null,
    isImpulsiveRisk: false,
    warnings: [],
    recommendations: []
  })
  
  // Trade history (local state for demo)
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([])
  
  const newsIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  
  // Fetch news
  const fetchNews = useCallback(async () => {
    try {
      // fetchCryptoNews already handles fallback to mock data internally
      const data = await fetchCryptoNews()
      
      if (!isMountedRef.current) return
      
      setNewsState({
        articles: data.articles,
        summary: data.summary,
        isLoading: false,
        error: null,
        lastUpdate: new Date()
      })
    } catch (error) {
      console.error('Error fetching news:', error)
      
      if (!isMountedRef.current) return
      
      setNewsState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error al cargar noticias'
      }))
    }
  }, [])
  
  // Record a trade for emotional tracking
  const recordTrade = useCallback((type: 'buy' | 'sell', result: 'win' | 'loss' | 'neutral', profit?: number) => {
    const newTrade: TradeRecord = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      result,
      profit
    }
    
    setTradeHistory(prev => {
      const updated = [newTrade, ...prev].slice(0, 20) // Keep last 20 trades
      
      // Calculate emotional metrics
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayTrades = updated.filter(t => new Date(t.timestamp) >= today)
      
      let consecutiveTrades = 0
      let consecutiveLosses = 0
      
      for (const trade of updated) {
        consecutiveTrades++
        if (trade.result === 'loss') {
          consecutiveLosses++
        } else {
          break
        }
      }
      
      // Generate warnings and recommendations
      const warnings: string[] = []
      const recommendations: string[] = []
      
      if (consecutiveTrades >= 3) {
        warnings.push(`⚠️ ${consecutiveTrades} operaciones seguidas`)
        recommendations.push('💡 Considera hacer una pausa de 15 minutos')
      }
      
      if (consecutiveLosses >= 2) {
        warnings.push(`🔴 ${consecutiveLosses} pérdidas consecutivas`)
        recommendations.push('💡 Revisa tu estrategia antes de continuar')
      }
      
      if (todayTrades.length >= 5) {
        warnings.push('📊 Límite diario de operaciones alcanzado')
        recommendations.push('💡 Vuelve mañana con mente fresca')
      }
      
      const isImpulsiveRisk = consecutiveTrades >= 3 || consecutiveLosses >= 2
      
      setEmotionalState({
        consecutiveTrades,
        consecutiveLosses,
        totalTradesToday: todayTrades.length,
        lastTradeTime: new Date(),
        isImpulsiveRisk,
        warnings,
        recommendations
      })
      
      return updated
    })
  }, [])
  
  // Check if user should trade (emotional control)
  const canTrade = useCallback((): { allowed: boolean; reasons: string[] } => {
    const reasons: string[] = []
    let allowed = true
    
    if (emotionalState.consecutiveTrades >= 3) {
      allowed = false
      reasons.push('Demasiadas operaciones consecutivas')
    }
    
    if (emotionalState.consecutiveLosses >= 3) {
      allowed = false
      reasons.push('Demasiadas pérdidas consecutivas')
    }
    
    if (emotionalState.totalTradesToday >= 5) {
      allowed = false
      reasons.push('Límite diario alcanzado')
    }
    
    return { allowed, reasons }
  }, [emotionalState])
  
  // Reset emotional state (new day)
  const resetEmotionalState = useCallback(() => {
    setEmotionalState({
      consecutiveTrades: 0,
      consecutiveLosses: 0,
      totalTradesToday: 0,
      lastTradeTime: null,
      isImpulsiveRisk: false,
      warnings: [],
      recommendations: []
    })
  }, [])
  
  // Initialize news fetching
  useEffect(() => {
    isMountedRef.current = true
    fetchNews()
    
    newsIntervalRef.current = setInterval(fetchNews, NEWS_REFRESH_INTERVAL)
    
    return () => {
      isMountedRef.current = false
      if (newsIntervalRef.current) {
        clearInterval(newsIntervalRef.current)
      }
    }
  }, [fetchNews])
  
  return {
    // News
    newsState,
    refreshNews: fetchNews,
    formatTimeAgo,
    
    // Emotional control
    emotionalState,
    tradeHistory,
    recordTrade,
    canTrade,
    resetEmotionalState
  }
}

export default useTradingAssistant
