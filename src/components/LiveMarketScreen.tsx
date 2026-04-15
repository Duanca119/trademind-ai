'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Activity,
  Globe,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Info,
  Zap,
  Loader2,
  AlertTriangle,
  Check,
  Plus,
  X,
  Eye,
  Target,
  Clock,
  Bell,
  BellOff,
  Crosshair
} from 'lucide-react'
import { useSelectedPair } from '../contexts/SelectedPairContext'

// ============================================
// TYPES
// ============================================

interface MarketStatus {
  sessions: {
    asia: { name: string; isOpen: boolean }
    london: { name: string; isOpen: boolean }
    newYork: { name: string; isOpen: boolean }
  }
  currentTime: string
  utcHour: number
  utcMinute: number
}

interface TrendAnalysis {
  direction: 'bullish' | 'bearish' | 'sideways'
  ema50: number
  currentPrice: number
  priceAboveEMA: boolean
  distanceToEMA: number
  structure: string
  strength: 'Alto' | 'Medio' | 'Bajo'
}

interface PairAnalysis {
  symbol: string
  trend1D: TrendAnalysis
  trend1H: TrendAnalysis | null
  isAligned: boolean
  isNearEMA: boolean
  shouldAlert: boolean
  status: 'watching' | 'in_zone' | 'cooldown'
  reason: string
  timestamp: string
}

interface ForexPair {
  symbol: string
  name: string
  type: 'major' | 'cross'
}

const FOREX_PAIRS: ForexPair[] = [
  // Major pairs
  { symbol: 'EUR/USD', name: 'Euro / Dólar', type: 'major' },
  { symbol: 'GBP/USD', name: 'Libra / Dólar', type: 'major' },
  { symbol: 'USD/JPY', name: 'Dólar / Yen', type: 'major' },
  { symbol: 'USD/CHF', name: 'Dólar / Franco', type: 'major' },
  { symbol: 'AUD/USD', name: 'Aussie / Dólar', type: 'major' },
  { symbol: 'USD/CAD', name: 'Dólar / Loonie', type: 'major' },
  { symbol: 'NZD/USD', name: 'Kiwi / Dólar', type: 'major' },
  // Cross pairs
  { symbol: 'EUR/GBP', name: 'Euro / Libra', type: 'cross' },
  { symbol: 'EUR/JPY', name: 'Euro / Yen', type: 'cross' },
  { symbol: 'GBP/JPY', name: 'Libra / Yen', type: 'cross' },
  { symbol: 'EUR/AUD', name: 'Euro / Aussie', type: 'cross' },
  { symbol: 'GBP/AUD', name: 'Libra / Aussie', type: 'cross' },
  { symbol: 'AUD/JPY', name: 'Aussie / Yen', type: 'cross' },
  { symbol: 'EUR/CHF', name: 'Euro / Franco', type: 'cross' },
  { symbol: 'GBP/CHF', name: 'Libra / Franco', type: 'cross' },
  { symbol: 'AUD/CHF', name: 'Aussie / Franco', type: 'cross' },
  { symbol: 'NZD/JPY', name: 'Kiwi / Yen', type: 'cross' },
  { symbol: 'EUR/CAD', name: 'Euro / Loonie', type: 'cross' },
  { symbol: 'GBP/CAD', name: 'Libra / Loonie', type: 'cross' },
  { symbol: 'AUD/CAD', name: 'Aussie / Loonie', type: 'cross' },
  { symbol: 'AUD/NZD', name: 'Aussie / Kiwi', type: 'cross' },
  { symbol: 'CAD/JPY', name: 'Loonie / Yen', type: 'cross' }
]

// ============================================
// LIVE MARKET SCREEN COMPONENT
// ============================================

export default function LiveMarketScreen() {
  // Get global selected pair context
  const { selectedPair: globalSelectedPair, setSelectedPair: setGlobalSelectedPair } = useSelectedPair()
  
  // State
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null)
  const [selectedPairs, setSelectedPairs] = useState<string[]>([])
  const [inZonePairs, setInZonePairs] = useState<PairAnalysis[]>([])
  const [watchingPairs, setWatchingPairs] = useState<PairAnalysis[]>([])
  const [cooldownPairs, setCooldownPairs] = useState<PairAnalysis[]>([])
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false)
  const [isLoadingPairs, setIsLoadingPairs] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [expandedPair, setExpandedPair] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [showPairSelector, setShowPairSelector] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [sentAlerts, setSentAlerts] = useState<Set<string>>(new Set())

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted')
      
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationsEnabled(permission === 'granted')
        })
      }
    }
  }, [])

  // Fetch market status
  const fetchMarketStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/market?action=status')
      const data = await response.json()
      setMarketStatus(data)
    } catch (error) {
      console.error('Error fetching market status:', error)
    }
  }, [])

  // Load selected pairs from API
  const loadSelectedPairs = useCallback(async () => {
    try {
      const response = await fetch('/api/market?action=selected-pairs')
      const data = await response.json()
      setSelectedPairs(data.selectedPairs || [])
    } catch (error) {
      console.error('Error loading selected pairs:', error)
    } finally {
      setIsLoadingPairs(false)
    }
  }, [])

  // Show notification
  const showNotification = useCallback((title: string, body: string) => {
    setNotification(body)
    setTimeout(() => setNotification(null), 8000)
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icons/icon-192x192.png', tag: 'trademind-alert' })
    }
  }, [])

  // Add pair to selection
  const addPair = useCallback(async (symbol: string) => {
    try {
      await fetch(`/api/market?action=select-pair&symbol=${encodeURIComponent(symbol)}`)
      setSelectedPairs(prev => [...prev, symbol])
    } catch (error) {
      console.error('Error adding pair:', error)
    }
  }, [])

  // Remove pair from selection
  const removePair = useCallback(async (symbol: string) => {
    try {
      await fetch(`/api/market?action=deselect-pair&symbol=${encodeURIComponent(symbol)}`)
      setSelectedPairs(prev => prev.filter(p => p !== symbol))
      setInZonePairs(prev => prev.filter(p => p.symbol !== symbol))
      setWatchingPairs(prev => prev.filter(p => p.symbol !== symbol))
      setCooldownPairs(prev => prev.filter(p => p.symbol !== symbol))
    } catch (error) {
      console.error('Error removing pair:', error)
    }
  }, [])

  // Run analysis
  const runAnalysis = useCallback(async () => {
    if (selectedPairs.length === 0) return
    
    setIsLoadingAnalysis(true)
    try {
      const response = await fetch('/api/market?action=analyze')
      const data = await response.json()
      
      setInZonePairs(data.inZonePairs || [])
      setWatchingPairs(data.watchingPairs || [])
      setCooldownPairs(data.cooldownPairs || [])
      setLastUpdate(new Date())
      
      // Send notifications for new alerts
      if (data.alerts && data.alerts.length > 0) {
        for (const alert of data.alerts) {
          // Only notify if we haven't sent this alert recently
          const alertKey = `${alert.symbol}-${Date.now().toString().slice(0, -5)}`
          if (!sentAlerts.has(alertKey)) {
            showNotification('⚠️ Zona de EMA 50', alert.message)
            setSentAlerts(prev => new Set([...prev, alertKey]))
            // Clean old alerts from tracking
            if (sentAlerts.size > 100) {
              setSentAlerts(new Set(Array.from(sentAlerts).slice(-50)))
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Error running analysis:', error)
    } finally {
      setIsLoadingAnalysis(false)
    }
  }, [selectedPairs.length, showNotification, sentAlerts])

  // Initial load
  useEffect(() => {
    fetchMarketStatus()
    loadSelectedPairs()
  }, [fetchMarketStatus, loadSelectedPairs])

  // Run analysis when pairs are loaded
  useEffect(() => {
    if (selectedPairs.length > 0 && !isLoadingPairs) {
      runAnalysis()
    }
  }, [selectedPairs, isLoadingPairs, runAnalysis])

  // Auto refresh every 2 minutes
  useEffect(() => {
    if (selectedPairs.length === 0) return
    
    const interval = setInterval(() => {
      fetchMarketStatus()
      runAnalysis()
    }, 120000) // 2 minutes
    
    return () => clearInterval(interval)
  }, [selectedPairs.length, fetchMarketStatus, runAnalysis])

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} UTC`
  }

  // Pair Card Component
  const PairCard = ({ pair, status }: { pair: PairAnalysis, status: 'in_zone' | 'watching' | 'cooldown' }) => {
    const isExpanded = expandedPair === pair.symbol
    
    return (
      <div 
        className={`rounded-xl border transition-all ${
          status === 'in_zone' 
            ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 border-amber-500/40' 
            : status === 'cooldown'
            ? 'bg-zinc-900/30 border-zinc-700/50 opacity-60'
            : 'bg-zinc-900/50 border-zinc-800'
        }`}
      >
        <button
          onClick={() => setExpandedPair(isExpanded ? null : pair.symbol)}
          className="w-full p-4 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                pair.trend1D?.direction === 'bullish' 
                  ? 'bg-emerald-500/20' 
                  : pair.trend1D?.direction === 'bearish'
                  ? 'bg-red-500/20'
                  : 'bg-zinc-500/20'
              }`}>
                {pair.trend1D?.direction === 'bullish' ? (
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                ) : pair.trend1D?.direction === 'bearish' ? (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                ) : (
                  <Activity className="w-5 h-5 text-zinc-400" />
                )}
              </div>
              
              <div>
                <p className="font-bold">{pair.symbol}</p>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  {status === 'in_zone' && (
                    <span className="text-amber-400 font-medium">⚡ En zona de entrada</span>
                  )}
                  {status === 'watching' && pair.isAligned && (
                    <span>Esperando acercamiento a EMA</span>
                  )}
                  {status === 'watching' && !pair.isAligned && (
                    <span>Tendencias no alineadas</span>
                  )}
                  {status === 'cooldown' && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      En cooldown
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              {status === 'in_zone' && (
                <div className="px-3 py-1 bg-amber-500/20 rounded-full text-xs font-medium text-amber-400 animate-pulse">
                  REVISAR 5M
                </div>
              )}
              {pair.trend1H && (
                <p className="text-sm font-mono mt-1">
                  {pair.trend1H.currentPrice.toFixed(pair.symbol.includes('JPY') ? 3 : 5)}
                </p>
              )}
            </div>
          </div>
          
          {pair.trend1H && (
            <div className="mt-3 flex items-center gap-4 text-xs">
              <span className={`flex items-center gap-1 ${
                pair.trend1H.distanceToEMA <= 0.2 
                  ? 'text-amber-400 font-medium' 
                  : 'text-zinc-400'
              }`}>
                {pair.trend1H.distanceToEMA <= 0.2 ? (
                  <Target className="w-3 h-3" />
                ) : (
                  <Activity className="w-3 h-3" />
                )}
                Dist. EMA: {pair.trend1H.distanceToEMA.toFixed(3)}%
              </span>
              
              {pair.isAligned && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Check className="w-3 h-3" />
                  1D + 1H alineados
                </span>
              )}
            </div>
          )}
        </button>
        
        {/* Expanded Details */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-3 border-t border-zinc-700/50 mt-2 pt-3">
            {/* 1D Analysis */}
            {pair.trend1D && (
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-blue-400">1D (Diario)</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    pair.trend1D.direction === 'bullish' 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : pair.trend1D.direction === 'bearish'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-zinc-500/20 text-zinc-400'
                  }`}>
                    {pair.trend1D.direction === 'bullish' ? 'Alcista' : 
                     pair.trend1D.direction === 'bearish' ? 'Bajista' : 'Lateral'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-500">EMA 50:</span>
                    <span className="ml-2 font-mono">{pair.trend1D.ema50.toFixed(5)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Precio:</span>
                    <span className="ml-2 font-mono">{pair.trend1D.currentPrice.toFixed(5)}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* 1H Analysis */}
            {pair.trend1H && (
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-purple-400">1H (1 Hora)</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    pair.trend1H.direction === 'bullish' 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : pair.trend1H.direction === 'bearish'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-zinc-500/20 text-zinc-400'
                  }`}>
                    {pair.trend1H.direction === 'bullish' ? 'Alcista' : 
                     pair.trend1H.direction === 'bearish' ? 'Bajista' : 'Lateral'}
                  </span>
                  {pair.trend1D?.direction === pair.trend1H.direction && (
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                      ✓ Alineado
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-500">EMA 50:</span>
                    <span className="ml-2 font-mono">{pair.trend1H.ema50.toFixed(5)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Precio:</span>
                    <span className="ml-2 font-mono">{pair.trend1H.currentPrice.toFixed(5)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-500">Distancia a EMA:</span>
                    <span className={`ml-2 font-medium ${
                      pair.trend1H.distanceToEMA <= 0.2 
                        ? 'text-amber-400' 
                        : pair.trend1H.distanceToEMA <= 0.5 
                        ? 'text-blue-400' 
                        : 'text-zinc-400'
                    }`}>
                      {pair.trend1H.distanceToEMA.toFixed(3)}%
                      {pair.trend1H.distanceToEMA <= 0.2 && ' ⚡ Zona de entrada'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Reason */}
            <div className="bg-zinc-800/30 rounded-lg p-3">
              <p className="text-xs text-zinc-400">{pair.reason}</p>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              {/* Select for Price Action button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setGlobalSelectedPair(pair.symbol)
                }}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
                  globalSelectedPair === pair.symbol
                    ? 'bg-purple-500/30 border border-purple-500/50 text-purple-300'
                    : 'bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400'
                }`}
              >
                <Crosshair className="w-4 h-4" />
                {globalSelectedPair === pair.symbol ? 'Par activo' : 'Usar en Price Action'}
              </button>
              
              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removePair(pair.symbol)
                }}
                className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-xs text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-black p-4 rounded-xl shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            <p className="font-medium text-sm">{notification}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity className="w-7 h-7 text-blue-400" />
          <h1 className="text-2xl font-bold">Mercado en Vivo</h1>
        </div>
        <p className="text-sm text-zinc-400">Filtro inteligente de zonas de entrada</p>
      </div>

      {/* Market Sessions */}
      <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold">Sesiones de Mercado</h3>
          </div>
          <div className="flex items-center gap-2">
            {notificationsEnabled ? (
              <Bell className="w-4 h-4 text-emerald-400" />
            ) : (
              <BellOff className="w-4 h-4 text-zinc-500" />
            )}
            {marketStatus && (
              <span className="text-xs text-zinc-400">
                {formatTime(marketStatus.utcHour, marketStatus.utcMinute)}
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {marketStatus?.sessions && Object.entries(marketStatus.sessions).map(([key, session]) => (
            <div 
              key={key}
              className={`p-3 rounded-lg text-center transition-all ${
                session.isOpen 
                  ? 'bg-emerald-500/20 border border-emerald-500/30' 
                  : 'bg-zinc-800/50 border border-zinc-700/50'
              }`}
            >
              <p className="text-xs text-zinc-400">{session.name}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <div className={`w-2 h-2 rounded-full ${session.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                <span className={`text-sm font-medium ${session.isOpen ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {session.isOpen ? 'Abierta' : 'Cerrada'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Pairs Count & Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-purple-400" />
          <span className="font-medium">Pares en vigilancia</span>
          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
            {selectedPairs.length} seleccionados
          </span>
        </div>
        
        <button
          onClick={() => setShowPairSelector(!showPairSelector)}
          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5 text-blue-400" />
        </button>
      </div>

      {/* Pair Selector */}
      {showPairSelector && (
        <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Seleccionar pares para vigilar</h3>
            <button
              onClick={() => setShowPairSelector(false)}
              className="p-1 hover:bg-zinc-700 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {FOREX_PAIRS.map((pair) => {
              const isSelected = selectedPairs.includes(pair.symbol)
              
              return (
                <button
                  key={pair.symbol}
                  onClick={() => isSelected ? removePair(pair.symbol) : addPair(pair.symbol)}
                  className={`p-3 rounded-lg text-left text-sm transition-all ${
                    isSelected 
                      ? 'bg-purple-500/20 border border-purple-500/40' 
                      : 'bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{pair.symbol}</p>
                      <p className="text-xs text-zinc-500">{pair.name}</p>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
          
          <p className="text-xs text-zinc-500 text-center">
            Solo los pares seleccionados serán analizados
          </p>
        </div>
      )}

      {/* No Pairs Selected */}
      {!isLoadingPairs && selectedPairs.length === 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-purple-500/10 rounded-full">
              <Eye className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <p className="font-medium mb-2">No hay pares seleccionados</p>
          <p className="text-sm text-zinc-400 mb-4">
            Selecciona los pares que quieres vigilar para recibir alertas precisas
          </p>
          <button
            onClick={() => setShowPairSelector(true)}
            className="py-2 px-4 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Añadir pares
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoadingAnalysis && selectedPairs.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
          <Loader2 className="w-8 h-8 text-blue-400 mx-auto animate-spin mb-3" />
          <p className="text-sm text-zinc-400">Analizando pares seleccionados...</p>
        </div>
      )}

      {/* Pares en Zona de Entrada (IN_ZONE) */}
      {!isLoadingAnalysis && inZonePairs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-amber-400">Pares en zona de entrada</h2>
            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full animate-pulse">
              {inZonePairs.length} {inZonePairs.length === 1 ? 'par' : 'pares'}
            </span>
          </div>
          
          {inZonePairs.map((pair) => (
            <PairCard key={pair.symbol} pair={pair} status="in_zone" />
          ))}
        </div>
      )}

      {/* Pares en Vigilancia (WATCHING) */}
      {!isLoadingAnalysis && watchingPairs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold">En vigilancia</h2>
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
              {watchingPairs.length} {watchingPairs.length === 1 ? 'par' : 'pares'}
            </span>
          </div>
          
          {watchingPairs.map((pair) => (
            <PairCard key={pair.symbol} pair={pair} status="watching" />
          ))}
        </div>
      )}

      {/* Pares en Cooldown */}
      {!isLoadingAnalysis && cooldownPairs.length > 0 && (
        <div className="space-y-3">
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer">
              <Clock className="w-5 h-5 text-zinc-500" />
              <h2 className="text-lg font-medium text-zinc-500">En cooldown</h2>
              <span className="px-2 py-1 bg-zinc-500/20 text-zinc-400 text-xs rounded-full">
                {cooldownPairs.length}
              </span>
              <span className="text-xs text-zinc-500 ml-2 group-open:hidden">(click para ver)</span>
            </summary>
            
            <div className="mt-3 space-y-2">
              {cooldownPairs.map((pair) => (
                <PairCard key={pair.symbol} pair={pair} status="cooldown" />
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Refresh Button */}
      {selectedPairs.length > 0 && (
        <button
          onClick={runAnalysis}
          disabled={isLoadingAnalysis}
          className="w-full py-3 px-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoadingAnalysis ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analizando...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Actualizar Análisis
            </>
          )}
        </button>
      )}

      {/* Last Update & Disclaimer */}
      {lastUpdate && (
        <div className="text-center space-y-2">
          <p className="text-xs text-zinc-500">
            Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}
          </p>
        </div>
      )}

      {/* Important Disclaimer */}
      <div className="space-y-2">
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-300">
            <strong>Importante:</strong> Las alertas indican zonas de interés. La entrada debe confirmarse manualmente en 5M.
          </p>
        </div>
        
        <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-300">
            <strong>Cómo funciona:</strong> Se analiza tendencia 1D + 1H. Solo se alerta cuando el precio está a ≤0.2% de la EMA 50 en 1H con tendencias alineadas.
          </p>
        </div>
      </div>
    </div>
  )
}
