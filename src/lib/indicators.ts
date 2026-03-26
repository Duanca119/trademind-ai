// Technical Indicators Calculation Functions

import { Candlestick } from './binance-api'

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = []
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN)
      continue
    }
    
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += data[i - j]
    }
    result.push(sum / period)
  }
  
  return result
}

/**
 * Calculate Exponential Moving Average (EMA)
 * EMA = (Close - previous EMA) * multiplier + previous EMA
 * multiplier = 2 / (period + 1)
 */
export function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = []
  const multiplier = 2 / (period + 1)
  
  // First EMA value is SMA
  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += data[i]
    result.push(NaN)
  }
  result[period - 1] = sum / period
  
  // Calculate EMA for remaining values
  for (let i = period; i < data.length; i++) {
    const ema = (data[i] - result[i - 1]) * multiplier + result[i - 1]
    result.push(ema)
  }
  
  return result
}

/**
 * Calculate RSI (Relative Strength Index)
 * RSI = 100 - (100 / (1 + RS))
 * RS = Average Gain / Average Loss
 */
export function calculateRSI(data: number[], period: number = 14): number[] {
  const result: number[] = []
  const gains: number[] = []
  const losses: number[] = []
  
  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1]
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? Math.abs(change) : 0)
  }
  
  // First RSI value
  result.push(NaN) // First data point has no RSI
  
  for (let i = 0; i < gains.length; i++) {
    if (i < period - 1) {
      result.push(NaN)
      continue
    }
    
    let avgGain: number
    let avgLoss: number
    
    if (i === period - 1) {
      // First calculation: simple average
      avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
      avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period
    } else {
      // Subsequent calculations: exponential average
      const prevAvgGain = (result[i] as number) !== NaN ? 
        ((i > 0 && !isNaN(result[i])) ? 
          ((gains[i] + (period - 1) * calculatePreviousAvgGain(gains, i, period)) / period) : 
          gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period) :
        gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period
      
      avgGain = (gains.slice(Math.max(0, i - period + 1), i + 1).reduce((a, b) => a + b, 0)) / Math.min(period, i + 1)
      avgLoss = (losses.slice(Math.max(0, i - period + 1), i + 1).reduce((a, b) => a + b, 0)) / Math.min(period, i + 1)
    }
    
    if (avgLoss === 0) {
      result.push(100)
    } else {
      const rs = avgGain / avgLoss
      const rsi = 100 - (100 / (1 + rs))
      result.push(rsi)
    }
  }
  
  return result
}

// Helper function for RSI calculation
function calculatePreviousAvgGain(gains: number[], currentIndex: number, period: number): number {
  const start = Math.max(0, currentIndex - period)
  return gains.slice(start, currentIndex).reduce((a, b) => a + b, 0) / period
}

/**
 * Calculate RSI using Wilder's Smoothing (more accurate)
 */
export function calculateRSIWilder(closes: number[], period: number = 14): number[] {
  const result: number[] = []
  
  if (closes.length < period + 1) {
    return closes.map(() => NaN)
  }
  
  // Calculate initial averages
  let avgGain = 0
  let avgLoss = 0
  
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1]
    if (change > 0) {
      avgGain += change
    } else {
      avgLoss += Math.abs(change)
    }
  }
  
  avgGain /= period
  avgLoss /= period
  
  // First RSI value
  for (let i = 0; i < period; i++) {
    result.push(NaN)
  }
  
  // Calculate RSI
  for (let i = period; i < closes.length; i++) {
    if (i === period) {
      // First RSI calculation
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
      result.push(100 - (100 / (1 + rs)))
    } else {
      // Subsequent calculations using Wilder's smoothing
      const change = closes[i] - closes[i - 1]
      const currentGain = change > 0 ? change : 0
      const currentLoss = change < 0 ? Math.abs(change) : 0
      
      avgGain = ((avgGain * (period - 1)) + currentGain) / period
      avgLoss = ((avgLoss * (period - 1)) + currentLoss) / period
      
      if (avgLoss === 0) {
        result.push(100)
      } else {
        const rs = avgGain / avgLoss
        result.push(100 - (100 / (1 + rs)))
      }
    }
  }
  
  return result
}

/**
 * Calculate Average True Range (ATR)
 * TR = max(High - Low, |High - Previous Close|, |Low - Previous Close|)
 * ATR = SMA of TR over period
 */
export function calculateATR(candlesticks: Candlestick[], period: number = 14): number[] {
  const result: number[] = []
  const trueRanges: number[] = []
  
  // Calculate True Range for each candle
  for (let i = 0; i < candlesticks.length; i++) {
    if (i === 0) {
      trueRanges.push(candlesticks[i].high - candlesticks[i].low)
    } else {
      const prevClose = candlesticks[i - 1].close
      const tr = Math.max(
        candlesticks[i].high - candlesticks[i].low,
        Math.abs(candlesticks[i].high - prevClose),
        Math.abs(candlesticks[i].low - prevClose)
      )
      trueRanges.push(tr)
    }
  }
  
  // Calculate ATR using Wilder's smoothing
  let atr = 0
  
  for (let i = 0; i < trueRanges.length; i++) {
    if (i < period - 1) {
      result.push(NaN)
      atr += trueRanges[i]
    } else if (i === period - 1) {
      atr = (atr + trueRanges[i]) / period
      result.push(atr)
    } else {
      // Wilder's smoothing
      atr = ((atr * (period - 1)) + trueRanges[i]) / period
      result.push(atr)
    }
  }
  
  return result
}

/**
 * Calculate all indicators from candlestick data
 */
export function calculateAllIndicators(candlesticks: Candlestick[]) {
  const closes = candlesticks.map(c => c.close)
  const volumes = candlesticks.map(c => c.volume)
  
  // Calculate EMAs
  const ema20 = calculateEMA(closes, 20)
  const ema50 = calculateEMA(closes, 50)
  
  // Calculate RSI
  const rsi = calculateRSIWilder(closes, 14)
  
  // Calculate ATR
  const atr = calculateATR(candlesticks, 14)
  
  // Get latest values
  const lastIndex = closes.length - 1
  
  // Calculate average volume (last 20 periods)
  const volumeAvg = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20
  
  return {
    ema20: ema20[lastIndex],
    ema50: ema50[lastIndex],
    rsi: rsi[lastIndex],
    atr: atr[lastIndex],
    volume: volumes[lastIndex],
    volumeAvg: volumeAvg,
    price: closes[lastIndex],
    // Arrays for potential chart display
    ema20Array: ema20,
    ema50Array: ema50,
    rsiArray: rsi,
    atrArray: atr,
    closes: closes,
    volumes: volumes
  }
}

/**
 * Get the last valid (non-NaN) value from an array
 */
export function getLastValidValue(arr: number[]): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (!isNaN(arr[i])) {
      return arr[i]
    }
  }
  return 0
}
