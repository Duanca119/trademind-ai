import { NextResponse } from 'next/server'

const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || '792522f333c3487a9102e68939c8e1e8'
const BASE_URL = 'https://api.twelvedata.com'

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

interface MarketData {
  symbol: string
  price: number
  change: number
  changePercent: number
  high: number
  low: number
  open: number
}

interface AnalysisResult {
  symbol: string
  trend1D: 'bullish' | 'bearish' | 'sideways'
  trend1H: 'bullish' | 'bearish' | 'sideways'
  ema50_5M: number
  currentPrice: number
  signal: 'BUY' | 'SELL' | 'WAIT'
  confidence: 'Alta' | 'Media' | 'Baja'
  explanation: string
  priceAboveEMA: boolean
  distanceToEMA: number
}

// Fetch time series data
async function fetchTimeSeries(symbol: string, interval: string, outputsize: number = 50): Promise<TimeSeriesData[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVE_DATA_API_KEY}`,
      { next: { revalidate: 30 } }
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

// Detect trend from price data
function detectTrend(data: TimeSeriesData[]): 'bullish' | 'bearish' | 'sideways' {
  if (data.length < 20) return 'sideways'
  
  const closes = data.slice(0, 20).map(d => parseFloat(d.close))
  const highs = data.slice(0, 20).map(d => parseFloat(d.high))
  const lows = data.slice(0, 20).map(d => parseFloat(d.low))
  
  // Count higher highs and higher lows (bullish)
  let higherHighs = 0
  let higherLows = 0
  let lowerHighs = 0
  let lowerLows = 0
  
  for (let i = 1; i < closes.length; i++) {
    if (highs[i] > highs[i - 1]) higherHighs++
    else lowerHighs++
    
    if (lows[i] > lows[i - 1]) higherLows++
    else lowerLows++
  }
  
  const bullishScore = higherHighs + higherLows
  const bearishScore = lowerHighs + lowerLows
  
  // Need clear direction (60%+ in one direction)
  if (bullishScore >= 24) return 'bullish' // 60% of 40 comparisons
  if (bearishScore >= 24) return 'bearish'
  return 'sideways'
}

// Analyze a single pair
async function analyzePair(symbol: string): Promise<AnalysisResult | null> {
  try {
    // Fetch all timeframes in parallel
    const [data1D, data1H, data5M] = await Promise.all([
      fetchTimeSeries(symbol, '1day', 30),
      fetchTimeSeries(symbol, '1h', 50),
      fetchTimeSeries(symbol, '5min', 100)
    ])
    
    if (!data1D.length || !data1H.length || !data5M.length) {
      return null
    }
    
    // Analyze 1D trend
    const trend1D = detectTrend(data1D)
    if (trend1D === 'sideways') {
      return null // Skip pairs with no clear trend
    }
    
    // Analyze 1H trend
    const trend1H = detectTrend(data1H)
    
    // Confirm trend alignment
    if (trend1D !== trend1H) {
      return null // Skip if not confirmed
    }
    
    // Calculate EMA 50 on 5M
    const closes5M = data5M.map(d => parseFloat(d.close)).reverse()
    const ema50 = calculateEMA(closes5M, 50)
    const currentPrice = closes5M[closes5M.length - 1]
    
    // Determine signal
    const priceAboveEMA = currentPrice > ema50
    const distanceToEMA = ((currentPrice - ema50) / ema50) * 100
    
    let signal: 'BUY' | 'SELL' | 'WAIT' = 'WAIT'
    let confidence: 'Alta' | 'Media' | 'Baja' = 'Baja'
    let explanation = ''
    
    if (trend1D === 'bullish' && trend1H === 'bullish') {
      if (priceAboveEMA && distanceToEMA < 0.5) {
        // Price above EMA but close to it (retracement)
        signal = 'BUY'
        confidence = distanceToEMA < 0.2 ? 'Alta' : 'Media'
        explanation = `Tendencia alcista confirmada. Precio sobre EMA 50 (${ema50.toFixed(5)}), retroceso hacia la media presenta oportunidad de compra.`
      } else if (priceAboveEMA) {
        signal = 'BUY'
        confidence = 'Baja'
        explanation = `Tendencia alcista. Precio sobre EMA 50 pero alejado. Esperar retroceso para mejor entrada.`
      }
    } else if (trend1D === 'bearish' && trend1H === 'bearish') {
      if (!priceAboveEMA && Math.abs(distanceToEMA) < 0.5) {
        // Price below EMA but close to it (retracement)
        signal = 'SELL'
        confidence = Math.abs(distanceToEMA) < 0.2 ? 'Alta' : 'Media'
        explanation = `Tendencia bajista confirmada. Precio bajo EMA 50 (${ema50.toFixed(5)}), retroceso hacia la media presenta oportunidad de venta.`
      } else if (!priceAboveEMA) {
        signal = 'SELL'
        confidence = 'Baja'
        explanation = `Tendencia bajista. Precio bajo EMA 50 pero alejado. Esperar retroceso para mejor entrada.`
      }
    }
    
    if (signal === 'WAIT') {
      return null // No valid setup
    }
    
    return {
      symbol,
      trend1D,
      trend1H,
      ema50_5M: ema50,
      currentPrice,
      signal,
      confidence,
      explanation,
      priceAboveEMA,
      distanceToEMA: Math.abs(distanceToEMA)
    }
  } catch (error) {
    console.error(`Error analyzing ${symbol}:`, error)
    return null
  }
}

// Get current price for a symbol
async function getCurrentPrice(symbol: string): Promise<MarketData | null> {
  try {
    const data = await fetchTimeSeries(symbol, '1min', 2)
    if (!data.length) return null
    
    const current = data[0]
    const previous = data[1]
    
    const currentClose = parseFloat(current.close)
    const previousClose = parseFloat(previous?.close || current.open)
    const change = currentClose - previousClose
    const changePercent = (change / previousClose) * 100
    
    return {
      symbol,
      price: currentClose,
      change,
      changePercent,
      high: parseFloat(current.high),
      low: parseFloat(current.low),
      open: parseFloat(current.open)
    }
  } catch (error) {
    console.error(`Error getting price for ${symbol}:`, error)
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
      const currentTime = utcHour * 60 + utcMinute // Minutes from midnight UTC
      
      const sessions = {
        asia: {
          name: 'Asia (Tokyo)',
          start: 0, // 00:00 UTC
          end: 9 * 60, // 09:00 UTC
          isOpen: currentTime >= 0 && currentTime < 9 * 60
        },
        london: {
          name: 'Londres',
          start: 8 * 60, // 08:00 UTC
          end: 17 * 60, // 17:00 UTC
          isOpen: currentTime >= 8 * 60 && currentTime < 17 * 60
        },
        newYork: {
          name: 'Nueva York',
          start: 13 * 60, // 13:00 UTC
          end: 22 * 60, // 22:00 UTC
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
    
    // Get price for specific symbol
    if (action === 'price' && symbol) {
      const price = await getCurrentPrice(symbol)
      return NextResponse.json(price || { error: 'Could not fetch price' })
    }
    
    // Get prices for all pairs
    if (action === 'prices') {
      const prices = await Promise.all(
        FOREX_PAIRS.slice(0, 10).map(pair => getCurrentPrice(pair)) // Limit to 10 to avoid rate limits
      )
      return NextResponse.json(prices.filter(Boolean))
    }
    
    // Analyze all pairs
    if (action === 'analyze') {
      // Analyze pairs with some delay to avoid rate limits
      const results: AnalysisResult[] = []
      
      for (const pair of FOREX_PAIRS.slice(0, 8)) { // Limit to 8 pairs for demo
        const analysis = await analyzePair(pair)
        if (analysis) {
          results.push(analysis)
        }
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      // Sort by confidence
      const confidenceOrder = { 'Alta': 3, 'Media': 2, 'Baja': 1 }
      results.sort((a, b) => confidenceOrder[b.confidence] - confidenceOrder[a.confidence])
      
      return NextResponse.json({
        bestPair: results[0] || null,
        allResults: results,
        timestamp: new Date().toISOString(),
        disclaimer: 'Este análisis es informativo, no garantiza resultados.'
      })
    }
    
    // Get time series data
    if (action === 'timeseries' && symbol) {
      const interval = searchParams.get('interval') || '1h'
      const outputsize = parseInt(searchParams.get('outputsize') || '50')
      const data = await fetchTimeSeries(symbol, interval, outputsize)
      return NextResponse.json({ symbol, interval, data })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
