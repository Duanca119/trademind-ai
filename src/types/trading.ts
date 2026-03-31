// Asset types
export interface Asset {
  symbol: string;
  name: string;
  type: 'forex' | 'crypto';
  category: 'major' | 'minor' | 'exotic' | 'crypto';
}

// Timeframe types
export type Timeframe = '1D' | '1H' | '5M';

export interface TimeframeConfig {
  id: Timeframe;
  name: string;
  purpose: string;
  tradingviewInterval: string;
}

// Price data
export interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  volume?: number;
  timestamp: number;
}

// Candle data
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// EMA data
export interface EMAData {
  period: number;
  value: number;
  timestamp: number;
}

// Support and Resistance zones
export interface Zone {
  type: 'support' | 'resistance';
  price: number;
  strength: 'weak' | 'medium' | 'strong';
  touches: number;
}

// Trading signal
export interface TradingSignal {
  direction: 'bullish' | 'bearish' | 'neutral';
  strength: 'strong' | 'medium' | 'weak';
  confidence: number;
  entry?: number;
  stopLoss?: number;
  takeProfit?: number;
  reason: string;
}

// Direction analysis (1D)
export interface DirectionAnalysis {
  direction: 'bullish' | 'bearish' | 'ranging';
  trend: 'uptrend' | 'downtrend' | 'sideways';
  ema50Position: 'above' | 'below' | 'crossing';
  priceAction: string;
  keyLevels: {
    support: number;
    resistance: number;
  };
  confidence: number;
}

// Strategy analysis (1H)
export interface StrategyAnalysis {
  strategy: 'new_york' | 'smart_money' | 'both' | 'none';
  impulse: boolean;
  pullback: boolean;
  patterns: string[];
  emaCross: boolean;
  volume: 'high' | 'medium' | 'low';
  confidence: number;
}

// Entry analysis (5M)
export interface EntryAnalysis {
  confirmed: boolean;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  riskReward: number;
  reasons: string[];
  confidence: number;
}

// Final decision
export interface FinalDecision {
  action: 'BUY' | 'SELL' | 'WAIT';
  direction: 'bullish' | 'bearish' | 'neutral';
  entry?: number;
  stopLoss?: number;
  takeProfit?: number;
  riskReward?: number;
  probability: number;
  timeframes: {
    '1D': DirectionAnalysis;
    '1H': StrategyAnalysis;
    '5M': EntryAnalysis;
  };
  strategy: string;
  notes: string;
}

// Market status
export interface MarketStatus {
  forex: 'open' | 'closed' | 'weekend';
  crypto: 'open';
  newYorkSession: boolean;
  londonSession: boolean;
  asianSession: boolean;
}

// News item
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  timestamp: number;
  impact: 'high' | 'medium' | 'low';
  currency?: string;
}

// Alert
export interface Alert {
  id: string;
  symbol: string;
  type: 'price' | 'signal' | 'zone';
  condition: string;
  triggered: boolean;
  timestamp: number;
}

// Chart configuration
export interface ChartConfig {
  symbol: string;
  timeframe: Timeframe;
  showEMA50: boolean;
  showZones: boolean;
  showSignals: boolean;
}

// Trading strategies
export type StrategyType = 'new_york' | 'smart_money';

export interface Strategy {
  id: StrategyType;
  name: string;
  description: string;
  conditions: string[];
}

// App state
export interface AppState {
  selectedAsset: Asset | null;
  selectedTimeframe: Timeframe;
  selectedStrategy: StrategyType;
  priceData: Map<string, PriceData>;
  signals: TradingSignal[];
  decisions: Map<string, FinalDecision>;
  loading: boolean;
  error: string | null;
}

// Forex pairs for scanner
export const FOREX_PAIRS = [
  // Majors
  { id: 'EURUSD', name: 'EUR/USD', icon: '💶' },
  { id: 'GBPUSD', name: 'GBP/USD', icon: '💷' },
  { id: 'USDJPY', name: 'USD/JPY', icon: '💴' },
  { id: 'USDCHF', name: 'USD/CHF', icon: '🇨🇭' },
  { id: 'AUDUSD', name: 'AUD/USD', icon: '🇦🇺' },
  { id: 'USDCAD', name: 'USD/CAD', icon: '🍁' },
  { id: 'NZDUSD', name: 'NZD/USD', icon: '🇳🇿' },
  
  // Crosses - European
  { id: 'EURGBP', name: 'EUR/GBP', icon: '💶' },
  { id: 'EURJPY', name: 'EUR/JPY', icon: '💶' },
  { id: 'GBPJPY', name: 'GBP/JPY', icon: '💷' },
  
  // Crosses - JPY
  { id: 'AUDJPY', name: 'AUD/JPY', icon: '🇦🇺' },
  { id: 'NZDJPY', name: 'NZD/JPY', icon: '🇳🇿' },
  { id: 'CADJPY', name: 'CAD/JPY', icon: '🍁' },
  { id: 'CHFJPY', name: 'CHF/JPY', icon: '🇨🇭' },
  
  // Crosses - Other
  { id: 'EURAUD', name: 'EUR/AUD', icon: '💶' },
  { id: 'EURNZD', name: 'EUR/NZD', icon: '💶' },
  { id: 'GBPAUD', name: 'GBP/AUD', icon: '💷' },
  { id: 'GBPCAD', name: 'GBP/CAD', icon: '💷' },
  { id: 'AUDCAD', name: 'AUD/CAD', icon: '🇦🇺' },
  { id: 'NZDCAD', name: 'NZD/CAD', icon: '🇳🇿' },
  
  // Commodities
  { id: 'XAUUSD', name: 'XAU/USD', icon: '🥇' },
]

// ASSETS constant for backwards compatibility
export const ASSETS: Asset[] = [
  // Major Pairs
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', type: 'forex', category: 'major' },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', type: 'forex', category: 'major' },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', type: 'forex', category: 'major' },
  { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', type: 'forex', category: 'major' },
  { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', type: 'forex', category: 'major' },
  { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', type: 'forex', category: 'major' },
  { symbol: 'NZD/USD', name: 'New Zealand Dollar / US Dollar', type: 'forex', category: 'major' },
  { symbol: 'EUR/GBP', name: 'Euro / British Pound', type: 'forex', category: 'major' },
  // Minor Pairs
  { symbol: 'EUR/JPY', name: 'Euro / Japanese Yen', type: 'forex', category: 'minor' },
  { symbol: 'GBP/JPY', name: 'British Pound / Japanese Yen', type: 'forex', category: 'minor' },
  { symbol: 'EUR/AUD', name: 'Euro / Australian Dollar', type: 'forex', category: 'minor' },
  { symbol: 'EUR/CAD', name: 'Euro / Canadian Dollar', type: 'forex', category: 'minor' },
  { symbol: 'EUR/CHF', name: 'Euro / Swiss Franc', type: 'forex', category: 'minor' },
  { symbol: 'GBP/CHF', name: 'British Pound / Swiss Franc', type: 'forex', category: 'minor' },
  { symbol: 'AUD/JPY', name: 'Australian Dollar / Japanese Yen', type: 'forex', category: 'minor' },
  { symbol: 'CAD/JPY', name: 'Canadian Dollar / Japanese Yen', type: 'forex', category: 'minor' },
  // Exotic Pairs
  { symbol: 'USD/MXN', name: 'US Dollar / Mexican Peso', type: 'forex', category: 'exotic' },
  { symbol: 'USD/ZAR', name: 'US Dollar / South African Rand', type: 'forex', category: 'exotic' },
  { symbol: 'USD/TRY', name: 'US Dollar / Turkish Lira', type: 'forex', category: 'exotic' },
  { symbol: 'USD/SGD', name: 'US Dollar / Singapore Dollar', type: 'forex', category: 'exotic' },
  // Crypto
  { symbol: 'BTC/USD', name: 'Bitcoin / US Dollar', type: 'crypto', category: 'crypto' },
  { symbol: 'ETH/USD', name: 'Ethereum / US Dollar', type: 'crypto', category: 'crypto' },
]

// Helper functions
export function getTradingViewSymbol(symbol: string): string {
  const [base, quote] = symbol.split('/')
  if (base === 'BTC') return 'BINANCE:BTCUSDT'
  if (base === 'ETH') return 'BINANCE:ETHUSDT'
  return `FX:${base}${quote}`
}

export function getAssetById(id: string): Asset | undefined {
  return ASSETS.find(a => a.symbol === id || a.symbol.replace('/', '') === id)
}

export function formatAssetPrice(price: number, symbol?: string): string {
  if (!price || isNaN(price)) return '0.00'
  if (symbol?.includes('JPY')) return price.toFixed(3)
  if (symbol?.includes('BTC')) return price.toFixed(2)
  if (symbol?.includes('ETH')) return price.toFixed(2)
  return price.toFixed(5)
}

export function isCryptoAsset(symbol: string): boolean {
  return symbol.includes('BTC') || symbol.includes('ETH')
}

// AssetConfig type for backwards compatibility
export type AssetConfig = Asset

// Trend type for scanner
export type Trend = 'bullish' | 'bearish' | 'sideways'

// Scanner status type
export type ScannerStatus = 'ready' | 'preparing' | 'avoid'

// Forex pair analysis for scanner
export interface ForexPairAnalysis {
  pairId: string
  pairName: string
  icon: string
  price: number
  priceChange: number
  priceChangePercent: number
  trend1D: Trend
  trend1H: Trend
  trend15M: Trend
  rsi1D: number
  rsi1H: number
  rsi15M: number
  alignment: boolean
  confirmation: boolean
  volatility: 'low' | 'medium' | 'high'
  status: ScannerStatus
  score: number
  signal: 'BUY' | 'SELL' | 'NONE'
  confidence: number
  lastUpdate: Date
}

// Scanner ranking
export interface ScannerRanking {
  topPicks: ForexPairAnalysis[]
  readyToTrade: ForexPairAnalysis[]
  preparing: ForexPairAnalysis[]
  avoid: ForexPairAnalysis[]
  totalScanned: number
  readyCount: number
  preparingCount: number
  avoidCount: number
  lastScanTime: Date
}

// Trading zones type
export interface TradingZones {
  direction: 'buy' | 'sell' | 'neutral'
  entryZone: {
    high: number
    low: number
    mid: number
  }
  stopLoss: number
  takeProfit1: number
  takeProfit2: number
  riskRewardRatio: number
  message: 'entrada_optima' | 'esperar_retroceso' | 'zona_no_segura' | 'sin_tendencia'
  messageText: string
  support: number
  resistance: number
  atr: number
}
