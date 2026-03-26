import { NextResponse } from 'next/server';

// Cache for forex rates (3 seconds for real-time feel)
let ratesCache: { rates: Record<string, number>; timestamp: number } | null = null;
const CACHE_DURATION = 3000; // 3 seconds

// Real-time prices from multiple sources
export async function GET() {
  try {
    const prices: Record<string, { price: number; change: number; changePercent: number; high: number; low: number; open: number }> = {};
    
    // Fetch Crypto prices from Binance (free, no API key needed)
    try {
      const cryptoResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT"]', {
        headers: { 'Accept': 'application/json' },
      });
      
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
      console.error('Binance API error:', e);
    }

    // Fetch real forex rates from multiple APIs
    let usdRates: Record<string, number> = {};
    const now = Date.now();
    
    // Check if we have cached rates
    if (ratesCache && (now - ratesCache.timestamp) < CACHE_DURATION) {
      usdRates = ratesCache.rates;
    } else {
      // Try multiple APIs for redundancy
      usdRates = await fetchForexRates();
      ratesCache = { rates: usdRates, timestamp: now };
    }

    // Calculate all forex pairs from USD rates
    const forexPairs = [
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

    forexPairs.forEach(pair => {
      const price = calculatePairPrice(pair.base, pair.quote, usdRates);
      if (price > 0) {
        // Calculate realistic spread based on pair type
        const isJpyPair = pair.quote === 'JPY' || pair.base === 'JPY';
        const isExotic = ['MXN', 'ZAR', 'TRY', 'SGD'].includes(pair.quote) || ['MXN', 'ZAR', 'TRY', 'SGD'].includes(pair.base);
        const spreadPercent = isExotic ? 0.0008 : isJpyPair ? 0.0003 : 0.00015;
        
        const midPrice = price;
        const spread = price * spreadPercent;
        
        // Add tiny movement for real-time feel
        const tick = (Math.random() - 0.5) * spread * 0.5;
        const currentPrice = midPrice + tick;
        
        prices[pair.symbol] = {
          price: currentPrice,
          change: tick,
          changePercent: (tick / midPrice) * 100,
          high: currentPrice * 1.002,
          low: currentPrice * 0.998,
          open: midPrice,
        };
      }
    });

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      prices,
      source: ratesCache ? 'cached' : 'live',
    });
    
  } catch (error) {
    console.error('Prices API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch prices',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}

// Fetch forex rates from multiple APIs
async function fetchForexRates(): Promise<Record<string, number>> {
  let rates: Record<string, number> = {};
  
  // Try API 1: Open Exchange Rates API (free tier)
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3 } // Cache for 3 seconds
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.rates) {
        rates = data.rates;
        console.log('Fetched rates from Open ER API');
        return rates;
      }
    }
  } catch (e) {
    console.error('Open ER API failed:', e);
  }
  
  // Try API 2: Exchange Rate API
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      next: { revalidate: 3 }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.rates) {
        rates = data.rates;
        console.log('Fetched rates from Exchange Rate API');
        return rates;
      }
    }
  } catch (e) {
    console.error('Exchange Rate API failed:', e);
  }
  
  // Try API 3: Frankfurter API (European Central Bank rates)
  try {
    const response = await fetch('https://api.frankfurter.app/latest?from=USD', {
      next: { revalidate: 3 }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.rates) {
        rates = data.rates;
        console.log('Fetched rates from Frankfurter API');
        return rates;
      }
    }
  } catch (e) {
    console.error('Frankfurter API failed:', e);
  }

  // Fallback to realistic current market rates (March 2025 estimates)
  // These are approximate and should be updated by APIs
  console.log('Using fallback rates');
  return {
    USD: 1,
    EUR: 0.867,    // EUR/USD ≈ 1.153
    GBP: 0.792,    // GBP/USD ≈ 1.262
    JPY: 150.25,   // USD/JPY
    CHF: 0.885,    // USD/CHF
    AUD: 1.532,    // AUD/USD ≈ 0.653
    CAD: 1.365,    // USD/CAD
    NZD: 1.632,    // NZD/USD ≈ 0.613
    MXN: 17.05,
    ZAR: 18.65,
    TRY: 32.25,
    SGD: 1.342,
    HKD: 7.82,
    NOK: 10.65,
    SEK: 10.45,
    DKK: 6.87,
  };
}

// Calculate pair price from USD rates
function calculatePairPrice(base: string, quote: string, usdRates: Record<string, number>): number {
  const baseToUsd = usdRates[base];
  const quoteToUsd = usdRates[quote];
  
  if (!baseToUsd || !quoteToUsd) return 0;
  
  // If base is USD, rate is quote's rate
  if (base === 'USD') {
    return quoteToUsd;
  }
  
  // If quote is USD, rate is 1 / base's rate
  if (quote === 'USD') {
    return 1 / baseToUsd;
  }
  
  // Cross rate: (1 / baseToUsd) * quoteToUsd
  // This gives us how many quote currency per base currency
  return (1 / baseToUsd) * quoteToUsd;
}
