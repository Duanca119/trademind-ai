// Binance API Service for fetching real-time market data

export interface Candlestick {
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

export interface MarketData {
  symbol: string
  currentPrice: number
  lastClose: number
  currentVolume: number
  high24h: number
  low24h: number
  priceChangePercent: number
  candlesticks: Candlestick[]
}

export type BinanceInterval = '1d' | '1h' | '15m' | '5m' | '1m' | '1w' | '1M'

const BINANCE_API_BASE = 'https://api.binance.com/api/v3'

/**
 * Fetch candlestick data from Binance API
 * @param symbol - Trading pair (e.g., 'BTCUSDT')
 * @param interval - Time interval for each candle
 * @param limit - Number of candlesticks to fetch (max 1000)
 */
export async function fetchKlines(
  symbol: string = 'BTCUSDT',
  interval: BinanceInterval = '1d',
  limit: number = 100
): Promise<Candlestick[]> {
  try {
    const url = `${BINANCE_API_BASE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Transform Binance response to our Candlestick interface
    return data.map((k: (string | number)[]) => ({
      openTime: k[0] as number,
      open: parseFloat(k[1] as string),
      high: parseFloat(k[2] as string),
      low: parseFloat(k[3] as string),
      close: parseFloat(k[4] as string),
      volume: parseFloat(k[5] as string),
      closeTime: k[6] as number,
      quoteAssetVolume: parseFloat(k[7] as string),
      numberOfTrades: k[8] as number,
      takerBuyBaseAssetVolume: parseFloat(k[9] as string),
      takerBuyQuoteAssetVolume: parseFloat(k[10] as string),
      ignore: parseFloat(k[11] as string)
    }))
  } catch (error) {
    console.error('Error fetching klines:', error)
    throw error
  }
}

/**
 * Fetch 24h ticker data for a symbol
 */
export async function fetch24hTicker(symbol: string = 'BTCUSDT') {
  try {
    const url = `${BINANCE_API_BASE}/ticker/24hr?symbol=${symbol}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      symbol: data.symbol,
      currentPrice: parseFloat(data.lastPrice),
      priceChange: parseFloat(data.priceChange),
      priceChangePercent: parseFloat(data.priceChangePercent),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      volume: parseFloat(data.volume),
      quoteVolume: parseFloat(data.quoteVolume),
      openPrice: parseFloat(data.openPrice)
    }
  } catch (error) {
    console.error('Error fetching 24h ticker:', error)
    throw error
  }
}

/**
 * Fetch current price for a symbol
 */
export async function fetchCurrentPrice(symbol: string = 'BTCUSDT'): Promise<number> {
  try {
    const url = `${BINANCE_API_BASE}/ticker/price?symbol=${symbol}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return parseFloat(data.price)
  } catch (error) {
    console.error('Error fetching current price:', error)
    throw error
  }
}

/**
 * Fetch market data for all timeframes
 */
export async function fetchAllTimeframesData(symbol: string = 'BTCUSDT') {
  const intervals: BinanceInterval[] = ['1d', '1h', '15m']
  
  try {
    const [ticker24h, ...klinesData] = await Promise.all([
      fetch24hTicker(symbol),
      fetchKlines(symbol, '1d', 100),
      fetchKlines(symbol, '1h', 100),
      fetchKlines(symbol, '15m', 100)
    ])
    
    return {
      ticker: ticker24h,
      klines: {
        '1D': klinesData[0],
        '1H': klinesData[1],
        '15M': klinesData[2]
      }
    }
  } catch (error) {
    console.error('Error fetching all timeframes data:', error)
    throw error
  }
}

/**
 * Format large numbers for display
 */
export function formatVolume(volume: number): string {
  if (volume >= 1e9) {
    return (volume / 1e9).toFixed(2) + 'B'
  }
  if (volume >= 1e6) {
    return (volume / 1e6).toFixed(2) + 'M'
  }
  if (volume >= 1e3) {
    return (volume / 1e3).toFixed(2) + 'K'
  }
  return volume.toFixed(2)
}

/**
 * Format price with appropriate decimal places
 */
export function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  if (price >= 1) {
    return price.toFixed(4)
  }
  return price.toFixed(6)
}
