// Forex Price API Client
// Fetches real-time forex prices from our backend API

import { FOREX_PAIRS } from '@/types/trading'

export interface ForexPriceData {
  symbol: string
  price: number
  bid: number
  ask: number
  high24h: number
  low24h: number
  change: number
  changePercent: number
  timestamp: number
}

// Base prices as fallback (current market rates March 2025)
export const BASE_PRICES: Record<string, number> = {
  EURUSD: 1.1530,
  GBPUSD: 1.2620,
  USDJPY: 150.25,
  USDCHF: 0.8850,
  AUDUSD: 0.6530,
  USDCAD: 1.3650,
  NZDUSD: 0.6130,
  EURGBP: 0.9140,
  EURJPY: 173.15,
  GBPJPY: 189.55,
  AUDJPY: 98.10,
  NZDJPY: 92.05,
  CADJPY: 110.05,
  CHFJPY: 169.55,
  EURAUD: 1.7660,
  EURNZD: 1.8790,
  GBPAUD: 1.9320,
  GBPCAD: 1.7220,
  AUDCAD: 0.8910,
  NZDCAD: 0.8375,
  XAUUSD: 2340.00
}

// Price cache
const priceCache: Record<string, ForexPriceData> = {}
const CACHE_DURATION = 1500 // 1.5 seconds

/**
 * Fetch forex price from our backend API
 */
export async function fetchForexPrice(symbol: string): Promise<ForexPriceData> {
  const now = Date.now()
  
  // Return cached price if still valid
  if (priceCache[symbol] && (now - priceCache[symbol].timestamp) < CACHE_DURATION) {
    return priceCache[symbol]
  }
  
  try {
    // Try to fetch from our backend API
    const response = await fetch(`/api/forex-price?symbol=${symbol}`, {
      cache: 'no-store'
    })
    
    if (response.ok) {
      const result = await response.json()
      
      if (result.success && result.data) {
        priceCache[symbol] = result.data
        return result.data
      }
    }
  } catch (error) {
    console.log('Forex API fetch failed, using local simulation')
  }
  
  // Fallback to local simulation
  return getLocalSimulatedPrice(symbol)
}

/**
 * Generate simulated price locally (fallback)
 */
function getLocalSimulatedPrice(symbol: string): ForexPriceData {
  const now = Date.now()
  const basePrice = BASE_PRICES[symbol] || 1.0
  
  // Get or initialize last price
  if (!priceCache[symbol]) {
    priceCache[symbol] = {
      symbol,
      price: basePrice,
      bid: basePrice * 0.9999,
      ask: basePrice * 1.0001,
      high24h: basePrice * 1.008,
      low24h: basePrice * 0.992,
      change: 0,
      changePercent: 0,
      timestamp: now
    }
  }
  
  const lastPrice = priceCache[symbol].price
  const timeSinceUpdate = now - priceCache[symbol].timestamp
  
  // Only update if cache expired
  if (timeSinceUpdate < CACHE_DURATION) {
    return priceCache[symbol]
  }
  
  // Calculate volatility
  let volatility = 0.0001
  if (symbol.includes('JPY')) volatility = 0.0003
  if (symbol === 'XAUUSD') volatility = 0.001
  if (symbol.includes('GBP')) volatility = 0.0002
  
  // Generate realistic movement
  const trendBias = (lastPrice - basePrice) / basePrice > 0 ? 0.01 : -0.01
  const randomMovement = (Math.random() - 0.5 + trendBias) * volatility * lastPrice
  
  const newPrice = Math.max(
    basePrice * 0.95,
    Math.min(basePrice * 1.05, lastPrice + randomMovement)
  )
  
  // Calculate spread
  const pipSize = symbol.includes('JPY') ? 0.01 : 0.0001
  const spread = pipSize * 2
  
  const priceData: ForexPriceData = {
    symbol,
    price: newPrice,
    bid: newPrice - spread / 2,
    ask: newPrice + spread / 2,
    high24h: Math.max(priceCache[symbol].high24h, newPrice),
    low24h: Math.min(priceCache[symbol].low24h, newPrice),
    change: newPrice - basePrice,
    changePercent: ((newPrice - basePrice) / basePrice) * 100,
    timestamp: now
  }
  
  priceCache[symbol] = priceData
  return priceData
}

/**
 * Fetch all forex prices at once
 */
export async function fetchAllForexPrices(): Promise<Record<string, ForexPriceData>> {
  const results: Record<string, ForexPriceData> = {}
  
  // Fetch in parallel
  const promises = FOREX_PAIRS.map(async (pair) => {
    results[pair.id] = await fetchForexPrice(pair.id)
  })
  
  await Promise.all(promises)
  return results
}

/**
 * Get current price (sync, uses cache)
 */
export function getCurrentPrice(symbol: string): number {
  if (priceCache[symbol]) {
    return priceCache[symbol].price
  }
  return BASE_PRICES[symbol] || 1.0
}

/**
 * Clear price cache
 */
export function clearPriceCache(): void {
  Object.keys(priceCache).forEach(key => delete priceCache[key])
}
