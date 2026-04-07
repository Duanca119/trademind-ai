'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Maximize2, Minimize2, TrendingUp, Clock, AlertCircle } from 'lucide-react'
import { useSelectedPair } from '../contexts/SelectedPairContext'

// ============================================
// TYPES
// ============================================

interface ChartConfig {
  id: string
  title: string
  interval: string
  timeframe: string
  height: string
}

type FullscreenChart = 'chart1' | 'chart2' | 'chart3' | null

// ============================================
// TRADINGVIEW SYMBOL MAPPING
// ============================================

// Convert pair format: EUR/USD -> OANDA:EURUSD
const getTradingViewSymbol = (pair: string | null): string => {
  if (!pair) return 'OANDA:EURUSD'
  
  // Remove the slash and add OANDA prefix (popular forex broker)
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
  const widgetRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    // Clear previous widget
    containerRef.current.innerHTML = ''

    // Create widget container
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

    // Set loaded after a delay
    const timer = setTimeout(() => setIsLoaded(true), 1000)

    return () => {
      clearTimeout(timer)
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [symbol, interval])

  // Fullscreen overlay
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
// MAIN COMPONENT
// ============================================

export default function AnalysisPanelScreen() {
  const { selectedPair, pairInfo } = useSelectedPair()
  const [fullscreenChart, setFullscreenChart] = useState<FullscreenChart>(null)

  // Chart configurations
  const charts: ChartConfig[] = [
    { id: 'chart1', title: 'Diario (1D)', interval: 'D', timeframe: '1D', height: '280px' },
    { id: 'chart2', title: '1 Hora (1H)', interval: '60', timeframe: '1H', height: '280px' },
    { id: 'chart3', title: '5 Minutos (5M)', interval: '5', timeframe: '5M', height: '320px' }
  ]

  const symbol = getTradingViewSymbol(selectedPair)

  const handleFullscreen = useCallback((chartId: FullscreenChart) => {
    setFullscreenChart(chartId)
  }, [])

  const closeFullscreen = useCallback(() => {
    setFullscreenChart(null)
  }, [])

  // Fullscreen chart render
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
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4">
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
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-400">Sin par seleccionado</p>
            <p className="text-xs text-zinc-400 mt-1">
              Ve a "Mercado" para seleccionar un par. Mostrando EUR/USD por defecto.
            </p>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="space-y-3">
        {/* Top row: 1D and 1H */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Chart 1: 1D */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium">Diario (1D)</span>
                <span className="text-xs text-zinc-500 ml-1">Tendencia principal</span>
              </div>
              <button
                onClick={() => handleFullscreen('chart1')}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                title="Pantalla completa"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2">
              <TradingViewWidget
                symbol={symbol}
                interval="D"
                height="280px"
              />
            </div>
          </div>

          {/* Chart 2: 1H */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">1 Hora (1H)</span>
                <span className="text-xs text-zinc-500 ml-1">Zonas de entrada</span>
              </div>
              <button
                onClick={() => handleFullscreen('chart2')}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                title="Pantalla completa"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2">
              <TradingViewWidget
                symbol={symbol}
                interval="60"
                height="280px"
              />
            </div>
          </div>
        </div>

        {/* Bottom: 5M (larger) */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium">5 Minutos (5M)</span>
              <span className="text-xs text-zinc-500 ml-1">Ejecución de entradas</span>
            </div>
            <button
              onClick={() => handleFullscreen('chart3')}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              title="Pantalla completa"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2">
            <TradingViewWidget
              symbol={symbol}
              interval="5"
              height="320px"
            />
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-3">
        <p className="text-xs text-zinc-500 text-center">
          💡 Gráficos de TradingView • Cambia el par en "Mercado" para analizar otro par
        </p>
      </div>
    </div>
  )
}
