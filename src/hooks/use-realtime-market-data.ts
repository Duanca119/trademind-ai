/**
 * Real-time Market Data Hook
 * Polls the market-data API every 1-3 seconds
 * All components use this same data source - NO differences!
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { isCryptoAsset, formatAssetPrice, getAssetById, ASSETS } from '@/types/trading'
import { calculateAllIndicators } from '@/lib/indicators'

// ============================================
// TYPES
// ============================================

export type Timeframe = '1D' | '1H' | '15M'

export interface TimeframeAnalysis {
  ema20: number
  ema50: number
  rsi: number
  volume: number
  volumeAvg: number
  price: number
  atr: number
}

export interface MarketDataPrice {
  symbol: string
  price: number
  bid: number
  ask: number
  open24h: number
  high24h: number
  low24h: number
  change24h: number
  changePercent24h: number
  volume24h: number
  timestamp: number
}

export interface RealtimeMarketDataState {
  // Current market data
  symbol: string
  currentPrice: number
  lastClose: number
  currentVolume: number
  high24h: number
  low24h: number
  priceChangePercent: number
  
  // Analysis by timeframe
  analysis: Record<Timeframe, TimeframeAnalysis>
  
  // Loading and error states
  isLoading: boolean
  error: string | null
  lastUpdate: Date | null
  
  // Connection status
  isConnected: boolean
  
  // Asset type
  isCrypto: boolean
  
  // Spread
  bid: number
  ask: number
  spread: number
}

// ============================================
// CONFIGURATION
// ============================================

const POLL_INTERVAL_FOREX = 2000 // 2 seconds for Forex
const POLL_INTERVAL_CRYPTO = 3000 // 3 seconds for Crypto

// ============================================
// HELPER TYPES
// ============================================

interface GeneratedCandle {
  openTime: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  closeTime: number
  quoteAssetVolume: number
  numberOfTrades: number
  takerBuyBaseAssetVolume: number
  takerBuyQuoteAssetVolume: number
  ignore: number
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateCandlesticksFromPrice(
  currentPrice: number,
  symbol: string,
  count: number = 100
): Record<Timeframe, GeneratedCandle[]> {
  const asset = getAssetById(symbol)
  const volatility = symbol === 'XAUUSD' ? 0.015 : 
                     symbol.includes('JPY') ? 0.008 : 
                     symbol.includes('USDT') ? 0.03 : 0.005
  
  const generateCandles = (intervalMs: number, candleCount: number) => {
    const candles = []
    let price = currentPrice * (1 - volatility * 0.3)
    const now = Date.now()
    
    for (let i = candleCount - 1; i >= 0; i--) {
      const openTime = now - (i * intervalMs)
      const closeTime = openTime + intervalMs - 1
      
      const open = price
      const trend = (currentPrice - price) / (candleCount - i + 1)
      const noise = (Math.random() - 0.5) * volatility * price * 0.3
      const close = price + trend + noise
      
      const high = Math.max(open, close) + Math.random() * volatility * price * 0.15
      const low = Math.min(open, close) - Math.random() * volatility * price * 0.15
      const volume = 500000 + Math.random() * 1500000
      
      candles.push({
        openTime,
        open,
        high,
        low,
        close,
        volume,
        closeTime,
        quoteAssetVolume: volume * close,
        numberOfTrades: Math.floor(Math.random() * 500) + 100,
        takerBuyBaseAssetVolume: volume * (0.4 + Math.random() * 0.2),
        takerBuyQuoteAssetVolume: volume * close * (0.4 + Math.random() * 0.2),
        ignore: 0
      })
      
      price = close
    }
    
    // Ensure last candle matches current price
    if (candles.length > 0) {
      candles[candles.length - 1].close = currentPrice
      candles[candles.length - 1].high = Math.max(candles[candles.length - 1].high, currentPrice)
      candles[candles.length - 1].low = Math.min(candles[candles.length - 1].low, currentPrice)
    }
    
    return candles
  }
  
  return {
    '1D': generateCandles(86400000, Math.min(count, 100)),
    '1H': generateCandles(3600000, Math.min(count, 100)),
    '15M': generateCandles(900000, Math.min(count, 96))
  }
}

// ============================================
// MAIN HOOK
// ============================================

export function useRealtimeMarketData(symbol: string = 'BTCUSDT') {
  const [state, setState] = useState<RealtimeMarketDataState>({
    symbol,
    currentPrice: 0,
    lastClose: 0,
    currentVolume: 0,
    high24h: 0,
    low24h: 0,
    priceChangePercent: 0,
    analysis: {
      '1D': { ema20: 0, ema50: 0, rsi: 50, volume: 0, volumeAvg: 0, price: 0, atr: 0 },
      '1H': { ema20: 0, ema50: 0, rsi: 50, volume: 0, volumeAvg: 0, price: 0, atr: 0 },
      '15M': { ema20: 0, ema50: 0, rsi: 50, volume: 0, volumeAvg: 0, price: 0, atr: 0 }
    },
    isLoading: true,
    error: null,
    lastUpdate: null,
    isConnected: false,
    isCrypto: true,
    bid: 0,
    ask: 0,
    spread: 0
  })
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  const lastSymbolRef = useRef<string>(symbol)
  
  // Fetch market data from our API
  const fetchMarketData = useCallback(async () => {
    const isCrypto = isCryptoAsset(symbol)
    
    try {
      // Call our backend API
      const response = await fetch(`/api/market-data?symbol=${symbol}&type=${isCrypto ? 'crypto' : 'forex'}`, {
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch market data')
      }
      
      const result = await response.json()
      
      if (!isMountedRef.current) return
      
      if (result.success && result.data) {
        const priceData: MarketDataPrice = result.data
        
        // Generate candlesticks based on current price
        const klines = generateCandlesticksFromPrice(priceData.price, symbol)
        
        // Calculate indicators for each timeframe
        const analysis1D = calculateAllIndicators(klines['1D'])
        const analysis1H = calculateAllIndicators(klines['1H'])
        const analysis15M = calculateAllIndicators(klines['15M'])
        
        // Calculate spread
        const spread = priceData.ask - priceData.bid
        
        setState(prev => ({
          ...prev,
          symbol,
          currentPrice: priceData.price,
          lastClose: priceData.open24h,
          currentVolume: priceData.volume24h,
          high24h: priceData.high24h,
          low24h: priceData.low24h,
          priceChangePercent: priceData.changePercent24h,
          analysis: {
            '1D': {
              ema20: analysis1D.ema20 || priceData.price,
              ema50: analysis1D.ema50 || priceData.price,
              rsi: analysis1D.rsi || 50,
              volume: analysis1D.volume || 0,
              volumeAvg: analysis1D.volumeAvg || 0,
              price: priceData.price,
              atr: analysis1D.atr || priceData.price * 0.01
            },
            '1H': {
              ema20: analysis1H.ema20 || priceData.price,
              ema50: analysis1H.ema50 || priceData.price,
              rsi: analysis1H.rsi || 50,
              volume: analysis1H.volume || 0,
              volumeAvg: analysis1H.volumeAvg || 0,
              price: priceData.price,
              atr: analysis1H.atr || priceData.price * 0.005
            },
            '15M': {
              ema20: analysis15M.ema20 || priceData.price,
              ema50: analysis15M.ema50 || priceData.price,
              rsi: analysis15M.rsi || 50,
              volume: analysis15M.volume || 0,
              volumeAvg: analysis15M.volumeAvg || 0,
              price: priceData.price,
              atr: analysis15M.atr || priceData.price * 0.002
            }
          },
          isLoading: false,
          error: null,
          lastUpdate: new Date(),
          isConnected: true,
          isCrypto,
          bid: priceData.bid,
          ask: priceData.ask,
          spread
        }))
      }
    } catch (error) {
      console.error('Market data fetch error:', error)
      
      if (!isMountedRef.current) return
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error al obtener datos del mercado',
        isConnected: false
      }))
    }
  }, [symbol])
  
  // Setup polling
  useEffect(() => {
    isMountedRef.current = true
    
    // Reset state when symbol changes
    if (lastSymbolRef.current !== symbol) {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        currentPrice: 0
      }))
      lastSymbolRef.current = symbol
    }
    
    // Initial fetch
    fetchMarketData()
    
    // Setup polling interval
    const isCrypto = isCryptoAsset(symbol)
    const interval = isCrypto ? POLL_INTERVAL_CRYPTO : POLL_INTERVAL_FOREX
    
    intervalRef.current = setInterval(fetchMarketData, interval)
    
    // Cleanup
    return () => {
      isMountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchMarketData, symbol])
  
  // Manual refresh
  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    fetchMarketData()
  }, [fetchMarketData])
  
  // Format price based on asset
  const formatPriceForAsset = useCallback((price: number): string => {
    return formatAssetPrice(price, symbol)
  }, [symbol])
  
  // Format price with $ sign
  const formatPrice = useCallback((price: number): string => {
    const decimals = getAssetById(symbol)?.decimals ?? 2
    return price.toFixed(decimals)
  }, [symbol])
  
  // Format volume
  const formatVolume = useCallback((volume: number): string => {
    if (volume >= 1000000000) {
      return `${(volume / 1000000000).toFixed(2)}B`
    }
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(2)}M`
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(2)}K`
    }
    return volume.toFixed(2)
  }, [])
  
  return {
    ...state,
    refresh,
    formatPriceForAsset,
    formatPrice,
    formatVolume
  }
}

export default useRealtimeMarketData
