import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format price with appropriate decimals
export function formatPrice(price: number, symbol?: string): string {
  if (!price || isNaN(price)) return "0.00";
  
  // JPY pairs have 2-3 decimals
  if (symbol?.includes("JPY")) {
    return price.toFixed(3);
  }
  
  // Crypto can have more decimals
  if (symbol?.includes("BTC") || symbol?.includes("ETH")) {
    return price.toFixed(2);
  }
  
  // Forex pairs typically have 5 decimals (pip precision)
  return price.toFixed(5);
}

// Format percentage
export function formatPercent(value: number): string {
  if (!value || isNaN(value)) return "0.00%";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

// Format change with color class
export function getChangeClass(value: number): string {
  if (value > 0) return "text-green-500";
  if (value < 0) return "text-red-500";
  return "text-yellow-500";
}

// Calculate pips
export function calculatePips(entry: number, exit: number, symbol?: string): number {
  const diff = exit - entry;
  
  // JPY pairs: 1 pip = 0.01
  if (symbol?.includes("JPY")) {
    return diff / 0.01;
  }
  
  // Standard forex: 1 pip = 0.0001
  return diff / 0.0001;
}

// Calculate risk/reward ratio
export function calculateRiskReward(
  entry: number,
  stopLoss: number,
  takeProfit: number,
  direction: 'bullish' | 'bearish'
): number {
  const risk = Math.abs(entry - stopLoss);
  const reward = Math.abs(takeProfit - entry);
  
  if (risk === 0) return 0;
  return reward / risk;
}

// Get market sessions
export function getMarketSessions(): {
  newYork: boolean;
  london: boolean;
  asian: boolean;
  forex: 'open' | 'closed' | 'weekend';
} {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcDay = now.getUTCDay();
  
  // Weekend check (Saturday = 6, Sunday = 0)
  const isWeekend = utcDay === 0 || utcDay === 6;
  
  // Session times in UTC
  const newYorkOpen = 13; // 9 AM EST = 13 UTC
  const newYorkClose = 22; // 5 PM EST = 22 UTC
  const londonOpen = 8; // 8 AM GMT = 8 UTC
  const londonClose = 17; // 5 PM GMT = 17 UTC
  const asianOpen = 23; // 9 PM JST previous day
  const asianClose = 8; // 5 PM JST = 8 UTC
  
  return {
    newYork: utcHour >= newYorkOpen && utcHour < newYorkClose,
    london: utcHour >= londonOpen && utcHour < londonClose,
    asian: utcHour >= asianOpen || utcHour < asianClose,
    forex: isWeekend ? 'weekend' : 'open',
  };
}

// Generate trading signal based on analysis
export function generateSignal(
  direction: 'bullish' | 'bearish' | 'neutral',
  ema50Position: 'above' | 'below' | 'crossing',
  priceAction: string,
  patterns: string[]
): { strength: 'strong' | 'medium' | 'weak'; confidence: number } {
  let score = 0;
  
  // Direction alignment
  if (direction === 'bullish' && ema50Position === 'above') score += 30;
  else if (direction === 'bearish' && ema50Position === 'below') score += 30;
  else if (direction === 'neutral') score += 10;
  else score -= 10;
  
  // Pattern recognition
  const bullishPatterns = ['bullish engulfing', 'morning star', 'hammer', 'double bottom'];
  const bearishPatterns = ['bearish engulfing', 'evening star', 'shooting star', 'double top'];
  
  patterns.forEach(pattern => {
    const lowerPattern = pattern.toLowerCase();
    if (direction === 'bullish' && bullishPatterns.some(p => lowerPattern.includes(p))) score += 15;
    if (direction === 'bearish' && bearishPatterns.some(p => lowerPattern.includes(p))) score += 15;
  });
  
  // Price action
  if (direction === 'bullish' && priceAction.includes('higher highs')) score += 20;
  if (direction === 'bearish' && priceAction.includes('lower lows')) score += 20;
  
  // EMA crossing bonus
  if (ema50Position === 'crossing') score += 10;
  
  // Normalize confidence
  const confidence = Math.min(Math.max(score, 0), 100);
  
  if (confidence >= 70) return { strength: 'strong', confidence };
  if (confidence >= 40) return { strength: 'medium', confidence };
  return { strength: 'weak', confidence };
}

// Simple EMA calculation
export function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length < period) return [];
  
  const multiplier = 2 / (period + 1);
  const ema: number[] = [];
  
  // Start with SMA for first EMA value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  ema[period - 1] = sum / period;
  
  // Calculate EMA for remaining prices
  for (let i = period; i < prices.length; i++) {
    ema[i] = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
  }
  
  return ema;
}

// Detect support/resistance zones
export function detectZones(candles: { high: number; low: number; close: number }[]): {
  supports: number[];
  resistances: number[];
} {
  if (candles.length < 10) return { supports: [], resistances: [] };
  
  const supports: number[] = [];
  const resistances: number[] = [];
  
  // Find pivot points
  for (let i = 2; i < candles.length - 2; i++) {
    const candle = candles[i];
    
    // Check for support (local low)
    if (
      candle.low < candles[i - 1].low &&
      candle.low < candles[i - 2].low &&
      candle.low < candles[i + 1].low &&
      candle.low < candles[i + 2].low
    ) {
      supports.push(candle.low);
    }
    
    // Check for resistance (local high)
    if (
      candle.high > candles[i - 1].high &&
      candle.high > candles[i - 2].high &&
      candle.high > candles[i + 1].high &&
      candle.high > candles[i + 2].high
    ) {
      resistances.push(candle.high);
    }
  }
  
  // Cluster nearby levels
  const clusterThreshold = 0.0005; // 5 pips
  
  const clusterLevels = (levels: number[]): number[] => {
    if (levels.length === 0) return [];
    
    const sorted = [...levels].sort((a, b) => a - b);
    const clustered: number[] = [];
    let cluster = [sorted[0]];
    
    for (let i = 1; i < sorted.length; i++) {
      if (Math.abs(sorted[i] - cluster[cluster.length - 1]) < clusterThreshold * sorted[i]) {
        cluster.push(sorted[i]);
      } else {
        clustered.push(cluster.reduce((a, b) => a + b, 0) / cluster.length);
        cluster = [sorted[i]];
      }
    }
    clustered.push(cluster.reduce((a, b) => a + b, 0) / cluster.length);
    
    return clustered;
  };
  
  return {
    supports: clusterLevels(supports).slice(-3),
    resistances: clusterLevels(resistances).slice(-3),
  };
}
