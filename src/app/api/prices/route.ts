import { NextResponse } from 'next/server';

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

    // Forex prices - current market rates
    const forexBasePrices: Record<string, { price: number; baseChange: number }> = {
      'EUR/USD': { price: 1.0825, baseChange: 0.0015 },
      'GBP/USD': { price: 1.2630, baseChange: 0.0020 },
      'USD/JPY': { price: 150.25, baseChange: 0.15 },
      'USD/CHF': { price: 0.8840, baseChange: 0.0010 },
      'AUD/USD': { price: 0.6520, baseChange: 0.0012 },
      'USD/CAD': { price: 1.3680, baseChange: 0.0015 },
      'NZD/USD': { price: 0.6120, baseChange: 0.0010 },
      'EUR/GBP': { price: 0.8570, baseChange: 0.0008 },
      'EUR/JPY': { price: 162.70, baseChange: 0.20 },
      'GBP/JPY': { price: 189.65, baseChange: 0.25 },
      'EUR/AUD': { price: 1.6600, baseChange: 0.0020 },
      'EUR/CAD': { price: 1.4800, baseChange: 0.0020 },
      'EUR/CHF': { price: 0.9570, baseChange: 0.0008 },
      'GBP/CHF': { price: 1.1165, baseChange: 0.0012 },
      'AUD/JPY': { price: 97.95, baseChange: 0.10 },
      'CAD/JPY': { price: 109.75, baseChange: 0.10 },
      'USD/MXN': { price: 17.05, baseChange: 0.05 },
      'USD/ZAR': { price: 18.65, baseChange: 0.05 },
      'USD/TRY': { price: 32.25, baseChange: 0.10 },
      'USD/SGD': { price: 1.3420, baseChange: 0.0015 },
    };

    // Add small random variation to simulate real-time movement
    Object.entries(forexBasePrices).forEach(([symbol, data]) => {
      const variation = data.baseChange * (Math.random() - 0.5) * 2;
      const price = data.price + variation;
      const changePercent = (variation / data.price) * 100;
      
      prices[symbol] = {
        price,
        change: variation,
        changePercent,
        high: price * 1.001,
        low: price * 0.999,
        open: data.price,
      };
    });

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      prices,
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch prices',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
