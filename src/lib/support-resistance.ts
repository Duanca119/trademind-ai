// Support and Resistance Detection Algorithm
// Detects key price levels where price may react

import { Candlestick } from './binance-api'

// ============================================
// TYPES
// ============================================

export interface PriceZone {
  low: number
  high: number
  mid: number
  strength: number      // 0-100 strength of the level
  touches: number       // Number of times price touched this zone
  type: 'support' | 'resistance'
  timeframe: '1D' | '1H' | '15M'
  lastTouch: number     // Timestamp of last touch
  distance: number      // Distance from current price (%)
}

export interface SupportResistanceAnalysis {
  supports: PriceZone[]
  resistances: PriceZone[]
  nearestSupport: PriceZone | null
  nearestResistance: PriceZone | null
  currentPrice: number
  pricePosition: 'near_support' | 'near_resistance' | 'mid_range' | 'above_all' | 'below_all'
  zonesByTimeframe: {
    '1D': { supports: PriceZone[]; resistances: PriceZone[] }
    '1H': { supports: PriceZone[]; resistances: PriceZone[] }
    '15M': { supports: PriceZone[]; resistances: PriceZone[] }
  }
  recommendedEntry: {
    zone: PriceZone | null
    direction: 'buy' | 'sell' | 'none'
    confidence: number
  }
}

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Minimum number of touches to consider a level valid
  minTouches: 2,
  
  // Zone width as percentage of price
  zoneWidthPercent: 0.3,
  
  // How much to merge nearby levels (as percentage)
  mergeThreshold: 0.5,
  
  // Maximum number of levels to return per type per timeframe
  maxLevels: 5,
  
  // Distance threshold for "near" a level (percentage)
  nearThreshold: 0.5,
  
  // Lookback periods for each timeframe
  lookback: {
    '1D': 100,
    '1H': 100,
    '15M': 100
  }
}

// ============================================
// DETECTION ALGORITHM
// ============================================

/**
 * Find local minima (potential support levels)
 */
function findLocalMinima(candlesticks: Candlestick[], lookback: number = 5): number[] {
  const minima: number[] = []
  
  for (let i = lookback; i < candlesticks.length - lookback; i++) {
    const current = candlesticks[i]
    let isMinima = true
    
    // Check if this is a local minimum
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && candlesticks[j].low < current.low) {
        isMinima = false
        break
      }
    }
    
    if (isMinima) {
      minima.push(current.low)
    }
  }
  
  return minima
}

/**
 * Find local maxima (potential resistance levels)
 */
function findLocalMaxima(candlesticks: Candlestick[], lookback: number = 5): number[] {
  const maxima: number[] = []
  
  for (let i = lookback; i < candlesticks.length - lookback; i++) {
    const current = candlesticks[i]
    let isMaxima = true
    
    // Check if this is a local maximum
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && candlesticks[j].high > current.high) {
        isMaxima = false
        break
      }
    }
    
    if (isMaxima) {
      maxima.push(current.high)
    }
  }
  
  return maxima
}

/**
 * Find rejection zones (where price was rejected multiple times)
 */
function findRejectionZones(
  candlesticks: Candlestick[],
  type: 'support' | 'resistance'
): { price: number; touches: number; strength: number }[] {
  const zones: Map<string, { price: number; touches: number; firstIndex: number; lastIndex: number }> = new Map()
  
  const zoneWidth = type === 'support' 
    ? candlesticks[0].low * (CONFIG.zoneWidthPercent / 100)
    : candlesticks[0].high * (CONFIG.zoneWidthPercent / 100)
  
  for (let i = 0; i < candlesticks.length; i++) {
    const candle = candlesticks[i]
    const price = type === 'support' ? candle.low : candle.high
    
    // Check if this price falls within an existing zone
    let foundZone = false
    for (const [key, zone] of zones) {
      if (Math.abs(price - zone.price) < zoneWidth) {
        // Update existing zone
        zone.touches++
        zone.lastIndex = i
        // Adjust price to average
        zone.price = (zone.price * (zone.touches - 1) + price) / zone.touches
        foundZone = true
        break
      }
    }
    
    if (!foundZone) {
      // Create new zone
      const key = price.toFixed(8)
      zones.set(key, { price, touches: 1, firstIndex: i, lastIndex: i })
    }
  }
  
  // Convert to array and calculate strength
  const result = Array.from(zones.values())
    .filter(zone => zone.touches >= CONFIG.minTouches)
    .map(zone => ({
      price: zone.price,
      touches: zone.touches,
      strength: Math.min(100, zone.touches * 20 + (zone.lastIndex - zone.firstIndex) * 0.5)
    }))
    .sort((a, b) => b.strength - a.strength)
  
  return result.slice(0, CONFIG.maxLevels)
}

/**
 * Find bounce zones (where price bounced from support)
 */
function findBounceZones(candlesticks: Candlestick[]): { price: number; touches: number; strength: number }[] {
  const zones: Map<string, { price: number; touches: number; bounces: number }> = new Map()
  
  const zoneWidth = candlesticks[0].low * (CONFIG.zoneWidthPercent / 100)
  
  for (let i = 2; i < candlesticks.length - 1; i++) {
    const prev = candlesticks[i - 1]
    const current = candlesticks[i]
    const next = candlesticks[i + 1]
    
    // Check for bounce pattern: low -> lower low -> higher low (or similar)
    if (current.low < prev.low && current.low < next.low) {
      // This is a potential bounce point
      const bouncePrice = current.low
      
      let foundZone = false
      for (const [key, zone] of zones) {
        if (Math.abs(bouncePrice - zone.price) < zoneWidth) {
          zone.touches++
          zone.bounces++
          zone.price = (zone.price * (zone.touches - 1) + bouncePrice) / zone.touches
          foundZone = true
          break
        }
      }
      
      if (!foundZone) {
        const key = bouncePrice.toFixed(8)
        zones.set(key, { price: bouncePrice, touches: 1, bounces: 1 })
      }
    }
  }
  
  return Array.from(zones.values())
    .filter(zone => zone.touches >= CONFIG.minTouches)
    .map(zone => ({
      price: zone.price,
      touches: zone.touches,
      strength: Math.min(100, 30 + zone.bounces * 15)
    }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, CONFIG.maxLevels)
}

/**
 * Find rejection from resistance zones
 */
function findRejectionFromResistanceZones(candlesticks: Candlestick[]): { price: number; touches: number; strength: number }[] {
  const zones: Map<string, { price: number; touches: number; rejections: number }> = new Map()
  
  const zoneWidth = candlesticks[0].high * (CONFIG.zoneWidthPercent / 100)
  
  for (let i = 2; i < candlesticks.length - 1; i++) {
    const prev = candlesticks[i - 1]
    const current = candlesticks[i]
    const next = candlesticks[i + 1]
    
    // Check for rejection pattern: high -> higher high -> lower high
    if (current.high > prev.high && current.high > next.high) {
      const rejectionPrice = current.high
      
      let foundZone = false
      for (const [key, zone] of zones) {
        if (Math.abs(rejectionPrice - zone.price) < zoneWidth) {
          zone.touches++
          zone.rejections++
          zone.price = (zone.price * (zone.touches - 1) + rejectionPrice) / zone.touches
          foundZone = true
          break
        }
      }
      
      if (!foundZone) {
        const key = rejectionPrice.toFixed(8)
        zones.set(key, { price: rejectionPrice, touches: 1, rejections: 1 })
      }
    }
  }
  
  return Array.from(zones.values())
    .filter(zone => zone.touches >= CONFIG.minTouches)
    .map(zone => ({
      price: zone.price,
      touches: zone.touches,
      strength: Math.min(100, 30 + zone.rejections * 15)
    }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, CONFIG.maxLevels)
}

/**
 * Create a price zone from detected level
 */
function createPriceZone(
  level: { price: number; touches: number; strength: number },
  type: 'support' | 'resistance',
  timeframe: '1D' | '1H' | '15M',
  currentPrice: number,
  atr: number
): PriceZone {
  // Zone width based on ATR (volatility-adjusted)
  const zoneWidth = atr * 0.2
  
  const low = level.price - zoneWidth
  const high = level.price + zoneWidth
  
  return {
    low,
    high,
    mid: level.price,
    strength: level.strength,
    touches: level.touches,
    type,
    timeframe,
    lastTouch: Date.now(),
    distance: Math.abs((level.price - currentPrice) / currentPrice) * 100
  }
}

/**
 * Merge overlapping zones
 */
function mergeZones(zones: PriceZone[]): PriceZone[] {
  if (zones.length === 0) return []
  
  const sorted = [...zones].sort((a, b) => a.low - b.low)
  const merged: PriceZone[] = []
  
  for (const zone of sorted) {
    const lastMerged = merged[merged.length - 1]
    
    if (lastMerged && zone.low <= lastMerged.high) {
      // Merge zones
      lastMerged.high = Math.max(lastMerged.high, zone.high)
      lastMerged.low = Math.min(lastMerged.low, zone.low)
      lastMerged.mid = (lastMerged.low + lastMerged.high) / 2
      lastMerged.strength = Math.max(lastMerged.strength, zone.strength)
      lastMerged.touches += zone.touches
    } else {
      merged.push({ ...zone })
    }
  }
  
  return merged
}

/**
 * Prioritize zones by timeframe (1D > 1H > 15M)
 */
function prioritizeZones(
  zonesByTimeframe: SupportResistanceAnalysis['zonesByTimeframe'],
  currentPrice: number
): { supports: PriceZone[]; resistances: PriceZone[] } {
  const allSupports: PriceZone[] = []
  const allResistances: PriceZone[] = []
  
  // Add zones with priority weight
  const priorityWeight = { '1D': 3, '1H': 2, '15M': 1 }
  
  for (const [tf, zones] of Object.entries(zonesByTimeframe)) {
    const timeframe = tf as '1D' | '1H' | '15M'
    
    for (const support of zones.supports) {
      support.strength = support.strength * (priorityWeight[timeframe] / 3)
      allSupports.push(support)
    }
    
    for (const resistance of zones.resistances) {
      resistance.strength = resistance.strength * (priorityWeight[timeframe] / 3)
      allResistances.push(resistance)
    }
  }
  
  // Sort by strength and distance
  const sortedSupports = allSupports
    .sort((a, b) => {
      // Prefer zones closer to current price but still below
      const aScore = a.strength - a.distance * 0.5
      const bScore = b.strength - b.distance * 0.5
      return bScore - aScore
    })
  
  const sortedResistances = allResistances
    .sort((a, b) => {
      const aScore = a.strength - a.distance * 0.5
      const bScore = b.strength - b.distance * 0.5
      return bScore - aScore
    })
  
  return {
    supports: mergeZones(sortedSupports).slice(0, CONFIG.maxLevels * 2),
    resistances: mergeZones(sortedResistances).slice(0, CONFIG.maxLevels * 2)
  }
}

/**
 * Find nearest support and resistance to current price
 */
function findNearestLevels(
  supports: PriceZone[],
  resistances: PriceZone[],
  currentPrice: number
): { nearestSupport: PriceZone | null; nearestResistance: PriceZone | null } {
  // Find nearest support (below current price)
  const validSupports = supports.filter(s => s.high < currentPrice)
  const nearestSupport = validSupports.length > 0 
    ? validSupports.reduce((nearest, s) => 
        (currentPrice - s.high) < (currentPrice - nearest.high) ? s : nearest
      )
    : null
  
  // Find nearest resistance (above current price)
  const validResistances = resistances.filter(r => r.low > currentPrice)
  const nearestResistance = validResistances.length > 0
    ? validResistances.reduce((nearest, r) =>
        (r.low - currentPrice) < (nearest.low - currentPrice) ? r : nearest
      )
    : null
  
  return { nearestSupport, nearestResistance }
}

/**
 * Determine price position relative to zones
 */
function determinePricePosition(
  currentPrice: number,
  nearestSupport: PriceZone | null,
  nearestResistance: PriceZone | null
): SupportResistanceAnalysis['pricePosition'] {
  const nearThreshold = CONFIG.nearThreshold
  
  if (nearestSupport && nearestResistance) {
    const supportDistance = ((currentPrice - nearestSupport.high) / currentPrice) * 100
    const resistanceDistance = ((nearestResistance.low - currentPrice) / currentPrice) * 100
    
    if (supportDistance < nearThreshold) return 'near_support'
    if (resistanceDistance < nearThreshold) return 'near_resistance'
    return 'mid_range'
  }
  
  if (!nearestSupport && !nearestResistance) {
    return 'mid_range'
  }
  
  if (!nearestSupport) return 'above_all'
  if (!nearestResistance) return 'below_all'
  
  return 'mid_range'
}

/**
 * Calculate recommended entry zone
 */
function calculateRecommendedEntry(
  supports: PriceZone[],
  resistances: PriceZone[],
  currentPrice: number,
  trend: 'bullish' | 'bearish' | 'sideways'
): SupportResistanceAnalysis['recommendedEntry'] {
  if (trend === 'bullish') {
    // Find nearest support for buy entry
    const validSupports = supports.filter(s => s.high < currentPrice && s.strength > 50)
    if (validSupports.length > 0) {
      const zone = validSupports.reduce((nearest, s) =>
        (currentPrice - s.high) < (currentPrice - nearest.high) ? s : nearest
      )
      const distance = ((currentPrice - zone.high) / currentPrice) * 100
      const confidence = Math.min(95, zone.strength + (distance < 1 ? 20 : 10))
      return { zone, direction: 'buy', confidence }
    }
  } else if (trend === 'bearish') {
    // Find nearest resistance for sell entry
    const validResistances = resistances.filter(r => r.low > currentPrice && r.strength > 50)
    if (validResistances.length > 0) {
      const zone = validResistances.reduce((nearest, r) =>
        (r.low - currentPrice) < (nearest.low - currentPrice) ? r : nearest
      )
      const distance = ((zone.low - currentPrice) / currentPrice) * 100
      const confidence = Math.min(95, zone.strength + (distance < 1 ? 20 : 10))
      return { zone, direction: 'sell', confidence }
    }
  }
  
  return { zone: null, direction: 'none', confidence: 0 }
}

// ============================================
// MAIN ANALYSIS FUNCTION
// ============================================

/**
 * Analyze candlestick data to detect support and resistance zones
 */
export function detectSupportResistance(
  klines: Record<'1D' | '1H' | '15M', Candlestick[]>,
  currentPrice: number,
  trend: 'bullish' | 'bearish' | 'sideways' = 'sideways'
): SupportResistanceAnalysis {
  // Analyze each timeframe
  const zonesByTimeframe: SupportResistanceAnalysis['zonesByTimeframe'] = {
    '1D': { supports: [], resistances: [] },
    '1H': { supports: [], resistances: [] },
    '15M': { supports: [], resistances: [] }
  }
  
  for (const [tf, candles] of Object.entries(klines)) {
    const timeframe = tf as '1D' | '1H' | '15M'
    
    if (!candles || candles.length === 0) continue
    
    // Get ATR for zone width calculation
    const atr = calculateATR(candles, 14)
    
    // Find support zones
    const supportLevels = [
      ...findBounceZones(candles),
      ...findRejectionZones(candles, 'support')
    ]
    
    // Find resistance zones
    const resistanceLevels = [
      ...findRejectionFromResistanceZones(candles),
      ...findRejectionZones(candles, 'resistance')
    ]
    
    // Add local minima as support
    const localMinima = findLocalMinima(candles)
    for (const low of localMinima) {
      supportLevels.push({ price: low, touches: 1, strength: 20 })
    }
    
    // Add local maxima as resistance
    const localMaxima = findLocalMaxima(candles)
    for (const high of localMaxima) {
      resistanceLevels.push({ price: high, touches: 1, strength: 20 })
    }
    
    // Create zones
    zonesByTimeframe[timeframe].supports = supportLevels
      .filter(l => l.price < currentPrice) // Support must be below current price
      .map(level => createPriceZone(level, 'support', timeframe, currentPrice, atr))
    
    zonesByTimeframe[timeframe].resistances = resistanceLevels
      .filter(l => l.price > currentPrice) // Resistance must be above current price
      .map(level => createPriceZone(level, 'resistance', timeframe, currentPrice, atr))
  }
  
  // Merge and prioritize zones from all timeframes
  const { supports, resistances } = prioritizeZones(zonesByTimeframe, currentPrice)
  
  // Find nearest levels
  const { nearestSupport, nearestResistance } = findNearestLevels(supports, resistances, currentPrice)
  
  // Determine price position
  const pricePosition = determinePricePosition(currentPrice, nearestSupport, nearestResistance)
  
  // Calculate recommended entry
  const recommendedEntry = calculateRecommendedEntry(supports, resistances, currentPrice, trend)
  
  return {
    supports,
    resistances,
    nearestSupport,
    nearestResistance,
    currentPrice,
    pricePosition,
    zonesByTimeframe,
    recommendedEntry
  }
}

/**
 * Calculate ATR for zone width
 */
function calculateATR(candlesticks: Candlestick[], period: number = 14): number {
  if (candlesticks.length < period + 1) return candlesticks[0].high - candlesticks[0].low
  
  const trueRanges: number[] = []
  
  for (let i = 1; i < candlesticks.length; i++) {
    const high = candlesticks[i].high
    const low = candlesticks[i].low
    const prevClose = candlesticks[i - 1].close
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    )
    trueRanges.push(tr)
  }
  
  // Calculate SMA of true ranges
  const recentTR = trueRanges.slice(-period)
  return recentTR.reduce((a, b) => a + b, 0) / recentTR.length
}

/**
 * Format price zone for display
 */
export function formatZone(zone: PriceZone, decimals: number = 5): string {
  const formatNum = (n: number) => n.toFixed(decimals)
  return `${formatNum(zone.low)} – ${formatNum(zone.high)}`
}

/**
 * Get zone status (for coloring)
 */
export function getZoneStatus(zone: PriceZone, currentPrice: number): 'active' | 'testing' | 'broken' {
  const inZone = currentPrice >= zone.low && currentPrice <= zone.high
  const nearZone = Math.abs(currentPrice - zone.mid) / zone.mid * 100 < 0.3
  
  if (inZone) return 'testing'
  if (nearZone) return 'active'
  
  // Check if broken (price passed through)
  if (zone.type === 'support' && currentPrice < zone.low) return 'broken'
  if (zone.type === 'resistance' && currentPrice > zone.high) return 'broken'
  
  return 'active'
}
