"use client";

import { useState, useEffect, useCallback } from 'react';
import { PriceData, Candle } from '@/types/trading';
import { ASSETS, getBinanceSymbol } from '@/lib/assets';

// Simulated prices for demo (in production, use real APIs)
const generateSimulatedPrice = (symbol: string): PriceData => {
  const basePrices: Record<string, number> = {
    'EUR/USD': 1.0850,
    'GBP/USD': 1.2650,
    'USD/JPY': 149.50,
    'USD/CHF': 0.8850,
    'AUD/USD': 0.6550,
    'USD/CAD': 1.3650,
    'NZD/USD': 0.6150,
    'EUR/GBP': 0.8575,
    'EUR/JPY': 162.25,
    'GBP/JPY': 189.15,
    'EUR/AUD': 1.6550,
    'EUR/CAD': 1.4825,
    'EUR/CHF': 0.9600,
    'GBP/CHF': 1.1190,
    'AUD/JPY': 97.85,
    'CAD/JPY': 109.50,
    'USD/MXN': 17.15,
    'USD/ZAR': 18.75,
    'USD/TRY': 32.50,
    'USD/SGD': 1.3450,
    'BTC/USD': 67500,
    'ETH/USD': 3450,
  };

  const basePrice = basePrices[symbol] || 1.0000;
  const volatility = symbol.includes('JPY') ? 0.15 : symbol.includes('BTC') ? 500 : symbol.includes('ETH') ? 25 : 0.0015;
  
  const change = (Math.random() - 0.5) * volatility * 2;
  const price = basePrice + change;
  const changePercent = (change / basePrice) * 100;
  
  return {
    symbol,
    price,
    change,
    changePercent,
    high: price + Math.random() * volatility,
    low: price - Math.random() * volatility,
    open: basePrice,
    timestamp: Date.now(),
  };
};

export function useMarketData(symbols: string[] = ASSETS.map(a => a.symbol)) {
  const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      const newPrices = new Map<string, PriceData>();
      
      // In production, fetch from real APIs:
      // - Forex: OpenExchangeRates API, Fixer.io, or similar
      // - Crypto: Binance API (free, no key needed)
      
      for (const symbol of symbols) {
        const priceData = generateSimulatedPrice(symbol);
        newPrices.set(symbol, priceData);
      }
      
      setPrices(newPrices);
      setError(null);
    } catch (err) {
      setError('Error fetching market data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    fetchPrices();
    
    // Update every 30 seconds
    const interval = setInterval(fetchPrices, 30000);
    
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return { prices, loading, error, refetch: fetchPrices };
}

export function useAssetPrice(symbol: string | null) {
  const { prices, loading, error } = useMarketData(symbol ? [symbol] : []);
  
  return {
    price: symbol ? prices.get(symbol) : null,
    loading,
    error,
  };
}

// Generate simulated candles for chart analysis
export function useCandles(symbol: string | null, timeframe: '1D' | '1H' | '5M') {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) {
      setCandles([]);
      setLoading(false);
      return;
    }

    // Generate simulated candle data
    const generateCandles = () => {
      const basePrices: Record<string, number> = {
        'EUR/USD': 1.0850,
        'GBP/USD': 1.2650,
        'USD/JPY': 149.50,
        'USD/CHF': 0.8850,
        'AUD/USD': 0.6550,
        'USD/CAD': 1.3650,
        'NZD/USD': 0.6150,
        'EUR/GBP': 0.8575,
        'EUR/JPY': 162.25,
        'GBP/JPY': 189.15,
        'EUR/AUD': 1.6550,
        'EUR/CAD': 1.4825,
        'EUR/CHF': 0.9600,
        'GBP/CHF': 1.1190,
        'AUD/JPY': 97.85,
        'CAD/JPY': 109.50,
        'USD/MXN': 17.15,
        'USD/ZAR': 18.75,
        'USD/TRY': 32.50,
        'USD/SGD': 1.3450,
        'BTC/USD': 67500,
        'ETH/USD': 3450,
      };

      const basePrice = basePrices[symbol] || 1.0000;
      const volatility = symbol.includes('JPY') ? 0.30 : symbol.includes('BTC') ? 1000 : symbol.includes('ETH') ? 50 : 0.0030;
      
      const count = timeframe === '1D' ? 50 : timeframe === '1H' ? 100 : 150;
      const interval = timeframe === '1D' ? 86400000 : timeframe === '1H' ? 3600000 : 300000;
      
      const generated: Candle[] = [];
      let currentPrice = basePrice;
      let currentTime = Date.now() - (count * interval);
      
      for (let i = 0; i < count; i++) {
        const trend = Math.random() > 0.5 ? 1 : -1;
        const move = (Math.random() * volatility * trend);
        
        const open = currentPrice;
        const close = currentPrice + move;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;
        
        generated.push({
          time: currentTime,
          open,
          high,
          low,
          close,
          volume: Math.random() * 1000000,
        });
        
        currentPrice = close;
        currentTime += interval;
      }
      
      return generated;
    };

    setCandles(generateCandles());
    setLoading(false);
  }, [symbol, timeframe]);

  return { candles, loading };
}
