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
