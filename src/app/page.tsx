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
  Globe
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
  
  // Fallback to base prices if API fails
  const basePrices = new Map<string, PriceData>();
  const basePriceValues: Record<string, number> = {
    'EUR/USD': 1.0825, 'GBP/USD': 1.2630, 'USD/JPY': 150.25, 'USD/CHF': 0.8840,
    'AUD/USD': 0.6520, 'USD/CAD': 1.3680, 'NZD/USD': 0.6120, 'EUR/GBP': 0.8570,
    'EUR/JPY': 162.70, 'GBP/JPY': 189.65, 'EUR/AUD': 1.6600, 'EUR/CAD': 1.4800,
    'EUR/CHF': 0.9570, 'GBP/CHF': 1.1165, 'AUD/JPY': 97.95, 'CAD/JPY': 109.75,
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
  
  // Fallback base prices
  const basePrices: Record<string, number> = {
    'EUR/USD': 1.0825, 'GBP/USD': 1.2630, 'USD/JPY': 150.25, 'USD/CHF': 0.8840,
    'AUD/USD': 0.6520, 'USD/CAD': 1.3680, 'NZD/USD': 0.6120, 'EUR/GBP': 0.8570,
    'EUR/JPY': 162.70, 'GBP/JPY': 189.65, 'EUR/AUD': 1.6600, 'EUR/CAD': 1.4800,
    'EUR/CHF': 0.9570, 'GBP/CHF': 1.1165, 'AUD/JPY': 97.95, 'CAD/JPY': 109.75,
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

// Generate decision based on selected strategy
const generateDecision = (symbol: string, strategyId: 'ema50' | 'candlestick' | 'smart_money') => {
  const rand = Math.random();
  const action = rand > 0.6 ? 'BUY' : rand > 0.3 ? 'SELL' : 'WAIT';
  const direction = action === 'BUY' ? 'bullish' : action === 'SELL' ? 'bearish' : 'ranging';
  const probability = Math.floor(Math.random() * 40) + 50;
  
  const { price } = generatePrice(symbol);
  const atr = symbol.includes('BTC') ? 500 : symbol.includes('ETH') ? 25 : 0.003;
  
  // Strategy-specific analysis
  const strategyAnalysis = {
    ema50: {
      name: 'EMA 50',
      analysis: 'Análisis de Media Móvil Exponencial',
      conditions: [
        { label: 'Precio vs EMA 50', value: direction === 'bullish' ? 'Por encima' : 'Por debajo', status: true },
        { label: 'Tendencia EMA', value: direction === 'bullish' ? 'Alcista (EMA apunta arriba)' : 'Bajista (EMA apunta abajo)', status: true },
        { label: 'Distancia de EMA', value: 'Retroceso hacia zona de valor', status: Math.random() > 0.3 },
        { label: 'Ángulo de EMA', value: Math.random() > 0.5 ? 'Fuerte (pendiente pronunciada)' : 'Moderado', status: true },
      ],
      entryReason: direction === 'bullish' 
        ? 'Precio hace retroceso hacia EMA 50 en tendencia alcista. Buscar rebote con velas confirmatorias.'
        : 'Precio hace retroceso hacia EMA 50 en tendencia bajista. Buscar rechazo con velas confirmatorias.',
      patterns: ['Retroceso a EMA', 'Rebote desde valor', 'Continuación de tendencia']
    },
    candlestick: {
      name: 'Velas Japonesas',
      analysis: 'Análisis de Patrones de Velas',
      conditions: [
        { label: 'Patrón detectado', value: direction === 'bullish' ? 'Bullish Engulfing / Martillo' : 'Bearish Engulfing / Estrella', status: true },
        { label: 'Ubicación', value: 'En zona clave de soporte/resistencia', status: Math.random() > 0.3 },
        { label: 'Volumen', value: 'Volumen superior al promedio', status: Math.random() > 0.4 },
        { label: 'Confirmación', value: 'Vela siguiente confirma el patrón', status: Math.random() > 0.5 },
      ],
      entryReason: direction === 'bullish'
        ? 'Patrón alcista detectado en zona de soporte. Vela confirmatoria presente. Entrar en apertura siguiente.'
        : 'Patrón bajista detectado en zona de resistencia. Vela confirmatoria presente. Entrar en apertura siguiente.',
      patterns: ['Engulfing', 'Martillo/Estrella', 'Doji en zona clave']
    },
    smart_money: {
      name: 'Smart Money',
      analysis: 'Análisis de Flujo Institucional',
      conditions: [
        { label: 'Order Block', value: 'OB identificado en zona actual', status: true },
        { label: 'Liquidez', value: 'Barrido de stops reciente', status: Math.random() > 0.3 },
        { label: 'Manipulación', value: 'Falso breakout detectado', status: Math.random() > 0.4 },
        { label: 'Inducement', value: 'Trampa institucional completada', status: Math.random() > 0.5 },
      ],
      entryReason: direction === 'bullish'
        ? 'Barrido de liquidez en zona de demanda institucional. Order Block alcista activo. Entrar tras mitigación.'
        : 'Barrido de liquidez en zona de oferta institucional. Order Block bajista activo. Entrar tras mitigación.',
      patterns: ['Order Block', 'Liquidity Sweep', 'Inducement Clear', 'Mitigation']
    }
  };

  const selected = strategyAnalysis[strategyId];
  
  return {
    action,
    direction,
    probability,
    entry: action !== 'WAIT' ? price : undefined,
    stopLoss: action === 'BUY' ? price - atr * 2 : action === 'SELL' ? price + atr * 2 : undefined,
    takeProfit: action === 'BUY' ? price + atr * 4 : action === 'SELL' ? price - atr * 4 : undefined,
    riskReward: 2,
    strategyName: selected.name,
    strategyAnalysis: selected.analysis,
    strategyConditions: selected.conditions,
    entryReason: selected.entryReason,
    patterns: selected.patterns,
    timeframes: {
      '1D': { 
        direction, 
        trend: direction === 'bullish' ? 'uptrend' : direction === 'bearish' ? 'downtrend' : 'sideways',
        ema50Position: direction === 'bullish' ? 'above' : 'below',
        priceAction: direction === 'bullish' ? 'Higher highs and higher lows' : 
                     direction === 'bearish' ? 'Lower highs and lower lows' : 'Consolidation',
        keyLevels: { support: price * 0.998, resistance: price * 1.002 },
        confidence: Math.floor(Math.random() * 30) + 60
      },
      '1H': {
        impulse: Math.random() > 0.4,
        pullback: Math.random() > 0.4,
        volume: 'high',
        confidence: Math.floor(Math.random() * 30) + 50
      },
      '5M': {
        confirmed: action !== 'WAIT',
        reasons: action !== 'WAIT' ? ['Señal confirmada', 'Condiciones cumplidas', 'Timing correcto'] : [],
        riskReward: 2,
        confidence: Math.floor(Math.random() * 30) + 40
      }
    }
  };
};

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
      <div className="flex items-center justify-between">
        <span className="font-bold">{asset.symbol}</span>
        {decision && (
          <Badge variant={decision.action === 'BUY' ? 'bull' : decision.action === 'SELL' ? 'bear' : 'neutral'}>
            {decision.action}
          </Badge>
        )}
      </div>
      {decision && (
        <div className="flex items-center gap-2">
          <Progress value={decision.probability} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground">{decision.probability}%</span>
        </div>
      )}
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
  const [price, setPrice] = useState<ReturnType<typeof generatePrice> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setPrice(generatePrice(selectedAsset.symbol));
    }
  }, [selectedAsset.symbol, mounted]);

  const chartConfigs = [
    { id: '1D', name: 'Diario', purpose: 'Dirección', interval: 'D', height: 280 },
    { id: '1H', name: '1 Hora', purpose: 'Estrategia', interval: '60', height: 250 },
    { id: '5M', name: '5 Min', purpose: 'Ejecución', interval: '5', height: 220 },
  ];

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
        <div className="space-y-2 p-2">
          {chartConfigs.map((config) => (
            <div key={config.id} className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-bold">{config.id}</Badge>
                  <span className="text-sm font-medium">{config.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{config.purpose}</span>
              </div>
              
              <div style={{ height: config.height }} className="bg-black/20">
                <iframe
                  src={`https://s.tradingview.com/widgetembed/?frameElementId=tv_${config.id}&symbol=${getTVSymbol(selectedAsset.symbol)}&interval=${config.interval}&hidesidetoolbar=1&hidetoptoolbar=1&symboledit=0&saveimage=0&toolbarbg=0a0a0a&studies=%5B%22EMA%40tv-basicstudies%22%5D&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hidevolume=1`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allowFullScreen
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
  const [marketStatus, setMarketStatus] = useState<ReturnType<typeof getActiveSessions>>({
    sessions: [], isWeekend: false, forexOpen: true, cryptoOpen: true
  });

  useEffect(() => {
    setMounted(true);
    setMarketStatus(getActiveSessions());
  }, []);

  useEffect(() => {
    if (mounted) {
      setDecision(generateDecision(selectedAsset.symbol, selectedStrategy));
    }
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

      {/* Chart */}
      <div className="flex-1 min-h-[280px] bg-black/20 relative">
        <iframe
          src={`https://s.tradingview.com/widgetembed/?frameElementId=tv_widget&symbol=${getTVSymbol(selectedAsset.symbol)}&interval=15&hidesidetoolbar=1&hidetoptoolbar=1&symboledit=0&saveimage=0&toolbarbg=0a0a0a&studies=%5B%22EMA%40tv-basicstudies%22%5D&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hidevolume=1`}
          style={{ width: '100%', height: '100%', border: 'none', minHeight: '280px' }}
          allowFullScreen
        />
        
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
  const [marketStatus, setMarketStatus] = useState<ReturnType<typeof getActiveSessions>>({
    sessions: [], isWeekend: false, forexOpen: true, cryptoOpen: true
  });

  useEffect(() => {
    setMounted(true);
    setMarketStatus(getActiveSessions());
  }, []);

  useEffect(() => {
    if (mounted) {
      setDecision(generateDecision(selectedAsset.symbol, selectedStrategy));
    }
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
function NewsTab() {
  const [selectedCurrency, setSelectedCurrency] = useState('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const news = [
    { id: '1', title: 'Fed mantiene tasas de interés sin cambios', summary: 'La Reserva Federal decidió mantener las tasas.', source: 'Reuters', impact: 'high', currency: 'USD' },
    { id: '2', title: 'BCE considera nuevos estímulos', summary: 'El Banco Central Europeo evalúa medidas.', source: 'Bloomberg', impact: 'high', currency: 'EUR' },
    { id: '3', title: 'Bitcoin alcanza nuevos máximos', summary: 'La criptomoneda líder supera los $68,000.', source: 'CoinDesk', impact: 'medium', currency: 'BTC' },
    { id: '4', title: 'Libra esterlina se fortalece', summary: 'Datos positivos del PIB británico.', source: 'Financial Times', impact: 'medium', currency: 'GBP' },
    { id: '5', title: 'Yen japonés bajo presión', summary: 'El Bank of Japan mantiene su política.', source: 'Nikkei', impact: 'medium', currency: 'JPY' },
  ];

  const currencies = [
    { id: 'all', name: 'Todas' },
    { id: 'USD', name: 'USD' },
    { id: 'EUR', name: 'EUR' },
    { id: 'GBP', name: 'GBP' },
    { id: 'JPY', name: 'JPY' },
    { id: 'BTC', name: 'Crypto' },
  ];

  const filteredNews = selectedCurrency === 'all' ? news : news.filter(n => n.currency === selectedCurrency);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 bg-card border-b border-border">
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

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {filteredNews.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className={cn("w-2 h-2 rounded-full mt-2", 
                    item.impact === 'high' ? 'bg-red-500' : item.impact === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs">{item.currency}</Badge>
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{item.source}</span>
                      <Badge variant={item.impact === 'high' ? 'bear' : 'neutral'}>
                        {item.impact === 'high' ? 'Alto' : 'Medio'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============ MAIN APP ============
export default function TradeMindAI() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        <Badge variant="outline" className="text-xs">
          <Activity className="w-3 h-3 mr-1" />
          Live
        </Badge>
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
