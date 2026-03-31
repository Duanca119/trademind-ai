import { NextResponse } from 'next/server';

// Binance API for crypto prices
const BINANCE_API_URL = 'https://api.binance.com/api/v3/ticker/24hr';

interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
}

export async function GET() {
  try {
    const response = await fetch(BINANCE_API_URL, {
      next: { revalidate: 5 }, // Cache for 5 seconds
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Binance data');
    }

    const data: BinanceTicker[] = await response.json();

    // Filter for USDT pairs we're interested in
    const symbols = ['BTCUSDT', 'ETHUSDT'];
    const cryptoData: Record<string, {
      price: number;
      change: number;
      changePercent: number;
      high: number;
      low: number;
      volume: number;
      timestamp: number;
    }> = {};

    data.forEach((ticker) => {
      if (symbols.includes(ticker.symbol)) {
        const symbol = ticker.symbol.replace('USDT', '/USDT');
        cryptoData[symbol] = {
          price: parseFloat(ticker.lastPrice),
          change: parseFloat(ticker.priceChange),
          changePercent: parseFloat(ticker.priceChangePercent),
          high: parseFloat(ticker.highPrice),
          low: parseFloat(ticker.lowPrice),
          volume: parseFloat(ticker.volume),
          timestamp: Date.now(),
        };
      }
    });

    return NextResponse.json({
      success: true,
      data: cryptoData,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Market data API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
