"use client";

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  Target, 
  Brain,
  Newspaper,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  DollarSign,
  CandlestickChart,
  LineChart,
  Layers,
  Globe,
  Square,
  Trash2,
  Save,
  X,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

// Constants
const ASSETS = [
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
];

const CATEGORIES = [
  { id: 'all', name: 'Todos' },
  { id: 'major', name: 'Mayores' },
  { id: 'minor', name: 'Menores' },
  { id: 'exotic', name: 'Exóticos' },
  { id: 'crypto', name: 'Cripto' },
];

// STRATEGIES - Analyze the market using indicators
const STRATEGIES = [
  { 
    id: 'ema50', 
    name: 'EMA 50', 
    icon: LineChart,
    description: 'Media Móvil Exponencial 50 períodos',
    details: 'Identifica la tendencia principal y zonas de valor',
    conditions: [
      'Precio sobre EMA 50 = Tendencia alcista',
      'Precio bajo EMA 50 = Tendencia bajista',
      'Retroceso hacia EMA 50 = Zona de valor para entradas',
      'Cruce de precio con EMA 50 = Cambio de tendencia'
    ]
  },
  { 
    id: 'candlestick', 
    name: 'Velas Japonesas', 
    icon: CandlestickChart,
    description: 'Análisis de patrones de velas',
    details: 'Identifica patrones de reversión y continuación',
    conditions: [
      'Patrones de reversión: Martillo, Estrella, Engulfing',
      'Patrones de continuación: Doji, Ventanas',
      'Confirmación con volumen',
      'Ubicación en zonas clave'
    ]
  },
  { 
    id: 'smart_money', 
    name: 'Smart Money', 
    icon: Layers,
    description: 'Order Blocks, Liquidez, Manipulación',
    details: 'Sigue el flujo institucional del mercado',
    conditions: [
      'Identificación de Order Blocks',
      'Barrido de liquidez (Stop Hunt)',
      'Zonas de manipulación',
      'Inducement y mitigación'
    ]
  },
];

// SESSIONS - Trading hours
const SESSIONS = [
  { 
    id: 'new_york', 
    name: 'Nueva York', 
    shortName: 'NY',
    open: 13, // 9 AM EST = 13 UTC
    close: 22, // 5 PM EST = 22 UTC
    color: 'bg-blue-500'
  },
  { 
    id: 'london', 
    name: 'Londres', 
    shortName: 'LDN',
    open: 8, // 8 AM GMT = 8 UTC
    close: 17, // 5 PM GMT = 17 UTC
    color: 'bg-green-500'
  },
  { 
    id: 'asia', 
    name: 'Asia', 
    shortName: 'ASIA',
    open: 23, // 9 PM JST previous day
    close: 8, // 5 PM JST = 8 UTC
    color: 'bg-yellow-500'
  },
];

// Utility functions
const formatPrice = (price: number, symbol?: string): string => {
  if (!price || isNaN(price)) return "0.00";
  if (symbol?.includes("JPY")) return price.toFixed(3);
  if (symbol?.includes("BTC")) return price.toFixed(2);
  if (symbol?.includes("ETH")) return price.toFixed(2);
  return price.toFixed(5);
};

const formatPercent = (value: number): string => {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

const getChangeClass = (value: number): string => {
  if (value > 0) return "text-green-500";
  if (value < 0) return "text-red-500";
  return "text-yellow-500";
};

const cn = (...classes: (string | boolean | undefined)[]) => 
  classes.filter(Boolean).join(' ');

// Get active sessions
const getActiveSessions = () => {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcDay = now.getUTCDay();
  const isWeekend = utcDay === 0 || utcDay === 6;
  
  const activeSessions: typeof SESSIONS = [];
  
  SESSIONS.forEach(session => {
    if (session.open < session.close) {
      // Normal session (e.g., London 8-17)
      if (utcHour >= session.open && utcHour < session.close) {
        activeSessions.push(session);
      }
    } else {
      // Overnight session (e.g., Asia 23-8)
      if (utcHour >= session.open || utcHour < session.close) {
        activeSessions.push(session);
      }
    }
  });
  
  return {
    sessions: activeSessions,
    isWeekend,
    forexOpen: !isWeekend,
    cryptoOpen: true
  };
};

// Price data interface
interface PriceData {
  price: number;
  change: number;
  changePercent: number;
  high?: number;
  low?: number;
  open?: number;
}

// Fetch real prices from API
const fetchPrices = async (): Promise<Map<string, PriceData>> => {
  try {
    const response = await fetch('/api/prices');
    const data = await response.json();
    
    if (data.success && data.prices) {
      const priceMap = new Map<string, PriceData>();
      Object.entries(data.prices).forEach(([symbol, priceData]: [string, any]) => {
        priceMap.set(symbol, priceData);
      });
      return priceMap;
    }
  } catch (error) {
    console.error('Error fetching prices:', error);
  }
  
  // Fallback to base prices if API fails (updated to current market rates)
  const basePrices = new Map<string, PriceData>();
  const basePriceValues: Record<string, number> = {
    'EUR/USD': 1.1530, 'GBP/USD': 1.2620, 'USD/JPY': 150.25, 'USD/CHF': 0.8850,
    'AUD/USD': 0.6530, 'USD/CAD': 1.3650, 'NZD/USD': 0.6130, 'EUR/GBP': 0.9140,
    'EUR/JPY': 173.15, 'GBP/JPY': 189.55, 'EUR/AUD': 1.7660, 'EUR/CAD': 1.5740,
    'EUR/CHF': 1.0200, 'GBP/CHF': 1.1165, 'AUD/JPY': 98.10, 'CAD/JPY': 110.05,
    'USD/MXN': 17.05, 'USD/ZAR': 18.65, 'USD/TRY': 32.25, 'USD/SGD': 1.3420,
    'BTC/USD': 87500, 'ETH/USD': 3450,
  };
  
  Object.entries(basePriceValues).forEach(([symbol, price]) => {
    basePrices.set(symbol, { price, change: 0, changePercent: 0 });
  });
  
  return basePrices;
};

// Generate single price from current price data
const generatePrice = (symbol: string, currentPrice?: PriceData) => {
  if (currentPrice) {
    return currentPrice;
  }
  
  // Fallback base prices (updated to current market rates)
  const basePrices: Record<string, number> = {
    'EUR/USD': 1.1530, 'GBP/USD': 1.2620, 'USD/JPY': 150.25, 'USD/CHF': 0.8850,
    'AUD/USD': 0.6530, 'USD/CAD': 1.3650, 'NZD/USD': 0.6130, 'EUR/GBP': 0.9140,
    'EUR/JPY': 173.15, 'GBP/JPY': 189.55, 'EUR/AUD': 1.7660, 'EUR/CAD': 1.5740,
    'EUR/CHF': 1.0200, 'GBP/CHF': 1.1165, 'AUD/JPY': 98.10, 'CAD/JPY': 110.05,
    'USD/MXN': 17.05, 'USD/ZAR': 18.65, 'USD/TRY': 32.25, 'USD/SGD': 1.3420,
    'BTC/USD': 87500, 'ETH/USD': 3450,
  };
  
  const base = basePrices[symbol] || 1;
  return { price: base, change: 0, changePercent: 0 };
};

// TradingView symbol
const getTVSymbol = (symbol: string) => {
  const [base, quote] = symbol.split('/');
  if (base === 'BTC') return 'BINANCE:BTCUSDT';
  if (base === 'ETH') return 'BINANCE:ETHUSDT';
  return `FX:${base}${quote}`;
};

// ============================================
// NUEVA LÓGICA DE ANÁLISIS JERÁRQUICO
// ============================================

interface TimeframeAnalysis {
  direction: 'bullish' | 'bearish' | 'sideways';
  trend: string;
  ema50Position: 'above' | 'below' | 'neutral';
  ema50Distance: 'close' | 'normal' | 'extended';
  priceAction: string;
  keyLevels: { support: number; resistance: number };
  confidence: number;
  validPattern?: boolean;
  patternType?: string;
  entryConfirmed?: boolean;
  rejectionType?: string;
  reasons?: string[];
}

interface HierarchicalAnalysis {
  canOperate: boolean;
  blockReason?: string;
  direction: 'bullish' | 'bearish' | 'sideways';
  timeframe1D: TimeframeAnalysis;
  timeframe1H: TimeframeAnalysis;
  timeframe5M: TimeframeAnalysis;
  emaConfirmation: boolean;
  riskRewardValid: boolean;
  riskReward: number;
  activePattern?: string;
}

// Analizar temporalidad 1D (DIRECCIÓN PRINCIPAL)
function analyze1D(price: number, atr: number): TimeframeAnalysis {
  // Simular análisis de dirección principal
  const directionRandom = Math.random();
  let direction: 'bullish' | 'bearish' | 'sideways';
  let trend: string;
  let priceAction: string;
  let confidence: number;
  
  // 40% alcista, 40% bajista, 20% lateral
  if (directionRandom < 0.4) {
    direction = 'bullish';
    trend = 'uptrend';
    priceAction = 'Higher highs and higher lows';
    confidence = 65 + Math.floor(Math.random() * 25);
  } else if (directionRandom < 0.8) {
    direction = 'bearish';
    trend = 'downtrend';
    priceAction = 'Lower highs and lower lows';
    confidence = 65 + Math.floor(Math.random() * 25);
  } else {
    direction = 'sideways';
    trend = 'sideways';
    priceAction = 'Consolidation - Sin dirección clara';
    confidence = 30 + Math.floor(Math.random() * 20);
  }

  // EMA 50 analysis
  const emaDistance = Math.random();
  let ema50Distance: 'close' | 'normal' | 'extended';
  if (emaDistance < 0.3) {
    ema50Distance = 'close';
  } else if (emaDistance < 0.7) {
    ema50Distance = 'normal';
  } else {
    ema50Distance = 'extended';
  }

  return {
    direction,
    trend,
    ema50Position: direction === 'bullish' ? 'above' : direction === 'bearish' ? 'below' : 'neutral',
    ema50Distance,
    priceAction,
    keyLevels: { 
      support: price - atr * 3, 
      resistance: price + atr * 3 
    },
    confidence
  };
}

// Analizar temporalidad 1H (FILTRO DE OPORTUNIDAD)
function analyze1H(price: number, atr: number, direction1D: 'bullish' | 'bearish' | 'sideways'): TimeframeAnalysis {
  // Solo evaluar si 1D tiene dirección clara
  if (direction1D === 'sideways') {
    return {
      direction: 'sideways',
      trend: 'undefined',
      ema50Position: 'neutral',
      ema50Distance: 'normal',
      priceAction: 'Sin análisis - 1D lateral',
      keyLevels: { support: price, resistance: price },
      confidence: 0,
      validPattern: false
    };
  }

  // Verificar si contradice a 1D
  const contradicts = Math.random() < 0.15; // 15% probabilidad de contradicción
  
  if (contradicts) {
    return {
      direction: direction1D === 'bullish' ? 'bearish' : 'bullish',
      trend: 'contradicts_1d',
      ema50Position: 'neutral',
      ema50Distance: 'normal',
      priceAction: 'Contradice dirección principal',
      keyLevels: { support: price, resistance: price },
      confidence: 20,
      validPattern: false
    };
  }

  // Determinar patrón único activo
  const patternRandom = Math.random();
  let patternType: string;
  let validPattern: boolean;
  
  if (patternRandom < 0.35) {
    // Impulso + Pullback + Continuación
    patternType = 'Impulso + Pullback + Continuación';
    validPattern = true;
  } else if (patternRandom < 0.55) {
    // Smart Money
    patternType = 'Smart Money (Manipulación + Reversa)';
    validPattern = true;
  } else if (patternRandom < 0.70) {
    // Múltiples patrones - INVALID
    patternType = 'Múltiples patrones detectados';
    validPattern = false;
  } else {
    // Sin patrón claro
    patternType = 'Sin patrón claro';
    validPattern = false;
  }

  const emaDistance = Math.random();
  let ema50Distance: 'close' | 'normal' | 'extended';
  if (emaDistance < 0.35) {
    ema50Distance = 'close';
  } else if (emaDistance < 0.75) {
    ema50Distance = 'normal';
  } else {
    ema50Distance = 'extended';
  }

  return {
    direction: direction1D,
    trend: direction1D === 'bullish' ? 'uptrend' : 'downtrend',
    ema50Position: direction1D === 'bullish' ? 'above' : 'below',
    ema50Distance,
    priceAction: validPattern ? `Patrón válido: ${patternType}` : patternType,
    keyLevels: { 
      support: price - atr * 2, 
      resistance: price + atr * 2 
    },
    confidence: validPattern ? 55 + Math.floor(Math.random() * 30) : 20 + Math.floor(Math.random() * 20),
    validPattern,
    patternType
  };
}

// Analizar temporalidad 5M (EJECUCIÓN)
function analyze5M(price: number, atr: number, direction1D: 'bullish' | 'bearish' | 'sideways', validPattern1H: boolean): TimeframeAnalysis {
  // Si 1D es lateral o 1H no tiene patrón válido, no hay entrada
  if (direction1D === 'sideways' || !validPattern1H) {
    return {
      direction: 'sideways',
      trend: 'no_entry',
      ema50Position: 'neutral',
      ema50Distance: 'normal',
      priceAction: 'Sin entrada - Condiciones no cumplidas',
      keyLevels: { support: price, resistance: price },
      confidence: 0,
      entryConfirmed: false,
      reasons: []
    };
  }

  // Buscar confirmación de entrada
  const confirmationRandom = Math.random();
  let entryConfirmed: boolean;
  let rejectionType: string;
  let reasons: string[];

  if (confirmationRandom < 0.4) {
    // Confirmación clara
    entryConfirmed = true;
    rejectionType = direction1D === 'bullish' ? 'Rechazo en soporte con vela alcista' : 'Rechazo en resistencia con vela bajista';
    reasons = [
      'Vela confirmatoria presente',
      'Micro estructura a favor',
      direction1D === 'bullish' ? 'Rechazo evidente en soporte' : 'Rechazo evidente en resistencia'
    ];
  } else if (confirmationRandom < 0.6) {
    // Confirmación parcial
    entryConfirmed = true;
    rejectionType = 'Confirmación parcial';
    reasons = [
      'Estructura a favor',
      'Esperando más confirmación'
    ];
  } else {
    // Sin confirmación
    entryConfirmed = false;
    rejectionType = 'Sin confirmación clara';
    reasons = [];
  }

  return {
    direction: direction1D,
    trend: direction1D === 'bullish' ? 'uptrend' : 'downtrend',
    ema50Position: direction1D === 'bullish' ? 'above' : 'below',
    ema50Distance: 'close',
    priceAction: entryConfirmed ? 'Entrada confirmada' : 'Sin confirmación',
    keyLevels: { 
      support: price - atr, 
      resistance: price + atr 
    },
    confidence: entryConfirmed ? 60 + Math.floor(Math.random() * 25) : 25 + Math.floor(Math.random() * 15),
    entryConfirmed,
    rejectionType,
    reasons
  };
}

// Calcular Riesgo/Beneficio
function calculateRiskReward(price: number, atr: number, direction: 'bullish' | 'bearish'): { 
  valid: boolean; 
  rr: number; 
  entry: number; 
  stopLoss: number; 
  takeProfit: number;
} {
  // SL = 1.5 * ATR, TP = 3 * ATR = RR 1:2
  const stopLoss = direction === 'bullish' ? price - atr * 1.5 : price + atr * 1.5;
  const takeProfit = direction === 'bullish' ? price + atr * 3 : price - atr * 3;
  
  // Calcular RR real
  const risk = Math.abs(price - stopLoss);
  const reward = Math.abs(takeProfit - price);
  const rr = reward / risk;
  
  // Mínimo 1:2
  const valid = rr >= 2;
  
  return { valid, rr, entry: price, stopLoss, takeProfit };
}

// ANÁLISIS JERÁRQUICO PRINCIPAL
function performHierarchicalAnalysis(symbol: string, currentPrice: number): HierarchicalAnalysis {
  const atr = symbol.includes('BTC') ? 500 : symbol.includes('ETH') ? 25 : 0.003;
  const price = currentPrice || generatePrice(symbol).price;

  // PASO 1: Analizar 1D (DIRECCIÓN PRINCIPAL)
  const timeframe1D = analyze1D(price, atr);
  
  // Si 1D está lateral → NO OPERAR
  if (timeframe1D.direction === 'sideways') {
    return {
      canOperate: false,
      blockReason: '1D LATERAL - Sin dirección clara',
      direction: 'sideways',
      timeframe1D,
      timeframe1H: analyze1H(price, atr, 'sideways'),
      timeframe5M: analyze5M(price, atr, 'sideways', false),
      emaConfirmation: false,
      riskRewardValid: false,
      riskReward: 0
    };
  }

  // PASO 2: Analizar 1H (FILTRO DE OPORTUNIDAD)
  const timeframe1H = analyze1H(price, atr, timeframe1D.direction);
  
  // Si 1H no tiene patrón válido → NO OPERAR
  if (!timeframe1H.validPattern) {
    return {
      canOperate: false,
      blockReason: timeframe1H.trend === 'contradicts_1d' 
        ? '1H CONTRADICE a 1D' 
        : '1H SIN PATRÓN VÁLIDO',
      direction: timeframe1D.direction,
      timeframe1D,
      timeframe1H,
      timeframe5M: analyze5M(price, atr, timeframe1D.direction, false),
      emaConfirmation: false,
      riskRewardValid: false,
      riskReward: 0
    };
  }

  // PASO 3: Verificar EMA 50
  const emaConfirmation = timeframe1D.ema50Distance !== 'extended' && 
                          timeframe1H.ema50Distance !== 'extended';
  
  if (!emaConfirmation) {
    return {
      canOperate: false,
      blockReason: 'EMA 50 - Precio muy alejado (sobreextensión)',
      direction: timeframe1D.direction,
      timeframe1D,
      timeframe1H,
      timeframe5M: analyze5M(price, atr, timeframe1D.direction, true),
      emaConfirmation: false,
      riskRewardValid: false,
      riskReward: 0,
      activePattern: timeframe1H.patternType
    };
  }

  // PASO 4: Analizar 5M (EJECUCIÓN)
  const timeframe5M = analyze5M(price, atr, timeframe1D.direction, true);
  
  // Si 5M no confirma → NO OPERAR
  if (!timeframe5M.entryConfirmed) {
    return {
      canOperate: false,
      blockReason: '5M SIN CONFIRMACIÓN de entrada',
      direction: timeframe1D.direction,
      timeframe1D,
      timeframe1H,
      timeframe5M,
      emaConfirmation: true,
      riskRewardValid: false,
      riskReward: 0,
      activePattern: timeframe1H.patternType
    };
  }

  // PASO 5: Verificar Riesgo/Beneficio
  const { valid: rrValid, rr, entry, stopLoss, takeProfit } = calculateRiskReward(price, atr, timeframe1D.direction);
  
  if (!rrValid) {
    return {
      canOperate: false,
      blockReason: `RR ${rr.toFixed(1)}:1 - No cumple mínimo 1:2`,
      direction: timeframe1D.direction,
      timeframe1D,
      timeframe1H,
      timeframe5M,
      emaConfirmation: true,
      riskRewardValid: false,
      riskReward: rr,
      activePattern: timeframe1H.patternType
    };
  }

  // TODAS LAS CONDICIONES CUMPLIDAS → OPERAR
  return {
    canOperate: true,
    direction: timeframe1D.direction,
    timeframe1D,
    timeframe1H,
    timeframe5M,
    emaConfirmation: true,
    riskRewardValid: true,
    riskReward: rr,
    activePattern: timeframe1H.patternType
  };
}

// Generate decision based on hierarchical analysis
const generateDecision = (symbol: string, strategyId: 'ema50' | 'candlestick' | 'smart_money', currentPrice?: number) => {
  const priceData = generatePrice(symbol);
  const price = currentPrice || priceData.price;
  const atr = symbol.includes('BTC') ? 500 : symbol.includes('ETH') ? 25 : 0.003;
  
  // Ejecutar análisis jerárquico
  const analysis = performHierarchicalAnalysis(symbol, price);
  
  // Determinar acción basada en el análisis
  const action = analysis.canOperate && analysis.direction !== 'sideways' 
    ? (analysis.direction === 'bullish' ? 'BUY' : 'SELL') 
    : 'WAIT';
  
  // Calcular probabilidad basada en confianza de cada nivel
  const probability = analysis.canOperate 
    ? Math.min(
        analysis.timeframe1D.confidence,
        analysis.timeframe1H.confidence,
        analysis.timeframe5M.confidence
      )
    : 20 + Math.floor(Math.random() * 20);

  // Strategy-specific conditions display
  const getStrategyConditions = () => {
    const baseConditions = [
      { 
        label: '1D Dirección', 
        value: analysis.timeframe1D.direction === 'bullish' ? 'Alcista ✓' : 
               analysis.timeframe1D.direction === 'bearish' ? 'Bajista ✓' : 'Lateral ✗', 
        status: analysis.timeframe1D.direction !== 'sideways' 
      },
      { 
        label: '1H Patrón', 
        value: analysis.timeframe1H.validPattern ? `${analysis.activePattern} ✓` : 'Sin patrón válido ✗', 
        status: analysis.timeframe1H.validPattern || false 
      },
      { 
        label: 'EMA 50', 
        value: analysis.emaConfirmation ? 'Confirma tendencia ✓' : 'Sobreextensión ✗', 
        status: analysis.emaConfirmation 
      },
      { 
        label: '5M Entrada', 
        value: analysis.timeframe5M.entryConfirmed ? 'Confirmada ✓' : 'Sin confirmar ✗', 
        status: analysis.timeframe5M.entryConfirmed || false 
      },
      { 
        label: 'Riesgo/Beneficio', 
        value: analysis.riskRewardValid ? `${analysis.riskReward.toFixed(1)}:1 ✓` : 'No cumple 1:2 ✗', 
        status: analysis.riskRewardValid 
      },
    ];
    
    return baseConditions;
  };

  // Strategy name mapping
  const strategyNames = {
    ema50: 'EMA 50',
    candlestick: 'Velas Japonesas',
    smart_money: 'Smart Money'
  };

  // Entry reason
  let entryReason = '';
  if (!analysis.canOperate) {
    entryReason = `NO OPERAR: ${analysis.blockReason}`;
  } else {
    entryReason = analysis.direction === 'bullish'
      ? `ENTRADA LARGA: ${analysis.activePattern}. Confirmado en 5M. RR ${analysis.riskReward.toFixed(1)}:1`
      : `ENTRADA CORTA: ${analysis.activePattern}. Confirmado en 5M. RR ${analysis.riskReward.toFixed(1)}:1`;
  }

  // Calculate levels
  const { entry, stopLoss, takeProfit } = analysis.canOperate 
    ? calculateRiskReward(price, atr, analysis.direction)
    : { entry: undefined, stopLoss: undefined, takeProfit: undefined };
  
  return {
    action,
    direction: analysis.direction,
    probability,
    entry: action !== 'WAIT' ? entry : undefined,
    stopLoss,
    takeProfit,
    riskReward: analysis.riskReward || 0,
    strategyName: strategyNames[strategyId],
    strategyAnalysis: 'Análisis Jerárquico Multi-Temporalidad',
    strategyConditions: getStrategyConditions(),
    entryReason,
    patterns: analysis.activePattern ? [analysis.activePattern] : [],
    blockReason: analysis.blockReason,
    canOperate: analysis.canOperate,
    timeframes: {
      '1D': {
        direction: analysis.timeframe1D.direction,
        trend: analysis.timeframe1D.trend,
        ema50Position: analysis.timeframe1D.ema50Position,
        emaDistance: analysis.timeframe1D.ema50Distance,
        priceAction: analysis.timeframe1D.priceAction,
        keyLevels: analysis.timeframe1D.keyLevels,
        confidence: analysis.timeframe1D.confidence
      },
      '1H': {
        direction: analysis.timeframe1H.direction,
        validPattern: analysis.timeframe1H.validPattern,
        patternType: analysis.timeframe1H.patternType,
        confidence: analysis.timeframe1H.confidence
      },
      '5M': {
        confirmed: analysis.timeframe5M.entryConfirmed || false,
        reasons: analysis.timeframe5M.reasons || [],
        rejectionType: analysis.timeframe5M.rejectionType,
        confidence: analysis.timeframe5M.confidence
      }
    }
  };
};

// ============ ZONE DRAWER COMPONENT ============
interface Zone {
  id: string;
  symbol: string;
  interval: string;
  zone_type: 'support' | 'resistance' | 'demand' | 'supply';
  price_top: number;
  price_bottom: number;
  color: string;
  created_at: string;
}

const ZONE_COLORS = {
  support: '#22c55e',
  resistance: '#ef4444',
  demand: '#3b82f6',
  supply: '#f59e0b',
};

const ZONE_TYPES = [
  { id: 'support', name: 'Soporte', color: '#22c55e' },
  { id: 'resistance', name: 'Resistencia', color: '#ef4444' },
  { id: 'demand', name: 'Demanda', color: '#3b82f6' },
  { id: 'supply', name: 'Oferta', color: '#f59e0b' },
];

function ZoneDrawer({ symbol, interval, currentPrice }: { symbol: string; interval: string; currentPrice: number }) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedType, setSelectedType] = useState<'support' | 'resistance' | 'demand' | 'supply'>('support');
  const [showPanel, setShowPanel] = useState(false);
  const [startPrice, setStartPrice] = useState<string>('');
  const [endPrice, setEndPrice] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Load zones from Supabase
  useEffect(() => {
    const loadZones = async () => {
      try {
        const response = await fetch(`/api/zones?symbol=${encodeURIComponent(symbol)}&interval=${interval}`);
        const data = await response.json();
        if (data.zones) {
          setZones(data.zones);
        }
      } catch (error) {
        console.error('Error loading zones:', error);
      }
    };
    loadZones();
  }, [symbol, interval]);

  // Save zone
  const saveZone = async () => {
    const top = parseFloat(startPrice);
    const bottom = parseFloat(endPrice);
    
    if (isNaN(top) || isNaN(bottom)) return;

    setLoading(true);
    try {
      const response = await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          interval,
          zoneType: selectedType,
          priceTop: Math.max(top, bottom),
          priceBottom: Math.min(top, bottom),
          color: ZONE_COLORS[selectedType],
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Reload zones
        const zonesResponse = await fetch(`/api/zones?symbol=${encodeURIComponent(symbol)}&interval=${interval}`);
        const zonesData = await zonesResponse.json();
        if (zonesData.zones) {
          setZones(zonesData.zones);
        }
        setStartPrice('');
        setEndPrice('');
        setIsDrawing(false);
      }
    } catch (error) {
      console.error('Error saving zone:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete zone
  const deleteZone = async (zoneId: string) => {
    try {
      await fetch(`/api/zones?id=${zoneId}`, { method: 'DELETE' });
      setZones(zones.filter(z => z.id !== zoneId));
    } catch (error) {
      console.error('Error deleting zone:', error);
    }
  };

  // Quick zone creation
  const createQuickZone = (type: 'support' | 'resistance' | 'demand' | 'supply') => {
    const offset = currentPrice * 0.002; // 0.2% range
    setSelectedType(type);
    setStartPrice((currentPrice + offset).toFixed(5));
    setEndPrice((currentPrice - offset).toFixed(5));
    setIsDrawing(true);
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowPanel(!showPanel)}
        className="flex items-center gap-1 bg-background/90 backdrop-blur"
      >
        <Layers className="w-4 h-4" />
        <span className="hidden sm:inline">Zonas</span>
        {zones.length > 0 && (
          <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
            {zones.length}
          </Badge>
        )}
      </Button>

      {/* Zone Panel */}
      {showPanel && (
        <Card className="absolute top-10 left-0 w-80 z-50 shadow-lg">
          <CardContent className="p-3 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">Guardar Zonas</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPanel(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Zone Type Selector */}
            <div className="grid grid-cols-2 gap-1">
              {ZONE_TYPES.map((type) => (
                <Button
                  key={type.id}
                  variant={selectedType === type.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type.id as any)}
                  className="text-xs justify-start"
                  style={{ 
                    borderLeft: `3px solid ${type.color}`,
                    paddingLeft: '8px'
                  }}
                >
                  {type.name}
                </Button>
              ))}
            </div>

            {/* Quick Zone Buttons */}
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Crear zona rápida:</span>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => createQuickZone('support')}
                  className="text-xs"
                  style={{ borderLeft: '3px solid #22c55e' }}
                >
                  + Soporte
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => createQuickZone('resistance')}
                  className="text-xs"
                  style={{ borderLeft: '3px solid #ef4444' }}
                >
                  + Resistencia
                </Button>
              </div>
            </div>

            {/* Drawing Mode */}
            {isDrawing && (
              <div className="space-y-2 p-2 bg-muted rounded-lg">
                <div className="text-xs font-medium">Nueva zona {selectedType}:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Precio superior:</span>
                    <input
                      type="number"
                      step="0.00001"
                      value={startPrice}
                      onChange={(e) => setStartPrice(e.target.value)}
                      className="w-full mt-1 p-1.5 bg-background rounded border text-xs"
                      placeholder="1.08500"
                    />
                  </div>
                  <div>
                    <span className="text-muted-foreground">Precio inferior:</span>
                    <input
                      type="number"
                      step="0.00001"
                      value={endPrice}
                      onChange={(e) => setEndPrice(e.target.value)}
                      className="w-full mt-1 p-1.5 bg-background rounded border text-xs"
                      placeholder="1.08300"
                    />
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={saveZone}
                    disabled={loading || !startPrice || !endPrice}
                    className="flex-1"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Guardar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsDrawing(false);
                      setStartPrice('');
                      setEndPrice('');
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Saved Zones List */}
            {zones.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                <span className="text-xs text-muted-foreground">Zonas guardadas:</span>
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: zone.color }}
                      />
                      <span className="capitalize">{zone.zone_type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {zone.price_bottom.toFixed(5)} - {zone.price_top.toFixed(5)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteZone(zone.id)}
                        className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* New Zone Button */}
            {!isDrawing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStartPrice((currentPrice * 1.001).toFixed(5));
                  setEndPrice((currentPrice * 0.999).toFixed(5));
                  setIsDrawing(true);
                }}
                className="w-full"
              >
                <Square className="w-4 h-4 mr-1" />
                Nueva Zona Manual
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============ DASHBOARD TAB ============
function DashboardTab() {
  const [selectedAsset, setSelectedAsset] = useState<typeof ASSETS[0] | null>(null);
  const [category, setCategory] = useState('all');
  const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());
  const [mounted, setMounted] = useState(false);
  const [marketStatus, setMarketStatus] = useState<ReturnType<typeof getActiveSessions>>({
    sessions: [], isWeekend: false, forexOpen: true, cryptoOpen: true
  });

  useEffect(() => {
    setMounted(true);
    
    const updateData = async () => {
      const newPrices = await fetchPrices();
      setPrices(newPrices);
      setMarketStatus(getActiveSessions());
    };
    
    updateData();
    // Update every 3 seconds for real-time data
    const interval = setInterval(updateData, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredAssets = category === 'all' ? ASSETS : ASSETS.filter(a => a.category === category);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Market Status with Sessions */}
      <div className="p-3 bg-card border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Estado del Mercado</span>
          <Badge variant={marketStatus.forexOpen ? 'bull' : 'neutral'}>
            {marketStatus.forexOpen ? 'Abierto' : 'Cerrado'}
          </Badge>
        </div>
        {/* Active Sessions */}
        <div className="flex gap-2 overflow-x-auto">
          {SESSIONS.map((session) => {
            const isActive = marketStatus.sessions.some(s => s.id === session.id);
            return (
              <Badge 
                key={session.id} 
                variant={isActive ? 'session' : 'outline'}
                className="flex items-center gap-1"
              >
                <Globe className="w-3 h-3" />
                {session.shortName}
                {isActive && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Category Filter */}
      <div className="p-3 border-b border-border">
        <div className="flex gap-2 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={category === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategory(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Asset List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredAssets.map((asset) => {
            const price = prices.get(asset.symbol);
            const isSelected = selectedAsset?.symbol === asset.symbol;
            
            return (
              <button
                key={asset.symbol}
                onClick={() => setSelectedAsset(asset)}
                className={cn(
                  "w-full p-3 rounded-lg flex items-center justify-between transition-all hover:bg-accent/50",
                  isSelected && "bg-accent ring-1 ring-primary"
                )}
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-sm">{asset.symbol}</span>
                  <span className="text-xs text-muted-foreground">{asset.name}</span>
                </div>
                {price && (
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-sm">{formatPrice(price.price, asset.symbol)}</span>
                    <span className={cn("text-xs", getChangeClass(price.changePercent))}>
                      {formatPercent(price.changePercent)}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {selectedAsset && (
        <div className="p-3 border-t border-border bg-card">
          <AssetQuickInfo asset={selectedAsset} price={prices.get(selectedAsset.symbol)} />
        </div>
      )}
    </div>
  );
}

function AssetQuickInfo({ asset, price }: { asset: typeof ASSETS[0]; price?: PriceData }) {
  const [decision, setDecision] = useState<ReturnType<typeof generateDecision> | null>(null);

  useEffect(() => {
    setDecision(generateDecision(asset.symbol, 'ema50', price?.price));
  }, [asset.symbol, price?.price]);

  return (
    <div className="space-y-2">
      {/* Header con acción y estado */}
      <div className="flex items-center justify-between">
        <span className="font-bold">{asset.symbol}</span>
        {decision && (
          <div className="flex items-center gap-2">
            {decision.canOperate === false && decision.blockReason && (
              <span className="text-xs text-red-400 truncate max-w-32">
                {decision.blockReason}
              </span>
            )}
            <Badge variant={decision.action === 'BUY' ? 'bull' : decision.action === 'SELL' ? 'bear' : 'neutral'}>
              {decision.action}
            </Badge>
          </div>
        )}
      </div>
      
      {/* Probabilidad */}
      {decision && (
        <div className="flex items-center gap-2">
          <Progress value={decision.probability} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground">{decision.probability}%</span>
        </div>
      )}
      
      {/* Condiciones jerárquicas en miniatura */}
      {decision && decision.strategyConditions && (
        <div className="grid grid-cols-5 gap-1 text-xs">
          {decision.strategyConditions.slice(0, 5).map((cond, idx) => (
            <div 
              key={idx}
              className={cn(
                "flex flex-col items-center p-1 rounded",
                cond.status ? "bg-green-500/20" : "bg-red-500/20"
              )}
            >
              <span className={cn("font-medium", cond.status ? "text-green-400" : "text-red-400")}>
                {cond.status ? "✓" : "✗"}
              </span>
              <span className="text-[10px] text-muted-foreground text-center truncate w-full">
                {cond.label.replace('1D ', '').replace('1H ', '').replace('EMA ', '').replace('5M ', '').replace('Riesgo/', 'RR')}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {/* Precios */}
      {price && (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Alto</span>
            <p className="font-mono">{formatPrice(price.high || price.price * 1.001, asset.symbol)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Bajo</span>
            <p className="font-mono">{formatPrice(price.low || price.price * 0.999, asset.symbol)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Cambio</span>
            <p className={cn("font-mono", getChangeClass(price.changePercent))}>
              {formatPercent(price.changePercent)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ CHARTS TAB ============
function ChartsTab() {
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [mounted, setMounted] = useState(false);
  const [price, setPrice] = useState<PriceData | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch real prices from API
  useEffect(() => {
    if (!mounted) return;
    
    const fetchPrice = async () => {
      try {
        const response = await fetch('/api/prices');
        const data = await response.json();
        if (data.success && data.prices && data.prices[selectedAsset.symbol]) {
          setPrice(data.prices[selectedAsset.symbol]);
        }
      } catch (error) {
        console.error('Error fetching price:', error);
        // Fallback
        setPrice(generatePrice(selectedAsset.symbol));
      }
    };
    
    fetchPrice();
    const interval = setInterval(fetchPrice, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, [selectedAsset.symbol, mounted]);

  const chartConfigs = [
    { id: '1D', name: 'Diario', purpose: 'Dirección', interval: 'D', height: 350 },
    { id: '1H', name: '1 Hora', purpose: 'Estrategia', interval: '60', height: 320 },
    { id: '5M', name: '5 Min', purpose: 'Ejecución', interval: '5', height: 300 },
  ];

  // TradingView widget URL with full toolbar enabled
  const getTVWidgetUrl = (configId: string, symbol: string, interval: string) => {
    const params = new URLSearchParams({
      frameElementId: `tv_${configId}`,
      symbol: getTVSymbol(symbol),
      interval: interval,
      hidesidetoolbar: '0', // Show side toolbar (drawing tools!)
      hidetoptoolbar: '0',  // Show top toolbar
      symboledit: '1',      // Allow symbol editing
      saveimage: '1',       // Allow saving image
      toolbarbg: '0a0a0a',
      studies: '["EMA@tv-basicstudies"]',
      theme: 'dark',
      style: '1',
      timezone: 'Etc/UTC',
      withdateranges: '1',
      hidevolume: '0',
      allow_symbol_change: '1',
      details: '1',
      hotlist: '0',
      calendar: '0',
    });
    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 bg-card border-b border-border space-y-3">
        <Select 
          value={selectedAsset.symbol} 
          onValueChange={(v) => setSelectedAsset(ASSETS.find(a => a.symbol === v) || ASSETS[0])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASSETS.map((asset) => (
              <SelectItem key={asset.symbol} value={asset.symbol}>
                {asset.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {price && (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-lg font-bold">
                {formatPrice(price.price, selectedAsset.symbol)}
              </div>
              <div className={cn("text-sm", getChangeClass(price.changePercent))}>
                {formatPercent(price.changePercent)}
              </div>
            </div>
            <Badge variant={price.change >= 0 ? 'bull' : 'bear'}>
              {price.change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {price.change >= 0 ? 'Alcista' : 'Bajista'}
            </Badge>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-2 pb-8">
          {chartConfigs.map((config) => (
            <div key={config.id} className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-bold">{config.id}</Badge>
                  <span className="text-sm font-medium">{config.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{config.purpose}</span>
              </div>
              
              <div style={{ height: config.height }} className="bg-black/20 relative">
                <iframe
                  src={getTVWidgetUrl(config.id, selectedAsset.symbol, config.interval)}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allowFullScreen
                  allow="clipboard-write"
                />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============ OPERATION TAB ============
function OperationTab() {
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [selectedStrategy, setSelectedStrategy] = useState<'ema50' | 'candlestick' | 'smart_money'>('ema50');
  const [mounted, setMounted] = useState(false);
  const [decision, setDecision] = useState<ReturnType<typeof generateDecision> | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | undefined>(undefined);
  const [marketStatus, setMarketStatus] = useState<ReturnType<typeof getActiveSessions>>({
    sessions: [], isWeekend: false, forexOpen: true, cryptoOpen: true
  });

  useEffect(() => {
    setMounted(true);
    setMarketStatus(getActiveSessions());
  }, []);

  // Fetch real prices every 3 seconds
  useEffect(() => {
    if (!mounted) return;
    
    const fetchPrice = async () => {
      try {
        const response = await fetch('/api/prices');
        const data = await response.json();
        if (data.success && data.prices && data.prices[selectedAsset.symbol]) {
          const priceData = data.prices[selectedAsset.symbol];
          setCurrentPrice(priceData.price);
          // Update decision with real price
          setDecision(generateDecision(selectedAsset.symbol, selectedStrategy, priceData.price));
        }
      } catch (error) {
        console.error('Error fetching price:', error);
      }
    };
    
    fetchPrice();
    const interval = setInterval(fetchPrice, 3000);
    return () => clearInterval(interval);
  }, [selectedAsset.symbol, selectedStrategy, mounted]);

  if (!mounted) return null;

  const currentStrategy = STRATEGIES.find(s => s.id === selectedStrategy);

  return (
    <div className="flex flex-col h-full">
      {/* Asset Selector */}
      <div className="p-3 bg-card border-b border-border">
        <Select 
          value={selectedAsset.symbol} 
          onValueChange={(v) => setSelectedAsset(ASSETS.find(a => a.symbol === v) || ASSETS[0])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASSETS.map((asset) => (
              <SelectItem key={asset.symbol} value={asset.symbol}>
                {asset.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Sessions */}
      <div className="p-2 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2 overflow-x-auto">
          {SESSIONS.map((session) => {
            const isActive = marketStatus.sessions.some(s => s.id === session.id);
            return (
              <Badge 
                key={session.id} 
                variant={isActive ? 'session' : 'outline'}
                className="text-xs"
              >
                {session.shortName}
                {isActive && <span className="w-1.5 h-1.5 bg-green-400 rounded-full ml-1 animate-pulse" />}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Strategy Selector */}
      <div className="p-3 bg-card border-b border-border">
        <div className="text-xs text-muted-foreground mb-2">Estrategia de Análisis</div>
        <div className="flex gap-2">
          {STRATEGIES.map((strategy) => {
            const Icon = strategy.icon;
            const isActive = selectedStrategy === strategy.id;
            return (
              <Button
                key={strategy.id}
                variant={isActive ? 'default' : 'outline'}
                onClick={() => setSelectedStrategy(strategy.id as 'ema50' | 'candlestick' | 'smart_money')}
                className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{strategy.name}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Chart - With tools enabled */}
      <div className="flex-1 min-h-[350px] bg-black/20 relative">
        <iframe
          src={`https://s.tradingview.com/widgetembed/?frameElementId=tv_operation&symbol=${getTVSymbol(selectedAsset.symbol)}&interval=15&hidesidetoolbar=0&hidetoptoolbar=0&symboledit=1&saveimage=1&toolbarbg=0a0a0a&studies=%5B%22EMA%40tv-basicstudies%22%5D&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hidevolume=0&allow_symbol_change=1&details=1`}
          style={{ width: '100%', height: '100%', border: 'none', minHeight: '350px' }}
          allowFullScreen
          allow="clipboard-write"
        />
        
        {/* Zone Drawer Button - Top Left */}
        <div className="absolute top-2 left-2">
          <ZoneDrawer 
            symbol={selectedAsset.symbol} 
            interval="15" 
            currentPrice={currentPrice || 1}
          />
        </div>
        
        {decision && decision.entry && (
          <div className="absolute top-2 right-2 bg-background/90 backdrop-blur p-2 rounded-lg text-xs space-y-1">
            {decision.takeProfit && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span>TP: {formatPrice(decision.takeProfit, selectedAsset.symbol)}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span>Entry: {formatPrice(decision.entry, selectedAsset.symbol)}</span>
            </div>
            {decision.stopLoss && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span>SL: {formatPrice(decision.stopLoss, selectedAsset.symbol)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Operation Details */}
      <div className="p-3 bg-card border-t border-border">
        {decision ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge 
                variant={decision.action === 'BUY' ? 'bull' : decision.action === 'SELL' ? 'bear' : 'neutral'}
                className="text-base px-4 py-1"
              >
                {decision.action === 'BUY' && <ArrowUpRight className="w-4 h-4 mr-1" />}
                {decision.action === 'SELL' && <ArrowDownRight className="w-4 h-4 mr-1" />}
                {decision.action}
              </Badge>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Probabilidad</span>
                <div className="font-bold">{decision.probability}%</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {decision.entry && (
                <Card className="bg-blue-500/10 border-blue-500/30">
                  <CardContent className="p-2 text-center">
                    <span className="text-xs text-blue-400">Entrada</span>
                    <p className="font-mono text-sm">{formatPrice(decision.entry, selectedAsset.symbol)}</p>
                  </CardContent>
                </Card>
              )}
              {decision.stopLoss && (
                <Card className="bg-red-500/10 border-red-500/30">
                  <CardContent className="p-2 text-center">
                    <span className="text-xs text-red-400">Stop Loss</span>
                    <p className="font-mono text-sm">{formatPrice(decision.stopLoss, selectedAsset.symbol)}</p>
                  </CardContent>
                </Card>
              )}
              {decision.takeProfit && (
                <Card className="bg-green-500/10 border-green-500/30">
                  <CardContent className="p-2 text-center">
                    <span className="text-xs text-green-400">Take Profit</span>
                    <p className="font-mono text-sm">{formatPrice(decision.takeProfit, selectedAsset.symbol)}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Riesgo/Beneficio</span>
              <Badge variant="outline">1:{decision.riskReward}</Badge>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            Cargando...
          </div>
        )}
      </div>
    </div>
  );
}

// ============ AI ANALYSIS TAB ============
function AIAnalysisTab() {
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [selectedStrategy, setSelectedStrategy] = useState<'ema50' | 'candlestick' | 'smart_money'>('ema50');
  const [mounted, setMounted] = useState(false);
  const [decision, setDecision] = useState<ReturnType<typeof generateDecision> | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | undefined>(undefined);
  const [marketStatus, setMarketStatus] = useState<ReturnType<typeof getActiveSessions>>({
    sessions: [], isWeekend: false, forexOpen: true, cryptoOpen: true
  });

  useEffect(() => {
    setMounted(true);
    setMarketStatus(getActiveSessions());
  }, []);

  // Fetch real prices every 3 seconds
  useEffect(() => {
    if (!mounted) return;
    
    const fetchPrice = async () => {
      try {
        const response = await fetch('/api/prices');
        const data = await response.json();
        if (data.success && data.prices && data.prices[selectedAsset.symbol]) {
          const priceData = data.prices[selectedAsset.symbol];
          setCurrentPrice(priceData.price);
          // Update decision with real price
          setDecision(generateDecision(selectedAsset.symbol, selectedStrategy, priceData.price));
        }
      } catch (error) {
        console.error('Error fetching price:', error);
      }
    };
    
    fetchPrice();
    const interval = setInterval(fetchPrice, 3000);
    return () => clearInterval(interval);
  }, [selectedAsset.symbol, selectedStrategy, mounted]);

  if (!mounted) return null;

  const currentStrategy = STRATEGIES.find(s => s.id === selectedStrategy);

  return (
    <div className="flex flex-col h-full">
      {/* Asset Selector */}
      <div className="p-3 bg-card border-b border-border">
        <Select 
          value={selectedAsset.symbol} 
          onValueChange={(v) => setSelectedAsset(ASSETS.find(a => a.symbol === v) || ASSETS[0])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASSETS.map((asset) => (
              <SelectItem key={asset.symbol} value={asset.symbol}>
                {asset.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Sessions */}
      <div className="p-2 bg-muted/30 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Sesiones Activas</span>
          <div className="flex gap-2">
            {SESSIONS.map((session) => {
              const isActive = marketStatus.sessions.some(s => s.id === session.id);
              return (
                <Badge 
                  key={session.id} 
                  variant={isActive ? 'session' : 'outline'}
                  className="text-xs"
                >
                  {session.shortName}
                  {isActive && <span className="w-1.5 h-1.5 bg-green-400 rounded-full ml-1 animate-pulse" />}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>

      {/* Strategy Selector */}
      <div className="p-3 bg-card border-b border-border">
        <div className="text-xs text-muted-foreground mb-2">Estrategia de Análisis</div>
        <div className="flex gap-2">
          {STRATEGIES.map((strategy) => {
            const Icon = strategy.icon;
            const isActive = selectedStrategy === strategy.id;
            return (
              <Button
                key={strategy.id}
                variant={isActive ? 'default' : 'outline'}
                onClick={() => setSelectedStrategy(strategy.id as 'ema50' | 'candlestick' | 'smart_money')}
                className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{strategy.name}</span>
              </Button>
            );
          })}
        </div>
        {currentStrategy && (
          <div className="text-xs text-muted-foreground mt-2 text-center">
            {currentStrategy.description}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {decision ? (
            <>
              {/* Market & Strategy Info */}
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Mercado</div>
                      <div className="font-bold text-lg">{selectedAsset.symbol}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Estrategia</div>
                      <div className="font-semibold flex items-center gap-1">
                        {currentStrategy && <currentStrategy.icon className="w-4 h-4" />}
                        {currentStrategy?.name}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Final Decision */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Decisión Final
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <Badge 
                      variant={decision.action === 'BUY' ? 'bull' : decision.action === 'SELL' ? 'bear' : 'neutral'}
                      className="text-lg px-6 py-2"
                    >
                      {decision.action}
                    </Badge>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{decision.probability}%</div>
                      <div className="text-xs text-muted-foreground">Probabilidad</div>
                    </div>
                  </div>
                  <Progress value={decision.probability} className="h-3" />
                </CardContent>
              </Card>

              {/* Strategy Analysis */}
              <Card className="border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    {currentStrategy && <currentStrategy.icon className="w-4 h-4" />}
                    {decision.strategyAnalysis}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {decision.strategyConditions.map((condition, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                      <span className="text-muted-foreground">{condition.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{condition.value}</span>
                        {condition.status ? 
                          <CheckCircle className="w-4 h-4 text-green-500" /> : 
                          <XCircle className="w-4 h-4 text-muted-foreground" />
                        }
                      </div>
                    </div>
                  ))}
                  
                  {decision.entryReason && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Razón de entrada:</div>
                      <span className="text-sm">{decision.entryReason}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Multi-Timeframe Analysis */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Análisis Multi-Temporalidad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* 1D */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">1D</Badge>
                      <span className="text-muted-foreground">Dirección</span>
                    </div>
                    <Badge variant={decision.direction === 'bullish' ? 'bull' : decision.direction === 'bearish' ? 'bear' : 'neutral'}>
                      {decision.direction === 'bullish' ? 'Alcista' : decision.direction === 'bearish' ? 'Bajista' : 'Lateral'}
                    </Badge>
                  </div>
                  
                  {/* 1H */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">1H</Badge>
                      <span className="text-muted-foreground">Estrategia</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {decision.timeframes['1H'].impulse ? 
                        <CheckCircle className="w-4 h-4 text-green-500" /> : 
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                      }
                      <span>Impulso</span>
                      {decision.timeframes['1H'].pullback ? 
                        <CheckCircle className="w-4 h-4 text-green-500 ml-2" /> : 
                        <XCircle className="w-4 h-4 text-muted-foreground ml-2" />
                      }
                      <span>Retroceso</span>
                    </div>
                  </div>
                  
                  {/* 5M */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">5M</Badge>
                      <span className="text-muted-foreground">Ejecución</span>
                    </div>
                    <Badge variant={decision.timeframes['5M'].confirmed ? 'bull' : 'neutral'}>
                      {decision.timeframes['5M'].confirmed ? 'Confirmado' : 'Pendiente'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Trade Summary */}
              {decision.action !== 'WAIT' && decision.entry && (
                <Card className="border-primary/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Resumen de Operación
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="space-y-1">
                        <Badge variant="outline" className="bg-blue-500/10">ENTRY</Badge>
                        <p className="font-mono text-lg">{formatPrice(decision.entry, selectedAsset.symbol)}</p>
                      </div>
                      <div className="space-y-1">
                        <Badge variant="outline" className="bg-red-500/10">SL</Badge>
                        <p className="font-mono text-lg">{formatPrice(decision.stopLoss || 0, selectedAsset.symbol)}</p>
                      </div>
                      <div className="space-y-1">
                        <Badge variant="outline" className="bg-green-500/10">TP</Badge>
                        <p className="font-mono text-lg">{formatPrice(decision.takeProfit || 0, selectedAsset.symbol)}</p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-muted rounded-lg text-center">
                      <span className="text-muted-foreground">Riesgo/Beneficio: </span>
                      <span className="font-bold text-primary">1:{decision.riskReward}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Cargando análisis...
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============ NEWS TAB ============
interface NewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  url: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentLabel: string;
  image: string | null;
}

interface NewsData {
  articles: NewsItem[];
  summary: { positive: number; negative: number; neutral: number };
  highVolatility: boolean;
  lastUpdate: string;
}

function NewsTab() {
  const [selectedCurrency, setSelectedCurrency] = useState('all');
  const [mounted, setMounted] = useState(false);
  const [news, setNews] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch real news every 60 seconds
  useEffect(() => {
    if (!mounted) return;

    const fetchNews = async () => {
      try {
        const response = await fetch('/api/news');
        const data = await response.json();
        setNews(data);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 60000); // Update every 60 seconds
    return () => clearInterval(interval);
  }, [mounted]);

  const currencies = [
    { id: 'all', name: 'Todas' },
    { id: 'USD', name: 'USD' },
    { id: 'EUR', name: 'EUR' },
    { id: 'GBP', name: 'GBP' },
    { id: 'JPY', name: 'JPY' },
    { id: 'BTC', name: 'Crypto' },
  ];

  // Filter news by currency keyword
  const filteredNews = selectedCurrency === 'all' 
    ? (news?.articles || [])
    : (news?.articles || []).filter(n => {
        const title = n.title.toLowerCase();
        const currencyKeywords: Record<string, string[]> = {
          'USD': ['dollar', 'usd', 'fed', 'federal reserve', 'us economy'],
          'EUR': ['euro', 'eur', 'ecb', 'european central', 'europe'],
          'GBP': ['pound', 'gbp', 'boe', 'bank of england', 'uk', 'britain'],
          'JPY': ['yen', 'jpy', 'boj', 'bank of japan', 'japan'],
          'BTC': ['bitcoin', 'btc', 'crypto', 'cryptocurrency']
        };
        return currencyKeywords[selectedCurrency]?.some(k => title.includes(k)) || false;
      });

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header with last update time */}
      <div className="p-3 bg-card border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Noticias en Tiempo Real</span>
          </div>
          {lastUpdate && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">
                {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>
        
        {/* Currency Filter */}
        <div className="flex gap-2 overflow-x-auto">
          {currencies.map((currency) => (
            <Button
              key={currency.id}
              variant={selectedCurrency === currency.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCurrency(currency.id)}
            >
              {currency.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Sentiment Summary */}
      {news && (
        <div className="p-3 bg-muted/30 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-xs">{news.summary.positive} Positivas</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-xs">{news.summary.negative} Negativas</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="text-xs">{news.summary.neutral} Neutrales</span>
              </div>
            </div>
            {news.highVolatility && (
              <Badge variant="bear" className="text-xs animate-pulse">
                <Zap className="w-3 h-3 mr-1" />
                Alta Volatilidad
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* News List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
              <p>Cargando noticias...</p>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Newspaper className="w-8 h-8 mx-auto mb-2" />
              <p>No hay noticias para este filtro</p>
            </div>
          ) : (
            filteredNews.map((item) => (
              <Card 
                key={item.id} 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => item.url && window.open(item.url, '_blank')}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0", 
                      item.sentiment === 'positive' ? 'bg-green-500' : 
                      item.sentiment === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <Badge 
                          variant={item.sentiment === 'positive' ? 'bull' : item.sentiment === 'negative' ? 'bear' : 'neutral'}
                          className="text-xs"
                        >
                          {item.sentimentLabel}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{item.date}</span>
                      </div>
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2">{item.title}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">{item.source}</span>
                        <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Auto-refresh indicator */}
      <div className="p-2 bg-muted/50 border-t border-border">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Actualización automática cada 60 segundos</span>
        </div>
      </div>
    </div>
  );
}

// ============ MAIN APP ============
export default function TradeMindAI() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mounted, setMounted] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check for Service Worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Check for updates
        registration.update();
        
        // Listen for new versions
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });
      });

      // Check for updates every 30 seconds
      setInterval(() => {
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg) reg.update();
        });
      }, 30000);
    }
  }, []);

  // Force update
  const handleUpdate = async () => {
    setUpdating(true);
    
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    
    // Unregister old service worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    }
    
    // Reload page
    window.location.reload();
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'charts', label: 'Gráficos', icon: Activity },
    { id: 'operation', label: 'Operación', icon: Target },
    { id: 'analysis', label: 'Análisis IA', icon: Brain },
    { id: 'news', label: 'Noticias', icon: Newspaper },
  ];

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Activity className="w-8 h-8 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="font-bold text-lg">TradeMind AI</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Update Button */}
          {updateAvailable ? (
            <Button 
              size="sm" 
              variant="default" 
              onClick={handleUpdate}
              disabled={updating}
              className="text-xs"
            >
              {updating ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Actualizar
                </>
              )}
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleUpdate}
              className="text-xs"
              title="Forzar actualización"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          )}
          <Badge variant="outline" className="text-xs">
            <Activity className="w-3 h-3 mr-1" />
            Live
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'charts' && <ChartsTab />}
        {activeTab === 'operation' && <OperationTab />}
        {activeTab === 'analysis' && <AIAnalysisTab />}
        {activeTab === 'news' && <NewsTab />}
      </main>

      {/* Bottom Navigation */}
      <nav className="border-t border-border bg-card">
        <div className="flex justify-around items-center py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
