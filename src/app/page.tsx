"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
  DollarSign
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
import { cn, formatPrice, formatPercent, getChangeClass, getMarketSessions } from '@/lib/utils';
import { ASSETS, TIMEFRAMES, ASSET_CATEGORIES, getTradingViewSymbol } from '@/lib/assets';
import { Asset, Timeframe, PriceData } from '@/types/trading';
import { useMarketData } from '@/hooks/use-market-data';
import { useTradingAnalysis } from '@/hooks/use-trading-analysis';

// ============ DASHBOARD TAB ============
function DashboardTab() {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [category, setCategory] = useState<string>('all');
  const { prices } = useMarketData();
  const sessions = getMarketSessions();
  
  const filteredAssets = useMemo(() => {
    if (category === 'all') return ASSETS;
    return ASSETS.filter(a => a.category === category);
  }, [category]);

  return (
    <div className="flex flex-col h-full">
      {/* Market Status */}
      <div className="p-3 bg-card border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Estado del Mercado</span>
          <Badge variant={sessions.forex === 'open' ? 'bull' : 'neutral'}>
            {sessions.forex === 'open' ? 'Abierto' : 'Cerrado'}
          </Badge>
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {sessions.newYork && <Badge variant="session">NY</Badge>}
          {sessions.london && <Badge variant="session">LDN</Badge>}
          {sessions.asian && <Badge variant="session">ASIA</Badge>}
        </div>
      </div>

      {/* Category Filter */}
      <div className="p-3 border-b border-border">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {ASSET_CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={category === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategory(cat.id)}
              className="whitespace-nowrap"
            >
              {cat.name} ({cat.count})
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
                  "w-full p-3 rounded-lg flex items-center justify-between transition-all",
                  "hover:bg-accent/50",
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
                    <span className={cn("text-xs font-medium", getChangeClass(price.changePercent))}>
                      {formatPercent(price.changePercent)}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Selected Asset Quick Info */}
      {selectedAsset && (
        <div className="p-3 border-t border-border bg-card">
          <AssetQuickInfo asset={selectedAsset} price={prices.get(selectedAsset.symbol)} />
        </div>
      )}
    </div>
  );
}

function AssetQuickInfo({ asset, price }: { asset: Asset; price?: PriceData }) {
  const { decision } = useTradingAnalysis(asset.symbol);

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
          <Progress 
            value={decision.probability} 
            className="h-2 flex-1"
          />
          <span className="text-xs text-muted-foreground">{decision.probability}%</span>
        </div>
      )}
      {price && (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Alto</span>
            <p className="font-mono">{formatPrice(price.high, asset.symbol)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Bajo</span>
            <p className="font-mono">{formatPrice(price.low, asset.symbol)}</p>
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
  const [selectedAsset, setSelectedAsset] = useState<Asset>(ASSETS[0]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1D');
  const [mounted, setMounted] = useState(false);
  const { prices } = useMarketData();

  useEffect(() => {
    setMounted(true);
  }, []);

  const tradingViewSymbol = getTradingViewSymbol(selectedAsset.symbol);
  const timeframeConfig = TIMEFRAMES.find(t => t.id === selectedTimeframe);
  const currentPrice = prices.get(selectedAsset.symbol);

  return (
    <div className="flex flex-col h-full">
      {/* Asset & Timeframe Selector */}
      <div className="p-3 bg-card border-b border-border space-y-3">
        <Select 
          value={selectedAsset.symbol} 
          onValueChange={(v) => setSelectedAsset(ASSETS.find(a => a.symbol === v) || ASSETS[0])}
        >
          <SelectTrigger className="flex-1">
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
        
        {/* Timeframe Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {TIMEFRAMES.map((tf) => (
            <Button
              key={tf.id}
              variant={selectedTimeframe === tf.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTimeframe(tf.id)}
              className="flex-1"
            >
              {tf.id}
            </Button>
          ))}
        </div>
        
        {/* Timeframe Purpose */}
        <div className="text-xs text-muted-foreground text-center">
          {timeframeConfig?.purpose}
        </div>
      </div>

      {/* Price Display */}
      {currentPrice && (
        <div className="p-3 border-b border-border flex items-center justify-between">
          <div>
            <div className="font-mono text-xl font-bold">
              {formatPrice(currentPrice.price, selectedAsset.symbol)}
            </div>
            <div className={cn("text-sm", getChangeClass(currentPrice.changePercent))}>
              {formatPercent(currentPrice.changePercent)}
            </div>
          </div>
          <Badge variant={currentPrice.change >= 0 ? 'bull' : 'bear'}>
            {currentPrice.change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {currentPrice.change >= 0 ? 'Alcista' : 'Bajista'}
          </Badge>
        </div>
      )}

      {/* TradingView Chart */}
      <div className="flex-1 min-h-[400px] bg-black/20">
        {mounted ? (
          <iframe
            src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${tradingViewSymbol}&interval=${timeframeConfig?.tradingviewInterval || 'D'}&hidesidetoolbar=1&hidetoptoolbar=1&symboledit=0&saveimage=0&toolbarbg=f1f3f6&studies=%5B%22EMA%40tv-basicstudies%22%5D&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hidevolume=1`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              minHeight: '400px',
            }}
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Activity className="w-8 h-8 animate-pulse text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}

// ============ OPERATION TAB ============
function OperationTab() {
  const [selectedAsset, setSelectedAsset] = useState<Asset>(ASSETS[0]);
  const [mounted, setMounted] = useState(false);
  const { prices } = useMarketData();
  const { decision, loading } = useTradingAnalysis(selectedAsset.symbol);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tradingViewSymbol = getTradingViewSymbol(selectedAsset.symbol);

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

      {/* Chart with zones */}
      <div className="flex-1 min-h-[350px] bg-black/20 relative">
        {mounted ? (
          <iframe
            src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${tradingViewSymbol}&interval=15&hidesidetoolbar=1&hidetoptoolbar=1&symboledit=0&saveimage=0&toolbarbg=f1f3f6&studies=%5B%22EMA%40tv-basicstudies%22%5D&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hidevolume=1`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              minHeight: '350px',
            }}
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
        )}
        
        {/* Overlay Zones */}
        {decision && decision.entry && (
          <div className="absolute top-2 right-2 bg-background/90 backdrop-blur p-2 rounded-lg text-xs space-y-1">
            {decision.takeProfit && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span>TP: {formatPrice(decision.takeProfit, selectedAsset.symbol)}</span>
              </div>
            )}
            {decision.entry && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span>Entry: {formatPrice(decision.entry, selectedAsset.symbol)}</span>
              </div>
            )}
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
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
        ) : decision ? (
          <div className="space-y-3">
            {/* Action Badge */}
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

            {/* Levels */}
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

            {/* Risk/Reward */}
            {decision.riskReward && decision.riskReward > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Riesgo/Beneficio</span>
                <Badge variant="outline">1:{decision.riskReward.toFixed(1)}</Badge>
              </div>
            )}

            {/* Strategy */}
            <div className="text-xs text-muted-foreground">
              {decision.strategy}
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            Selecciona un activo para ver la operación
          </div>
        )}
      </div>
    </div>
  );
}

// ============ AI ANALYSIS TAB ============
function AIAnalysisTab() {
  const [selectedAsset, setSelectedAsset] = useState<Asset>(ASSETS[0]);
  const { decision, loading } = useTradingAnalysis(selectedAsset.symbol);

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

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Activity className="w-8 h-8 animate-pulse" />
            </div>
          ) : decision ? (
            <>
              {/* Final Decision Card */}
              <Card className="bg-gradient-to-br from-card to-muted">
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
                  <Progress 
                    value={decision.probability}
                    className="h-3"
                  />
                  <p className="text-sm text-muted-foreground mt-3">{decision.strategy}</p>
                </CardContent>
              </Card>

              {/* 1D Analysis - Direction */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      1D - Dirección
                    </CardTitle>
                    <Badge variant={decision.timeframes['1D'].direction === 'bullish' ? 'bull' : 
                                   decision.timeframes['1D'].direction === 'bearish' ? 'bear' : 'neutral'}>
                      {decision.timeframes['1D'].direction === 'bullish' ? 'Alcista' :
                       decision.timeframes['1D'].direction === 'bearish' ? 'Bajista' : 'Lateral'}
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
                  <div className="pt-2">
                    <div className="text-muted-foreground mb-1">Niveles clave</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-green-500/10 p-2 rounded">
                        <span className="text-xs text-green-400">Soporte</span>
                        <p className="font-mono">{formatPrice(decision.timeframes['1D'].keyLevels.support, selectedAsset.symbol)}</p>
                      </div>
                      <div className="bg-red-500/10 p-2 rounded">
                        <span className="text-xs text-red-400">Resistencia</span>
                        <p className="font-mono">{formatPrice(decision.timeframes['1D'].keyLevels.resistance, selectedAsset.symbol)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Progress value={decision.timeframes['1D'].confidence} className="h-2 flex-1" />
                    <span className="text-xs">{decision.timeframes['1D'].confidence}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* 1H Analysis - Strategy */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      1H - Estrategia
                    </CardTitle>
                    <Badge variant={decision.timeframes['1H'].strategy !== 'none' ? 'session' : 'neutral'}>
                      {decision.timeframes['1H'].strategy === 'new_york' ? 'Nueva York' :
                       decision.timeframes['1H'].strategy === 'smart_money' ? 'Smart Money' :
                       decision.timeframes['1H'].strategy === 'both' ? 'Combinada' : 'Sin señal'}
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
                    <div className="flex items-center gap-2">
                      {decision.timeframes['1H'].emaCross ? 
                        <CheckCircle className="w-4 h-4 text-green-500" /> : 
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                      }
                      <span>Cruce EMA</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="capitalize">{decision.timeframes['1H'].volume}</span>
                      <span className="text-muted-foreground">Volumen</span>
                    </div>
                  </div>
                  {decision.timeframes['1H'].patterns.length > 0 && (
                    <div className="pt-2">
                      <span className="text-muted-foreground">Patrones: </span>
                      {decision.timeframes['1H'].patterns.map((p, i) => (
                        <Badge key={i} variant="outline" className="mr-1">{p}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Progress value={decision.timeframes['1H'].confidence} className="h-2 flex-1" />
                    <span className="text-xs">{decision.timeframes['1H'].confidence}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* 5M Analysis - Entry */}
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
                  {decision.timeframes['5M'].reasons.length > 0 && (
                    <div className="space-y-1">
                      {decision.timeframes['5M'].reasons.map((reason, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {decision.timeframes['5M'].riskReward > 0 && (
                    <div className="flex justify-between pt-2">
                      <span className="text-muted-foreground">Riesgo/Beneficio</span>
                      <Badge variant="outline">1:{decision.timeframes['5M'].riskReward.toFixed(1)}</Badge>
                    </div>
                  )}
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
                    {decision.riskReward && decision.riskReward > 0 && (
                      <div className="mt-4 p-3 bg-muted rounded-lg text-center">
                        <span className="text-muted-foreground">Riesgo/Beneficio: </span>
                        <span className="font-bold text-primary">1:{decision.riskReward.toFixed(2)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Selecciona un activo para ver el análisis
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============ NEWS TAB ============
function NewsTab() {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  
  const news = [
    {
      id: '1',
      title: 'Fed mantiene tasas de interés sin cambios',
      summary: 'La Reserva Federal decidió mantener las tasas en el rango actual.',
      source: 'Reuters',
      timestamp: Date.now() - 3600000,
      impact: 'high' as const,
      currency: 'USD',
    },
    {
      id: '2',
      title: 'BCE considera nuevos estímulos económicos',
      summary: 'El Banco Central Europeo evalúa medidas adicionales.',
      source: 'Bloomberg',
      timestamp: Date.now() - 7200000,
      impact: 'high' as const,
      currency: 'EUR',
    },
    {
      id: '3',
      title: 'Bitcoin alcanza nuevos máximos mensuales',
      summary: 'La criptomoneda líder supera los $68,000.',
      source: 'CoinDesk',
      timestamp: Date.now() - 1800000,
      impact: 'medium' as const,
      currency: 'BTC',
    },
    {
      id: '4',
      title: 'Libra esterlina se fortalece',
      summary: 'Datos positivos del PIB británico impulsan la moneda.',
      source: 'Financial Times',
      timestamp: Date.now() - 5400000,
      impact: 'medium' as const,
      currency: 'GBP',
    },
    {
      id: '5',
      title: 'Yen japonés bajo presión',
      summary: 'El Bank of Japan mantiene su política ultraaccomodativa.',
      source: 'Nikkei',
      timestamp: Date.now() - 9000000,
      impact: 'medium' as const,
      currency: 'JPY',
    },
  ];

  const currencies = [
    { id: 'all', name: 'Todas' },
    { id: 'USD', name: 'USD' },
    { id: 'EUR', name: 'EUR' },
    { id: 'GBP', name: 'GBP' },
    { id: 'JPY', name: 'JPY' },
    { id: 'BTC', name: 'Crypto' },
  ];

  const filteredNews = selectedCurrency === 'all' 
    ? news 
    : news.filter(n => n.currency === selectedCurrency);

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Hace minutos';
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Currency Filter */}
      <div className="p-3 bg-card border-b border-border">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {currencies.map((currency) => (
            <Button
              key={currency.id}
              variant={selectedCurrency === currency.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCurrency(currency.id)}
              className="whitespace-nowrap"
            >
              {currency.name}
            </Button>
          ))}
        </div>
      </div>

      {/* News List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {filteredNews.map((item) => (
            <Card key={item.id} className="hover:bg-accent/50 transition-colors">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className={cn("w-2 h-2 rounded-full mt-2", getImpactColor(item.impact))} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs">{item.currency}</Badge>
                      <span className="text-xs text-muted-foreground">{formatTime(item.timestamp)}</span>
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{item.source}</span>
                      <Badge variant={item.impact === 'high' ? 'bear' : item.impact === 'medium' ? 'neutral' : 'bull'}>
                        {item.impact === 'high' ? 'Alto impacto' : item.impact === 'medium' ? 'Medio' : 'Bajo'}
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

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'charts', label: 'Gráficos', icon: Activity },
    { id: 'operation', label: 'Operación', icon: Target },
    { id: 'analysis', label: 'Análisis IA', icon: Brain },
    { id: 'news', label: 'Noticias', icon: Newspaper },
  ];

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
                <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
                <span className="text-xs">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
