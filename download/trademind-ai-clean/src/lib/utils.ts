import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, symbol: string): string {
  // Forex pairs with specific decimal places
  const forexDecimals: Record<string, number> = {
    'EUR/USD': 5,
    'GBP/USD': 5,
    'USD/JPY': 3,
    'USD/CHF': 5,
    'AUD/USD': 5,
    'USD/CAD': 5,
    'NZD/USD': 5,
    'EUR/GBP': 5,
    'EUR/JPY': 3,
    'GBP/JPY': 3,
    'XAU/USD': 2,
    'XAG/USD': 3,
  };

  const decimals = forexDecimals[symbol] ?? (symbol.includes('JPY') ? 3 : symbol.includes('XAU') ? 2 : 5);
  return price.toFixed(decimals);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  });
}

export function getSymbolForTradingView(symbol: string): string {
  // Map our symbols to TradingView format
  const mapping: Record<string, string> = {
    'EUR/USD': 'FX:EURUSD',
    'GBP/USD': 'FX:GBPUSD',
    'USD/JPY': 'FX:USDJPY',
    'USD/CHF': 'FX:USDCHF',
    'AUD/USD': 'FX:AUDUSD',
    'USD/CAD': 'FX:USDCAD',
    'NZD/USD': 'FX:NZDUSD',
    'EUR/GBP': 'FX:EURGBP',
    'EUR/JPY': 'FX:EURJPY',
    'GBP/JPY': 'FX:GBPJPY',
    'XAU/USD': 'TVC:GOLD',
    'XAG/USD': 'TVC:SILVER',
    'BTC/USDT': 'BINANCE:BTCUSDT',
    'ETH/USDT': 'BINANCE:ETHUSDT',
  };

  return mapping[symbol] ?? `FX:${symbol.replace('/', '')}`;
}

export function calculatePips(entry: number, current: number, symbol: string): number {
  const isJpyPair = symbol.includes('JPY');
  const isGold = symbol.includes('XAU');
  const pipMultiplier = isJpyPair || isGold ? 100 : 10000;
  return (current - entry) * pipMultiplier;
}

export function getRiskRewardRatio(entry: number, stopLoss: number, takeProfit: number): number {
  const risk = Math.abs(entry - stopLoss);
  const reward = Math.abs(takeProfit - entry);
  return risk > 0 ? reward / risk : 0;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
