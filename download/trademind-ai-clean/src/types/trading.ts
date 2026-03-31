// Trading Types for TradeMind AI

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: 'forex' | 'crypto';
  category?: string;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume?: number;
  timestamp: number;
}

export interface SupportResistanceLevel {
  price: number;
  type: 'support' | 'resistance';
  strength: 'weak' | 'moderate' | 'strong';
  touches: number;
  distance: number;
}

export interface TradingSignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  reason: string;
}

export interface TradingDecision {
  asset: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entryZone: { min: number; max: number };
  stopLoss: number;
  takeProfit: number[];
  riskRewardRatio: number;
  reasoning: string;
  supportResistance: SupportResistanceLevel[];
  timestamp: number;
}

export interface Alert {
  id: string;
  symbol: string;
  type: 'price' | 'signal' | 'support_resistance';
  condition: string;
  value?: number;
  triggered: boolean;
  createdAt: number;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relatedAssets: string[];
  publishedAt: number;
}

export interface EmotionalControl {
  currentEmotion: 'neutral' | 'fear' | 'greed' | 'hope' | 'regret';
  tradingPaused: boolean;
  recommendations: string[];
  journal: JournalEntry[];
}

export interface JournalEntry {
  id: string;
  date: number;
  emotion: string;
  notes: string;
  trades?: string[];
}

export type TabType = 'dashboard' | 'scanner' | 'analysis' | 'alerts' | 'journal';
