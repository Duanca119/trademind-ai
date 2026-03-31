import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Twelve Data API Key from environment variable
const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || '';

// Cache for real prices (5 minutes for day trading)
let realPricesCache: { 
  prices: Record<string, { price: number; change: number; changePercent: number; high: number; low: number; open: number }>; 
  timestamp: number;
} | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Major forex pairs to fetch from Twelve Data
const TWELVE_DATA_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 
  'AUD/USD', 'USD/CAD', 'NZD/USD',
  'EUR/GBP', 'EUR/JPY', 'GBP/JPY',
  'EUR/CHF', 'GBP/CHF', 'AUD/JPY',
  'USD/MXN', 'USD/SGD'
];

export async function GET() {
  try {
    const now = Date.now();
    const prices: Record<string, { price: number; change: number; changePercent: number; high: number; low: number; open: number }> = {};
    
    // Check if we need to refresh real prices from Twelve Data
    const needsRefresh = !realPricesCache || (now - realPricesCache.timestamp) >= CACHE_DURATION;
    
    if (needsRefresh && TWELVE_DATA_API_KEY) {
      console.log('[Prices] Fetching REAL prices from Twelve Data...');
      
      // Fetch real prices from Twelve Data
      const realPrices = await fetchTwelveDataPrices();
      
      if (Object.keys(realPrices).length > 0) {
        realPricesCache = { prices: realPrices, timestamp: now };
        console.log('[Prices] Updated real prices from Twelve Data:', Object.keys(realPrices).length, 'pairs');
      }
    }
    
    // Use cached real prices as base
    const basePrices = realPricesCache?.prices || {};
    
    // Generate all pairs with small tick movements
    const allPairs = [
      // Major pairs
      { symbol: 'EUR/USD', base: 'EUR', quote: 'USD' },
      { symbol: 'GBP/USD', base: 'GBP', quote: 'USD' },
      { symbol: 'USD/JPY', base: 'USD', quote: 'JPY' },
      { symbol: 'USD/CHF', base: 'USD', quote: 'CHF' },
      { symbol: 'AUD/USD', base: 'AUD', quote: 'USD' },
      { symbol: 'USD/CAD', base: 'USD', quote: 'CAD' },
      { symbol: 'NZD/USD', base: 'NZD', quote: 'USD' },
      { symbol: 'EUR/GBP', base: 'EUR', quote: 'GBP' },
      // Minor pairs
      { symbol: 'EUR/JPY', base: 'EUR', quote: 'JPY' },
      { symbol: 'GBP/JPY', base: 'GBP', quote: 'JPY' },
      { symbol: 'EUR/AUD', base: 'EUR', quote: 'AUD' },
      { symbol: 'EUR/CAD', base: 'EUR', quote: 'CAD' },
      { symbol: 'EUR/CHF', base: 'EUR', quote: 'CHF' },
      { symbol: 'GBP/CHF', base: 'GBP', quote: 'CHF' },
      { symbol: 'AUD/JPY', base: 'AUD', quote: 'JPY' },
      { symbol: 'CAD/JPY', base: 'CAD', quote: 'JPY' },
      // Exotic pairs
      { symbol: 'USD/MXN', base: 'USD', quote: 'MXN' },
      { symbol: 'USD/ZAR', base: 'USD', quote: 'ZAR' },
      { symbol: 'USD/TRY', base: 'USD', quote: 'TRY' },
      { symbol: 'USD/SGD', base: 'USD', quote: 'SGD' },
    ];

    // Fetch crypto from Binance (free, real-time)
    try {
      const cryptoResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT"]');
      
      if (cryptoResponse.ok) {
        const cryptoData = await cryptoResponse.json();
        cryptoData.forEach((ticker: any) => {
          const symbol = ticker.symbol === 'BTCUSDT' ? 'BTC/USD' : 'ETH/USD';
          prices[symbol] = {
            price: parseFloat(ticker.lastPrice),
            change: parseFloat(ticker.priceChange),
            changePercent: parseFloat(ticker.priceChangePercent),
            high: parseFloat(ticker.highPrice),
            low: parseFloat(ticker.lowPrice),
            open: parseFloat(ticker.openPrice),
          };
        });
      }
    } catch (e) {
      console.error('[Prices] Binance error:', e);
    }

    // Process forex pairs
    allPairs.forEach(pair => {
      const realData = basePrices[pair.symbol];
      
      if (realData) {
        // Use REAL price from Twelve Data with tiny tick
        const tick = (Math.random() - 0.5) * realData.price * 0.00002; // Very small tick
        prices[pair.symbol] = {
          price: realData.price + tick,
          change: realData.change,
          changePercent: realData.changePercent,
          high: realData.high,
          low: realData.low,
          open: realData.open,
        };
      } else {
        // Fallback for pairs not in Twelve Data (use calculated prices)
        const fallbackPrice = getFallbackPrice(pair.symbol);
        const tick = (Math.random() - 0.5) * fallbackPrice * 0.0001;
        prices[pair.symbol] = {
          price: fallbackPrice + tick,
          change: tick,
          changePercent: (tick / fallbackPrice) * 100,
          high: fallbackPrice * 1.002,
          low: fallbackPrice * 0.998,
          open: fallbackPrice,
        };
      }
    });

    const timeSinceUpdate = realPricesCache ? Math.floor((now - realPricesCache.timestamp) / 1000) : 0;

    return NextResponse.json({
      success: true,
      timestamp: now,
      prices,
      source: realPricesCache ? 'twelvedata' : 'fallback',
      lastRealUpdate: realPricesCache?.timestamp || null,
      secondsSinceUpdate: timeSinceUpdate,
      nextUpdateIn: Math.max(0, Math.floor((CACHE_DURATION - (now - (realPricesCache?.timestamp || 0))) / 1000)),
    });
    
  } catch (error) {
    console.error('[Prices] API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch prices',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}

// Fetch real-time prices from Twelve Data
async function fetchTwelveDataPrices(): Promise<Record<string, any>> {
  const prices: Record<string, any> = {};
  
  if (!TWELVE_DATA_API_KEY) {
    console.log('[Prices] No Twelve Data API key configured');
    return prices;
  }
  
  // Fetch pairs in batches
  const batchSize = 8;
  
  for (let i = 0; i < TWELVE_DATA_PAIRS.length; i += batchSize) {
    const batch = TWELVE_DATA_PAIRS.slice(i, i + batchSize);
    
    const promises = batch.map(async (pair) => {
      try {
        const response = await fetch(
          `https://api.twelvedata.com/quote?symbol=${pair}&apikey=${TWELVE_DATA_API_KEY}`,
          { next: { revalidate: 0 } }
        );
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.close && !data.status) {
            prices[pair] = {
              price: parseFloat(data.close),
              change: parseFloat(data.change || 0),
              changePercent: parseFloat(data.percent_change || 0),
              high: parseFloat(data.high || data.close),
              low: parseFloat(data.low || data.close),
              open: parseFloat(data.open || data.close),
            };
            console.log(`[Prices] ${pair}: ${data.close}`);
          }
        }
      } catch (e) {
        console.error(`[Prices] Error fetching ${pair}:`, e);
      }
    });
    
    await Promise.all(promises);
    
    if (i + batchSize < TWELVE_DATA_PAIRS.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return prices;
}

// Fallback prices for pairs not in Twelve Data
function getFallbackPrice(symbol: string): number {
  const fallbacks: Record<string, number> = {
    'EUR/AUD': 1.76,
    'EUR/CAD': 1.57,
    'CAD/JPY': 110.50,
    'USD/ZAR': 18.75,
    'USD/TRY': 32.50,
  };
  
  return fallbacks[symbol] || 1.0;
}
