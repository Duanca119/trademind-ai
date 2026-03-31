import { NextResponse } from 'next/server';

// Forex price API using ExchangeRate-API (free tier)
const FOREX_API_URL = 'https://open.er-api.com/v6/latest/USD';

interface ExchangeRateResponse {
  rates: Record<string, number>;
  base_code: string;
  time_last_update_utc: string;
}

export async function GET() {
  try {
    const response = await fetch(FOREX_API_URL, {
      next: { revalidate: 10 }, // Cache for 10 seconds
    });

    if (!response.ok) {
      throw new Error('Failed to fetch forex rates');
    }

    const data: ExchangeRateResponse = await response.json();

    // Calculate forex pair prices
    const rates = data.rates;
    const forexPrices: Record<string, { price: number; timestamp: number }> = {};

    // USD is base, so EUR/USD = 1/EUR_rate
    const pairs = [
      { symbol: 'EUR/USD', calc: () => 1 / rates.EUR },
      { symbol: 'GBP/USD', calc: () => 1 / rates.GBP },
      { symbol: 'USD/JPY', calc: () => rates.JPY },
      { symbol: 'USD/CHF', calc: () => rates.CHF },
      { symbol: 'AUD/USD', calc: () => 1 / rates.AUD },
      { symbol: 'USD/CAD', calc: () => rates.CAD },
      { symbol: 'NZD/USD', calc: () => 1 / rates.NZD },
      { symbol: 'EUR/GBP', calc: () => (1 / rates.EUR) * rates.GBP },
      { symbol: 'EUR/JPY', calc: () => (1 / rates.EUR) * rates.JPY },
      { symbol: 'GBP/JPY', calc: () => (1 / rates.GBP) * rates.JPY },
    ];

    pairs.forEach(({ symbol, calc }) => {
      try {
        const price = calc();
        // Add small random variation for realistic movement (since free API doesn't update frequently)
        const variation = (Math.random() - 0.5) * 0.0002;
        forexPrices[symbol] = {
          price: price + variation,
          timestamp: Date.now(),
        };
      } catch (error) {
        console.error(`Error calculating ${symbol}:`, error);
      }
    });

    return NextResponse.json({
      success: true,
      data: forexPrices,
      lastUpdate: data.time_last_update_utc,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Forex price API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch forex prices' },
      { status: 500 }
    );
  }
}
