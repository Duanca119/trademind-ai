"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  DirectionAnalysis, 
  StrategyAnalysis, 
  EntryAnalysis, 
  FinalDecision,
  Candle 
} from '@/types/trading';
import { calculateEMA, detectZones } from '@/lib/utils';

// Analyze Direction from Daily timeframe (1D)
export function analyzeDirection(candles: Candle[]): DirectionAnalysis {
  if (candles.length < 20) {
    return {
      direction: 'ranging',
      trend: 'sideways',
      ema50Position: 'above',
      priceAction: 'Insufficient data',
      keyLevels: { support: 0, resistance: 0 },
      confidence: 0,
    };
  }

  const closes = candles.map(c => c.close);
  const ema50 = calculateEMA(closes, 50);
  const currentPrice = closes[closes.length - 1];
  const currentEMA = ema50[ema50.length - 1];
  
  // Determine trend
  const recentCloses = closes.slice(-20);
  const higherHighs = recentCloses.filter((c, i) => i > 0 && c > recentCloses[i-1]).length;
  const lowerLows = recentCloses.filter((c, i) => i > 0 && c < recentCloses[i-1]).length;
  
  let trend: 'uptrend' | 'downtrend' | 'sideways';
  let direction: 'bullish' | 'bearish' | 'ranging';
  
  if (higherHighs > lowerLows + 5) {
    trend = 'uptrend';
    direction = 'bullish';
  } else if (lowerLows > higherHighs + 5) {
    trend = 'downtrend';
    direction = 'bearish';
  } else {
    trend = 'sideways';
    direction = 'ranging';
  }
  
  // EMA position
  let ema50Position: 'above' | 'below' | 'crossing';
  const prevEMA = ema50[ema50.length - 2];
  
  if (currentPrice > currentEMA && closes[closes.length - 2] < prevEMA) {
    ema50Position = 'crossing';
  } else if (currentPrice > currentEMA) {
    ema50Position = 'above';
  } else {
    ema50Position = 'below';
  }
  
  // Price action description
  let priceAction = '';
  if (trend === 'uptrend') priceAction = 'Higher highs and higher lows';
  else if (trend === 'downtrend') priceAction = 'Lower highs and lower lows';
  else priceAction = 'Consolidation / Range-bound';
  
  // Key levels
  const zones = detectZones(candles);
  const support = zones.supports.length > 0 ? Math.max(...zones.supports) : Math.min(...candles.slice(-50).map(c => c.low));
  const resistance = zones.resistances.length > 0 ? Math.min(...zones.resistances) : Math.max(...candles.slice(-50).map(c => c.high));
  
  // Confidence calculation
  let confidence = 50;
  if (direction === 'bullish' && ema50Position === 'above') confidence += 20;
  if (direction === 'bearish' && ema50Position === 'below') confidence += 20;
  if (ema50Position === 'crossing') confidence += 10;
  confidence = Math.min(confidence, 95);
  
  return {
    direction,
    trend,
    ema50Position,
    priceAction,
    keyLevels: { support, resistance },
    confidence,
  };
}

// Analyze Strategy from 1H timeframe
export function analyzeStrategy(candles: Candle[], direction: 'bullish' | 'bearish' | 'ranging'): StrategyAnalysis {
  if (candles.length < 30) {
    return {
      strategy: 'none',
      impulse: false,
      pullback: false,
      patterns: [],
      emaCross: false,
      volume: 'medium',
      confidence: 0,
    };
  }

  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume || 0);
  const ema50 = calculateEMA(closes, 50);
  
  // Detect impulse (strong move)
  const recentCandles = candles.slice(-5);
  const avgBody = candles.slice(-20).reduce((sum, c) => sum + Math.abs(c.close - c.open), 0) / 20;
  const lastBody = Math.abs(recentCandles[recentCandles.length - 1].close - recentCandles[recentCandles.length - 1].open);
  const impulse = lastBody > avgBody * 1.5;
  
  // Detect pullback
  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];
  const pullback = direction === 'bullish' 
    ? lastCandle.close < prevCandle.close 
    : direction === 'bearish' 
    ? lastCandle.close > prevCandle.close 
    : false;
  
  // Pattern detection (simplified)
  const patterns: string[] = [];
  
  // Bullish patterns
  if (direction === 'bullish') {
    if (lastCandle.close > lastCandle.open && prevCandle.close < prevCandle.open) {
      if (lastCandle.open < prevCandle.close && lastCandle.close > prevCandle.open) {
        patterns.push('Bullish Engulfing');
      }
    }
    if (lastCandle.low < prevCandle.low && lastCandle.close > prevCandle.close) {
      patterns.push('Higher Low');
    }
  }
  
  // Bearish patterns
  if (direction === 'bearish') {
    if (lastCandle.close < lastCandle.open && prevCandle.close > prevCandle.open) {
      if (lastCandle.open > prevCandle.close && lastCandle.close < prevCandle.open) {
        patterns.push('Bearish Engulfing');
      }
    }
    if (lastCandle.high > prevCandle.high && lastCandle.close < prevCandle.close) {
      patterns.push('Lower High');
    }
  }
  
  // EMA cross detection
  const currentPrice = closes[closes.length - 1];
  const currentEMA = ema50[ema50.length - 1];
  const prevPrice = closes[closes.length - 2];
  const prevEMA = ema50[ema50.length - 2];
  const emaCross = (currentPrice > currentEMA && prevPrice < prevEMA) || (currentPrice < currentEMA && prevPrice > prevEMA);
  
  // Volume analysis
  const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const recentVolume = volumes[volumes.length - 1];
  const volume = recentVolume > avgVolume * 1.5 ? 'high' : recentVolume < avgVolume * 0.5 ? 'low' : 'medium';
  
  // Determine strategy
  let strategy: 'new_york' | 'smart_money' | 'both' | 'none' = 'none';
  
  if (impulse && pullback && patterns.length > 0) {
    strategy = 'new_york';
  } else if (pullback && emaCross) {
    strategy = 'smart_money';
  } else if (impulse || patterns.length > 0) {
    strategy = 'both';
  }
  
  // Confidence
  let confidence = 40;
  if (impulse) confidence += 15;
  if (pullback) confidence += 15;
  if (patterns.length > 0) confidence += 10;
  if (emaCross) confidence += 10;
  confidence = Math.min(confidence, 90);
  
  return {
    strategy,
    impulse,
    pullback,
    patterns,
    emaCross,
    volume,
    confidence,
  };
}

// Analyze Entry from 5M timeframe
export function analyzeEntry(
  candles: Candle[], 
  direction: 'bullish' | 'bearish' | 'ranging',
  strategy: 'new_york' | 'smart_money' | 'both' | 'none'
): EntryAnalysis {
  if (candles.length < 20) {
    return {
      confirmed: false,
      reasons: [],
      confidence: 0,
      riskReward: 0,
    };
  }

  const lastCandle = candles[candles.length - 1];
  const closes = candles.map(c => c.close);
  const ema50 = calculateEMA(closes, 50);
  const currentEMA = ema50[ema50.length - 1];
  const currentPrice = closes[closes.length - 1];
  
  const reasons: string[] = [];
  let confirmed = false;
  
  // Entry confirmations
  if (direction === 'bullish') {
    if (lastCandle.close > lastCandle.open) reasons.push('Vela alcista');
    if (currentPrice > currentEMA) reasons.push('Precio sobre EMA 50');
    if (lastCandle.close > candles[candles.length - 2].high) reasons.push('Ruptura de máximo anterior');
    
    if (reasons.length >= 2) confirmed = true;
  } else if (direction === 'bearish') {
    if (lastCandle.close < lastCandle.open) reasons.push('Vela bajista');
    if (currentPrice < currentEMA) reasons.push('Precio bajo EMA 50');
    if (lastCandle.close < candles[candles.length - 2].low) reasons.push('Ruptura de mínimo anterior');
    
    if (reasons.length >= 2) confirmed = true;
  }
  
  // Calculate entry, SL, TP
  let entry: number | undefined;
  let stopLoss: number | undefined;
  let takeProfit: number | undefined;
  let riskReward = 0;
  
  if (confirmed) {
    const zones = detectZones(candles);
    const atr = calculateATR(candles.slice(-14));
    
    if (direction === 'bullish') {
      entry = currentPrice;
      stopLoss = Math.min(...zones.supports, lastCandle.low) || currentPrice - atr * 2;
      takeProfit = currentPrice + (currentPrice - stopLoss) * 2;
    } else if (direction === 'bearish') {
      entry = currentPrice;
      stopLoss = Math.max(...zones.resistances, lastCandle.high) || currentPrice + atr * 2;
      takeProfit = currentPrice - (stopLoss - currentPrice) * 2;
    }
    
    if (entry && stopLoss && takeProfit) {
      riskReward = Math.abs(takeProfit - entry) / Math.abs(entry - stopLoss);
    }
  }
  
  // Confidence
  let confidence = 30;
  if (confirmed) confidence += 30;
  if (riskReward >= 2) confidence += 20;
  confidence = Math.min(confidence, 95);
  
  return {
    confirmed,
    entryPrice: entry,
    stopLoss,
    takeProfit,
    riskReward,
    reasons,
    confidence,
  };
}

// Calculate ATR (Average True Range)
function calculateATR(candles: Candle[]): number {
  if (candles.length < 14) return 0;
  
  const trueRanges = candles.map((c, i) => {
    if (i === 0) return c.high - c.low;
    const prevClose = candles[i - 1].close;
    return Math.max(
      c.high - c.low,
      Math.abs(c.high - prevClose),
      Math.abs(c.low - prevClose)
    );
  });
  
  return trueRanges.slice(-14).reduce((a, b) => a + b, 0) / 14;
}

// Generate final decision
export function generateFinalDecision(
  direction: DirectionAnalysis,
  strategy: StrategyAnalysis,
  entry: EntryAnalysis
): FinalDecision {
  // Determine action
  let action: 'BUY' | 'SELL' | 'WAIT' = 'WAIT';
  
  if (direction.direction === 'bullish' && entry.confirmed && strategy.confidence >= 50) {
    action = 'BUY';
  } else if (direction.direction === 'bearish' && entry.confirmed && strategy.confidence >= 50) {
    action = 'SELL';
  }
  
  // Calculate overall probability
  const probability = Math.round(
    (direction.confidence * 0.4 + strategy.confidence * 0.35 + entry.confidence * 0.25)
  );
  
  // Strategy description
  let strategyDesc = '';
  if (strategy.strategy === 'new_york') {
    strategyDesc = 'Estrategia Nueva York: Impulso + Retroceso';
  } else if (strategy.strategy === 'smart_money') {
    strategyDesc = 'Estrategia Smart Money: Manipulación';
  } else if (strategy.strategy === 'both') {
    strategyDesc = 'Combinación de estrategias';
  } else {
    strategyDesc = 'Sin señal clara';
  }
  
  // Notes
  const notes: string[] = [];
  if (direction.ema50Position === 'crossing') {
    notes.push('Cruce de EMA 50 detectado');
  }
  if (strategy.patterns.length > 0) {
    notes.push(`Patrones: ${strategy.patterns.join(', ')}`);
  }
  if (entry.riskReward >= 2) {
    notes.push(`R:R favorable: 1:${entry.riskReward.toFixed(1)}`);
  }
  
  return {
    action,
    direction: direction.direction,
    entry: entry.entryPrice,
    stopLoss: entry.stopLoss,
    takeProfit: entry.takeProfit,
    riskReward: entry.riskReward,
    probability,
    timeframes: {
      '1D': direction,
      '1H': strategy,
      '5M': entry,
    },
    strategy: strategyDesc,
    notes: notes.join(' | '),
  };
}

// Main hook
export function useTradingAnalysis(symbol: string | null) {
  const [decision, setDecision] = useState<FinalDecision | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbol) {
      setDecision(null);
      return;
    }

    setLoading(true);

    // In production, this would fetch real candle data
    // For demo, we generate analysis based on symbol
    const generateAnalysis = () => {
      // Simulated candle data for each timeframe
      const dailyCandles = generateSimulatedCandles(symbol, 50);
      const hourlyCandles = generateSimulatedCandles(symbol, 100);
      const fiveMinCandles = generateSimulatedCandles(symbol, 150);

      const direction = analyzeDirection(dailyCandles);
      const strategy = analyzeStrategy(hourlyCandles, direction.direction);
      const entry = analyzeEntry(fiveMinCandles, direction.direction, strategy.strategy);
      const finalDecision = generateFinalDecision(direction, strategy, entry);

      setDecision(finalDecision);
      setLoading(false);
    };

    generateAnalysis();
    
    // Update every minute
    const interval = setInterval(generateAnalysis, 60000);
    return () => clearInterval(interval);
  }, [symbol]);

  return { decision, loading };
}

// Helper to generate simulated candles
function generateSimulatedCandles(symbol: string, count: number): Candle[] {
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

  const basePrice = basePrices[symbol] || 1.0;
  const volatility = symbol.includes('JPY') ? 0.30 : symbol.includes('BTC') ? 1000 : symbol.includes('ETH') ? 50 : 0.003;
  
  const candles: Candle[] = [];
  let currentPrice = basePrice;
  let currentTime = Date.now() - count * 60000;
  
  for (let i = 0; i < count; i++) {
    const trend = Math.random() > 0.48 ? 1 : -1;
    const move = (Math.random() * volatility * trend);
    
    const open = currentPrice;
    const close = currentPrice + move;
    const high = Math.max(open, close) + Math.random() * volatility * 0.3;
    const low = Math.min(open, close) - Math.random() * volatility * 0.3;
    
    candles.push({
      time: currentTime,
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000000,
    });
    
    currentPrice = close;
    currentTime += 60000;
  }
  
  return candles;
}
