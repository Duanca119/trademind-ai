import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || '792522f333c3487a9102e68939c8e1e8'
const BASE_URL = 'https://api.twelvedata.com'

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Default user ID (can be expanded for multi-user later)
const DEFAULT_USER_ID = 'default_user'

// Constants for alert detection
const EMA_PROXIMITY_THRESHOLD = 0.2 // 0.2% - Price must be within this to trigger alert
const COOLDOWN_CLEAR_DISTANCE = 0.5 // 0.5% - Price must move this far from EMA to clear cooldown

// Forex pairs list
export const FOREX_PAIRS = [
  // Major pairs
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
  // Cross pairs
  'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'EUR/AUD', 'GBP/AUD', 'AUD/JPY',
  'EUR/CHF', 'GBP/CHF', 'AUD/CHF', 'NZD/JPY', 'EUR/CAD', 'GBP/CAD',
  'AUD/CAD', 'AUD/NZD', 'CAD/JPY'
]

interface TimeSeriesData {
  datetime: string
  open: string
  high: string
  low: string
  close: string
  volume: string
}

interface TrendAnalysis {
  direction: 'bullish' | 'bearish' | 'sideways'
  ema50: number
  currentPrice: number
  priceAboveEMA: boolean
  distanceToEMA: number // percentage
  structure: string
  strength: 'Alto' | 'Medio' | 'Bajo'
}

interface PairAnalysis {
  symbol: string
  trend1D: TrendAnalysis
  trend1H: TrendAnalysis | null
  isAligned: boolean
  isNearEMA: boolean // NEW: Price within 0.2% of EMA 50 in 1H
  shouldAlert: boolean // NEW: Conditions met for alert
  status: 'watching' | 'in_zone' | 'cooldown'
  reason: string
  timestamp: string
}

interface AlertTracking {
  symbol: string
  status: string
  last_alert_time: string | null
  last_alert_distance: number | null
  cooldown_until: string | null
}

// Fetch time series data
async function fetchTimeSeries(symbol: string, interval: string, outputsize: number = 100): Promise<TimeSeriesData[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVE_DATA_API_KEY}`,
      { next: { revalidate: 60 } }
    )
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data.values || []
  } catch (error) {
    console.error(`Error fetching ${symbol} ${interval}:`, error)
    return []
  }
}

// Calculate EMA
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0
  
  const multiplier = 2 / (period + 1)
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema
  }
  
  return ema
}

// Analyze trend for a timeframe
function analyzeTrend(data: TimeSeriesData[], timeframe: string): TrendAnalysis {
  if (data.length < 50) {
    return {
      direction: 'sideways',
      ema50: 0,
      currentPrice: 0,
      priceAboveEMA: false,
      distanceToEMA: 100,
      structure: 'Datos insuficientes',
      strength: 'Bajo'
    }
  }

  // Sort data chronologically (oldest first)
  const sortedData = [...data].reverse()
  const closes = sortedData.map(d => parseFloat(d.close))
  const highs = sortedData.map(d => parseFloat(d.high))
  const lows = sortedData.map(d => parseFloat(d.low))
  
  const currentPrice = closes[closes.length - 1]
  const ema50 = calculateEMA(closes, 50)
  const priceAboveEMA = currentPrice > ema50
  const distanceToEMA = Math.abs((currentPrice - ema50) / ema50) * 100

  // Analyze structure (last 20 candles)
  const recentHighs = highs.slice(-20)
  const recentLows = lows.slice(-20)
  
  let higherHighs = 0
  let higherLows = 0
  let lowerHighs = 0
  let lowerLows = 0
  
  for (let i = 1; i < recentHighs.length; i++) {
    if (recentHighs[i] > recentHighs[i - 1]) higherHighs++
    else lowerHighs++
    
    if (recentLows[i] > recentLows[i - 1]) higherLows++
    else lowerLows++
  }

  // Determine direction and structure
  let direction: 'bullish' | 'bearish' | 'sideways' = 'sideways'
  let structure = ''
  let strength: 'Alto' | 'Medio' | 'Bajo' = 'Bajo'

  const bullishStructure = higherHighs + higherLows
  const bearishStructure = lowerHighs + lowerLows
  
  if (bullishStructure >= 24 && priceAboveEMA) {
    direction = 'bullish'
    structure = 'Máximos y mínimos crecientes'
    strength = distanceToEMA < 0.5 ? 'Alto' : distanceToEMA < 1.5 ? 'Medio' : 'Bajo'
  } else if (bearishStructure >= 24 && !priceAboveEMA) {
    direction = 'bearish'
    structure = 'Máximos y mínimos decrecientes'
    strength = distanceToEMA < 0.5 ? 'Alto' : distanceToEMA < 1.5 ? 'Medio' : 'Bajo'
  } else {
    direction = 'sideways'
    structure = 'Sin estructura clara'
    strength = 'Bajo'
  }

  return {
    direction,
    ema50,
    currentPrice,
    priceAboveEMA,
    distanceToEMA,
    structure,
    strength
  }
}

// Get alert tracking state for a pair
async function getAlertTracking(symbol: string): Promise<AlertTracking | null> {
  const { data, error } = await supabase
    .from('alert_tracking')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
    .eq('symbol', symbol)
    .single()
  
  if (error || !data) return null
  return data as AlertTracking
}

// Update alert tracking state
async function updateAlertTracking(
  symbol: string, 
  status: string, 
  trend1D: string,
  trend1H: string,
  isAligned: boolean,
  currentPrice: number,
  ema50: number,
  distanceToEMA: number,
  sendAlert: boolean = false
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    trend_1d: trend1D,
    trend_1h: trend1H,
    is_aligned: isAligned,
    current_price: currentPrice,
    ema50_1h: ema50,
    distance_to_ema_pct: distanceToEMA,
    updated_at: new Date().toISOString()
  }

  // If sending alert, update alert-specific fields
  if (sendAlert) {
    updateData.last_alert_time = new Date().toISOString()
    updateData.last_alert_distance = distanceToEMA
    // Set cooldown for 30 minutes by default (can be adjusted)
    const cooldownUntil = new Date()
    cooldownUntil.setHours(cooldownUntil.getHours() + 1) // 1 hour cooldown
    updateData.cooldown_until = cooldownUntil.toISOString()
    
    // Increment alert count
    const { data: existing } = await supabase
      .from('alert_tracking')
      .select('alert_count')
      .eq('user_id', DEFAULT_USER_ID)
      .eq('symbol', symbol)
      .single()
    
    updateData.alert_count = (existing?.alert_count || 0) + 1
  }

  // Upsert the record
  await supabase
    .from('alert_tracking')
    .upsert({
      user_id: DEFAULT_USER_ID,
      symbol,
      ...updateData
    }, { onConflict: 'user_id,symbol' })
}

// Save alert to history
async function saveAlertHistory(
  symbol: string,
  message: string,
  price: number,
  ema50: number,
  distancePct: number,
  trend1D: string,
  trend1H: string
): Promise<void> {
  await supabase
    .from('alert_history')
    .insert({
      user_id: DEFAULT_USER_ID,
      symbol,
      alert_type: 'ema_proximity',
      message,
      price,
      ema50,
      distance_pct: distancePct,
      trend_1d: trend1D,
      trend_1h: trend1H
    })
}

// Analyze a single pair
async function analyzePair(symbol: string): Promise<PairAnalysis> {
  try {
    // Get existing tracking state
    const tracking = await getAlertTracking(symbol)
    
    // Check if in cooldown
    const now = new Date()
    const isInCooldown = tracking?.cooldown_until && new Date(tracking.cooldown_until) > now
    
    // Fetch 1D data first
    const data1D = await fetchTimeSeries(symbol, '1day', 100)
    
    if (data1D.length < 50) {
      return {
        symbol,
        trend1D: analyzeTrend([], '1D'),
        trend1H: null,
        isAligned: false,
        isNearEMA: false,
        shouldAlert: false,
        status: 'watching',
        reason: 'Datos insuficientes',
        timestamp: new Date().toISOString()
      }
    }

    const trend1D = analyzeTrend(data1D, '1D')

    // If 1D is sideways, don't analyze 1H
    if (trend1D.direction === 'sideways') {
      await updateAlertTracking(
        symbol, 'watching',
        trend1D.direction, 'sideways', false,
        trend1D.currentPrice, 0, 100, false
      )
      
      return {
        symbol,
        trend1D,
        trend1H: null,
        isAligned: false,
        isNearEMA: false,
        shouldAlert: false,
        status: 'watching',
        reason: '1D lateral - Sin dirección clara',
        timestamp: new Date().toISOString()
      }
    }

    // Fetch 1H data only if 1D has direction
    const data1H = await fetchTimeSeries(symbol, '1h', 100)
    
    if (data1H.length < 50) {
      return {
        symbol,
        trend1D,
        trend1H: null,
        isAligned: false,
        isNearEMA: false,
        shouldAlert: false,
        status: 'watching',
        reason: 'Datos 1H insuficientes',
        timestamp: new Date().toISOString()
      }
    }

    const trend1H = analyzeTrend(data1H, '1H')

    // Check alignment (1D and 1H same direction)
    const isAligned = trend1D.direction === trend1H.direction && trend1H.direction !== 'sideways'
    
    // Check if price is near EMA 50 in 1H (within 0.2%)
    const isNearEMA = trend1H.distanceToEMA <= EMA_PROXIMITY_THRESHOLD
    
    // Determine status and if should alert
    let status: 'watching' | 'in_zone' | 'cooldown' = 'watching'
    let shouldAlert = false
    let reason = ''

    if (!isAligned) {
      reason = `1D es ${trend1D.direction}, 1H es ${trend1H.direction} - No alineados`
      status = 'watching'
    } else if (isInCooldown) {
      // Check if price has moved far enough from EMA to clear cooldown
      if (trend1H.distanceToEMA >= COOLDOWN_CLEAR_DISTANCE) {
        // Price moved away, can clear cooldown
        status = 'watching'
        reason = 'Precio se alejó de EMA - Cooldown limpiado'
      } else {
        status = 'cooldown'
        reason = `En cooldown hasta ${tracking?.cooldown_until ? new Date(tracking.cooldown_until).toLocaleTimeString('es-ES') : 'N/A'}`
      }
    } else if (isNearEMA) {
      // All conditions met for alert!
      status = 'in_zone'
      shouldAlert = true
      reason = `${trend1D.direction === 'bullish' ? 'Alcista' : 'Bajista'} en 1D y 1H. Precio en zona EMA 50 (${trend1H.distanceToEMA.toFixed(3)}%)`
    } else {
      // Aligned but not near EMA
      status = 'watching'
      reason = `Alineado ${trend1D.direction === 'bullish' ? 'alcista' : 'bajista'}. Esperando acercamiento a EMA (actual: ${trend1H.distanceToEMA.toFixed(2)}%)`
    }

    // Update tracking
    await updateAlertTracking(
      symbol, status,
      trend1D.direction, trend1H.direction, isAligned,
      trend1H.currentPrice, trend1H.ema50, trend1H.distanceToEMA,
      shouldAlert
    )

    // If should alert, save to history
    if (shouldAlert) {
      const alertMessage = `⚠️ ${symbol} en zona de EMA 50 (1H) con tendencia alineada. Revisar en 5M`
      await saveAlertHistory(
        symbol, alertMessage,
        trend1H.currentPrice, trend1H.ema50, trend1H.distanceToEMA,
        trend1D.direction, trend1H.direction
      )
    }

    return {
      symbol,
      trend1D,
      trend1H,
      isAligned,
      isNearEMA,
      shouldAlert,
      status,
      reason,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error(`Error analyzing ${symbol}:`, error)
    return {
      symbol,
      trend1D: analyzeTrend([], '1D'),
      trend1H: null,
      isAligned: false,
      isNearEMA: false,
      shouldAlert: false,
      status: 'watching',
      reason: 'Error en análisis',
      timestamp: new Date().toISOString()
    }
  }
}

// Get user's selected pairs
async function getSelectedPairs(): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_selected_pairs')
    .select('symbol')
    .eq('user_id', DEFAULT_USER_ID)
    .eq('is_active', true)
  
  if (error || !data) return []
  return data.map(d => d.symbol)
}

// Add pair to user's selection
async function addSelectedPair(symbol: string): Promise<void> {
  await supabase
    .from('user_selected_pairs')
    .upsert({
      user_id: DEFAULT_USER_ID,
      symbol,
      is_active: true
    }, { onConflict: 'user_id,symbol' })
}

// Remove pair from user's selection
async function removeSelectedPair(symbol: string): Promise<void> {
  await supabase
    .from('user_selected_pairs')
    .update({ is_active: false })
    .eq('user_id', DEFAULT_USER_ID)
    .eq('symbol', symbol)
}

// ============================================
// PRICE ACTION ANALYSIS FUNCTIONS
// ============================================

interface CandlePattern {
  type: string
  direction: 'bullish' | 'bearish' | 'neutral'
  strength: 'fuerte' | 'moderado' | 'débil'
  description: string
  timestamp: string
}

// Key Zone interface for Support/Resistance detection
interface KeyZone {
  low: number
  high: number
  mid: number
  type: 'support' | 'resistance'
  touches: number
  strength: 'fuerte' | 'moderado' | 'débil'
  distance: number // percentage from current price
  isNearEMA: boolean // zone is near EMA 50
}

interface PriceActionAnalysis {
  symbol: string
  currentPrice: number
  timestamp: string
  
  // Trend
  trend: {
    direction: 'alcista' | 'bajista' | 'lateral'
    strength: 'Alto' | 'Medio' | 'Bajo'
    structure: string
    ema20: number
    ema50: number
    priceAboveEMA20: boolean
    priceAboveEMA50: boolean
  }
  
  // Candle patterns
  patterns: CandlePattern[]
  
  // Last 5 candles for display
  recentCandles: {
    open: number
    high: number
    low: number
    close: number
    direction: 'bullish' | 'bearish'
    body: number
    upperWick: number
    lowerWick: number
    timestamp: string
  }[]
  
  // Key levels (simple - kept for compatibility)
  keyLevels: {
    resistance: number[]
    support: number[]
  }
  
  // NEW: Key Zones with detailed info
  keyZones: {
    supports: KeyZone[]
    resistances: KeyZone[]
    nearestSupport: KeyZone | null
    nearestResistance: KeyZone | null
    priceInZone: boolean
    zoneMessage: string
  }
  
  // Summary
  summary: string
}

// ============================================
// KEY ZONES DETECTION (Swing Highs/Lows)
// ============================================

// Detect Swing Highs (resistance zones)
function detectSwingHighs(highs: number[], lookback: number = 2): { index: number; price: number }[] {
  const swingHighs: { index: number; price: number }[] = []
  
  for (let i = lookback; i < highs.length - lookback; i++) {
    const currentHigh = highs[i]
    let isSwingHigh = true
    
    // Check if current high is higher than neighbors
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && highs[j] >= currentHigh) {
        isSwingHigh = false
        break
      }
    }
    
    if (isSwingHigh) {
      swingHighs.push({ index: i, price: currentHigh })
    }
  }
  
  return swingHighs
}

// Detect Swing Lows (support zones)
function detectSwingLows(lows: number[], lookback: number = 2): { index: number; price: number }[] {
  const swingLows: { index: number; price: number }[] = []
  
  for (let i = lookback; i < lows.length - lookback; i++) {
    const currentLow = lows[i]
    let isSwingLow = true
    
    // Check if current low is lower than neighbors
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && lows[j] <= currentLow) {
        isSwingLow = false
        break
      }
    }
    
    if (isSwingLow) {
      swingLows.push({ index: i, price: currentLow })
    }
  }
  
  return swingLows
}

// Group nearby levels into zones (±0.2%)
function groupLevelsIntoZones(
  levels: { index: number; price: number }[],
  currentPrice: number,
  type: 'support' | 'resistance',
  ema50: number
): KeyZone[] {
  if (levels.length === 0) return []
  
  // Sort by price
  const sorted = [...levels].sort((a, b) => a.price - b.price)
  
  // Group nearby levels (within 0.2% of each other)
  const groups: { prices: number[]; indices: number[] }[] = []
  let currentGroup: { prices: number[]; indices: number[] } = { prices: [], indices: [] }
  
  const threshold = currentPrice * 0.002 // 0.2%
  
  for (const level of sorted) {
    if (currentGroup.prices.length === 0) {
      currentGroup.prices.push(level.price)
      currentGroup.indices.push(level.index)
    } else {
      const lastPrice = currentGroup.prices[currentGroup.prices.length - 1]
      if (Math.abs(level.price - lastPrice) <= threshold) {
        currentGroup.prices.push(level.price)
        currentGroup.indices.push(level.index)
      } else {
        if (currentGroup.prices.length > 0) {
          groups.push(currentGroup)
        }
        currentGroup = { prices: [level.price], indices: [level.index] }
      }
    }
  }
  
  if (currentGroup.prices.length > 0) {
    groups.push(currentGroup)
  }
  
  // Convert groups to zones
  const zones: KeyZone[] = groups
    .filter(group => group.prices.length >= 2) // Minimum 2 touches
    .map(group => {
      const minPrice = Math.min(...group.prices)
      const maxPrice = Math.max(...group.prices)
      const mid = (minPrice + maxPrice) / 2
      const touches = group.prices.length
      
      // Zone width (expand a bit beyond min/max)
      const zoneWidth = currentPrice * 0.001 // 0.1% expansion
      const low = minPrice - zoneWidth
      const high = maxPrice + zoneWidth
      
      // Distance from current price
      const distance = Math.abs((mid - currentPrice) / currentPrice) * 100
      
      // Check if zone is near EMA 50
      const emaDistance = Math.abs((mid - ema50) / ema50) * 100
      const isNearEMA = emaDistance <= 0.3 // Within 0.3% of EMA
      
      // Strength based on touches
      let strength: 'fuerte' | 'moderado' | 'débil' = 'débil'
      if (touches >= 4) strength = 'fuerte'
      else if (touches >= 3) strength = 'moderado'
      
      return {
        low,
        high,
        mid,
        type,
        touches,
        strength,
        distance,
        isNearEMA
      }
    })
  
  // Sort by distance (closest first)
  return zones.sort((a, b) => a.distance - b.distance)
}

// Detect key zones from 1H data
function detectKeyZones(
  highs: number[],
  lows: number[],
  currentPrice: number,
  ema50: number,
  trend: 'alcista' | 'bajista' | 'lateral'
): {
  supports: KeyZone[]
  resistances: KeyZone[]
  nearestSupport: KeyZone | null
  nearestResistance: KeyZone | null
  priceInZone: boolean
  zoneMessage: string
} {
  // Detect swing points
  const swingHighs = detectSwingHighs(highs)
  const swingLows = detectSwingLows(lows)
  
  // Group into zones
  const allResistanceZones = groupLevelsIntoZones(swingHighs, currentPrice, 'resistance', ema50)
  const allSupportZones = groupLevelsIntoZones(swingLows, currentPrice, 'support', ema50)
  
  // Filter: only zones on correct side of price
  const resistances = allResistanceZones.filter(z => z.low > currentPrice).slice(0, 3)
  const supports = allSupportZones.filter(z => z.high < currentPrice).slice(0, 3)
  
  // Find nearest
  const nearestSupport = supports.length > 0 ? supports[0] : null
  const nearestResistance = resistances.length > 0 ? resistances[0] : null
  
  // Check if price is currently in a zone
  let priceInZone = false
  let zoneMessage = ''
  
  // Check support zones
  for (const zone of supports) {
    if (currentPrice >= zone.low && currentPrice <= zone.high) {
      priceInZone = true
      if (zone.isNearEMA) {
        zoneMessage = `🎯 Precio en zona de SOPORTE clave + cerca de EMA 50 → Posible entrada larga en 5M`
      } else {
        zoneMessage = `📍 Precio en zona de soporte (${zone.touches} toques). Esperar confirmación.`
      }
      break
    }
  }
  
  // Check resistance zones
  if (!priceInZone) {
    for (const zone of resistances) {
      if (currentPrice >= zone.low && currentPrice <= zone.high) {
        priceInZone = true
        if (zone.isNearEMA) {
          zoneMessage = `🎯 Precio en zona de RESISTENCIA clave + cerca de EMA 50 → Posible entrada corta en 5M`
        } else {
          zoneMessage = `📍 Precio en zona de resistencia (${zone.touches} toques). Esperar confirmación.`
        }
        break
      }
    }
  }
  
  // If not in zone, check proximity to nearest
  if (!priceInZone) {
    if (nearestSupport && nearestSupport.distance < 0.5) {
      zoneMessage = `⏳ Precio cerca de soporte (${nearestSupport.distance.toFixed(2)}%). Preparar entrada.`
    } else if (nearestResistance && nearestResistance.distance < 0.5) {
      zoneMessage = `⏳ Precio cerca de resistencia (${nearestResistance.distance.toFixed(2)}%). Preparar entrada.`
    } else {
      zoneMessage = trend === 'alcista' 
        ? '⏳ Esperar retroceso a zona de soporte para entrada larga.'
        : trend === 'bajista'
        ? '⏳ Esperar rebote en resistencia para entrada corta.'
        : '⏳ Mercado lateral. Esperar definición de dirección.'
    }
  }
  
  return {
    supports,
    resistances,
    nearestSupport,
    nearestResistance,
    priceInZone,
    zoneMessage
  }
}

// Detect candle patterns
function detectCandlePatterns(candles: TimeSeriesData[]): CandlePattern[] {
  const patterns: CandlePattern[] = []
  
  if (candles.length < 3) return patterns
  
  const last3 = candles.slice(0, 3).map(c => ({
    open: parseFloat(c.open),
    high: parseFloat(c.high),
    low: parseFloat(c.low),
    close: parseFloat(c.close),
    datetime: c.datetime
  }))
  
  const [c1, c2, c3] = last3 // c1 = most recent, c3 = oldest
  
  // Calculate bodies and wicks
  const body1 = Math.abs(c1.close - c1.open)
  const range1 = c1.high - c1.low
  const upperWick1 = c1.high - Math.max(c1.open, c1.close)
  const lowerWick1 = Math.min(c1.open, c1.close) - c1.low
  
  const body2 = Math.abs(c2.close - c2.open)
  const range2 = c2.high - c2.low
  
  // Detect patterns
  
  // 1. Engulfing (Envolvente)
  const c1Bullish = c1.close > c1.open
  const c2Bullish = c2.close > c2.open
  
  if (c1Bullish && !c2Bullish && body1 > body2) {
    patterns.push({
      type: 'Envolvente Alcista',
      direction: 'bullish',
      strength: 'fuerte',
      description: 'Vela verde que envuelve completamente la vela roja anterior. Señal de reversión alcista.',
      timestamp: c1.datetime
    })
  }
  
  if (!c1Bullish && c2Bullish && body1 > body2) {
    patterns.push({
      type: 'Envolvente Bajista',
      direction: 'bearish',
      strength: 'fuerte',
      description: 'Vela roja que envuelve completamente la vela verde anterior. Señal de reversión bajista.',
      timestamp: c1.datetime
    })
  }
  
  // 2. Pin Bar / Hammer
  const bodyToRange1 = body1 / range1
  
  if (bodyToRange1 < 0.35 && lowerWick1 > body1 * 2 && upperWick1 < body1) {
    patterns.push({
      type: 'Martillo Alcista',
      direction: 'bullish',
      strength: lowerWick1 > body1 * 3 ? 'fuerte' : 'moderado',
      description: 'Mecha inferior larga con cuerpo pequeño. Posible rechazo de soporte.',
      timestamp: c1.datetime
    })
  }
  
  if (bodyToRange1 < 0.35 && upperWick1 > body1 * 2 && lowerWick1 < body1) {
    patterns.push({
      type: 'Martillo Invertido',
      direction: 'bearish',
      strength: upperWick1 > body1 * 3 ? 'fuerte' : 'moderado',
      description: 'Mecha superior larga con cuerpo pequeño. Posible rechazo de resistencia.',
      timestamp: c1.datetime
    })
  }
  
  // 3. Doji
  if (bodyToRange1 < 0.1) {
    patterns.push({
      type: 'Doji',
      direction: 'neutral',
      strength: 'moderado',
      description: 'Cuerpo muy pequeño. Indica indecisión en el mercado.',
      timestamp: c1.datetime
    })
  }
  
  // 4. Marubozu (vela sin mechas)
  if (bodyToRange1 > 0.9) {
    patterns.push({
      type: c1Bullish ? 'Marubozu Alcista' : 'Marubozu Bajista',
      direction: c1Bullish ? 'bullish' : 'bearish',
      strength: 'fuerte',
      description: 'Vela con cuerpo grande y sin mechas. Fuerte presión direccional.',
      timestamp: c1.datetime
    })
  }
  
  // 5. Morning/Evening Star (estrella de la mañana/tarde)
  if (candles.length >= 3) {
    const c3Bullish = c3.close > c3.open
    const smallBody2 = Math.abs(c2.close - c2.open) / (c2.high - c2.low) < 0.3
    
    if (!c3Bullish && smallBody2 && c1Bullish && c1.close > (c3.open + c3.close) / 2) {
      patterns.push({
        type: 'Estrella de la Mañana',
        direction: 'bullish',
        strength: 'fuerte',
        description: 'Patrón de 3 velas que indica reversión alcista.',
        timestamp: c1.datetime
      })
    }
    
    if (c3Bullish && smallBody2 && !c1Bullish && c1.close < (c3.open + c3.close) / 2) {
      patterns.push({
        type: 'Estrella de la Tarde',
        direction: 'bearish',
        strength: 'fuerte',
        description: 'Patrón de 3 velas que indica reversión bajista.',
        timestamp: c1.datetime
      })
    }
  }
  
  return patterns
}

// Analyze price action for a symbol
async function analyzePriceAction(symbol: string): Promise<PriceActionAnalysis | null> {
  try {
    // Fetch 1H data (100 candles for patterns)
    const data = await fetchTimeSeries(symbol, '1h', 100)
    
    if (data.length < 50) {
      return null
    }
    
    // Sort chronologically (oldest first)
    const sortedData = [...data].reverse()
    const closes = sortedData.map(d => parseFloat(d.close))
    const highs = sortedData.map(d => parseFloat(d.high))
    const lows = sortedData.map(d => parseFloat(d.low))
    
    const currentPrice = closes[closes.length - 1]
    
    // Calculate EMAs
    const ema20 = calculateEMA(closes, 20)
    const ema50 = calculateEMA(closes, 50)
    const priceAboveEMA20 = currentPrice > ema20
    const priceAboveEMA50 = currentPrice > ema50
    
    // Analyze trend structure
    const recentHighs = highs.slice(-20)
    const recentLows = lows.slice(-20)
    
    let higherHighs = 0, higherLows = 0, lowerHighs = 0, lowerLows = 0
    
    for (let i = 1; i < recentHighs.length; i++) {
      if (recentHighs[i] > recentHighs[i - 1]) higherHighs++
      else lowerHighs++
      if (recentLows[i] > recentLows[i - 1]) higherLows++
      else lowerLows++
    }
    
    const bullishStructure = higherHighs + higherLows
    const bearishStructure = lowerHighs + lowerLows
    
    let trendDirection: 'alcista' | 'bajista' | 'lateral' = 'lateral'
    let trendStrength: 'Alto' | 'Medio' | 'Bajo' = 'Bajo'
    let structureText = ''
    
    if (bullishStructure >= 24 && priceAboveEMA50) {
      trendDirection = 'alcista'
      structureText = 'Máximos y mínimos crecientes'
      trendStrength = bullishStructure >= 30 ? 'Alto' : 'Medio'
    } else if (bearishStructure >= 24 && !priceAboveEMA50) {
      trendDirection = 'bajista'
      structureText = 'Máximos y mínimos decrecientes'
      trendStrength = bearishStructure >= 30 ? 'Alto' : 'Medio'
    } else {
      structureText = 'Sin estructura definida'
    }
    
    // Detect candle patterns
    const patterns = detectCandlePatterns(data)
    
    // Get recent candles for display
    const recentCandles = data.slice(0, 5).map(c => {
      const open = parseFloat(c.open)
      const close = parseFloat(c.close)
      const high = parseFloat(c.high)
      const low = parseFloat(c.low)
      
      return {
        open,
        high,
        low,
        close,
        direction: close > open ? 'bullish' : 'bearish',
        body: Math.abs(close - open),
        upperWick: high - Math.max(open, close),
        lowerWick: Math.min(open, close) - low,
        timestamp: c.datetime
      }
    })
    
    // Find key levels (support/resistance) - simple version for compatibility
    const sortedHighs = [...highs].sort((a, b) => b - a)
    const sortedLows = [...lows].sort((a, b) => a - b)
    
    const resistance = sortedHighs.slice(0, 3)
    const support = sortedLows.slice(0, 3)
    
    // NEW: Detect key zones using Swing Highs/Lows
    const keyZones = detectKeyZones(highs, lows, currentPrice, ema50, trendDirection)
    
    // Generate summary with zone info
    let summary = `El ${symbol} muestra una tendencia ${trendDirection}`
    
    if (keyZones.priceInZone) {
      summary += `. ${keyZones.zoneMessage}`
    } else if (patterns.length > 0) {
      const mainPattern = patterns[0]
      summary += `. Se detectó ${mainPattern.type} con señal ${mainPattern.direction === 'bullish' ? 'alcista' : mainPattern.direction === 'bearish' ? 'bajista' : 'neutral'}.`
    } else {
      summary += `. ${keyZones.zoneMessage}`
    }
    
    return {
      symbol,
      currentPrice,
      timestamp: new Date().toISOString(),
      trend: {
        direction: trendDirection,
        strength: trendStrength,
        structure: structureText,
        ema20,
        ema50,
        priceAboveEMA20,
        priceAboveEMA50
      },
      patterns,
      recentCandles,
      keyLevels: {
        resistance,
        support
      },
      keyZones,
      summary
    }
  } catch (error) {
    console.error('Error analyzing price action:', error)
    return null
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const symbol = searchParams.get('symbol')
  
  try {
    // Get market status
    if (action === 'status') {
      const now = new Date()
      const utcHour = now.getUTCHours()
      const utcMinute = now.getUTCMinutes()
      const currentTime = utcHour * 60 + utcMinute
      
      const sessions = {
        asia: {
          name: 'Asia (Tokyo)',
          isOpen: currentTime >= 0 && currentTime < 9 * 60
        },
        london: {
          name: 'Londres',
          isOpen: currentTime >= 8 * 60 && currentTime < 17 * 60
        },
        newYork: {
          name: 'Nueva York',
          isOpen: currentTime >= 13 * 60 && currentTime < 22 * 60
        }
      }
      
      return NextResponse.json({
        sessions,
        currentTime: now.toISOString(),
        utcHour,
        utcMinute
      })
    }

    // Get selected pairs
    if (action === 'selected-pairs') {
      const selectedPairs = await getSelectedPairs()
      return NextResponse.json({ selectedPairs })
    }

    // Add pair to selection
    if (action === 'select-pair' && symbol) {
      await addSelectedPair(symbol)
      return NextResponse.json({ success: true, symbol, message: `${symbol} añadido a vigilancia` })
    }

    // Remove pair from selection
    if (action === 'deselect-pair' && symbol) {
      await removeSelectedPair(symbol)
      return NextResponse.json({ success: true, symbol, message: `${symbol} eliminado de vigilancia` })
    }

    // Get available pairs list
    if (action === 'available-pairs') {
      return NextResponse.json({ pairs: FOREX_PAIRS })
    }

    // Analyze selected pairs only
    if (action === 'analyze') {
      const selectedPairs = await getSelectedPairs()
      
      if (selectedPairs.length === 0) {
        return NextResponse.json({
          readyPairs: [],
          allResults: [],
          totalAnalyzed: 0,
          totalReady: 0,
          timestamp: new Date().toISOString(),
          message: 'No hay pares seleccionados. Selecciona pares para analizar.',
          disclaimer: 'Las alertas indican zonas de interés. La entrada debe confirmarse manualmente en 5M.'
        })
      }

      const results: PairAnalysis[] = []
      const alertsToSend: { symbol: string; message: string }[] = []
      
      // Analyze selected pairs sequentially to avoid rate limits
      for (const pair of selectedPairs) {
        const analysis = await analyzePair(pair)
        results.push(analysis)
        
        if (analysis.shouldAlert) {
          alertsToSend.push({
            symbol: pair,
            message: `⚠️ ${pair} en zona de EMA 50 (1H) con tendencia alineada. Revisar en 5M`
          })
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 150))
      }

      // Sort: in_zone first, then by proximity to EMA
      results.sort((a, b) => {
        const statusOrder = { 'in_zone': 0, 'watching': 1, 'cooldown': 2 }
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status]
        }
        // Then by distance to EMA (closer = better)
        return (a.trend1H?.distanceToEMA || 100) - (b.trend1H?.distanceToEMA || 100)
      })

      // Filter pairs by status
      const inZonePairs = results.filter(r => r.status === 'in_zone')
      const watchingPairs = results.filter(r => r.status === 'watching')
      const cooldownPairs = results.filter(r => r.status === 'cooldown')

      return NextResponse.json({
        inZonePairs,
        watchingPairs,
        cooldownPairs,
        alerts: alertsToSend,
        allResults: results,
        totalAnalyzed: results.length,
        totalInZone: inZonePairs.length,
        totalWatching: watchingPairs.length,
        timestamp: new Date().toISOString(),
        disclaimer: 'Las alertas indican zonas de interés. La entrada debe confirmarse manualmente en 5M.'
      })
    }

    // Analyze single pair
    if (action === 'analyze-pair' && symbol) {
      const analysis = await analyzePair(symbol)
      return NextResponse.json(analysis)
    }

    // Get alert history
    if (action === 'alert-history') {
      const limit = parseInt(searchParams.get('limit') || '20')
      const { data, error } = await supabase
        .from('alert_history')
        .select('*')
        .eq('user_id', DEFAULT_USER_ID)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) {
        return NextResponse.json({ error: 'Error fetching history' }, { status: 500 })
      }
      
      return NextResponse.json({ history: data })
    }

    // ============================================
    // GLOBAL SELECTED PAIR (for tab synchronization)
    // ============================================

    // Get the globally selected pair
    if (action === 'get-selected-pair') {
      const { data, error } = await supabase
        .from('user_selected_pair')
        .select('symbol')
        .eq('user_id', DEFAULT_USER_ID)
        .single()
      
      if (error || !data) {
        return NextResponse.json({ selectedPair: null })
      }
      
      return NextResponse.json({ selectedPair: data.symbol })
    }

    // Set the globally selected pair
    if (action === 'set-selected-pair' && symbol) {
      await supabase
        .from('user_selected_pair')
        .upsert({
          user_id: DEFAULT_USER_ID,
          symbol
        }, { onConflict: 'user_id' })
      
      return NextResponse.json({ success: true, symbol, message: `Par activo: ${symbol}` })
    }

    // ============================================
    // PRICE ACTION ANALYSIS
    // ============================================

    // Analyze price action for a specific pair
    if (action === 'price-action' && symbol) {
      const priceActionAnalysis = await analyzePriceAction(symbol)
      return NextResponse.json(priceActionAnalysis)
    }

    // ============================================
    // TRADER PROFILE
    // ============================================

    // Get trader profile
    if (action === 'get-trader-profile') {
      const { data, error } = await supabase
        .from('user_trader_profile')
        .select('profile_type, ema_distance, alerts_enabled, favorite_pairs')
        .eq('user_id', DEFAULT_USER_ID)
        .single()
      
      if (error || !data) {
        return NextResponse.json({ 
          profile: 'dayTrader', // Default
          settings: {
            emaDistance: 0.2,
            alertsEnabled: true
          }
        })
      }
      
      return NextResponse.json({ 
        profile: data.profile_type,
        settings: {
          emaDistance: data.ema_distance,
          alertsEnabled: data.alerts_enabled
        }
      })
    }

    // Set trader profile
    if (action === 'set-trader-profile') {
      const profile = searchParams.get('profile')
      
      if (!profile || !['scalper', 'dayTrader', 'swingTrader'].includes(profile)) {
        return NextResponse.json({ error: 'Invalid profile' }, { status: 400 })
      }
      
      await supabase
        .from('user_trader_profile')
        .upsert({
          user_id: DEFAULT_USER_ID,
          profile_type: profile,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
      
      return NextResponse.json({ success: true, profile, message: `Perfil actualizado: ${profile}` })
    }

    // Set trader settings
    if (action === 'set-trader-settings') {
      const emaDistance = parseFloat(searchParams.get('emaDistance') || '0.2')
      const alertsEnabled = searchParams.get('alertsEnabled') === 'true'
      
      await supabase
        .from('user_trader_profile')
        .upsert({
          user_id: DEFAULT_USER_ID,
          ema_distance: emaDistance,
          alerts_enabled: alertsEnabled,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
      
      return NextResponse.json({ success: true, settings: { emaDistance, alertsEnabled } })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
