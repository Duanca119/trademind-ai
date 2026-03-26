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
  Building2,
  Sparkles
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

const STRATEGIES = [
  { 
    id: 'new_york', 
    name: 'Nueva York', 
    icon: Building2,
    description: 'Impulso + Retroceso + Continuación',
    color: 'bg-blue-500'
  },
  { 
    id: 'smart_money', 
    name: 'Smart Money', 
    icon: Sparkles,
    description: 'Manipulación + Liquidez + Order Blocks',
    color: 'bg-purple-500'
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

// Price generation
const generatePrice = (symbol: string) => {
  const basePrices: Record<string, number> = {
    'EUR/USD': 1.0850, 'GBP/USD': 1.2650, 'USD/JPY': 149.50, 'USD/CHF': 0.8850,
    'AUD/USD': 0.6550, 'USD/CAD': 1.3650, 'NZD/USD': 0.6150, 'EUR/GBP': 0.8575,
    'EUR/JPY': 162.25, 'GBP/JPY': 189.15, 'EUR/AUD': 1.6550, 'EUR/CAD': 1.4825,
    'EUR/CHF': 0.9600, 'GBP/CHF': 1.1190, 'AUD/JPY': 97.85, 'CAD/JPY': 109.50,
    'USD/MXN': 17.15, 'USD/ZAR': 18.75, 'USD/TRY': 32.50, 'USD/SGD': 1.3450,
    'BTC/USD': 67500, 'ETH/USD': 3450,
  };
  const base = basePrices[symbol] || 1;
  const vol = symbol.includes('BTC') ? 500 : symbol.includes('ETH') ? 25 : symbol.includes('JPY') ? 0.15 : 0.001;
  const change = (Math.random() - 0.5) * vol * 2;
  const price = base + change;
  return { price, change, changePercent: (change / base) * 100 };
};

// TradingView symbol
const getTVSymbol = (symbol: string) => {
  const [base, quote] = symbol.split('/');
  if (base === 'BTC') return 'BINANCE:BTCUSDT';
  if (base === 'ETH') return 'BINANCE:ETHUSDT';
  return `FX:${base}${quote}`;
};

// Generate decision based on strategy
const generateDecision = (symbol: string, strategy: 'new_york' | 'smart_money') => {
  const rand = Math.random();
  const action = rand > 0.6 ? 'BUY' : rand > 0.3 ? 'SELL' : 'WAIT';
  const direction = action === 'BUY' ? 'bullish' : action === 'SELL' ? 'bearish' : 'ranging';
  const probability = Math.floor(Math.random() * 40) + 50;
  
  const { price } = generatePrice(symbol);
  const atr = symbol.includes('BTC') ? 500 : symbol.includes('ETH') ? 25 : 0.003;
  
  // Strategy-specific reasoning
  const strategyReasoning = {
    new_york: {
      name: 'Estrategia Nueva York',
      description: 'Impulso + Retroceso + Continuación',
      conditions: [
        'Sesión de Nueva York activa (13:00-22:00 UTC)',
        'Impulso inicial identificado en 1H',
        'Retroceso hacia zona de valor (EMA 50)',
        'Continuación en dirección del impulso'
      ],
      entryReason: 'Entrada en retroceso hacia EMA 50 con impulso previo confirmado',
      patterns: ['Impulse Move', 'Pullback to Value', 'Break of Structure']
    },
    smart_money: {
      name: 'Estrategia Smart Money',
      description: 'Manipulación + Liquidez + Order Blocks',
      conditions: [
        'Identificación de Order Block principal',
        'Barrido de liquidez (stop hunt) confirmado',
        'Rechazo de zona de manipulación',
        'Retorno al orden institucional'
      ],
      entryReason: 'Entrada tras barrido de liquidez en Order Block institucional',
      patterns: ['Liquidity Sweep', 'Order Block Rejection', 'Inducement Clear']
    }
  };

  const selectedStrategy = strategyReasoning[strategy];
  
  return {
    action,
    direction,
    probability,
    entry: action !== 'WAIT' ? price : undefined,
    stopLoss: action === 'BUY' ? price - atr * 2 : action === 'SELL' ? price + atr * 2 : undefined,
    takeProfit: action === 'BUY' ? price + atr * 4 : action === 'SELL' ? price - atr * 4 : undefined,
    riskReward: 2,
    strategy: selectedStrategy.name,
    strategyDescription: selectedStrategy.description,
    strategyConditions: selectedStrategy.conditions,
    entryReason: selectedStrategy.entryReason,
    patterns: selectedStrategy.patterns,
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
        strategy: strategy,
        impulse: strategy === 'new_york' ? Math.random() > 0.3 : Math.random() > 0.5,
        pullback: strategy === 'new_york' ? Math.random() > 0.4 : true,
        patterns: selectedStrategy.patterns,
        emaCross: Math.random() > 0.5,
        volume: 'high',
        confidence: Math.floor(Math.random() * 30) + 50
      },
      '5M': {
        confirmed: action !== 'WAIT',
        reasons: action !== 'WAIT' ? ['Vela confirmatoria', 'Volumen institucional', 'Orden flow positivo'] : [],
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
  const [prices, setPrices] = useState<Map<string, ReturnType<typeof generatePrice>>>(new Map());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updatePrices = () => {
      const newPrices = new Map();
      ASSETS.forEach(a => newPrices.set(a.symbol, generatePrice(a.symbol)));
      setPrices(newPrices);
    };
    updatePrices();
    const interval = setInterval(updatePrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredAssets = category === 'all' ? ASSETS : ASSETS.filter(a => a.category === category);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 bg-card border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Estado del Mercado</span>
          <Badge variant="bull">Abierto</Badge>
        </div>
      </div>

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

function AssetQuickInfo({ asset, price }: { asset: typeof ASSETS[0]; price?: ReturnType<typeof generatePrice> }) {
  const [decision, setDecision] = useState<ReturnType<typeof generateDecision> | null>(null);

  useEffect(() => {
    setDecision(generateDecision(asset.symbol, 'new_york'));
  }, [asset.symbol]);

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
            <p className="font-mono">{formatPrice(price.price * 1.001, asset.symbol)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Bajo</span>
            <p className="font-mono">{formatPrice(price.price * 0.999, asset.symbol)}</p>
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
  const [selectedStrategy, setSelectedStrategy] = useState<'new_york' | 'smart_money'>('new_york');
  const [mounted, setMounted] = useState(false);
  const [decision, setDecision] = useState<ReturnType<typeof generateDecision> | null>(null);

  useEffect(() => {
    setMounted(true);
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

      {/* Strategy Selector */}
      <div className="p-3 bg-card border-b border-border">
        <div className="text-xs text-muted-foreground mb-2">Estrategia Activa</div>
        <div className="flex gap-2">
          {STRATEGIES.map((strategy) => {
            const Icon = strategy.icon;
            const isActive = selectedStrategy === strategy.id;
            return (
              <Button
                key={strategy.id}
                variant={isActive ? 'default' : 'outline'}
                onClick={() => setSelectedStrategy(strategy.id as 'new_york' | 'smart_money')}
                className="flex-1 flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {strategy.name}
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

      {/* Chart */}
      <div className="flex-1 min-h-[300px] bg-black/20 relative">
        <iframe
          src={`https://s.tradingview.com/widgetembed/?frameElementId=tv_widget&symbol=${getTVSymbol(selectedAsset.symbol)}&interval=15&hidesidetoolbar=1&hidetoptoolbar=1&symboledit=0&saveimage=0&toolbarbg=0a0a0a&studies=%5B%22EMA%40tv-basicstudies%22%5D&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hidevolume=1`}
          style={{ width: '100%', height: '100%', border: 'none', minHeight: '300px' }}
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
  const [selectedStrategy, setSelectedStrategy] = useState<'new_york' | 'smart_money'>('new_york');
  const [mounted, setMounted] = useState(false);
  const [decision, setDecision] = useState<ReturnType<typeof generateDecision> | null>(null);

  useEffect(() => {
    setMounted(true);
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

      {/* Strategy Selector */}
      <div className="p-3 bg-card border-b border-border">
        <div className="text-xs text-muted-foreground mb-2">Estrategia Activa</div>
        <div className="flex gap-2">
          {STRATEGIES.map((strategy) => {
            const Icon = strategy.icon;
            const isActive = selectedStrategy === strategy.id;
            return (
              <Button
                key={strategy.id}
                variant={isActive ? 'default' : 'outline'}
                onClick={() => setSelectedStrategy(strategy.id as 'new_york' | 'smart_money')}
                className="flex-1 flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {strategy.name}
              </Button>
            );
          })}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {decision ? (
            <>
              {/* Market & Strategy Info */}
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Mercado Actual</div>
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
                  <p className="text-sm text-muted-foreground mt-3">{decision.strategyDescription}</p>
                </CardContent>
              </Card>

              {/* Strategy Reasoning */}
              <Card className="border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    {currentStrategy && <currentStrategy.icon className="w-4 h-4" />}
                    Razonamiento de la Estrategia
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="text-xs text-muted-foreground mb-2">Condiciones evaluadas:</div>
                  {decision.strategyConditions.map((condition, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{condition}</span>
                    </div>
                  ))}
                  {decision.entryReason && (
                    <div className="mt-3 p-2 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Razón de entrada:</div>
                      <span className="text-sm">{decision.entryReason}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 1D Analysis */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      1D - Dirección
                    </CardTitle>
                    <Badge variant={decision.direction === 'bullish' ? 'bull' : decision.direction === 'bearish' ? 'bear' : 'neutral'}>
                      {decision.direction === 'bullish' ? 'Alcista' : decision.direction === 'bearish' ? 'Bajista' : 'Lateral'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tendencia</span>
                    <span className="capitalize">{decision.timeframes['1D'].trend}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">EMA 50</span>
                    <span className="capitalize">{decision.timeframes['1D'].ema50Position}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Acción del precio</span>
                    <span>{decision.timeframes['1D'].priceAction}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Progress value={decision.timeframes['1D'].confidence} className="h-2 flex-1" />
                    <span className="text-xs">{decision.timeframes['1D'].confidence}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* 1H Analysis */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      1H - Estrategia
                    </CardTitle>
                    <Badge variant="session">
                      {currentStrategy?.name}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      {decision.timeframes['1H'].impulse ? 
                        <CheckCircle className="w-4 h-4 text-green-500" /> : 
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                      }
                      <span>Impulso</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {decision.timeframes['1H'].pullback ? 
                        <CheckCircle className="w-4 h-4 text-green-500" /> : 
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                      }
                      <span>Retroceso</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <span className="text-xs text-muted-foreground">Patrones: </span>
                    {decision.patterns.map((p, i) => (
                      <Badge key={i} variant="outline" className="mr-1 text-xs">{p}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Progress value={decision.timeframes['1H'].confidence} className="h-2 flex-1" />
                    <span className="text-xs">{decision.timeframes['1H'].confidence}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* 5M Analysis */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      5M - Ejecución
                    </CardTitle>
                    <Badge variant={decision.timeframes['5M'].confirmed ? 'bull' : 'neutral'}>
                      {decision.timeframes['5M'].confirmed ? 'Confirmado' : 'Pendiente'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {decision.timeframes['5M'].reasons.map((reason, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{reason}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-2">
                    <Progress value={decision.timeframes['5M'].confidence} className="h-2 flex-1" />
                    <span className="text-xs">{decision.timeframes['5M'].confidence}%</span>
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
