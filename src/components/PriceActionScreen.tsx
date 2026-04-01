'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Target,
  Zap,
  Info,
  ChevronUp,
  ChevronDown,
  Minus
} from 'lucide-react'
import { useSelectedPair } from '../contexts/SelectedPairContext'

// ============================================
// TYPES
// ============================================

interface CandlePattern {
  type: string
  direction: 'bullish' | 'bearish' | 'neutral'
  strength: 'fuerte' | 'moderado' | 'débil'
  description: string
  timestamp: string
}

interface PriceActionAnalysis {
  symbol: string
  currentPrice: number
  timestamp: string
  trend: {
    direction: 'alcista' | 'bajista' | 'lateral'
    strength: 'Alto' | 'Medio' | 'Bajo'
    structure: string
    ema20: number
    ema50: number
    priceAboveEMA20: boolean
    priceAboveEMA50: boolean
  }
  patterns: CandlePattern[]
  recentCandles: {
    open: number
    high: number
    low: number
    close: number
    direction: 'bullish' | 'bearish'
    body: number
    upperWick: number
    lowerWick: number
    timestamp: string
  }[]
  keyLevels: {
    resistance: number[]
    support: number[]
  }
  summary: string
}

// ============================================
// COMPONENT
// ============================================

export default function PriceActionScreen() {
  const { selectedPair, pairInfo } = useSelectedPair()
  const [analysis, setAnalysis] = useState<PriceActionAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Fetch price action analysis
  const fetchAnalysis = useCallback(async () => {
    if (!selectedPair) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/market?action=price-action&symbol=${encodeURIComponent(selectedPair)}`)
      const data = await response.json()
      
      if (data && data.symbol) {
        setAnalysis(data)
        setLastUpdate(new Date())
      } else {
        setError('No se pudieron obtener los datos')
      }
    } catch (err) {
      console.error('Error fetching price action:', err)
      setError('Error al cargar análisis')
    } finally {
      setIsLoading(false)
    }
  }, [selectedPair])

  // Load analysis when pair changes
  useEffect(() => {
    if (selectedPair) {
      fetchAnalysis()
    }
  }, [selectedPair, fetchAnalysis])

  // No pair selected
  if (!selectedPair) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Target className="w-7 h-7 text-purple-400" />
            <h1 className="text-2xl font-bold">Price Action</h1>
          </div>
          <p className="text-sm text-zinc-400">Análisis de estructura y velas</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-amber-500/10 rounded-full">
              <Target className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          <p className="font-medium mb-2">No hay par seleccionado</p>
          <p className="text-sm text-zinc-400">
            👉 Selecciona un par en <strong>Mercado en Vivo</strong> para comenzar
          </p>
        </div>

        <div className="flex items-start gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <Info className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-purple-300">
            <strong>Price Action</strong> analiza la estructura del mercado, detecta patrones de velas como envolventes, martillos y dojis, e identifica niveles clave de soporte y resistencia.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Target className="w-7 h-7 text-purple-400" />
          <h1 className="text-2xl font-bold">Price Action</h1>
        </div>
        <p className="text-sm text-zinc-400">Análisis de estructura y velas</p>
      </div>

      {/* Active Pair Banner */}
      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          <span className="text-sm text-zinc-400">Par activo:</span>
          <span className="font-bold text-lg">{selectedPair}</span>
          {pairInfo && (
            <span className="text-xs text-zinc-500">({pairInfo.name})</span>
          )}
        </div>
        <button
          onClick={fetchAnalysis}
          disabled={isLoading}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
          <Loader2 className="w-10 h-10 text-purple-400 mx-auto animate-spin mb-3" />
          <p className="text-sm text-zinc-400">Analizando {selectedPair}...</p>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !isLoading && (
        <div className="space-y-4">
          {/* Current Price */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">Precio actual (1H)</p>
                <p className="text-2xl font-mono font-bold">
                  {analysis.currentPrice.toFixed(selectedPair.includes('JPY') ? 3 : 5)}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                analysis.trend.direction === 'alcista' 
                  ? 'bg-emerald-500/20' 
                  : analysis.trend.direction === 'bajista'
                  ? 'bg-red-500/20'
                  : 'bg-zinc-500/20'
              }`}>
                {analysis.trend.direction === 'alcista' ? (
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                ) : analysis.trend.direction === 'bajista' ? (
                  <TrendingDown className="w-6 h-6 text-red-400" />
                ) : (
                  <Minus className="w-6 h-6 text-zinc-400" />
                )}
              </div>
            </div>
          </div>

          {/* Trend Analysis */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Tendencia
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <p className="text-xs text-zinc-500">Dirección</p>
                <div className="flex items-center gap-2 mt-1">
                  {analysis.trend.direction === 'alcista' ? (
                    <ChevronUp className="w-5 h-5 text-emerald-400" />
                  ) : analysis.trend.direction === 'bajista' ? (
                    <ChevronDown className="w-5 h-5 text-red-400" />
                  ) : (
                    <Minus className="w-5 h-5 text-zinc-400" />
                  )}
                  <span className={`font-medium capitalize ${
                    analysis.trend.direction === 'alcista' 
                      ? 'text-emerald-400' 
                      : analysis.trend.direction === 'bajista' 
                      ? 'text-red-400' 
                      : 'text-zinc-400'
                  }`}>
                    {analysis.trend.direction}
                  </span>
                </div>
              </div>
              
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <p className="text-xs text-zinc-500">Fuerza</p>
                <p className={`font-medium mt-1 ${
                  analysis.trend.strength === 'Alto' 
                    ? 'text-emerald-400' 
                    : analysis.trend.strength === 'Medio' 
                    ? 'text-amber-400' 
                    : 'text-zinc-400'
                }`}>
                  {analysis.trend.strength}
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <p className="text-xs text-zinc-500">EMA 20</p>
                <p className="font-mono">{analysis.trend.ema20.toFixed(5)}</p>
                <p className={`text-xs mt-1 ${analysis.trend.priceAboveEMA20 ? 'text-emerald-400' : 'text-red-400'}`}>
                  Precio {analysis.trend.priceAboveEMA20 ? 'sobre' : 'bajo'} EMA20
                </p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <p className="text-xs text-zinc-500">EMA 50</p>
                <p className="font-mono">{analysis.trend.ema50.toFixed(5)}</p>
                <p className={`text-xs mt-1 ${analysis.trend.priceAboveEMA50 ? 'text-emerald-400' : 'text-red-400'}`}>
                  Precio {analysis.trend.priceAboveEMA50 ? 'sobre' : 'bajo'} EMA50
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-400 mt-3">{analysis.trend.structure}</p>
          </div>

          {/* Candle Patterns */}
          {analysis.patterns.length > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Patrones Detectados
              </h3>
              
              <div className="space-y-3">
                {analysis.patterns.map((pattern, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${
                      pattern.direction === 'bullish' 
                        ? 'bg-emerald-500/10 border-emerald-500/20' 
                        : pattern.direction === 'bearish'
                        ? 'bg-red-500/10 border-red-500/20'
                        : 'bg-zinc-800/50 border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{pattern.type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        pattern.strength === 'fuerte' 
                          ? 'bg-amber-500/20 text-amber-400' 
                          : pattern.strength === 'moderado'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-zinc-500/20 text-zinc-400'
                      }`}>
                        {pattern.strength}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">{pattern.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Candles */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <h3 className="font-semibold mb-3">Últimas 5 Velas (1H)</h3>
            
            <div className="space-y-2">
              {analysis.recentCandles.map((candle, index) => (
                <div 
                  key={index}
                  className={`p-2 rounded-lg flex items-center justify-between ${
                    candle.direction === 'bullish' 
                      ? 'bg-emerald-500/10' 
                      : 'bg-red-500/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${
                      candle.direction === 'bullish' ? 'bg-emerald-400' : 'bg-red-400'
                    }`} />
                    <span className="text-xs text-zinc-500">
                      {new Date(candle.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-xs font-mono">
                    <span className="text-zinc-400">O:</span> {candle.open.toFixed(selectedPair.includes('JPY') ? 3 : 5)}
                    <span className="text-zinc-400 ml-2">H:</span> {candle.high.toFixed(selectedPair.includes('JPY') ? 3 : 5)}
                    <span className="text-zinc-400 ml-2">L:</span> {candle.low.toFixed(selectedPair.includes('JPY') ? 3 : 5)}
                    <span className="text-zinc-400 ml-2">C:</span> {candle.close.toFixed(selectedPair.includes('JPY') ? 3 : 5)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Levels */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <h3 className="font-semibold mb-3">Niveles Clave</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-zinc-500 mb-2">Resistencias</p>
                <div className="space-y-1">
                  {analysis.keyLevels.resistance.map((level, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <ChevronUp className="w-4 h-4 text-red-400" />
                      <span className="font-mono">{level.toFixed(selectedPair.includes('JPY') ? 3 : 5)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-2">Soportes</p>
                <div className="space-y-1">
                  {analysis.keyLevels.support.map((level, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <ChevronDown className="w-4 h-4 text-emerald-400" />
                      <span className="font-mono">{level.toFixed(selectedPair.includes('JPY') ? 3 : 5)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4">
            <h3 className="font-semibold mb-2">📋 Resumen</h3>
            <p className="text-sm text-zinc-300">{analysis.summary}</p>
          </div>

          {/* Last Update */}
          {lastUpdate && (
            <p className="text-xs text-zinc-500 text-center">
              Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}
            </p>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-300">
          El análisis de price action es una herramienta de referencia. Siempre confirma con múltiples temporalidades y gestiona tu riesgo adecuadamente.
        </p>
      </div>
    </div>
  )
}
