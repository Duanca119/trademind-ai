'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchAllTimeframesData, fetch24hTicker, Candlestick, formatVolume, formatPrice } from '@/lib/binance-api'
import { fetchForexPrice, BASE_PRICES } from '@/lib/forex-price-api'
import { calculateAllIndicators } from '@/lib/indicators'
import { isCryptoAsset, formatAssetPrice, getAssetById } from '@/types/trading'

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

export interface MarketDataState {
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
  
  // Raw klines data for each timeframe
  klines: Record<Timeframe, Candlestick[]>
  
  // Loading and error states
  isLoading: boolean
  error: string | null
  lastUpdate: Date | null
  
  // Connection status
  isConnected: boolean
  
  // Asset type
  isCrypto: boolean
  
  // Bid/Ask for spread
  bid: number
  ask: number
}

// Faster refresh for real-time feel
const REFRESH_INTERVAL_CRYPTO = 5000 // 5 seconds for crypto
const REFRESH_INTERVAL_FOREX = 2000 // 2 seconds for forex

export function useMarketData(symbol: string = 'BTCUSDT') {
  const [state, setState] = useState<MarketDataState>({
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
    klines: {
      '1D': [],
      '1H': [],
      '15M': []
    },
    isLoading: true,
    error: null,
    lastUpdate: null,
    isConnected: false,
    isCrypto: true,
    bid: 0,
    ask: 0
  })
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const priceUpdateRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  const lastSymbolRef = useRef<string>(symbol)
  
  // Generate simulated candlestick data for forex based on real price
  const generateForexCandlesticks = useCallback((
    currentPrice: number, 
    pairId: string, 
    count: number = 100
  ): Record<Timeframe, Candlestick[]> => {
    const asset = getAssetById(pairId)
    const volatility = pairId === 'XAUUSD' ? 0.015 : pairId.includes('JPY') ? 0.008 : 0.005
    
    const generateCandles = (intervalMs: number, candleCount: number) => {
      const candles: Candlestick[] = []
      let price = currentPrice * (1 - volatility * 0.5) // Start slightly below current
      const now = Date.now()
      
      for (let i = candleCount - 1; i >= 0; i--) {
        const openTime = now - (i * intervalMs)
        const closeTime = openTime + intervalMs - 1
        
        // Generate realistic OHLC
        const open = price
        const trend = (currentPrice - price) / (candleCount - i + 1) // Trend towards current
        const noise = (Math.random() - 0.5) * volatility * price * 0.5
        const close = price + trend + noise
        
        const high = Math.max(open, close) + Math.random() * volatility * price * 0.2
        const low = Math.min(open, close) - Math.random() * volatility * price * 0.2
        
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
      
      // Ensure last candle matches current price closely
      if (candles.length > 0) {
        const lastCandle = candles[candles.length - 1]
        const priceDiff = currentPrice - lastCandle.close
        candles[candles.length - 1] = {
          ...lastCandle,
          close: currentPrice,
          high: Math.max(lastCandle.high, currentPrice),
          low: Math.min(lastCandle.low, currentPrice)
        }
      }
      
      return candles
    }
    
    return {
      '1D': generateCandles(86400000, Math.min(count, 100)),
      '1H': generateCandles(3600000, Math.min(count, 100)),
      '15M': generateCandles(900000, Math.min(count, 96))
    }
  }, [])
  
  // Fetch price update only (for fast forex updates)
  const fetchPriceUpdate = useCallback(async () => {
    if (isCryptoAsset(symbol)) return // Only for forex
    
    try {
      const priceData = await fetchForexPrice(symbol)
      
      if (!isMountedRef.current) return
      
      setState(prev => {
        // Only update if price actually changed
        if (Math.abs(prev.currentPrice - priceData.price) < 0.000001) {
          return prev
        }
        
        return {
          ...prev,
          currentPrice: priceData.price,
          high24h: priceData.high24h,
          low24h: priceData.low24h,
          priceChangePercent: priceData.changePercent,
          bid: priceData.bid,
          ask: priceData.ask,
          lastUpdate: new Date(),
          isConnected: true
        }
      })
    } catch (error) {
      console.error('Price update error:', error)
    }
  }, [symbol])
  
  const fetchData = useCallback(async () => {
    const isCrypto = isCryptoAsset(symbol)
    
    try {
      let data: {
        ticker: {
          currentPrice: number
          priceChange?: number
          priceChangePercent: number
          high24h: number
          low24h: number
          volume?: number
        }
        klines: Record<Timeframe, Candlestick[]>
      }
      
      if (isCrypto) {
        // Fetch from Binance for crypto
        data = await fetchAllTimeframesData(symbol)
      } else {
        // Fetch real forex price from API
        const priceData = await fetchForexPrice(symbol)
        
        // Generate candlesticks based on real price
        const klines = generateForexCandlesticks(priceData.price, symbol)
        
        data = {
          ticker: {
            currentPrice: priceData.price,
            priceChange: priceData.change,
            priceChangePercent: priceData.changePercent,
            high24h: priceData.high24h,
            low24h: priceData.low24h,
            volume: 0
          },
          klines
        }
      }
      
      if (!isMountedRef.current) return
      
      // Calculate indicators for each timeframe
      const analysis1D = calculateAllIndicators(data.klines['1D'])
      const analysis1H = calculateAllIndicators(data.klines['1H'])
      const analysis15M = calculateAllIndicators(data.klines['15M'])
      
      // Get last close from the most recent candle
      const lastCandle = data.klines['1D'][data.klines['1D'].length - 1]
      const prevCandle = data.klines['1D'][data.klines['1D'].length - 2]
      
      setState(prev => ({
        ...prev,
        symbol,
        currentPrice: data.ticker.currentPrice,
        lastClose: prevCandle?.close || lastCandle?.open || 0,
        currentVolume: lastCandle?.volume || 0,
        high24h: data.ticker.high24h,
        low24h: data.ticker.low24h,
        priceChangePercent: data.ticker.priceChangePercent,
        analysis: {
          '1D': {
            ema20: analysis1D.ema20 || data.ticker.currentPrice,
            ema50: analysis1D.ema50 || data.ticker.currentPrice,
            rsi: analysis1D.rsi || 50,
            volume: analysis1D.volume || 0,
            volumeAvg: analysis1D.volumeAvg || 0,
            price: data.ticker.currentPrice,
            atr: analysis1D.atr || data.ticker.currentPrice * 0.01
          },
          '1H': {
            ema20: analysis1H.ema20 || data.ticker.currentPrice,
            ema50: analysis1H.ema50 || data.ticker.currentPrice,
            rsi: analysis1H.rsi || 50,
            volume: analysis1H.volume || 0,
            volumeAvg: analysis1H.volumeAvg || 0,
            price: data.ticker.currentPrice,
            atr: analysis1H.atr || data.ticker.currentPrice * 0.005
          },
          '15M': {
            ema20: analysis15M.ema20 || data.ticker.currentPrice,
            ema50: analysis15M.ema50 || data.ticker.currentPrice,
            rsi: analysis15M.rsi || 50,
            volume: analysis15M.volume || 0,
            volumeAvg: analysis15M.volumeAvg || 0,
            price: data.ticker.currentPrice,
            atr: analysis15M.atr || data.ticker.currentPrice * 0.002
          }
        },
        klines: {
          '1D': data.klines['1D'],
          '1H': data.klines['1H'],
          '15M': data.klines['15M']
        },
        isLoading: false,
        error: null,
        lastUpdate: new Date(),
        isConnected: true,
        isCrypto,
        bid: isCrypto ? data.ticker.currentPrice : data.ticker.currentPrice * 0.9999,
        ask: isCrypto ? data.ticker.currentPrice : data.ticker.currentPrice * 1.0001
      }))
      
    } catch (error) {
      console.error('Error fetching market data:', error)
      
      if (!isMountedRef.current) return
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error al conectar con el mercado',
        isConnected: false
      }))
    }
  }, [symbol, generateForexCandlesticks])
  
  // Setup intervals based on asset type
  useEffect(() => {
    isMountedRef.current = true
    
    // Clear existing intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    if (priceUpdateRef.current) {
      clearInterval(priceUpdateRef.current)
    }
    
    // Reset state when symbol changes
    if (lastSymbolRef.current !== symbol) {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        currentPrice: 0,
        lastSymbolRef: symbol
      }))
      lastSymbolRef.current = symbol
    }
    
    // Initial fetch
    fetchData()
    
    // Setup intervals
    const isCrypto = isCryptoAsset(symbol)
    const mainInterval = isCrypto ? REFRESH_INTERVAL_CRYPTO : REFRESH_INTERVAL_FOREX
    
    intervalRef.current = setInterval(fetchData, mainInterval)
    
    // For forex, also do faster price-only updates
    if (!isCrypto) {
      priceUpdateRef.current = setInterval(fetchPriceUpdate, 1500) // Every 1.5 seconds
    }
    
    // Cleanup
    return () => {
      isMountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (priceUpdateRef.current) {
        clearInterval(priceUpdateRef.current)
      }
    }
  }, [fetchData, fetchPriceUpdate, symbol])
  
  // Manual refresh function
  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    fetchData()
  }, [fetchData])
  
  // Format price based on asset type
  const formatPriceForAsset = useCallback((price: number): string => {
    return formatAssetPrice(price, symbol)
  }, [symbol])
  
  return {
    ...state,
    refresh,
    formatVolume,
    formatPrice,
    formatPriceForAsset
  }
}

export default useMarketData
