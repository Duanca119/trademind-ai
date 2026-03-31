"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRealtimeMarketData } from "@/hooks/use-realtime-market-data";
import { useSupportResistance } from "@/hooks/use-support-resistance";
import { useTradingDecision } from "@/hooks/use-trading-decision";
import { useNews } from "@/hooks/use-news";
import { formatPrice, getSymbolForTradingView, cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  Target,
  BarChart3,
  Newspaper,
  Activity,
  Zap,
  Shield,
  Brain,
  Menu,
  X,
} from "lucide-react";

// Available assets for trading
const ASSETS = [
  // Cryptocurrencies
  { id: "btc", symbol: "BTC/USDT", name: "Bitcoin", type: "crypto" as const },
  { id: "eth", symbol: "ETH/USDT", name: "Ethereum", type: "crypto" as const },
  // Forex pairs
  { id: "eurusd", symbol: "EUR/USD", name: "Euro/US Dollar", type: "forex" as const },
  { id: "gbpusd", symbol: "GBP/USD", name: "British Pound/US Dollar", type: "forex" as const },
  { id: "usdjpy", symbol: "USD/JPY", name: "US Dollar/Japanese Yen", type: "forex" as const },
  { id: "usdchf", symbol: "USD/CHF", name: "US Dollar/Swiss Franc", type: "forex" as const },
  { id: "audusd", symbol: "AUD/USD", name: "Australian Dollar/US Dollar", type: "forex" as const },
  { id: "usdcad", symbol: "USD/CAD", name: "US Dollar/Canadian Dollar", type: "forex" as const },
  { id: "nzdusd", symbol: "NZD/USD", name: "New Zealand Dollar/US Dollar", type: "forex" as const },
  { id: "eurgbp", symbol: "EUR/GBP", name: "Euro/British Pound", type: "forex" as const },
  { id: "eurjpy", symbol: "EUR/JPY", name: "Euro/Japanese Yen", type: "forex" as const },
  { id: "gbpjpy", symbol: "GBP/JPY", name: "British Pound/Japanese Yen", type: "forex" as const },
  { id: "xauusd", symbol: "XAU/USD", name: "Gold", type: "forex" as const },
];

export default function TradeMindAI() {
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tradingViewLoaded, setTradingViewLoaded] = useState(false);

  const { data: marketData, isLoading: marketLoading, lastUpdate, refresh } = useRealtimeMarketData(3000);
  const { levels: srLevels, analyze: analyzeSR } = useSupportResistance();
  const { decision, isLoading: decisionLoading, analyze: analyzeDecision } = useTradingDecision();
  const { news, isLoading: newsLoading } = useNews();

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLElement | null>(null);

  // Get current price for selected asset
  const currentData = marketData[selectedAsset.symbol];
  const currentPrice = currentData?.price ?? 0;

  // Analyze when asset or price changes
  useEffect(() => {
    if (currentPrice > 0) {
      analyzeSR(selectedAsset.symbol, currentPrice);
    }
  }, [selectedAsset.symbol, currentPrice, analyzeSR]);

  // Trigger decision analysis when S/R levels change
  useEffect(() => {
    if (srLevels.length > 0 && currentPrice > 0) {
      analyzeDecision(selectedAsset.symbol, currentPrice, srLevels);
    }
  }, [srLevels, currentPrice, selectedAsset.symbol, analyzeDecision]);

  // Load TradingView widget
  const loadTradingViewWidget = useCallback(() => {
    if (!chartContainerRef.current || widgetRef.current) return;

    const container = chartContainerRef.current;
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: getSymbolForTradingView(selectedAsset.symbol),
      interval: '15',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'es',
      enable_publishing: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      support_host: 'https://www.tradingview.com',
    });

    container.innerHTML = '';
    const widgetWrapper = document.createElement('div');
    widgetWrapper.className = 'tradingview-widget-container';
    widgetWrapper.style.height = '100%';
    widgetWrapper.style.width = '100%';
    widgetWrapper.appendChild(widgetContainer);
    widgetWrapper.appendChild(script);
    container.appendChild(widgetWrapper);

    widgetRef.current = widgetWrapper;
    setTradingViewLoaded(true);
  }, [selectedAsset.symbol]);

  useEffect(() => {
    loadTradingViewWidget();
    return () => {
      widgetRef.current = null;
    };
  }, [loadTradingViewWidget]);

  // Update TradingView symbol when asset changes
  useEffect(() => {
    if (widgetRef.current) {
      const iframe = widgetRef.current.querySelector('iframe');
      if (iframe) {
        widgetRef.current.remove();
        widgetRef.current = null;
        setTradingViewLoaded(false);
        setTimeout(loadTradingViewWidget, 100);
      }
    }
  }, [selectedAsset.symbol, loadTradingViewWidget]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY':
        return 'text-green-500';
      case 'SELL':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  const getActionBg = (action: string) => {
    switch (action) {
      case 'BUY':
        return 'bg-green-500/10 border-green-500/30';
      case 'SELL':
        return 'bg-red-500/10 border-red-500/30';
      default:
        return 'bg-yellow-500/10 border-yellow-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">TradeMind AI</span>
          </div>

          <div className="flex items-center gap-2">
            {lastUpdate && (
              <span className="text-xs text-muted-foreground hidden sm:block">
                Actualizado: {new Date(lastUpdate).toLocaleTimeString('es-ES')}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refresh()}
              disabled={marketLoading}
            >
              <RefreshCw className={cn("h-4 w-4", marketLoading && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-4 max-w-7xl">
        {/* Asset Selector */}
        <div className="mb-4">
          <Select
            value={selectedAsset.id}
            onValueChange={(value) => {
              const asset = ASSETS.find((a) => a.id === value);
              if (asset) setSelectedAsset(asset);
            }}
          >
            <SelectTrigger className="w-full md:w-[280px]">
              <SelectValue placeholder="Seleccionar activo" />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Criptomonedas
              </div>
              {ASSETS.filter((a) => a.type === 'crypto').map((asset) => (
                <SelectItem key={asset.id} value={asset.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{asset.symbol}</span>
                    <span className="text-xs text-muted-foreground">{asset.name}</span>
                  </div>
                </SelectItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
                Forex
              </div>
              {ASSETS.filter((a) => a.type === 'forex').map((asset) => (
                <SelectItem key={asset.id} value={asset.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{asset.symbol}</span>
                    <span className="text-xs text-muted-foreground">{asset.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Main Grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Chart Section */}
          <div className="lg:col-span-2">
            <Card className="h-[400px] md:h-[500px]">
              <CardContent className="p-0 h-full">
                <div ref={chartContainerRef} className="h-full w-full" />
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Price Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>{selectedAsset.symbol}</span>
                  <Badge variant="outline" className="text-xs">
                    {selectedAsset.type === 'crypto' ? 'Crypto' : 'Forex'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {marketLoading && !currentPrice ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-muted rounded w-32 mb-2" />
                    <div className="h-4 bg-muted rounded w-24" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {formatPrice(currentPrice, selectedAsset.symbol)}
                      </span>
                      {currentData && (
                        <span
                          className={cn(
                            "text-sm flex items-center gap-1",
                            currentData.changePercent >= 0 ? "text-green-500" : "text-red-500"
                          )}
                        >
                          {currentData.changePercent >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          {currentData.changePercent >= 0 ? '+' : ''}
                          {currentData.changePercent.toFixed(2)}%
                        </span>
                      )}
                    </div>
                    {currentData && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span>High: {formatPrice(currentData.high, selectedAsset.symbol)}</span>
                        <span className="mx-2">•</span>
                        <span>Low: {formatPrice(currentData.low, selectedAsset.symbol)}</span>
                      </div>
                    )}
                    {lastUpdate && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Activity className="h-3 w-3 live-indicator text-green-500" />
                        En vivo
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Trading Decision Card */}
            <Card className={cn("border", decision && getActionBg(decision.action))}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Señal de Trading
                </CardTitle>
              </CardHeader>
              <CardContent>
                {decisionLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-6 bg-muted rounded w-20" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </div>
                ) : decision ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={cn("text-xl font-bold", getActionColor(decision.action))}>
                        {decision.action}
                      </span>
                      <Badge variant="outline">
                        {decision.confidence}% confianza
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Entrada:</span>
                        <span className="font-medium">
                          {formatPrice(decision.entryZone.min, selectedAsset.symbol)} - {formatPrice(decision.entryZone.max, selectedAsset.symbol)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Stop Loss:</span>
                        <span className="font-medium text-red-500">
                          {formatPrice(decision.stopLoss, selectedAsset.symbol)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Take Profit 1:</span>
                        <span className="font-medium text-green-500">
                          {formatPrice(decision.takeProfit[0], selectedAsset.symbol)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Riesgo/Beneficio:</span>
                        <span className="font-medium">1:{decision.riskRewardRatio.toFixed(2)}</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground border-t pt-2">
                      {decision.reasoning}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Selecciona un activo para ver la señal</p>
                )}
              </CardContent>
            </Card>

            {/* Support/Resistance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Soportes y Resistencias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {srLevels.slice().reverse().map((level, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-center justify-between p-2 rounded text-sm",
                          level.type === 'resistance' ? "bg-red-500/10" : "bg-green-500/10"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              level.type === 'resistance' ? "bg-red-500" : "bg-green-500"
                            )}
                          />
                          <span className="text-xs capitalize">{level.type === 'resistance' ? 'R' : 'S'}</span>
                        </div>
                        <span className="font-medium">
                          {formatPrice(level.price, selectedAsset.symbol)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {level.strength}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section - Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="text-xs md:text-sm">
              <BarChart3 className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="scanner" className="text-xs md:text-sm">
              <Activity className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Scanner</span>
            </TabsTrigger>
            <TabsTrigger value="news" className="text-xs md:text-sm">
              <Newspaper className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Noticias</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs md:text-sm">
              <AlertTriangle className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Alertas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ASSETS.slice(0, 6).map((asset) => {
                const data = marketData[asset.symbol];
                return (
                  <Card
                    key={asset.id}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary",
                      selectedAsset.id === asset.id && "border-primary"
                    )}
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{asset.symbol}</span>
                        <Badge variant="outline" className="text-xs">
                          {asset.type}
                        </Badge>
                      </div>
                      {data ? (
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold">
                            {formatPrice(data.price, asset.symbol)}
                          </span>
                          <span
                            className={cn(
                              "text-sm",
                              data.changePercent >= 0 ? "text-green-500" : "text-red-500"
                            )}
                          >
                            {data.changePercent >= 0 ? '+' : ''}
                            {data.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      ) : (
                        <div className="h-6 bg-muted rounded animate-pulse" />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="scanner" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Escáner de Mercado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {ASSETS.map((asset) => {
                      const data = marketData[asset.symbol];
                      return (
                        <div
                          key={asset.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            "hover:bg-accent cursor-pointer transition-colors",
                            selectedAsset.id === asset.id && "bg-accent"
                          )}
                          onClick={() => setSelectedAsset(asset)}
                        >
                          <div>
                            <span className="font-medium">{asset.symbol}</span>
                            <p className="text-xs text-muted-foreground">{asset.name}</p>
                          </div>
                          {data && (
                            <div className="text-right">
                              <span className="font-medium">
                                {formatPrice(data.price, asset.symbol)}
                              </span>
                              <p
                                className={cn(
                                  "text-xs",
                                  data.changePercent >= 0 ? "text-green-500" : "text-red-500"
                                )}
                              >
                                {data.changePercent >= 0 ? '+' : ''}
                                {data.changePercent.toFixed(2)}%
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="news" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-primary" />
                  Noticias del Mercado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {newsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-full" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {news.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm">{item.title}</h4>
                            <Badge
                              variant={
                                item.sentiment === 'positive'
                                  ? 'success'
                                  : item.sentiment === 'negative'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                              className="text-xs shrink-0"
                            >
                              {item.sentiment}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.summary}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>{item.source}</span>
                            <span>•</span>
                            <span>{new Date(item.publishedAt).toLocaleTimeString('es-ES')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  Sistema de Alertas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Sin alertas activas</h3>
                  <p className="text-sm text-muted-foreground max-w-[300px]">
                    Las alertas de precio y señales aparecerán aquí cuando se activen.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 mt-8">
        <div className="container px-4 text-center text-xs text-muted-foreground">
          <p>TradeMind AI - Asistente de Trading con IA</p>
          <p className="mt-1">
            Los datos de mercado se actualizan automáticamente cada 3 segundos
          </p>
        </div>
      </footer>
    </div>
  );
}
