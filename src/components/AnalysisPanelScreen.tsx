'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Maximize2, Minimize2, TrendingUp, Clock, AlertCircle, 
  RefreshCw, Target, ArrowUpRight, ArrowDownRight, Minus,
  AlertTriangle, CheckCircle, Info, Zap, Layers
} from 'lucide-react'
import { useSelectedPair } from '../contexts/SelectedPairContext'
import { useAnalysisData } from '../hooks/useAnalysisData'

// ============================================
// TYPES
// ============================================

type FullscreenChart = 'chart1' | 'chart2' | 'chart3' | null

// ============================================
// TRADINGVIEW SYMBOL MAPPING
// ============================================

const getTradingViewSymbol = (pair: string | null): string => {
  if (!pair) return 'OANDA:EURUSD'
  const symbol = pair.replace('/', '')
  return `OANDA:${symbol}`
}

// ============================================
// TRADINGVIEW WIDGET COMPONENT
// ============================================

interface TradingViewWidgetProps {
  symbol: string
  interval: string
  height: string
  fullscreen?: boolean
  onCloseFullscreen?: () => void
}

function TradingViewWidget({ symbol, interval, height, fullscreen, onCloseFullscreen }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''

    const widgetContainer = document.createElement('div')
    widgetContainer.className = 'tradingview-widget-container'
    widgetContainer.style.width = '100%'
    widgetContainer.style.height = '100%'

    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    widgetDiv.style.width = '100%'
    widgetDiv.style.height = '100%'
    widgetContainer.appendChild(widgetDiv)

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: interval,
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'es',
      enable_publishing: false,
      allow_symbol_change: false,
      save_image: true,
      calendar: false,
      studies: ['RSI@tv-basicstudies'],
      hide_top_toolbar: false,
      hide_legend: false,
      hide_side_toolbar: false,
      support_host: 'https://www.tradingview.com'
    })

    widgetContainer.appendChild(script)
    containerRef.current.appendChild(widgetContainer)
  }, [symbol, interval])

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0a0f] p-2">
        <div className="flex items-center justify-between mb-2 px-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-medium">{symbol.replace('OANDA:', '')}</span>
            <span className="text-xs text-zinc-500">| {interval}</span>
          </div>
          <button
            onClick={onCloseFullscreen}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>
        <div 
          ref={containerRef}
          className="w-full rounded-lg overflow-hidden"
          style={{ height: 'calc(100vh - 60px)' }}
        />
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="w-full h-full rounded-lg overflow-hidden bg-zinc-900"
      style={{ minHeight: height }}
    />
  )
}

// ============================================
// VISUAL GUIDE PANEL
// ============================================

interface VisualGuideProps {
  data: ReturnType<typeof useAnalysisData>['data']
  onRefresh: () => void
}

function VisualGuide({ data, onRefresh }: VisualGuideProps) {
  const getTrendIcon = () => {
    switch (data.trend) {
      case 'bullish': return <ArrowUpRight className="w-4 h-4 text-emerald-400" />
      case 'bearish': return <ArrowDownRight className="w-4 h-4 text-red-400" />
      default: return <Minus className="w-4 h-4 text-zinc-400" />
    }
  }

  const getTrendText = () => {
    switch (data.trend) {
      case 'bullish': return 'Alcista'
      case 'bearish': return 'Bajista'
      default: return 'Lateral'
    }
  }

  const getTrendColor = () => {
    switch (data.trend) {
      case 'bullish': return 'text-emerald-400'
      case 'bearish': return 'text-red-400'
      default: return 'text-zinc-400'
    }
  }

  const getOpportunityColor = () => {
    switch (data.opportunityLevel) {
      case 'alta': return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
      case 'media': return 'bg-amber-500/20 border-amber-500/50 text-amber-400'
      case 'baja': return 'bg-red-500/20 border-red-500/50 text-red-400'
    }
  }

  const getOpportunityIcon = () => {
    switch (data.opportunityLevel) {
      case 'alta': return '🟢'
      case 'media': return '🟡'
      case 'baja': return '🔴'
    }
  }

  if (data.isLoading) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 animate-pulse">
        <div className="flex items-center justify-center gap-2 py-4">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
          <span className="text-sm text-zinc-400">Analizando mercado...</span>
        </div>
      </div>
    )
  }

  if (data.error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-sm text-red-400">{data.error}</span>
        </div>
        <button 
          onClick={onRefresh}
          className="mt-3 text-xs text-blue-400 hover:underline"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main Analysis Card */}
      <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/50 border border-zinc-700/50 rounded-xl overflow-hidden">
        {/* Header with Pair and Opportunity Level */}
        <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-lg">{data.pair}</span>
          </div>
          <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getOpportunityColor()}`}>
            {getOpportunityIcon()} Oportunidad {data.opportunityLevel.toUpperCase()}
          </div>
        </div>

        {/* Sweep Alert */}
        {data.sweepDetected && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-400">Barrida de Liquidez Detectada</p>
                <p className="text-xs text-zinc-400 mt-1">{data.sweepInfo}</p>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Grid */}
        <div className="p-3 grid grid-cols-2 gap-3">
          {/* Trend */}
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-1">Tendencia 1H</p>
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className={`font-medium ${getTrendColor()}`}>{getTrendText()}</span>
              {data.trendStrength === 'strong' && (
                <span className="text-xs px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">Fuerte</span>
              )}
            </div>
          </div>

          {/* EMA 50 */}
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-1">EMA 50</p>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 font-mono text-sm">{data.ema50.toFixed(5)}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                data.priceVsEMA === 'above' ? 'bg-emerald-500/20 text-emerald-400' :
                data.priceVsEMA === 'below' ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {data.priceVsEMA === 'above' ? '↑ Encima' : data.priceVsEMA === 'below' ? '↓ Debajo' : '○ En EMA'}
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-1">Precio Actual</p>
            <span className="text-white font-mono text-lg">{data.currentPrice.toFixed(5)}</span>
          </div>

          {/* Zone Status */}
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-1">Estado de Zona</p>
            <div className="flex items-center gap-2">
              {data.priceInZone ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 text-sm">
                    En zona de {data.zoneType === 'support' ? 'soporte' : 'resistencia'}
                  </span>
                </>
              ) : (
                <>
                  <Minus className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-400 text-sm">Fuera de zona</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Zones Details */}
        <div className="p-3 border-t border-zinc-800 space-y-2">
          {/* Supports */}
          {data.supports.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-500/50" />
              <span className="text-xs text-zinc-400">Soporte:</span>
              <span className="text-xs text-emerald-400 font-mono">
                {data.supports.map(s => s.price.toFixed(5)).join(', ')}
              </span>
              {data.nearestSupport && (
                <span className="text-xs text-zinc-500">
                  ({data.nearestSupport.distance.toFixed(2)}%)
                </span>
              )}
            </div>
          )}

          {/* Resistances */}
          {data.resistances.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500/50" />
              <span className="text-xs text-zinc-400">Resistencia:</span>
              <span className="text-xs text-red-400 font-mono">
                {data.resistances.map(r => r.price.toFixed(5)).join(', ')}
              </span>
              {data.nearestResistance && (
                <span className="text-xs text-zinc-500">
                  ({data.nearestResistance.distance.toFixed(2)}%)
                </span>
              )}
            </div>
          )}

          {/* Liquidity */}
          {data.liquidityZones.length > 0 && (
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-xs text-zinc-400">Liquidez:</span>
              <span className="text-xs text-amber-400">
                {data.liquidityZones.map(l => `${l.type === 'buy_side' ? '↑' : '↓'}${l.price.toFixed(5)}`).join(' ')}
              </span>
            </div>
          )}
        </div>

        {/* Recommendation */}
        <div className="p-3 border-t border-zinc-800 bg-blue-500/5">
          <p className="text-sm text-zinc-300 leading-relaxed">{data.recommendation}</p>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>Última actualización: {data.lastUpdate.toLocaleTimeString('es-ES')}</span>
        <button 
          onClick={onRefresh}
          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Actualizar
        </button>
      </div>

      {/* Disclaimer */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-2 flex items-start gap-2">
        <Info className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-zinc-500">
          Esta herramienta indica zonas clave. Confirmar siempre antes de operar.
        </p>
      </div>
    </div>
  )
}

// ============================================
// ZONE OVERLAY COMPONENT
// ============================================

interface ZoneOverlayProps {
  supports: { price: number }[]
  resistances: { price: number }[]
  currentPrice: number
  ema50: number
}

function ZoneOverlay({ supports, resistances, currentPrice, ema50 }: ZoneOverlayProps) {
  // This is a visual representation of zones
  // Since TradingView widgets are iframes, we can't overlay directly
  // This shows a mini zone map instead
  
  const priceRange = Math.max(
    ...resistances.map(r => Math.abs(r.price - currentPrice)),
    ...supports.map(s => Math.abs(s.price - currentPrice)),
    Math.abs(ema50 - currentPrice)
  ) || currentPrice * 0.01

  const getPosition = (price: number): number => {
    const minPrice = currentPrice - priceRange
    const maxPrice = currentPrice + priceRange
    return ((maxPrice - price) / (maxPrice - minPrice)) * 100
  }

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-2">
      <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
        <Layers className="w-3 h-3" />
        Mapa de Zonas
      </p>
      <div className="relative h-24 bg-zinc-800/50 rounded overflow-hidden">
        {/* Resistances */}
        {resistances.slice(0, 2).map((r, i) => (
          <div
            key={`res-${i}`}
            className="absolute left-0 right-0 h-2 bg-red-500/30 border-y border-red-500/50"
            style={{ top: `${Math.max(5, Math.min(90, getPosition(r.price)))}%` }}
          >
            <span className="absolute right-1 -top-3 text-[8px] text-red-400">R{i + 1}</span>
          </div>
        ))}
        
        {/* EMA 50 */}
        <div
          className="absolute left-0 right-0 h-0.5 bg-yellow-500"
          style={{ top: `${Math.max(5, Math.min(90, getPosition(ema50)))}%` }}
        >
          <span className="absolute right-1 -top-3 text-[8px] text-yellow-400">EMA</span>
        </div>
        
        {/* Current Price Line */}
        <div
          className="absolute left-0 right-0 h-0.5 bg-blue-500"
          style={{ top: '50%' }}
        >
          <span className="absolute right-1 -top-3 text-[8px] text-blue-400">AHORA</span>
        </div>
        
        {/* Supports */}
        {supports.slice(0, 2).map((s, i) => (
          <div
            key={`sup-${i}`}
            className="absolute left-0 right-0 h-2 bg-emerald-500/30 border-y border-emerald-500/50"
            style={{ top: `${Math.max(5, Math.min(90, getPosition(s.price)))}%` }}
          >
            <span className="absolute right-1 -top-3 text-[8px] text-emerald-400">S{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AnalysisPanelScreen() {
  const { selectedPair, pairInfo } = useSelectedPair()
  const { data: analysisData, refresh } = useAnalysisData(selectedPair)
  const [fullscreenChart, setFullscreenChart] = useState<FullscreenChart>(null)

  const charts = [
    { id: 'chart1', title: 'Diario (1D)', interval: 'D', timeframe: '1D' },
    { id: 'chart2', title: '1 Hora (1H)', interval: '60', timeframe: '1H' },
    { id: 'chart3', title: '5 Minutos (5M)', interval: '5', timeframe: '5M' }
  ]

  const symbol = getTradingViewSymbol(selectedPair)

  const handleFullscreen = useCallback((chartId: FullscreenChart) => {
    setFullscreenChart(chartId)
  }, [])

  const closeFullscreen = useCallback(() => {
    setFullscreenChart(null)
  }, [])

  if (fullscreenChart) {
    const chart = charts.find(c => c.id === fullscreenChart)!
    return (
      <TradingViewWidget
        symbol={symbol}
        interval={chart.interval}
        height="100vh"
        fullscreen={true}
        onCloseFullscreen={closeFullscreen}
      />
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <TrendingUp className="w-7 h-7 text-blue-400" />
          <h1 className="text-2xl font-bold">Panel de Análisis</h1>
        </div>
        <p className="text-sm text-zinc-400">Análisis visual multi-temporal</p>
      </div>

      {/* Active Pair Banner */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">Par Activo</p>
              <p className="text-lg font-bold text-blue-400">
                {selectedPair || 'EUR/USD'}
              </p>
              {pairInfo && (
                <p className="text-xs text-zinc-500">{pairInfo.name}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-400">Temporalidades</p>
            <div className="flex gap-2 mt-1">
              <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs">1D</span>
              <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs">1H</span>
              <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs">5M</span>
            </div>
          </div>
        </div>
      </div>

      {/* No pair selected warning */}
      {!selectedPair && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-zinc-400">
            Sin par seleccionado. Ve a "Mercado" para seleccionar. Mostrando EUR/USD por defecto.
          </p>
        </div>
      )}

      {/* Visual Guide Panel */}
      <VisualGuide data={analysisData} onRefresh={refresh} />

      {/* Zone Map */}
      {!analysisData.isLoading && !analysisData.error && (
        <ZoneOverlay
          supports={analysisData.supports}
          resistances={analysisData.resistances}
          currentPrice={analysisData.currentPrice}
          ema50={analysisData.ema50}
        />
      )}

      {/* Charts Grid */}
      <div className="space-y-3">
        {/* Top row: 1D and 1H */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Chart 1: 1D */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium">Diario (1D)</span>
                <span className="text-[10px] text-zinc-500">Tendencia</span>
              </div>
              <button
                onClick={() => handleFullscreen('chart1')}
                className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
                title="Pantalla completa"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
            <div className="p-1">
              <TradingViewWidget symbol={symbol} interval="D" height="200px" />
            </div>
          </div>

          {/* Chart 2: 1H */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium">1 Hora (1H)</span>
                <span className="text-[10px] text-zinc-500">Entradas</span>
              </div>
              <button
                onClick={() => handleFullscreen('chart2')}
                className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
                title="Pantalla completa"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
            <div className="p-1">
              <TradingViewWidget symbol={symbol} interval="60" height="200px" />
            </div>
          </div>
        </div>

        {/* Bottom: 5M (larger) */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium">5 Minutos (5M)</span>
              <span className="text-[10px] text-zinc-500">Ejecución</span>
            </div>
            <button
              onClick={() => handleFullscreen('chart3')}
              className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
              title="Pantalla completa"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
          <div className="p-1">
            <TradingViewWidget symbol={symbol} interval="5" height="240px" />
          </div>
        </div>
      </div>
    </div>
  )
}
