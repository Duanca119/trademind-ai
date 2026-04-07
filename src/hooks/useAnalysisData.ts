'use client'

import { useState, useEffect, useCallback } from 'react'

// ============================================
// TYPES
// ============================================

export interface Candle {
  open: number
  high: number
  low: number
  close: number
  volume: number
  timestamp: number
}

export interface SupportResistanceZone {
  type: 'support' | 'resistance'
  price: number
  strength: number // 1-5 based on number of touches
  touches: number
  distance: number // percentage distance from current price
}

export interface LiquidityZone {
  type: 'buy_side' | 'sell_side'
  price: number
  strength: 'high' | 'medium' | 'low'
  reason: string
}

export interface AnalysisData {
  pair: string
  currentPrice: number
  trend: 'bullish' | 'bearish' | 'sideways'
  trendStrength: 'strong' | 'moderate' | 'weak'
  ema50: number
  priceVsEMA: 'above' | 'below' | 'at'
  distanceToEMA: number
  supports: SupportResistanceZone[]
  resistances: SupportResistanceZone[]
  liquidityZones: LiquidityZone[]
  nearestSupport: SupportResistanceZone | null
  nearestResistance: SupportResistanceZone | null
  priceInZone: boolean
  zoneType: 'support' | 'resistance' | 'none'
  opportunityLevel: 'alta' | 'media' | 'baja'
  sweepDetected: boolean
  sweepInfo: string | null
  recommendation: string
  lastUpdate: Date
  isLoading: boolean
  error: string | null
}

// ============================================
// TWELVE DATA API
// ============================================

const TWELVE_DATA_API_KEY = '792522f333c3487a9102e68939c8e1e8'
const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com'

// Convert pair format: EUR/USD -> EURUSD
const formatPairForAPI = (pair: string): string => {
  return pair.replace('/', '')
}

// ============================================
// EMA CALCULATION
// ============================================

function calculateEMA(closes: number[], period: number): number {
  if (closes.length < period) return closes[closes.length - 1]
  
  const multiplier = 2 / (period + 1)
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period
  
  for (let i = period; i < closes.length; i++) {
    ema = (closes[i] - ema) * multiplier + ema
  }
  
  return ema
}

// ============================================
// SWING HIGH/LOW DETECTION
// ============================================

function detectSwingPoints(candles: Candle[], lookback: number = 3): {
  swingHighs: { price: number; index: number }[]
  swingLows: { price: number; index: number }[]
} {
  const swingHighs: { price: number; index: number }[] = []
  const swingLows: { price: number; index: number }[] = []
  
  for (let i = lookback; i < candles.length - lookback; i++) {
    const current = candles[i]
    let isSwingHigh = true
    let isSwingLow = true
    
    // Check if current high is higher than surrounding highs
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i) {
        if (candles[j].high >= current.high) isSwingHigh = false
        if (candles[j].low <= current.low) isSwingLow = false
      }
    }
    
    if (isSwingHigh) {
      swingHighs.push({ price: current.high, index: i })
    }
    if (isSwingLow) {
      swingLows.push({ price: current.low, index: i })
    }
  }
  
  return { swingHighs, swingLows }
}

// ============================================
// ZONE GROUPING (±0.2%)
// ============================================

function groupIntoZones(
  points: { price: number; index: number }[],
  currentPrice: number,
  type: 'support' | 'resistance'
): SupportResistanceZone[] {
  if (points.length === 0) return []
  
  const tolerance = 0.002 // 0.2%
  const zones: SupportResistanceZone[] = []
  const used = new Set<number>()
  
  for (let i = 0; i < points.length; i++) {
    if (used.has(i)) continue
    
    const basePrice = points[i].price
    const group = [points[i]]
    used.add(i)
    
    // Find nearby points
    for (let j = i + 1; j < points.length; j++) {
      if (used.has(j)) continue
      const diff = Math.abs(points[j].price - basePrice) / basePrice
      if (diff <= tolerance) {
        group.push(points[j])
        used.add(j)
      }
    }
    
    // Only create zone if 2+ touches
    if (group.length >= 2) {
      const avgPrice = group.reduce((sum, p) => sum + p.price, 0) / group.length
      const distance = ((avgPrice - currentPrice) / currentPrice) * 100
      
      zones.push({
        type,
        price: avgPrice,
        strength: Math.min(group.length, 5),
        touches: group.length,
        distance: Math.abs(distance)
      })
    }
  }
  
  return zones.sort((a, b) => a.distance - b.distance)
}

// ============================================
// LIQUIDITY DETECTION
// ============================================

function detectLiquidityZones(
  candles: Candle[],
  currentPrice: number
): LiquidityZone[] {
  const zones: LiquidityZone[] = []
  const lookback = 20
  
  if (candles.length < lookback) return zones
  
  const recentCandles = candles.slice(-lookback)
  
  // Find equal highs (buy-side liquidity)
  const highs = recentCandles.map(c => c.high)
  const highFreq: Record<number, number> = {}
  
  highs.forEach(h => {
    const rounded = Math.round(h * 10000) / 10000
    highFreq[rounded] = (highFreq[rounded] || 0) + 1
  })
  
  Object.entries(highFreq).forEach(([price, count]) => {
    if (count >= 2 && parseFloat(price) > currentPrice) {
      zones.push({
        type: 'buy_side',
        price: parseFloat(price),
        strength: count >= 3 ? 'high' : 'medium',
        reason: `${count} máximos iguales`
      })
    }
  })
  
  // Find equal lows (sell-side liquidity)
  const lows = recentCandles.map(c => c.low)
  const lowFreq: Record<number, number> = {}
  
  lows.forEach(l => {
    const rounded = Math.round(l * 10000) / 10000
    lowFreq[rounded] = (lowFreq[rounded] || 0) + 1
  })
  
  Object.entries(lowFreq).forEach(([price, count]) => {
    if (count >= 2 && parseFloat(price) < currentPrice) {
      zones.push({
        type: 'sell_side',
        price: parseFloat(price),
        strength: count >= 3 ? 'high' : 'medium',
        reason: `${count} mínimos iguales`
      })
    }
  })
  
  return zones
}

// ============================================
// SWEEP DETECTION
// ============================================

function detectSweep(
  candles: Candle[],
  liquidityZones: LiquidityZone[]
): { detected: boolean; info: string | null } {
  if (candles.length < 5 || liquidityZones.length === 0) {
    return { detected: false, info: null }
  }
  
  const recentCandles = candles.slice(-5)
  const lastCandle = candles[candles.length - 1]
  
  for (const zone of liquidityZones) {
    // Check if price swept through the liquidity zone
    const sweptHigh = zone.type === 'buy_side' && lastCandle.high > zone.price
    const sweptLow = zone.type === 'sell_side' && lastCandle.low < zone.price
    
    if (sweptHigh || sweptLow) {
      return {
        detected: true,
        info: `⚠️ Barrida de liquidez ${zone.type === 'buy_side' ? 'superior' : 'inferior'} en ${zone.price.toFixed(5)}. Posible manipulación.`
      }
    }
  }
  
  return { detected: false, info: null }
}

// ============================================
// TREND ANALYSIS
// ============================================

function analyzeTrend(candles: Candle[]): {
  trend: 'bullish' | 'bearish' | 'sideways'
  strength: 'strong' | 'moderate' | 'weak'
} {
  if (candles.length < 20) {
    return { trend: 'sideways', strength: 'weak' }
  }
  
  const recentCandles = candles.slice(-20)
  const firstClose = recentCandles[0].close
  const lastClose = recentCandles[recentCandles.length - 1].close
  const change = ((lastClose - firstClose) / firstClose) * 100
  
  // Count higher highs and higher lows
  let higherHighs = 0
  let higherLows = 0
  let lowerHighs = 0
  let lowerLows = 0
  
  for (let i = 1; i < recentCandles.length; i++) {
    if (recentCandles[i].high > recentCandles[i - 1].high) higherHighs++
    if (recentCandles[i].low > recentCandles[i - 1].low) higherLows++
    if (recentCandles[i].high < recentCandles[i - 1].high) lowerHighs++
    if (recentCandles[i].low < recentCandles[i - 1].low) lowerLows++
  }
  
  let trend: 'bullish' | 'bearish' | 'sideways' = 'sideways'
  let strength: 'strong' | 'moderate' | 'weak' = 'weak'
  
  if (higherHighs > lowerHighs && higherLows > lowerLows) {
    trend = 'bullish'
    strength = change > 0.5 ? 'strong' : 'moderate'
  } else if (lowerHighs > higherHighs && lowerLows > higherLows) {
    trend = 'bearish'
    strength = change < -0.5 ? 'strong' : 'moderate'
  } else {
    strength = Math.abs(change) > 0.3 ? 'moderate' : 'weak'
  }
  
  return { trend, strength }
}

// ============================================
// OPPORTUNITY LEVEL
// ============================================

function calculateOpportunityLevel(
  trend: 'bullish' | 'bearish' | 'sideways',
  priceInZone: boolean,
  nearEMA: boolean,
  sweepDetected: boolean,
  trendStrength: 'strong' | 'moderate' | 'weak'
): 'alta' | 'media' | 'baja' {
  let score = 0
  
  // Trend alignment
  if (trend !== 'sideways' && trendStrength === 'strong') score += 2
  else if (trend !== 'sideways') score += 1
  
  // Price in key zone
  if (priceInZone) score += 2
  
  // Near EMA
  if (nearEMA) score += 1
  
  // Sweep (can be opportunity or risk)
  if (sweepDetected) score += 1
  
  if (score >= 5) return 'alta'
  if (score >= 3) return 'media'
  return 'baja'
}

// ============================================
// RECOMMENDATION GENERATOR
// ============================================

function generateRecommendation(
  pair: string,
  trend: 'bullish' | 'bearish' | 'sideways',
  priceInZone: boolean,
  zoneType: 'support' | 'resistance' | 'none',
  nearEMA: boolean,
  sweepDetected: boolean,
  sweepInfo: string | null
): string {
  const trendText = trend === 'bullish' ? 'alcista' : trend === 'bearish' ? 'bajista' : 'lateral'
  
  if (sweepDetected) {
    return `⚠️ ${pair}: ${sweepInfo}. Esperar confirmación de reversión.`
  }
  
  if (trend === 'sideways') {
    return `${pair}: Mercado lateral. Esperar definición de dirección.`
  }
  
  if (priceInZone && nearEMA) {
    const zoneAction = zoneType === 'support' ? 'soporte' : 'resistencia'
    const action = trend === 'bullish' && zoneType === 'support' ? 'compra' :
                   trend === 'bearish' && zoneType === 'resistance' ? 'venta' : 'confirmación'
    return `✅ ${pair}: Tendencia ${trendText}, precio en zona de ${zoneAction} + cerca de EMA 50. 👉 Buscar ${action} en 5M.`
  }
  
  if (priceInZone) {
    const zoneAction = zoneType === 'support' ? 'soporte' : 'resistencia'
    return `${pair}: Precio en zona de ${zoneAction}. Esperar confirmación.`
  }
  
  if (nearEMA) {
    return `${pair}: Precio cerca de EMA 50. Esperar reacción.`
  }
  
  return `${pair}: Tendencia ${trendText}. Esperar llegada a zona clave.`
}

// ============================================
// MAIN HOOK
// ============================================

export function useAnalysisData(selectedPair: string | null) {
  const [data, setData] = useState<AnalysisData>({
    pair: selectedPair || 'EUR/USD',
    currentPrice: 0,
    trend: 'sideways',
    trendStrength: 'weak',
    ema50: 0,
    priceVsEMA: 'below',
    distanceToEMA: 0,
    supports: [],
    resistances: [],
    liquidityZones: [],
    nearestSupport: null,
    nearestResistance: null,
    priceInZone: false,
    zoneType: 'none',
    opportunityLevel: 'baja',
    sweepDetected: false,
    sweepInfo: null,
    recommendation: '',
    lastUpdate: new Date(),
    isLoading: true,
    error: null
  })

  const fetchData = useCallback(async () => {
    if (!selectedPair) return
    
    setData(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const symbol = formatPairForAPI(selectedPair)
      
      // Fetch 1H data (150 candles for better analysis)
      const response = await fetch(
        `${TWELVE_DATA_BASE_URL}/time_series?symbol=${symbol}&interval=1h&outputsize=150&apikey=${TWELVE_DATA_API_KEY}`
      )
      
      if (!response.ok) {
        throw new Error('Error fetching data from Twelve Data')
      }
      
      const result = await response.json()
      
      if (result.status === 'error') {
        throw new Error(result.message || 'API Error')
      }
      
      // Parse candles
      const candles: Candle[] = result.values.map((v: any) => ({
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
        volume: parseFloat(v.volume || 0),
        timestamp: new Date(v.datetime).getTime()
      })).reverse()
      
      if (candles.length < 50) {
        throw new Error('Insufficient data')
      }
      
      const currentPrice = candles[candles.length - 1].close
      const closes = candles.map(c => c.close)
      
      // Calculate EMA 50
      const ema50 = calculateEMA(closes, 50)
      const distanceToEMA = ((currentPrice - ema50) / ema50) * 100
      const priceVsEMA = Math.abs(distanceToEMA) < 0.1 ? 'at' : currentPrice > ema50 ? 'above' : 'below'
      const nearEMA = Math.abs(distanceToEMA) < 0.3
      
      // Detect swing points
      const { swingHighs, swingLows } = detectSwingPoints(candles, 3)
      
      // Group into zones
      const resistances = groupIntoZones(swingHighs, currentPrice, 'resistance')
      const supports = groupIntoZones(swingLows, currentPrice, 'support')
      
      // Find nearest zones
      const nearestSupport = supports[0] || null
      const nearestResistance = resistances[0] || null
      
      // Check if price is in a zone (within 0.2%)
      const inSupport = nearestSupport && nearestSupport.distance < 0.2
      const inResistance = nearestResistance && nearestResistance.distance < 0.2
      const priceInZone = inSupport || inResistance
      const zoneType = inSupport ? 'support' : inResistance ? 'resistance' : 'none'
      
      // Detect liquidity
      const liquidityZones = detectLiquidityZones(candles, currentPrice)
      
      // Detect sweep
      const { detected: sweepDetected, info: sweepInfo } = detectSweep(candles, liquidityZones)
      
      // Analyze trend
      const { trend, strength: trendStrength } = analyzeTrend(candles)
      
      // Calculate opportunity level
      const opportunityLevel = calculateOpportunityLevel(
        trend, priceInZone, nearEMA, sweepDetected, trendStrength
      )
      
      // Generate recommendation
      const recommendation = generateRecommendation(
        selectedPair, trend, priceInZone, zoneType, nearEMA, sweepDetected, sweepInfo
      )
      
      setData({
        pair: selectedPair,
        currentPrice,
        trend,
        trendStrength,
        ema50,
        priceVsEMA,
        distanceToEMA,
        supports: supports.slice(0, 3),
        resistances: resistances.slice(0, 3),
        liquidityZones: liquidityZones.slice(0, 3),
        nearestSupport,
        nearestResistance,
        priceInZone,
        zoneType,
        opportunityLevel,
        sweepDetected,
        sweepInfo,
        recommendation,
        lastUpdate: new Date(),
        isLoading: false,
        error: null
      })
      
    } catch (error: any) {
      console.error('Analysis error:', error)
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Error loading analysis'
      }))
    }
  }, [selectedPair])

  useEffect(() => {
    fetchData()
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [fetchData])

  return { data, refresh: fetchData }
}
