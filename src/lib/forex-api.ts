// Forex API Service for generating simulated market data for multiple pairs
// Since we can't access real forex APIs from the browser, we generate realistic data

import { FOREX_PAIRS, ForexPairAnalysis, ScannerRanking, ScannerStatus, Trend } from '@/types/trading'

// Base prices for forex pairs (approximate real-world values)
const FOREX_BASE_PRICES: Record<string, number> = {
  // Majors
  EURUSD: 1.0850,
  GBPUSD: 1.2650,
  USDJPY: 149.50,
  USDCHF: 0.8850,
  AUDUSD: 0.6550,
  USDCAD: 1.3650,
  NZDUSD: 0.6150,
  
  // Crosses - European
  EURGBP: 0.8580,
  EURJPY: 162.20,
  GBPJPY: 189.15,
  
  // Crosses - JPY pairs
  AUDJPY: 97.85,
  NZDJPY: 91.95,
  CADJPY: 109.45,
  CHFJPY: 168.85,
  
  // Crosses - Other
  EURAUD: 1.6550,
  EURNZD: 1.7650,
  GBPAUD: 1.9350,
  GBPCAD: 1.7250,
  AUDCAD: 0.8945,
  NZDCAD: 0.8410,
  
  // Commodities
  XAUUSD: 2340.00
}

// Volatility factors (percentage of price movement per day)
const FOREX_VOLATILITY: Record<string, number> = {
  // Majors - lower volatility
  EURUSD: 0.005,
  GBPUSD: 0.007,
  USDJPY: 0.006,
  USDCHF: 0.005,
  AUDUSD: 0.008,
  USDCAD: 0.006,
  NZDUSD: 0.008,
  
  // Crosses - higher volatility
  EURGBP: 0.005,
  EURJPY: 0.008,
  GBPJPY: 0.010,  // Most volatile
  
  // JPY crosses
  AUDJPY: 0.009,
  NZDJPY: 0.009,
  CADJPY: 0.008,
  CHFJPY: 0.007,
  
  // Other crosses
  EURAUD: 0.008,
  EURNZD: 0.009,
  GBPAUD: 0.010,
  GBPCAD: 0.009,
  AUDCAD: 0.007,
  NZDCAD: 0.008,
  
  // Commodities
  XAUUSD: 0.015  // Gold is more volatile
}

// Store the last prices to maintain continuity
let lastPrices: Record<string, number> = { ...FOREX_BASE_PRICES }
let lastUpdateTime: Record<string, number> = {}

/**
 * Generate a random price movement
 */
function generatePriceMovement(basePrice: number, volatility: number): number {
  const change = (Math.random() - 0.5) * 2 * volatility * basePrice
  return basePrice + change
}

/**
 * Generate trend with probability
 */
function generateTrend(): Trend {
  const rand = Math.random()
  if (rand < 0.35) return 'bullish'
  if (rand < 0.70) return 'bearish'
  return 'sideways'
}

/**
 * Generate RSI based on trend
 */
function generateRSI(trend: Trend): number {
  switch (trend) {
    case 'bullish':
      return 50 + Math.random() * 30  // 50-80
    case 'bearish':
      return 20 + Math.random() * 30  // 20-50
    default:
      return 40 + Math.random() * 20  // 40-60
  }
}

/**
 * Calculate volatility level
 */
function calculateVolatility(pairId: string): 'low' | 'medium' | 'high' {
  const vol = FOREX_VOLATILITY[pairId] || 0.006
  if (vol > 0.009) return 'high'
  if (vol > 0.006) return 'medium'
  return 'low'
}

/**
 * Calculate scanner status based on analysis
 * SYNCHRONIZED WITH OPERATION TAB - Same 4 conditions
 * 
 * Conditions:
 * 1. Trend 1D and 1H aligned (not sideways)
 * 2. RSI confirmation in direction
 * 3. 15M confirmation
 * 4. Alignment + Confirmation together
 */
function calculateStatus(
  trend1D: Trend,
  trend1H: Trend,
  trend15M: Trend,
  alignment: boolean,
  confirmation: boolean,
  rsi1D: number,
  rsi1H: number,
  rsi15M: number
): { status: ScannerStatus; score: number; signal: 'BUY' | 'SELL' | 'NONE' } {
  let score = 0
  let status: ScannerStatus = 'avoid'
  let signal: 'BUY' | 'SELL' | 'NONE' = 'NONE'
  
  // ============================================
  // EVALUATE 4 CONDITIONS (Same as Operation tab)
  // ============================================
  
  // Condition 1: Trend 1D/1H aligned
  const trendAligned = alignment && trend1D !== 'sideways' && trend1H !== 'sideways'
  
  // Condition 2: RSI confirms direction
  let rsiConfirm = false
  if (trend1H === 'bullish' && rsi1H > 55) rsiConfirm = true
  if (trend1H === 'bearish' && rsi1H < 45) rsiConfirm = true
  
  // Condition 3: 15M confirmation
  const confirm15M = confirmation
  
  // Condition 4: Valid setup (alignment + confirmation)
  const validSetup = trendAligned && confirm15M
  
  // Count passed conditions
  const conditionsPassed = [trendAligned, rsiConfirm, confirm15M, validSetup].filter(Boolean).length
  
  // ============================================
  // DETERMINE SIGNAL
  // ============================================
  
  if (trendAligned && trend1D === 'bullish' && trend1H === 'bullish') {
    signal = 'BUY'
  } else if (trendAligned && trend1D === 'bearish' && trend1H === 'bearish') {
    signal = 'SELL'
  }
  
  // ============================================
  // CALCULATE SCORE
  // ============================================
  
  // Base score from conditions
  if (trendAligned) score += 25
  if (rsiConfirm) score += 20
  if (confirm15M) score += 25
  if (validSetup) score += 20
  
  // Small bonus for non-sideways trends
  if (trend1D !== 'sideways') score += 5
  if (trend1H !== 'sideways') score += 5
  
  // ============================================
  // DETERMINE STATUS (SYNCHRONIZED WITH OPERATION)
  // ============================================
  
  // ONLY "ready" when ALL 4 conditions are met
  if (conditionsPassed === 4 && signal !== 'NONE') {
    status = 'ready'
    score = Math.max(score, 80) // Ensure ready status has high score
  }
  // "preparing" when 3 conditions met (ESPERAR in Operation)
  else if (conditionsPassed === 3) {
    status = 'preparing'
    score = Math.min(score, 75) // Cap score to not appear as ready
  }
  // "preparing" when 2 conditions met
  else if (conditionsPassed === 2) {
    status = 'preparing'
    score = Math.min(score, 60)
  }
  // "avoid" when 0-1 conditions met (NO OPERAR in Operation)
  else {
    status = 'avoid'
    score = Math.min(score, 45)
  }
  
  return { status, score: Math.min(100, Math.round(score)), signal }
}

/**
 * Analyze a single forex pair
 */
export function analyzeForexPair(pairId: string): ForexPairAnalysis {
  const pair = FOREX_PAIRS.find(p => p.id === pairId)
  if (!pair) {
    throw new Error(`Pair ${pairId} not found`)
  }
  
  const now = Date.now()
  const lastUpdate = lastUpdateTime[pairId] || 0
  
  // Update price every 10 seconds
  if (now - lastUpdate > 10000) {
    const volatility = FOREX_VOLATILITY[pairId] || 0.006
    const priceMovement = (Math.random() - 0.5) * 2 * volatility * 0.01 * (lastPrices[pairId] || FOREX_BASE_PRICES[pairId])
    lastPrices[pairId] = (lastPrices[pairId] || FOREX_BASE_PRICES[pairId]) + priceMovement
    lastUpdateTime[pairId] = now
  }
  
  const currentPrice = lastPrices[pairId] || FOREX_BASE_PRICES[pairId]
  const basePrice = FOREX_BASE_PRICES[pairId]
  const priceChange = currentPrice - basePrice
  const priceChangePercent = (priceChange / basePrice) * 100
  
  // Generate trends (with correlation - if 1D is bullish, 1H has higher chance)
  const trend1D = generateTrend()
  
  // 1H has 60% chance to follow 1D
  let trend1H: Trend
  if (Math.random() < 0.6) {
    trend1H = trend1D
  } else if (Math.random() < 0.5) {
    trend1H = trend1D === 'sideways' ? (Math.random() < 0.5 ? 'bullish' : 'bearish') : 'sideways'
  } else {
    trend1H = trend1D === 'bullish' ? 'bearish' : trend1D === 'bearish' ? 'bullish' : 'sideways'
  }
  
  // 15M has 50% chance to follow 1H
  let trend15M: Trend
  if (Math.random() < 0.5) {
    trend15M = trend1H
  } else if (Math.random() < 0.3) {
    trend15M = 'sideways'
  } else {
    trend15M = trend1H === 'bullish' ? 'bearish' : trend1H === 'bearish' ? 'bullish' : (Math.random() < 0.5 ? 'bullish' : 'bearish')
  }
  
  // Generate RSI values
  const rsi1D = generateRSI(trend1D)
  const rsi1H = generateRSI(trend1H)
  const rsi15M = generateRSI(trend15M)
  
  // Check alignment
  const alignment = trend1D === trend1H && trend1D !== 'sideways'
  
  // Check confirmation
  const confirmation = trend15M === trend1H || trend15M === 'sideways'
  
  // Calculate volatility
  const volatility = calculateVolatility(pairId)
  
  // Calculate status and score
  const { status, score, signal } = calculateStatus(
    trend1D, trend1H, trend15M, alignment, confirmation, rsi1D, rsi1H, rsi15M
  )
  
  // Calculate confidence
  const confidence = score >= 70 ? 70 + Math.random() * 25 : score >= 40 ? 50 + Math.random() * 20 : 20 + Math.random() * 20
  
  return {
    pairId,
    pairName: pair.name,
    icon: pair.icon,
    
    price: currentPrice,
    priceChange,
    priceChangePercent,
    
    trend1D,
    trend1H,
    trend15M,
    
    rsi1D,
    rsi1H,
    rsi15M,
    
    alignment,
    confirmation,
    volatility,
    
    status,
    score,
    signal,
    confidence: Math.round(confidence),
    
    lastUpdate: new Date()
  }
}

/**
 * Scan all forex pairs and return ranking
 */
export function scanAllForexPairs(): ScannerRanking {
  const analyses = FOREX_PAIRS.map(pair => analyzeForexPair(pair.id))
  
  // Sort by score descending
  analyses.sort((a, b) => b.score - a.score)
  
  // Categorize
  const readyToTrade = analyses.filter(a => a.status === 'ready')
  const preparing = analyses.filter(a => a.status === 'preparing')
  const avoid = analyses.filter(a => a.status === 'avoid')
  
  // Top 5 picks
  const topPicks = analyses.slice(0, 5)
  
  return {
    topPicks,
    readyToTrade,
    preparing,
    avoid,
    
    totalScanned: analyses.length,
    readyCount: readyToTrade.length,
    preparingCount: preparing.length,
    avoidCount: avoid.length,
    lastScanTime: new Date()
  }
}

/**
 * Format forex price
 */
export function formatForexPrice(price: number, pairId: string): string {
  if (pairId.includes('JPY')) {
    return price.toFixed(3)
  }
  if (pairId === 'XAUUSD') {
    return price.toFixed(2)
  }
  return price.toFixed(5)
}

/**
 * Get status color
 */
export function getStatusColor(status: ScannerStatus): string {
  switch (status) {
    case 'ready': return 'emerald'
    case 'preparing': return 'amber'
    case 'avoid': return 'red'
  }
}

/**
 * Get status icon
 */
export function getStatusIcon(status: ScannerStatus): string {
  switch (status) {
    case 'ready': return '🟢'
    case 'preparing': return '🟡'
    case 'avoid': return '🔴'
  }
}

/**
 * Get status text - SYNCHRONIZED WITH OPERATION TAB
 */
export function getStatusText(status: ScannerStatus): string {
  switch (status) {
    case 'ready': return 'LISTO PARA ENTRAR'
    case 'preparing': return 'ESPERAR'
    case 'avoid': return 'NO OPERAR'
  }
}

/**
 * Check if a symbol is a forex pair
 */
export function isForexSymbol(symbol: string): boolean {
  return FOREX_PAIRS.some(p => p.id === symbol)
}

/**
 * Fetch all timeframes data for a forex symbol (simulated)
 */
export function fetchAllForexTimeframesData(symbol: string) {
  const pair = FOREX_PAIRS.find(p => p.id === symbol)
  const basePrice = FOREX_BASE_PRICES[symbol] || 1.0
  const volatility = FOREX_VOLATILITY[symbol] || 0.006
  
  // Generate simulated candlestick data
  const generateCandlesticks = (count: number, intervalMs: number) => {
    const candlesticks = []
    let currentPrice = basePrice
    const now = Date.now()
    
    for (let i = count - 1; i >= 0; i--) {
      const openTime = now - (i * intervalMs)
      const closeTime = openTime + intervalMs - 1
      
      const open = currentPrice
      const priceChange = (Math.random() - 0.5) * 2 * volatility * currentPrice
      const close = currentPrice + priceChange
      const high = Math.max(open, close) + Math.random() * volatility * currentPrice * 0.3
      const low = Math.min(open, close) - Math.random() * volatility * currentPrice * 0.3
      const volume = Math.random() * 1000000 + 500000
      
      candlesticks.push({
        openTime,
        open,
        high,
        low,
        close,
        volume,
        closeTime,
        quoteAssetVolume: volume * close,
        numberOfTrades: Math.floor(Math.random() * 1000),
        takerBuyBaseAssetVolume: volume * 0.5,
        takerBuyQuoteAssetVolume: volume * close * 0.5,
        ignore: 0
      })
      
      currentPrice = close
    }
    
    return candlesticks
  }
  
  // Get current price from last prices or use base
  const currentPrice = lastPrices[symbol] || basePrice
  
  // Calculate 24h high/low
  const dailyVolatility = volatility * currentPrice
  const high24h = currentPrice + dailyVolatility
  const low24h = currentPrice - dailyVolatility
  
  return {
    ticker: {
      symbol,
      currentPrice,
      priceChange: currentPrice - basePrice,
      priceChangePercent: ((currentPrice - basePrice) / basePrice) * 100,
      high24h,
      low24h,
      volume: Math.random() * 10000000 + 1000000
    },
    klines: {
      '1D': generateCandlesticks(100, 86400000),
      '1H': generateCandlesticks(100, 3600000),
      '15M': generateCandlesticks(100, 900000)
    }
  }
}
