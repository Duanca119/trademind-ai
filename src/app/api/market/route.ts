import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || '792522f333c3487a9102e68939c8e1e8'
const BASE_URL = 'https://api.twelvedata.com'

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

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
  distanceToEMA: number
  structure: string // "Higher highs/lows" or "Lower highs/lows"
  strength: 'Alto' | 'Medio' | 'Bajo'
}

interface PairAlignment {
  symbol: string
  trend1D: TrendAnalysis
  trend1H: TrendAnalysis | null
  isAligned: boolean
  isReadyFor5M: boolean
  strength: 'Alto' | 'Medio' | 'Bajo'
  reason: string
  timestamp: string
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
      structure: 'Insuficiente data',
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
    // Strength based on EMA respect
    if (distanceToEMA < 0.5) {
      strength = 'Alto'
    } else if (distanceToEMA < 1.5) {
      strength = 'Medio'
    } else {
      strength = 'Bajo'
    }
  } else if (bearishStructure >= 24 && !priceAboveEMA) {
    direction = 'bearish'
    structure = 'Máximos y mínimos decrecientes'
    if (distanceToEMA < 0.5) {
      strength = 'Alto'
    } else if (distanceToEMA < 1.5) {
      strength = 'Medio'
    } else {
      strength = 'Bajo'
    }
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

// Analyze a single pair for alignment
async function analyzePairAlignment(symbol: string): Promise<PairAlignment> {
  try {
    // Fetch 1D data first
    const data1D = await fetchTimeSeries(symbol, '1day', 100)
    
    if (data1D.length < 50) {
      return {
        symbol,
        trend1D: analyzeTrend([], '1D'),
        trend1H: null,
        isAligned: false,
        isReadyFor5M: false,
        strength: 'Bajo',
        reason: 'Datos insuficientes',
        timestamp: new Date().toISOString()
      }
    }

    const trend1D = analyzeTrend(data1D, '1D')

    // If 1D is sideways, don't analyze 1H
    if (trend1D.direction === 'sideways') {
      return {
        symbol,
        trend1D,
        trend1H: null,
        isAligned: false,
        isReadyFor5M: false,
        strength: 'Bajo',
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
        isReadyFor5M: false,
        strength: 'Bajo',
        reason: 'Datos 1H insuficientes',
        timestamp: new Date().toISOString()
      }
    }

    const trend1H = analyzeTrend(data1H, '1H')

    // Check alignment
    const isAligned = trend1D.direction === trend1H.direction && trend1H.direction !== 'sideways'
    
    // Check if price is respecting EMA 50 (not too far)
    const priceRespectsEMA = trend1H.distanceToEMA < 1.5

    // Determine if ready for 5M analysis
    let isReadyFor5M = false
    let reason = ''
    let strength: 'Alto' | 'Medio' | 'Bajo' = 'Bajo'

    if (!isAligned) {
      reason = `1D es ${trend1D.direction}, 1H es ${trend1H.direction} - No alineados`
      strength = 'Bajo'
    } else if (!priceRespectsEMA) {
      reason = `Precio muy alejado de EMA 50 (${trend1H.distanceToEMA.toFixed(2)}%)`
      strength = 'Bajo'
    } else {
      isReadyFor5M = true
      reason = `${trend1D.direction === 'bullish' ? 'Alcista' : 'Bajista'} en 1D y 1H. EMA respetada.`
      
      // Determine strength
      if (trend1D.strength === 'Alto' && trend1H.strength === 'Alto') {
        strength = 'Alto'
      } else if (trend1D.strength === 'Alto' || trend1H.strength === 'Alto') {
        strength = 'Medio'
      } else {
        strength = 'Medio'
      }
    }

    return {
      symbol,
      trend1D,
      trend1H,
      isAligned,
      isReadyFor5M,
      strength,
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
      isReadyFor5M: false,
      strength: 'Bajo',
      reason: 'Error en análisis',
      timestamp: new Date().toISOString()
    }
  }
}

// Save analysis to Supabase
async function saveAnalysisToSupabase(results: PairAlignment[]) {
  try {
    const records = results
      .filter(r => r.isReadyFor5M)
      .map(r => ({
        symbol: r.symbol,
        trend_1d: r.trend1D.direction,
        trend_1h: r.trend1H?.direction || 'unknown',
        ema50_5m: r.trend1H?.ema50 || 0,
        current_price: r.trend1H?.currentPrice || 0,
        price_above_ema: r.trend1H?.priceAboveEMA || false,
        explanation: r.reason,
        signal: 'WAIT', // We don't give signals, just filter
        confidence: r.strength
      }))

    if (records.length > 0) {
      await supabase.from('market_analysis').insert(records)
    }
  } catch (error) {
    console.error('Error saving to Supabase:', error)
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

    // Analyze all pairs for alignment
    if (action === 'analyze') {
      const results: PairAlignment[] = []
      
      // Analyze pairs sequentially to avoid rate limits
      for (const pair of FOREX_PAIRS.slice(0, 12)) {
        const analysis = await analyzePairAlignment(pair)
        results.push(analysis)
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 150))
      }

      // Sort: ready for 5M first, then by strength
      const strengthOrder = { 'Alto': 3, 'Medio': 2, 'Bajo': 1 }
      results.sort((a, b) => {
        if (a.isReadyFor5M !== b.isReadyFor5M) {
          return a.isReadyFor5M ? -1 : 1
        }
        return strengthOrder[b.strength] - strengthOrder[a.strength]
      })

      // Filter ready pairs
      const readyPairs = results.filter(r => r.isReadyFor5M)

      // Save to Supabase
      await saveAnalysisToSupabase(results)

      return NextResponse.json({
        readyPairs,
        allResults: results,
        totalAnalyzed: results.length,
        totalReady: readyPairs.length,
        timestamp: new Date().toISOString(),
        disclaimer: 'Esta herramienta filtra oportunidades. La entrada debe confirmarse manualmente en 5M.'
      })
    }

    // Analyze single pair
    if (action === 'analyze-pair' && symbol) {
      const analysis = await analyzePairAlignment(symbol)
      return NextResponse.json(analysis)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
