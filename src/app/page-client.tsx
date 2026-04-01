'use client'

export const dynamic = 'force-dynamic'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BarChart3, 
  Shield, 
  History,
  ChevronUp,
  ChevronDown,
  Activity,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  Zap,
  Layers,
  Info,
  XCircle,
  AlertOctagon,
  Calendar,
  RefreshCw,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  Loader2,
  Ban,
  Newspaper,
  Heart,
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
  Sparkles,
  AlertCircle,
  TrendingUpIcon,
  Lightbulb,
  MessageSquareWarning,
  Clock4,
  Crosshair,
  TrendingDownIcon,
  Bell,
  BellRing,
  X,
  GraduationCap
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

// Import our custom hooks
import useRealtimeMarketData, { Timeframe, TimeframeAnalysis } from '@/hooks/use-realtime-market-data'
import useTradingAssistant, { EmotionalState, NewsDataState, TradeRecord } from '@/hooks/use-trading-assistant'
import useAlerts, { TradingAlert as TradingAlertHook, AlertType as AlertTypeHook } from '@/hooks/use-alerts'
import useForexScanner from '@/hooks/use-forex-scanner'
import { useTrades, useUserSettings, useWatchlist } from '@/hooks/use-supabase-data'
import { scanAllForexPairs, formatForexPrice } from '@/lib/forex-api'

// Import types
import { TradingZones, ASSETS, AssetConfig, getTradingViewSymbol, getAssetById, formatAssetPrice, isCryptoAsset, ForexPairAnalysis } from '@/types/trading'

// Import components
import { SupportResistanceZones } from '@/components/support-resistance-zones'
import { UnifiedDecisionCard, useTradingDecision } from '@/components/unified-decision-card'
import LearnTradingScreen from '@/components/learn-trading'

// Types
type Trend = 'bullish' | 'bearish' | 'sideways'
type SignalType = 'buy' | 'sell' | 'none'
type TabId = 'dashboard' | 'scanner' | 'operation' | 'charts' | 'analysis' | 'risk' | 'history' | 'news' | 'learn'

// ============================================
// MARKET STATUS & SESSIONS
// ============================================

interface TradingSessionInfo {
  name: string
  shortName: string
  startHour: number  // Hour in UTC
  endHour: number    // Hour in UTC
  isActive: boolean
  isKey: boolean     // Key sessions: London, New York
  color: string
}

function getColombiaTime(): { 
  day: number
  hour: number 
  minute: number 
  totalMinutes: number 
  dateStr: string 
  timeStr: string 
} {
  const now = new Date()
  
  // Colombia is GMT-5
  const colombiaOffset = -5
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  const colombiaTime = new Date(utc + (3600000 * colombiaOffset))
  
  const day = colombiaTime.getDay() // 0 = Sunday, 6 = Saturday
  const hour = colombiaTime.getHours()
  const minute = colombiaTime.getMinutes()
  const totalMinutes = hour * 60 + minute
  
  const dateStr = colombiaTime.toLocaleDateString('es-CO', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  })
  const timeStr = colombiaTime.toLocaleTimeString('es-CO', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  })
  
  return { day, hour, minute, totalMinutes, dateStr, timeStr }
}

function getMarketStatus(): { 
  isOpen: boolean
  message: string
  reason: string
  nextOpen?: string
} {
  const { day, hour } = getColombiaTime()
  
  // Sábado = Cerrado
  if (day === 6) {
    return { 
      isOpen: false, 
      message: 'Mercado Cerrado', 
      reason: 'Sábado - Mercado descansando',
      nextOpen: 'Domingo 17:00'
    }
  }
  
  // Domingo
  if (day === 0) {
    // Antes de las 17:00 = Cerrado
    if (hour < 17) {
      const hoursUntil = 17 - hour
      return { 
        isOpen: false, 
        message: 'Mercado Cerrado', 
        reason: 'Domingo - Abre a las 17:00',
        nextOpen: hoursUntil > 1 ? `Domingo 17:00 (~${hoursUntil} horas)` : 'Domingo 17:00 (~1 hora)'
      }
    }
    // Después de las 17:00 = Abierto
    return { 
      isOpen: true, 
      message: 'Mercado Abierto', 
      reason: 'Sesión dominical iniciada' 
    }
  }
  
  // Lunes a Viernes = Abierto
  const dayNames = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  return { 
    isOpen: true, 
    message: 'Mercado Abierto', 
    reason: `${dayNames[day]} - Sesión activa` 
  }
}

function getTradingSessions(): TradingSessionInfo[] {
  const { totalMinutes } = getColombiaTime()
  
  // Sessions in Colombia time (GMT-5)
  // Sydney: 16:00 - 01:00 (next day)
  // Tokyo: 18:00 - 03:00 (next day)  
  // London: 02:00 - 11:00
  // New York: 07:00 - 16:00
  
  const sessions: TradingSessionInfo[] = [
    {
      name: 'Sydney',
      shortName: 'SYD',
      startHour: 16,
      endHour: 1, // 01:00 next day
      isActive: totalMinutes >= 16 * 60 || totalMinutes < 1 * 60,
      isKey: false,
      color: 'purple'
    },
    {
      name: 'Tokyo',
      shortName: 'TKY',
      startHour: 18,
      endHour: 3, // 03:00 next day
      isActive: totalMinutes >= 18 * 60 || totalMinutes < 3 * 60,
      isKey: false,
      color: 'pink'
    },
    {
      name: 'London',
      shortName: 'LDN',
      startHour: 2,
      endHour: 11,
      isActive: totalMinutes >= 2 * 60 && totalMinutes < 11 * 60,
      isKey: true,
      color: 'blue'
    },
    {
      name: 'New York',
      shortName: 'NYC',
      startHour: 7,
      endHour: 16,
      isActive: totalMinutes >= 7 * 60 && totalMinutes < 16 * 60,
      isKey: true,
      color: 'emerald'
    }
  ]
  
  return sessions
}

// ============================================
// MARKET STATUS COMPONENT
// ============================================

function MarketStatusCard() {
  const [, forceUpdate] = useState(0)
  
  // Update every minute
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 60000)
    return () => clearInterval(interval)
  }, [])
  
  const marketStatus = getMarketStatus()
  const sessions = getTradingSessions()
  const { dateStr, timeStr } = getColombiaTime()
  
  const activeSessions = sessions.filter(s => s.isActive)
  const keySessionsActive = activeSessions.filter(s => s.isKey)
  
  const getSessionColor = (color: string, isActive: boolean) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
      pink: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
      blue: { bg: 'bg-[#3B82F6]/25', text: 'text-[#3B82F6]', border: 'border-[#3B82F6]/50' },
      emerald: { bg: 'bg-[#22C55E]/25', text: 'text-[#22C55E]', border: 'border-[#22C55E]/50' }
    }
    const c = colors[color] || colors.blue
    return isActive ? c : { bg: 'bg-zinc-700/30', text: 'text-zinc-500', border: 'border-zinc-600/30' }
  }
  
  return (
    <Card className={`border-2 ${marketStatus.isOpen ? 'bg-[#22C55E]/20 border-[#22C55E]/50' : 'bg-[#EF4444]/20 border-[#EF4444]/50'}`}>
      <CardContent className="p-3">
        {/* Market Status Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${marketStatus.isOpen ? 'bg-[#22C55E] animate-pulse' : 'bg-[#EF4444]'}`} />
            <span className={`font-bold ${marketStatus.isOpen ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
              {marketStatus.isOpen ? '🟢' : '🔴'} {marketStatus.message}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{dateStr}</p>
            <p className="text-sm font-bold">{timeStr}</p>
          </div>
        </div>
        
        {/* Market Closed Warning */}
        {!marketStatus.isOpen && (
          <div className="p-2 rounded bg-[#EF4444]/25 border border-[#EF4444]/50 mb-3">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-[#EF4444]" />
              <div>
                <p className="text-xs font-bold text-[#EF4444]">NO OPERAR</p>
                <p className="text-xs text-[#EF4444]/80">{marketStatus.reason}</p>
                {marketStatus.nextOpen && (
                  <p className="text-xs text-[#EF4444]">Próxima apertura: {marketStatus.nextOpen}</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Trading Sessions */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Sesiones de Trading:</p>
          <div className="grid grid-cols-4 gap-1.5">
            {sessions.map((session) => {
              const colors = getSessionColor(session.color, session.isActive)
              return (
                <div 
                  key={session.name}
                  className={`p-2 rounded text-center ${colors.bg} border ${colors.border} ${session.isKey ? 'ring-1 ring-white/10' : ''}`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${session.isActive ? 'bg-current' : 'bg-zinc-600'}`} />
                    <span className={`text-[10px] font-bold ${colors.text}`}>{session.shortName}</span>
                  </div>
                  <p className={`text-[9px] mt-0.5 ${session.isActive ? colors.text : 'text-zinc-600'}`}>
                    {session.isActive ? '🟢' : '⚪'}
                  </p>
                  {session.isKey && (
                    <p className="text-[8px] text-amber-400 mt-0.5">★ KEY</p>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Active Sessions Summary */}
          {activeSessions.length > 0 && (
            <div className="flex items-center gap-2 mt-2 p-2 rounded bg-cyan-500/10 border border-cyan-500/20">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <div className="flex-1">
                <p className="text-[10px] text-cyan-400 font-medium">
                  Sesiones activas: {activeSessions.map(s => s.name).join(', ')}
                </p>
                {keySessionsActive.length > 0 && (
                  <p className="text-[10px] text-amber-400">
                    ⭐ Mejor momento: {keySessionsActive.map(s => s.name).join(' + ')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// INTERFACES
// ============================================

interface TradingSignal {
  type: 'buy' | 'sell' | 'none'
  signalText: 'BUY' | 'SELL' | 'NO OPERAR'
  confidence: number
  entryPrice: number
  stopLoss: number
  takeProfit: number
  stopLossPercent: number
  takeProfitPercent: number
  riskRewardRatio: number
  reasons: string[]
  conditions: {
    trend1D: boolean
    trend1H: boolean
    trend15M: boolean
    rsiConfirm: boolean
    volumeConfirm: boolean
    allConditionsMet: boolean
  }
  trendDetails: {
    '1D': { trend: Trend; rsi: number; volumeUp: boolean }
    '1H': { trend: Trend; rsi: number; volumeUp: boolean }
    '15M': { trend: Trend; rsi: number; volumeUp: boolean }
  }
  // Multi-timeframe execution logic
  execution: {
    authorizedTimeframe: '1H' | 'none'  // Only 1H is authorized for execution
    isAligned: boolean                   // 1D and 1H aligned
    isConfirmed: boolean                 // 15M confirms direction
    canOperate: boolean                  // All conditions met for operation
    statusMessage: string                // Human-readable status
    executionMessage: string             // Action message
    priceInEntryZone: boolean            // Price is in entry zone
  }
}

interface AdvancedAnalysis {
  overallScore: number
  marketCondition: 'ALTA PROBABILIDAD DE SUBIDA' | 'ALTA PROBABILIDAD DE BAJADA' | 'MERCADO INCIERTO'
  institutionalInterest: boolean
  strongMovement: boolean
  volatilityLevel: 'low' | 'medium' | 'high'
  signals: string[]
  warnings: string[]
}

// ============================================
// ALERT SYSTEM INTERFACE
// ============================================

type AlertType = 'entry' | 'pre_entry' | 'stop_loss' | 'take_profit' | 'signal_change'

interface TradingAlert {
  id: string
  type: AlertType
  title: string
  message: string
  timestamp: Date
  price: number
  dismissed: boolean
  priority: 'high' | 'medium' | 'low'
}

interface AlertState {
  alerts: TradingAlert[]
  lastAlertTimes: Record<string, number>
  activeAlert: TradingAlert | null
  alertsEnabled: boolean
}

// Alert type configurations
const ALERT_CONFIG = {
  entry: {
    color: 'emerald',
    bgColor: 'bg-[#22C55E]',
    borderColor: 'border-[#22C55E]',
    textColor: 'text-[#22C55E]',
    bgLight: 'bg-[#22C55E]/25',
    icon: Target,
    priority: 'high' as const,
    cooldown: 30000 // 30 seconds
  },
  pre_entry: {
    color: 'amber',
    bgColor: 'bg-[#F59E0B]',
    borderColor: 'border-[#F59E0B]',
    textColor: 'text-[#F59E0B]',
    bgLight: 'bg-[#F59E0B]/25',
    icon: AlertTriangle,
    priority: 'medium' as const,
    cooldown: 60000 // 1 minute
  },
  stop_loss: {
    color: 'red',
    bgColor: 'bg-[#EF4444]',
    borderColor: 'border-[#EF4444]',
    textColor: 'text-[#EF4444]',
    bgLight: 'bg-[#EF4444]/25',
    icon: AlertOctagon,
    priority: 'high' as const,
    cooldown: 15000 // 15 seconds
  },
  take_profit: {
    color: 'blue',
    bgColor: 'bg-[#3B82F6]',
    borderColor: 'border-[#3B82F6]',
    textColor: 'text-[#3B82F6]',
    bgLight: 'bg-[#3B82F6]/25',
    icon: CheckCircle,
    priority: 'high' as const,
    cooldown: 30000 // 30 seconds
  },
  signal_change: {
    color: 'cyan',
    bgColor: 'bg-cyan-500',
    borderColor: 'border-cyan-500',
    textColor: 'text-cyan-500',
    bgLight: 'bg-cyan-500/20',
    icon: Zap,
    priority: 'medium' as const,
    cooldown: 60000 // 1 minute
  }
}

// ============================================
// SIGNAL GENERATION ENGINE
// ============================================

function detectTrend(ema20: number, ema50: number): Trend {
  if (!ema20 || !ema50) return 'sideways'
  const diff = ((ema20 - ema50) / ema50) * 100
  if (diff > 0.3) return 'bullish'
  if (diff < -0.3) return 'bearish'
  return 'sideways'
}

function isVolumeIncreasing(volume: number, volumeAvg: number): boolean {
  if (!volume || !volumeAvg) return false
  return volume > volumeAvg * 1.1
}

function calculateTradeLevels(
  price: number,
  direction: 'buy' | 'sell',
  stopLossPercent: number = 1.5,
  takeProfitPercent: number = 2.5
) {
  const entry = price
  if (direction === 'buy') {
    return {
      entry,
      stopLoss: price * (1 - stopLossPercent / 100),
      takeProfit: price * (1 + takeProfitPercent / 100),
      stopLossPercent,
      takeProfitPercent,
      riskRewardRatio: takeProfitPercent / stopLossPercent
    }
  } else {
    return {
      entry,
      stopLoss: price * (1 + stopLossPercent / 100),
      takeProfit: price * (1 - takeProfitPercent / 100),
      stopLossPercent,
      takeProfitPercent,
      riskRewardRatio: takeProfitPercent / stopLossPercent
    }
  }
}

function generateTradingSignal(
  analyses: Record<Timeframe, TimeframeAnalysis>,
  currentPrice: number,
  zones?: TradingZones
): TradingSignal {
  const reasons: string[] = []
  
  // ============================================
  // STEP 1: Analyze each timeframe independently
  // ============================================
  
  const trendDetails = {
    '1D': {
      trend: detectTrend(analyses['1D'].ema20, analyses['1D'].ema50),
      rsi: analyses['1D'].rsi || 50,
      volumeUp: isVolumeIncreasing(analyses['1D'].volume, analyses['1D'].volumeAvg)
    },
    '1H': {
      trend: detectTrend(analyses['1H'].ema20, analyses['1H'].ema50),
      rsi: analyses['1H'].rsi || 50,
      volumeUp: isVolumeIncreasing(analyses['1H'].volume, analyses['1H'].volumeAvg)
    },
    '15M': {
      trend: detectTrend(analyses['15M'].ema20, analyses['15M'].ema50),
      rsi: analyses['15M'].rsi || 50,
      volumeUp: isVolumeIncreasing(analyses['15M'].volume, analyses['15M'].volumeAvg)
    }
  }
  
  // ============================================
  // STEP 2: Multi-timeframe alignment check
  // ============================================
  
  // 1D defines MAIN TREND (direction filter)
  const mainTrend = trendDetails['1D'].trend
  
  // 1H defines EXECUTION (only timeframe authorized to operate)
  const executionTrend = trendDetails['1H'].trend
  
  // 15M provides CONFIRMATION (entry timing)
  const confirmationTrend = trendDetails['15M'].trend
  
  // Check alignment: 1D and 1H must match
  const isAligned1D1H = mainTrend === executionTrend && mainTrend !== 'sideways'
  
  // Check 15M confirmation
  const isConfirmed15M = confirmationTrend === executionTrend || confirmationTrend === 'sideways'
  
  // Check RSI conditions per timeframe
  const rsi1DValid = mainTrend === 'bullish' ? trendDetails['1D'].rsi > 50 : 
                    mainTrend === 'bearish' ? trendDetails['1D'].rsi < 50 : false
  const rsi1HValid = executionTrend === 'bullish' ? trendDetails['1H'].rsi > 55 : 
                     executionTrend === 'bearish' ? trendDetails['1H'].rsi < 45 : false
  const rsi15MValid = confirmationTrend === 'bullish' ? trendDetails['15M'].rsi > 50 : 
                      confirmationTrend === 'bearish' ? trendDetails['15M'].rsi < 50 : true
  
  // Volume confirmation in 1H (execution timeframe)
  const volumeConfirm = trendDetails['1H'].volumeUp
  
  // Price in entry zone (if zones provided)
  const priceInEntryZone = zones ? 
    (currentPrice >= zones.entryZone.low && currentPrice <= zones.entryZone.high) : true
  
  // ============================================
  // STEP 3: Determine if operation is allowed
  // ============================================
  
  let signalType: 'buy' | 'sell' | 'none' = 'none'
  let signalText: 'BUY' | 'SELL' | 'NO OPERAR' = 'NO OPERAR'
  let confidence = 0
  let canOperate = false
  let statusMessage = ''
  let executionMessage = ''
  
  // Calculate bullish conditions
  const bullishConditions = {
    mainDirection: mainTrend === 'bullish',
    executionAligned: executionTrend === 'bullish',
    confirmed: confirmationTrend === 'bullish' || confirmationTrend === 'sideways',
    rsi1D: trendDetails['1D'].rsi > 50,
    rsi1H: trendDetails['1H'].rsi > 55,
    rsi15M: trendDetails['15M'].rsi > 50,
    volume: volumeConfirm
  }
  
  // Calculate bearish conditions
  const bearishConditions = {
    mainDirection: mainTrend === 'bearish',
    executionAligned: executionTrend === 'bearish',
    confirmed: confirmationTrend === 'bearish' || confirmationTrend === 'sideways',
    rsi1D: trendDetails['1D'].rsi < 50,
    rsi1H: trendDetails['1H'].rsi < 45,
    rsi15M: trendDetails['15M'].rsi < 50,
    volume: volumeConfirm
  }
  
  // Calculate scores
  const bullishScore = Object.values(bullishConditions).filter(Boolean).length
  const bearishScore = Object.values(bearishConditions).filter(Boolean).length
  
  // BULLISH SIGNAL LOGIC
  if (bullishScore >= 5 && isAligned1D1H) {
    if (isConfirmed15M && priceInEntryZone) {
      signalType = 'buy'
      signalText = 'BUY'
      canOperate = true
      statusMessage = '✅ Operar en 1H con confirmación en 15M'
      executionMessage = '🎯 Ejecutar compra en timeframe 1H'
      confidence = 75 + (bullishScore - 5) * 3
      reasons.push('✓ 1D: Tendencia alcista (dirección principal)')
      reasons.push('✓ 1H: Alcista - Autorizado para operar')
      reasons.push('✓ 15M: Confirma dirección')
      reasons.push('✓ Precio en zona de entrada')
      if (volumeConfirm) reasons.push('✓ Volumen favorable')
    } else if (!isConfirmed15M) {
      signalType = 'none'
      signalText = 'NO OPERAR'
      statusMessage = '⏳ Esperar confirmación en 15M'
      executionMessage = '15M aún no confirma la dirección alcista'
      reasons.push('✓ 1D y 1H alineados alcistas')
      reasons.push('✗ 15M no confirma aún')
      reasons.push('⏳ Esperar señal en 15M')
    } else {
      signalType = 'none'
      signalText = 'NO OPERAR'
      statusMessage = '⏳ Precio fuera de zona de entrada'
      executionMessage = 'Esperar a que el precio llegue a la zona'
      reasons.push('✓ Tendencias alineadas')
      reasons.push('✗ Precio no está en zona de entrada')
    }
  }
  // BEARISH SIGNAL LOGIC
  else if (bearishScore >= 5 && isAligned1D1H) {
    if (isConfirmed15M && priceInEntryZone) {
      signalType = 'sell'
      signalText = 'SELL'
      canOperate = true
      statusMessage = '✅ Operar en 1H con confirmación en 15M'
      executionMessage = '🎯 Ejecutar venta en timeframe 1H'
      confidence = 75 + (bearishScore - 5) * 3
      reasons.push('✓ 1D: Tendencia bajista (dirección principal)')
      reasons.push('✓ 1H: Bajista - Autorizado para operar')
      reasons.push('✓ 15M: Confirma dirección')
      reasons.push('✓ Precio en zona de entrada')
      if (volumeConfirm) reasons.push('✓ Volumen favorable')
    } else if (!isConfirmed15M) {
      signalType = 'none'
      signalText = 'NO OPERAR'
      statusMessage = '⏳ Esperar confirmación en 15M'
      executionMessage = '15M aún no confirma la dirección bajista'
      reasons.push('✓ 1D y 1H alineados bajistas')
      reasons.push('✗ 15M no confirma aún')
      reasons.push('⏳ Esperar señal en 15M')
    } else {
      signalType = 'none'
      signalText = 'NO OPERAR'
      statusMessage = '⏳ Precio fuera de zona de entrada'
      executionMessage = 'Esperar a que el precio llegue a la zona'
      reasons.push('✓ Tendencias alineadas')
      reasons.push('✗ Precio no está en zona de entrada')
    }
  }
  // NO ALIGNMENT
  else {
    signalType = 'none'
    signalText = 'NO OPERAR'
    confidence = 0
    
    if (mainTrend === 'sideways') {
      statusMessage = '🚫 No operar - Mercado lateral en 1D'
      executionMessage = 'Tendencia principal no definida'
      reasons.push('✗ 1D: Mercado lateral (sin dirección clara)')
    } else if (executionTrend === 'sideways') {
      statusMessage = '🚫 No operar - 1H lateral'
      executionMessage = 'Timeframe de ejecución sin dirección'
      reasons.push(`✗ 1H: Lateral (no autorizado para operar)`)
      reasons.push(`ℹ️ 1D muestra ${mainTrend === 'bullish' ? 'alcista' : 'bajista'}`)
    } else if (!isAligned1D1H) {
      statusMessage = '🚫 No operar - Sin alineación 1D/1H'
      executionMessage = '1D y 1H no coinciden en dirección'
      reasons.push(`✗ 1D: ${mainTrend} ≠ 1H: ${executionTrend}`)
      reasons.push('✗ No hay alineación de tendencias')
    } else {
      statusMessage = '🚫 No operar - Condiciones no cumplidas'
      executionMessage = 'Esperar mejor configuración'
      if (!volumeConfirm) reasons.push('✗ Volumen bajo')
      if (mainTrend === 'bullish' && !bullishConditions.rsi1D) reasons.push('✗ RSI 1D no confirma')
      if (executionTrend === 'bullish' && !bullishConditions.rsi1H) reasons.push('✗ RSI 1H no confirma')
    }
  }
  
  confidence = Math.min(confidence, 95)
  
  const levels = calculateTradeLevels(currentPrice, signalType === 'buy' ? 'buy' : 'sell', 1.5, 2.5)
  
  return {
    type: signalType,
    signalText,
    confidence,
    entryPrice: currentPrice,
    stopLoss: levels.stopLoss,
    takeProfit: levels.takeProfit,
    stopLossPercent: levels.stopLossPercent,
    takeProfitPercent: levels.takeProfitPercent,
    riskRewardRatio: levels.riskRewardRatio,
    reasons,
    conditions: {
      trend1D: isAligned1D1H,
      trend1H: executionTrend !== 'sideways',
      trend15M: isConfirmed15M,
      rsiConfirm: signalType !== 'none',
      volumeConfirm,
      allConditionsMet: canOperate
    },
    trendDetails,
    execution: {
      authorizedTimeframe: canOperate ? '1H' : 'none',
      isAligned: isAligned1D1H,
      isConfirmed: isConfirmed15M,
      canOperate,
      statusMessage,
      executionMessage,
      priceInEntryZone
    }
  }
}

// ============================================
// ADVANCED ANALYSIS ENGINE
// ============================================

function generateAdvancedAnalysis(
  analyses: Record<Timeframe, TimeframeAnalysis>,
  signal: TradingSignal,
  newsSummary: { positive: number; negative: number; neutral: number },
  emotionalState: EmotionalState
): AdvancedAnalysis {
  const signals: string[] = []
  const warnings: string[] = []
  
  // Volume analysis
  const volume1D = analyses['1D'].volume
  const volumeAvg1D = analyses['1D'].volumeAvg
  const highVolume = volume1D > volumeAvg1D * 1.5
  const institutionalInterest = volume1D > volumeAvg1D * 2
  
  if (institutionalInterest) {
    signals.push('🏦 Interés institucional detectado')
  }
  
  // Volatility analysis (using price ranges)
  const atr1D = analyses['1D'].atr || 0
  const price = analyses['1D'].price || 1
  const volatilityPercent = (atr1D / price) * 100
  const volatilityLevel: 'low' | 'medium' | 'high' = 
    volatilityPercent > 5 ? 'high' : volatilityPercent > 2 ? 'medium' : 'low'
  
  if (volatilityLevel === 'high') {
    signals.push('📊 Alta volatilidad - Movimiento fuerte')
  }
  
  // News sentiment impact
  const newsImpact = newsSummary.positive - newsSummary.negative
  if (newsImpact > 2) {
    signals.push('📰 Noticias positivas dominantes')
  } else if (newsImpact < -2) {
    warnings.push('📰 Noticias negativas en el mercado')
  }
  
  // Emotional state warnings
  if (emotionalState.isImpulsiveRisk) {
    warnings.push('🧠 Riesgo de trading emocional detectado')
  }
  
  if (emotionalState.consecutiveLosses >= 2) {
    warnings.push('📉 Pérdidas consecutivas - Considera pausar')
  }
  
  // Calculate overall score
  let score = 50 // Base score
  
  // Signal contribution
  if (signal.type === 'buy') score += 25
  else if (signal.type === 'sell') score -= 25
  
  // Volume contribution
  if (highVolume) score += 10
  if (institutionalInterest) score += 5
  
  // News contribution
  score += newsImpact * 3
  
  // Emotional penalty
  if (emotionalState.isImpulsiveRisk) score -= 10
  
  score = Math.max(0, Math.min(100, score))
  
  // Determine market condition
  let marketCondition: AdvancedAnalysis['marketCondition']
  if (score >= 70) {
    marketCondition = 'ALTA PROBABILIDAD DE SUBIDA'
  } else if (score <= 30) {
    marketCondition = 'ALTA PROBABILIDAD DE BAJADA'
  } else {
    marketCondition = 'MERCADO INCIERTO'
  }
  
  return {
    overallScore: score,
    marketCondition,
    institutionalInterest,
    strongMovement: volatilityLevel === 'high',
    volatilityLevel,
    signals,
    warnings
  }
}

// ============================================
// TRADING ZONES CALCULATION ENGINE
// ============================================

function calculateTradingZones(
  analyses: Record<Timeframe, TimeframeAnalysis>,
  currentPrice: number,
  high24h: number,
  low24h: number,
  signal: TradingSignal
): TradingZones {
  // Get key data from 1H timeframe (best balance for zones)
  const analysis1H = analyses['1H']
  const analysis1D = analyses['1D']
  
  const atr = analysis1H.atr || analysis1D.atr || currentPrice * 0.02
  const ema20 = analysis1H.ema20 || currentPrice
  const ema50 = analysis1H.ema50 || currentPrice
  
  // Calculate support and resistance based on EMA and recent price action
  const volatilityFactor = atr / currentPrice
  
  // Support and resistance calculation
  const support = Math.min(low24h, ema50 - atr * 0.5)
  const resistance = Math.max(high24h, ema50 + atr * 0.5)
  
  // Determine direction from signal
  const direction = signal.type === 'buy' ? 'buy' : signal.type === 'sell' ? 'sell' : 'neutral'
  
  // Calculate zone width based on ATR (volatility)
  const zoneWidth = atr * 0.3 // 30% of ATR for zone width
  
  // Default values
  let entryZone = { high: currentPrice, low: currentPrice - zoneWidth, mid: currentPrice - zoneWidth / 2 }
  let stopLoss = currentPrice
  let takeProfit1 = currentPrice
  let takeProfit2 = currentPrice
  let riskRewardRatio = 0
  let message: TradingZones['message'] = 'sin_tendencia'
  let messageText = 'Sin tendencia clara definida'
  
  if (direction === 'buy') {
    // BUY: Entry near support
    const entryLow = support + atr * 0.1
    const entryHigh = support + atr * 0.4
    entryZone = {
      low: entryLow,
      high: entryHigh,
      mid: (entryLow + entryHigh) / 2
    }
    
    // Stop Loss below support
    stopLoss = support - atr * 0.5
    
    // Take Profit with minimum 2:1 ratio
    const risk = entryZone.mid - stopLoss
    takeProfit1 = entryZone.mid + risk * 2 // 2:1
    takeProfit2 = entryZone.mid + risk * 3 // 3:1
    riskRewardRatio = 2
    
    // Determine message based on current price vs entry zone
    if (currentPrice >= entryZone.low && currentPrice <= entryZone.high) {
      message = 'entrada_optima'
      messageText = '🎯 Entrada óptima detectada'
    } else if (currentPrice > entryZone.high) {
      message = 'esperar_retroceso'
      messageText = '⏳ Esperar retroceso a zona de entrada'
    } else {
      message = 'zona_no_segura'
      messageText = '⚠️ Zona no segura - Precio muy bajo'
    }
    
  } else if (direction === 'sell') {
    // SELL: Entry near resistance
    const entryLow = resistance - atr * 0.4
    const entryHigh = resistance - atr * 0.1
    entryZone = {
      low: entryLow,
      high: entryHigh,
      mid: (entryLow + entryHigh) / 2
    }
    
    // Stop Loss above resistance
    stopLoss = resistance + atr * 0.5
    
    // Take Profit with minimum 2:1 ratio
    const risk = stopLoss - entryZone.mid
    takeProfit1 = entryZone.mid - risk * 2 // 2:1
    takeProfit2 = entryZone.mid - risk * 3 // 3:1
    riskRewardRatio = 2
    
    // Determine message based on current price vs entry zone
    if (currentPrice >= entryZone.low && currentPrice <= entryZone.high) {
      message = 'entrada_optima'
      messageText = '🎯 Entrada óptima detectada'
    } else if (currentPrice < entryZone.low) {
      message = 'esperar_retroceso'
      messageText = '⏳ Esperar retroceso a zona de entrada'
    } else {
      message = 'zona_no_segura'
      messageText = '⚠️ Zona no segura - Precio muy alto'
    }
  }
  
  return {
    direction,
    entryZone,
    stopLoss,
    takeProfit1,
    takeProfit2,
    riskRewardRatio,
    message,
    messageText,
    support,
    resistance,
    atr
  }
}

// ============================================
// TREND ANALYSIS
// ============================================

function detectTrendWithRSI(ema20: number, ema50: number, rsi: number) {
  const emaDiff = ema50 > 0 ? ((ema20 - ema50) / ema50) * 100 : 0
  let emaCondition: 'bullish' | 'bearish' | 'neutral'
  
  if (emaDiff > 0.3) emaCondition = 'bullish'
  else if (emaDiff < -0.3) emaCondition = 'bearish'
  else emaCondition = 'neutral'
  
  let rsiCondition: 'bullish' | 'bearish' | 'neutral'
  if (rsi > 55) rsiCondition = 'bullish'
  else if (rsi < 45) rsiCondition = 'bearish'
  else rsiCondition = 'neutral'
  
  let trend: Trend
  let confidence: number
  let description: string
  
  if (emaCondition === 'bullish' && rsiCondition === 'bullish') {
    trend = 'bullish'; confidence = 90; description = 'EMA20 > EMA50 y RSI > 55'
  } else if (emaCondition === 'bearish' && rsiCondition === 'bearish') {
    trend = 'bearish'; confidence = 90; description = 'EMA20 < EMA50 y RSI < 45'
  } else if (emaCondition === 'bullish') {
    trend = 'bullish'; confidence = 70; description = 'EMA20 > EMA50'
  } else if (emaCondition === 'bearish') {
    trend = 'bearish'; confidence = 70; description = 'EMA20 < EMA50'
  } else {
    trend = 'sideways'; confidence = 60; description = 'RSI entre 45-55'
  }
  
  return { trend, emaCondition, rsiCondition, confidence, description }
}

function analyzeMarketTrend(analyses: Record<Timeframe, TimeframeAnalysis>) {
  const timeframes = Object.entries(analyses).reduce((acc, [tf, data]) => {
    if (data.ema20 && data.ema50 && data.rsi) {
      acc[tf as Timeframe] = detectTrendWithRSI(data.ema20, data.ema50, data.rsi)
    } else {
      acc[tf as Timeframe] = {
        trend: 'sideways' as Trend,
        emaCondition: 'neutral',
        rsiCondition: 'neutral',
        confidence: 50,
        description: 'Datos insuficientes'
      }
    }
    return acc
  }, {} as Record<Timeframe, { trend: Trend; emaCondition: 'bullish' | 'bearish' | 'neutral'; rsiCondition: 'bullish' | 'bearish' | 'neutral'; confidence: number; description: string }>)
  
  const bullishCount = Object.values(timeframes).filter(t => t.trend === 'bullish').length
  const bearishCount = Object.values(timeframes).filter(t => t.trend === 'bearish').length
  const sidewaysCount = Object.values(timeframes).filter(t => t.trend === 'sideways').length
  
  let alignment: 'strong_bullish' | 'strong_bearish' | 'mixed' | 'lateral'
  let conclusion: string
  let trend: Trend
  
  if (bullishCount === 3) {
    alignment = 'strong_bullish'; conclusion = 'FUERTE ALCISTA'; trend = 'bullish'
  } else if (bearishCount === 3) {
    alignment = 'strong_bearish'; conclusion = 'FUERTE BAJISTA'; trend = 'bearish'
  } else if (sidewaysCount >= 2) {
    alignment = 'lateral'; conclusion = 'MERCADO LATERAL'; trend = 'sideways'
  } else {
    alignment = 'mixed'; conclusion = 'SIN CONFIRMACIÓN'; trend = 'sideways'
  }
  
  return { timeframes, overall: { trend, conclusion, alignment, bullishCount, bearishCount, sidewaysCount } }
}

// ============================================
// COMPONENTS
// ============================================

function TrendBadge({ trend, size = 'md' }: { trend: Trend; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-3 py-1', lg: 'text-base px-4 py-1.5' }
  const trendConfig = {
    bullish: { icon: <TrendingUp className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />, label: 'Alcista', className: 'bg-[#22C55E]/25 text-[#22C55E] border-[#22C55E]/50' },
    bearish: { icon: <TrendingDown className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />, label: 'Bajista', className: 'bg-[#EF4444]/25 text-[#EF4444] border-[#EF4444]/50' },
    sideways: { icon: <Minus className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />, label: 'Lateral', className: 'bg-[#F59E0B]/25 text-[#F59E0B] border-[#F59E0B]/50' }
  }
  const config = trendConfig[trend]
  return (
    <Badge variant="outline" className={`flex items-center gap-1 ${config.className} ${sizeClasses[size]}`}>
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  )
}

function SignalCard({ signal }: { signal: TradingSignal }) {
  const isBuy = signal.type === 'buy'
  const isSell = signal.type === 'sell'
  const isNoTrade = signal.type === 'none'
  
  const colorScheme = isBuy ? {
    bg: 'from-[#22C55E]/25 to-[#22C55E]/5',
    border: 'border-[#22C55E]/50',
    text: 'text-[#22C55E]',
    bgLight: 'bg-[#22C55E]/25',
    bgLighter: 'bg-[#22C55E]/20',
    borderLight: 'border-[#22C55E]/50'
  } : isSell ? {
    bg: 'from-[#EF4444]/25 to-[#EF4444]/5',
    border: 'border-[#EF4444]/50',
    text: 'text-[#EF4444]',
    bgLight: 'bg-[#EF4444]/25',
    bgLighter: 'bg-[#EF4444]/20',
    borderLight: 'border-[#EF4444]/50'
  } : {
    bg: 'from-[#F59E0B]/25 to-[#F59E0B]/5',
    border: 'border-[#F59E0B]/50',
    text: 'text-[#F59E0B]',
    bgLight: 'bg-[#F59E0B]/25',
    bgLighter: 'bg-[#F59E0B]/20',
    borderLight: 'border-[#F59E0B]/50'
  }
  
  const Icon = isBuy ? TrendingUp : isSell ? TrendingDown : Ban
  
  return (
    <Card className={`bg-gradient-to-br ${colorScheme.bg} ${colorScheme.border}`}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-xl ${colorScheme.bgLight}`}>
              <Icon className={`w-8 h-8 ${colorScheme.text}`} />
            </div>
            <div>
              <Badge className={`text-2xl font-bold px-4 py-2 ${
                isBuy ? 'bg-[#22C55E] text-white' : 
                isSell ? 'bg-[#EF4444] text-white' : 
                'bg-[#F59E0B] text-white'
              }`}>
                {signal.signalText}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                {isNoTrade ? 'Esperar mejores condiciones' : 'Señal de Trading Activa'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Confianza</p>
            <p className={`text-3xl font-bold ${colorScheme.text}`}>{signal.confidence}%</p>
            <Progress value={signal.confidence} className="w-24 h-2 mt-1" />
          </div>
        </div>

        {(isBuy || isSell) && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Entrada</p>
                <p className="text-lg font-bold">${signal.entryPrice.toFixed(2)}</p>
              </div>
              <div className="bg-[#EF4444]/20 rounded-lg p-3 text-center border border-[#EF4444]/50">
                <p className="text-xs text-[#EF4444] mb-1">Stop Loss</p>
                <p className="text-lg font-bold text-[#EF4444]">${signal.stopLoss.toFixed(2)}</p>
                <p className="text-xs text-[#EF4444] mt-1">{isBuy ? '-' : '+'}{signal.stopLossPercent.toFixed(1)}%</p>
              </div>
              <div className="bg-[#22C55E]/20 rounded-lg p-3 text-center border border-[#22C55E]/50">
                <p className="text-xs text-[#22C55E] mb-1">Take Profit</p>
                <p className="text-lg font-bold text-[#22C55E]">${signal.takeProfit.toFixed(2)}</p>
                <p className="text-xs text-[#22C55E] mt-1">{isBuy ? '+' : '-'}{signal.takeProfitPercent.toFixed(1)}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between bg-background/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-500" />
                <span className="text-sm font-medium">Risk/Reward</span>
              </div>
              <Badge variant="outline" className="border-cyan-500 text-cyan-500 font-bold">1:{signal.riskRewardRatio.toFixed(1)}</Badge>
            </div>
          </>
        )}

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado de Condiciones</p>
          <div className="grid grid-cols-5 gap-1">
            {[ 
              { label: '1D', passed: signal.conditions.trend1D },
              { label: '1H', passed: signal.conditions.trend1H },
              { label: '15M', passed: signal.conditions.trend15M },
              { label: 'RSI', passed: signal.conditions.rsiConfirm },
              { label: 'VOL', passed: signal.conditions.volumeConfirm }
            ].map((c, i) => (
              <div key={i} className={`p-1.5 rounded text-center text-xs ${c.passed ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}>
                {c.passed ? <CheckCircle className="w-3 h-3 mx-auto" /> : <XCircle className="w-3 h-3 mx-auto" />}
                <span className="block mt-0.5">{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          {signal.reasons.map((reason, idx) => (
            <div key={idx} className={`text-sm ${isNoTrade ? 'text-amber-400' : colorScheme.text}`}>{reason}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// ASSET SELECTOR COMPONENT
// ============================================

function AssetSelector({ 
  selectedAsset, 
  onAssetChange 
}: { 
  selectedAsset: string
  onAssetChange: (assetId: string) => void 
}) {
  const cryptoAssets = ASSETS.filter(a => a.category === 'crypto')
  const forexAssets = ASSETS.filter(a => a.category === 'forex')
  const selectedAssetConfig = getAssetById(selectedAsset)
  
  return (
    <Card className="bg-[#111827] border-white/10">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{selectedAssetConfig?.icon || '📊'}</span>
          <div className="flex-1">
            <p className="text-sm font-bold">{selectedAssetConfig?.name || selectedAsset}</p>
            <p className="text-xs text-muted-foreground">{selectedAssetConfig?.description}</p>
          </div>
          <Badge 
            variant="outline" 
            className={selectedAssetConfig?.category === 'crypto' 
              ? 'border-orange-500/50 text-orange-500' 
              : 'border-[#3B82F6]/50 text-[#3B82F6]'
            }
          >
            {selectedAssetConfig?.category === 'crypto' ? 'CRYPTO' : 'FOREX'}
          </Badge>
        </div>
        
        <Select value={selectedAsset} onValueChange={onAssetChange}>
          <SelectTrigger className="w-full bg-background/50 border-white/10">
            <SelectValue placeholder="Seleccionar activo" />
          </SelectTrigger>
          <SelectContent>
            {/* Crypto Group */}
            <div className="px-2 py-1.5 text-xs font-semibold text-orange-500 uppercase tracking-wider">
              🪙 Criptomonedas
            </div>
            {cryptoAssets.map((asset) => (
              <SelectItem key={asset.id} value={asset.id}>
                <div className="flex items-center gap-2">
                  <span>{asset.icon}</span>
                  <span>{asset.name}</span>
                </div>
              </SelectItem>
            ))}
            
            {/* Forex Group */}
            <div className="px-2 py-1.5 text-xs font-semibold text-blue-500 uppercase tracking-wider mt-2">
              💱 Forex
            </div>
            {forexAssets.map((asset) => (
              <SelectItem key={asset.id} value={asset.id}>
                <div className="flex items-center gap-2">
                  <span>{asset.icon}</span>
                  <span>{asset.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}

function TradingViewCharts({ assetId }: { assetId: string }) {
  const charts = [
    { label: '1D', interval: '1D', title: 'Diario', icon: Calendar, color: 'emerald' },
    { label: '1H', interval: '60', title: '1 Hora', icon: Clock, color: 'cyan' },
    { label: '15M', interval: '15', title: '15 Minutos', icon: Clock4, color: 'amber' }
  ]
  
  const tradingViewSymbol = getTradingViewSymbol(assetId)
  
  const colorMap: Record<string, string> = {
    emerald: 'border-[#22C55E]/50 text-[#22C55E]',
    cyan: 'border-cyan-500/50 text-cyan-500',
    amber: 'border-[#F59E0B]/50 text-[#F59E0B]'
  }
  
  return (
    <div className="space-y-3">
      {charts.map((chart) => {
        const Icon = chart.icon
        
        return (
          <Card key={chart.label} className="bg-[#111827] border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-[#1E293B]/50">
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-zinc-500" />
                <Badge variant="outline" className={colorMap[chart.color]}>{chart.label}</Badge>
                <span className="text-xs text-muted-foreground">{chart.title}</span>
              </div>
              <span className="text-xs font-mono text-zinc-500">{tradingViewSymbol}</span>
            </div>
            <iframe 
              key={`${assetId}-${chart.label}`}
              src={`https://s.tradingview.com/widgetembed/?symbol=${tradingViewSymbol}&interval=${chart.interval}&theme=dark&style=1&timezone=America/Bogota&hide_top_toolbar=0&hide_legend=0&save_image=1`}
              width="100%" 
              height="280" 
              frameBorder="0"
              className="w-full"
              style={{ border: 'none' }}
              allowFullScreen
            />
          </Card>
        )
      })}
    </div>
  )
}

// ============================================
// VISUAL ZONES PANEL COMPONENT
// ============================================

function VisualZonesPanel({ zones, currentPrice }: { zones: TradingZones; currentPrice: number }) {
  // Calculate price range for visualization
  const allPrices = [
    zones.resistance,
    zones.support,
    zones.entryZone.high,
    zones.entryZone.low,
    zones.stopLoss,
    zones.takeProfit1,
    zones.takeProfit2,
    currentPrice
  ].filter(p => p > 0)
  
  const minPrice = Math.min(...allPrices) * 0.998
  const maxPrice = Math.max(...allPrices) * 1.002
  const priceRange = maxPrice - minPrice
  
  // Helper to convert price to Y position (inverted for chart)
  const priceToY = (price: number) => {
    return ((maxPrice - price) / priceRange) * 100
  }
  
  // Helper to get zone height
  const getZoneHeight = (high: number, low: number) => {
    return ((high - low) / priceRange) * 100
  }
  
  // Zone configurations
  const zoneConfigs = [
    {
      id: 'resistance',
      label: 'Resistencia',
      high: zones.resistance * 1.001,
      low: zones.resistance * 0.999,
      color: 'bg-[#EF4444]/35',
      borderColor: 'border-[#EF4444]/50',
      textColor: 'text-[#EF4444]',
      icon: '⬇️'
    },
    {
      id: 'support',
      label: 'Soporte',
      high: zones.support * 1.001,
      low: zones.support * 0.999,
      color: 'bg-[#22C55E]/35',
      borderColor: 'border-[#22C55E]/50',
      textColor: 'text-[#22C55E]',
      icon: '⬆️'
    },
    {
      id: 'entry',
      label: zones.direction === 'buy' ? 'Zona de Compra' : 'Zona de Venta',
      high: zones.entryZone.high,
      low: zones.entryZone.low,
      color: 'bg-[#3B82F6]/35',
      borderColor: 'border-[#3B82F6]/50',
      textColor: 'text-[#3B82F6]',
      icon: '🎯'
    },
    {
      id: 'stopLoss',
      label: 'Stop Loss',
      high: zones.stopLoss * 1.001,
      low: zones.stopLoss * 0.999,
      color: 'bg-[#374151]/40',
      borderColor: 'border-[#374151]/60',
      textColor: 'text-[#9CA3AF]',
      icon: '🛑'
    },
    {
      id: 'takeProfit',
      label: 'Take Profit',
      high: zones.takeProfit1 * 1.002,
      low: zones.takeProfit1 * 0.998,
      color: 'bg-[#FACC15]/35',
      borderColor: 'border-[#FACC15]/50',
      textColor: 'text-[#FACC15]',
      icon: '💰'
    }
  ]
  
  return (
    <Card className="bg-[#111827]/80 border-white/10 overflow-hidden">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-500" />
          Zonas de Trading - 1H
          <Badge className={`ml-1 ${zones.direction === 'buy' ? 'bg-[#22C55E]/25 text-[#22C55E]' : 'bg-[#EF4444]/25 text-[#EF4444]'}`}>
            {zones.direction === 'buy' ? '📈 COMPRA' : '📉 VENTA'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        {/* Visual Price Scale with Zones */}
        <div className="flex gap-3">
          {/* Price Scale */}
          <div className="w-12 flex flex-col justify-between text-[10px] text-muted-foreground font-mono">
            <span>{maxPrice.toFixed(2)}</span>
            <span>{((maxPrice + minPrice) / 2).toFixed(2)}</span>
            <span>{minPrice.toFixed(2)}</span>
          </div>
          
          {/* Zones Visualization */}
          <div className="flex-1 relative h-48 bg-[#1E293B]/50 rounded-lg overflow-hidden border border-white/5">
            {/* Price grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 25, 50, 75, 100].map(pct => (
                <div key={pct} className="w-full border-t border-white/5" />
              ))}
            </div>
            
            {/* Zones as bands */}
            {zoneConfigs.map((zone) => {
              const topY = priceToY(zone.high)
              const height = getZoneHeight(zone.high, zone.low)
              
              return (
                <div
                  key={zone.id}
                  className={`absolute left-0 right-0 ${zone.color} ${zone.borderColor} border-y flex items-center`}
                  style={{
                    top: `${Math.max(0, Math.min(100 - height, topY))}%`,
                    height: `${Math.max(2, Math.min(15, height))}%`
                  }}
                >
                  {/* Zone Label */}
                  <div className={`absolute left-2 px-1.5 py-0.5 rounded text-[9px] font-medium ${zone.textColor} bg-zinc-900/80`}>
                    {zone.icon} {zone.label}
                  </div>
                  
                  {/* Price Label */}
                  <div className={`absolute right-2 px-1.5 py-0.5 rounded text-[9px] font-mono ${zone.textColor} bg-zinc-900/80`}>
                    {zone.id === 'entry' 
                      ? `${zone.low.toFixed(2)} - ${zone.high.toFixed(2)}`
                      : ((zone.high + zone.low) / 2).toFixed(2)
                    }
                  </div>
                </div>
              )
            })}
            
            {/* Current Price Line */}
            {currentPrice > 0 && (
              <div
                className="absolute left-0 right-0 h-0.5 bg-cyan-500 flex items-center"
                style={{ top: `${priceToY(currentPrice)}%` }}
              >
                <div className="absolute -left-1 -top-1.5 w-2 h-3 bg-cyan-500 rounded-r" />
                <div className="absolute right-2 -top-3 px-1.5 py-0.5 rounded text-[9px] font-bold text-cyan-400 bg-zinc-900/90">
                  ACTUAL: {currentPrice.toFixed(2)}
                </div>
              </div>
            )}
            
            {/* Entry Zone Highlight */}
            <div
              className="absolute left-0 w-1 bg-blue-500"
              style={{
                top: `${priceToY(zones.entryZone.high)}%`,
                height: `${getZoneHeight(zones.entryZone.high, zones.entryZone.low)}%`
              }}
            />
          </div>
          
          {/* Legend */}
          <div className="w-24 flex flex-col gap-1 text-[9px]">
            {zoneConfigs.map((zone) => (
              <div 
                key={zone.id}
                className={`flex items-center gap-1 p-1 rounded ${zone.color} ${zone.borderColor} border`}
              >
                <span>{zone.icon}</span>
                <span className={zone.textColor}>{zone.label}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Zone Details */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="p-2 rounded-lg bg-[#3B82F6]/20 border border-[#3B82F6]/50 text-center">
            <p className="text-[10px] text-[#3B82F6] font-medium">Entrada Recomendada</p>
            <p className="text-sm font-bold text-[#3B82F6]">
              {zones.entryZone.low.toFixed(2)} - {zones.entryZone.high.toFixed(2)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-[#374151]/30 border border-[#374151]/60 text-center">
            <p className="text-[10px] text-[#9CA3AF] font-medium">Stop Loss</p>
            <p className="text-sm font-bold text-[#9CA3AF]">{zones.stopLoss.toFixed(2)}</p>
          </div>
          <div className="p-2 rounded-lg bg-[#FACC15]/20 border border-[#FACC15]/50 text-center">
            <p className="text-[10px] text-[#FACC15] font-medium">Take Profit</p>
            <p className="text-sm font-bold text-[#FACC15]">{zones.takeProfit1.toFixed(2)}</p>
          </div>
        </div>
        
        {/* Risk/Reward */}
        <div className="mt-2 flex items-center justify-between p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <span className="text-xs text-cyan-400">Risk/Reward Ratio</span>
          <Badge className="bg-cyan-500 text-black font-bold">1:{zones.riskRewardRatio.toFixed(1)}</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function TrendDetectionPanel({ analyses }: { analyses: Record<Timeframe, TimeframeAnalysis> }) {
  const marketAnalysis = useMemo(() => analyzeMarketTrend(analyses), [analyses])
  const { timeframes, overall } = marketAnalysis
  
  const trendColors = {
    bullish: { bg: 'bg-[#22C55E]/25', text: 'text-[#22C55E]', border: 'border-[#22C55E]/50' },
    bearish: { bg: 'bg-[#EF4444]/25', text: 'text-[#EF4444]', border: 'border-[#EF4444]/50' },
    sideways: { bg: 'bg-[#F59E0B]/25', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]/50' }
  }
  
  return (
    <div className="space-y-3">
      {(['1D', '1H', '15M'] as const).map((tf) => {
        const analysis = timeframes[tf]
        const data = analyses[tf]
        const colors = trendColors[analysis.trend]
        
        return (
          <Card key={tf} className={`bg-card/50 border ${colors.border}`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-cyan-500/50 text-cyan-500 w-10 justify-center">{tf}</Badge>
                  <TrendBadge trend={analysis.trend} size="sm" />
                </div>
                <span className="text-xs text-muted-foreground">{analysis.confidence}%</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`p-1.5 rounded ${analysis.emaCondition === 'bullish' ? 'bg-[#22C55E]/20' : analysis.emaCondition === 'bearish' ? 'bg-[#EF4444]/20' : 'bg-[#374151]/30'}`}>
                  <span className="text-muted-foreground">EMA:</span>
                  <span className={`ml-1 ${analysis.emaCondition === 'bullish' ? 'text-[#22C55E]' : analysis.emaCondition === 'bearish' ? 'text-[#EF4444]' : 'text-[#9CA3AF]'}`}>
                    {data.ema50 > 0 ? ((data.ema20 - data.ema50) / data.ema50 * 100).toFixed(2) : '0'}%
                  </span>
                </div>
                <div className={`p-1.5 rounded ${analysis.rsiCondition === 'bullish' ? 'bg-[#22C55E]/20' : analysis.rsiCondition === 'bearish' ? 'bg-[#EF4444]/20' : 'bg-[#374151]/30'}`}>
                  <span className="text-muted-foreground">RSI:</span>
                  <span className={`ml-1 ${data.rsi > 55 ? 'text-[#22C55E]' : data.rsi < 45 ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
                    {data.rsi.toFixed(1)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
      
      <Card className={`${overall.alignment === 'strong_bullish' ? 'bg-[#22C55E]/25 border-[#22C55E]/50' : overall.alignment === 'strong_bearish' ? 'bg-[#EF4444]/25 border-[#EF4444]/50' : 'bg-[#F59E0B]/20 border-[#F59E0B]/50'}`}>
        <CardContent className="p-3 text-center">
          <p className={`text-sm font-bold ${overall.alignment === 'strong_bullish' ? 'text-[#22C55E]' : overall.alignment === 'strong_bearish' ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
            {overall.conclusion}
          </p>
          <div className="flex justify-center gap-4 mt-2 text-xs">
            <span className="text-[#22C55E]">{overall.bullishCount} alcistas</span>
            <span className="text-[#EF4444]">{overall.bearishCount} bajistas</span>
            <span className="text-[#F59E0B]">{overall.sidewaysCount} laterales</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EmotionalControlCard({ emotionalState, onReset }: { emotionalState: EmotionalState; onReset: () => void }) {
  const hasWarnings = emotionalState.warnings.length > 0 || emotionalState.recommendations.length > 0
  const riskLevel = emotionalState.isImpulsiveRisk ? 'high' : emotionalState.consecutiveLosses >= 1 ? 'medium' : 'low'
  
  return (
    <Card className={`${riskLevel === 'high' ? 'bg-[#EF4444]/20 border-[#EF4444]/50' : riskLevel === 'medium' ? 'bg-[#F59E0B]/20 border-[#F59E0B]/50' : 'bg-[#111827] border-white/10'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className={`w-4 h-4 ${riskLevel === 'high' ? 'text-[#EF4444]' : riskLevel === 'medium' ? 'text-[#F59E0B]' : 'text-[#22C55E]'}`} />
            Control Emocional
          </CardTitle>
          <Badge variant="outline" className={riskLevel === 'high' ? 'border-[#EF4444] text-[#EF4444]' : riskLevel === 'medium' ? 'border-[#F59E0B] text-[#F59E0B]' : 'border-[#22C55E] text-[#22C55E]'}>
            {emotionalState.totalTradesToday}/5 operaciones
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded bg-background/30">
            <p className="text-xs text-muted-foreground">Consecutivas</p>
            <p className="text-lg font-bold">{emotionalState.consecutiveTrades}</p>
          </div>
          <div className="p-2 rounded bg-background/30">
            <p className="text-xs text-muted-foreground">Pérdidas</p>
            <p className={`text-lg font-bold ${emotionalState.consecutiveLosses >= 2 ? 'text-[#EF4444]' : ''}`}>{emotionalState.consecutiveLosses}</p>
          </div>
          <div className="p-2 rounded bg-background/30">
            <p className="text-xs text-muted-foreground">Hoy</p>
            <p className={`text-lg font-bold ${emotionalState.totalTradesToday >= 5 ? 'text-[#EF4444]' : ''}`}>{emotionalState.totalTradesToday}</p>
          </div>
        </div>
        
        {/* Warnings */}
        {emotionalState.warnings.length > 0 && (
          <div className="space-y-1">
            {emotionalState.warnings.map((w, i) => (
              <div key={i} className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {w}
              </div>
            ))}
          </div>
        )}
        
        {/* Recommendations */}
        {emotionalState.recommendations.length > 0 && (
          <div className="space-y-1">
            {emotionalState.recommendations.map((r, i) => (
              <div key={i} className="text-xs text-amber-400 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                {r}
              </div>
            ))}
          </div>
        )}
        
        {/* Pre-trade check */}
        <div className="p-3 rounded-lg bg-background/30 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquareWarning className="w-4 h-4 text-cyan-500" />
            <span className="text-sm font-medium">Antes de operar</span>
          </div>
          <p className="text-xs text-muted-foreground">¿Sigues tu estrategia? ¿Operas por impulso o por análisis?</p>
        </div>
        
        {!hasWarnings && (
          <div className="flex items-center gap-2 text-xs text-[#22C55E]">
            <CheckCircle className="w-4 h-4" />
            <span>Estado mental óptimo para operar</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function NewsCard({ newsState, formatTimeAgo }: { newsState: NewsDataState; formatTimeAgo: (date: string) => string }) {
  const [showAll, setShowAll] = useState(false)
  const { articles, summary, isLoading } = newsState
  const displayArticles = showAll ? articles : articles.slice(0, 5)
  
  const sentimentConfig = {
    positive: { icon: ThumbsUp, color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/20', label: 'Positiva' },
    negative: { icon: ThumbsDown, color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/20', label: 'Negativa' },
    neutral: { icon: MinusCircle, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/20', label: 'Neutral' }
  }
  
  return (
    <Card className="bg-[#111827] border-white/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Newspaper className="w-4 h-4" />
            Noticias Bitcoin
          </CardTitle>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <Badge variant="outline" className={summary.alertLevel === 'high' ? 'border-[#EF4444] text-[#EF4444]' : 'border-cyan-500 text-cyan-500'}>
              {summary.alertLevel === 'high' ? 'Alta volatilidad' : `${summary.total} noticias`}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded bg-[#22C55E]/20">
            <p className="text-xs text-muted-foreground">Positivas</p>
            <p className="text-lg font-bold text-[#22C55E]">{summary.positive}</p>
          </div>
          <div className="p-2 rounded bg-[#EF4444]/20">
            <p className="text-xs text-muted-foreground">Negativas</p>
            <p className="text-lg font-bold text-[#EF4444]">{summary.negative}</p>
          </div>
          <div className="p-2 rounded bg-[#F59E0B]/20">
            <p className="text-xs text-muted-foreground">Neutrales</p>
            <p className="text-lg font-bold text-[#F59E0B]">{summary.neutral}</p>
          </div>
        </div>
        
        {/* Alert */}
        {summary.alertLevel === 'high' && (
          <div className="p-2 rounded bg-[#EF4444]/20 border border-[#EF4444]/50 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
            <span className="text-xs text-[#EF4444]">{summary.alertMessage}</span>
          </div>
        )}
        
        {/* Articles */}
        <div className="space-y-2">
          {displayArticles.map((article) => {
            const config = sentimentConfig[article.sentiment]
            const Icon = config.icon
            return (
              <div key={article.id} className={`p-2 rounded ${config.bg}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{article.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{article.source}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(article.publishedAt)}</span>
                    </div>
                  </div>
                  <Icon className={`w-4 h-4 ${config.color} flex-shrink-0`} />
                </div>
              </div>
            )
          })}
        </div>
        
        {articles.length > 5 && (
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Mostrar menos' : `Ver ${articles.length - 5} más`}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function AdvancedAnalysisCard({ analysis }: { analysis: AdvancedAnalysis }) {
  const colorScheme = analysis.overallScore >= 70 ? {
    text: 'text-[#22C55E]',
    bg: 'bg-[#22C55E]/25',
    border: 'border-[#22C55E]/50'
  } : analysis.overallScore <= 30 ? {
    text: 'text-[#EF4444]',
    bg: 'bg-[#EF4444]/25',
    border: 'border-[#EF4444]/50'
  } : {
    text: 'text-[#F59E0B]',
    bg: 'bg-[#F59E0B]/25',
    border: 'border-[#F59E0B]/50'
  }
  
  return (
    <Card className={`${colorScheme.bg} border ${colorScheme.border}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Análisis Avanzado
          </CardTitle>
          <Badge className={colorScheme.text}>{analysis.overallScore}%</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Main Conclusion */}
        <div className="p-3 rounded bg-background/30 text-center">
          <p className={`text-lg font-bold ${colorScheme.text}`}>{analysis.marketCondition}</p>
        </div>
        
        {/* Quick Indicators */}
        <div className="grid grid-cols-2 gap-2">
          <div className={`p-2 rounded ${analysis.institutionalInterest ? 'bg-[#22C55E]/20' : 'bg-[#374151]/30'}`}>
            <p className="text-xs text-muted-foreground">Interés Institucional</p>
            <p className={`text-sm font-bold ${analysis.institutionalInterest ? 'text-[#22C55E]' : 'text-[#9CA3AF]'}`}>
              {analysis.institutionalInterest ? 'Detectado' : 'No detectado'}
            </p>
          </div>
          <div className={`p-2 rounded ${analysis.strongMovement ? 'bg-[#F59E0B]/20' : 'bg-[#374151]/30'}`}>
            <p className="text-xs text-muted-foreground">Volatilidad</p>
            <p className={`text-sm font-bold ${analysis.volatilityLevel === 'high' ? 'text-[#F59E0B]' : 'text-[#9CA3AF]'}`}>
              {analysis.volatilityLevel === 'high' ? 'Alta' : analysis.volatilityLevel === 'medium' ? 'Media' : 'Baja'}
            </p>
          </div>
        </div>
        
        {/* Signals */}
        {analysis.signals.length > 0 && (
          <div className="space-y-1">
            {analysis.signals.map((s, i) => (
              <div key={i} className="text-xs text-[#22C55E] flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {s}
              </div>
            ))}
          </div>
        )}
        
        {/* Warnings */}
        {analysis.warnings.length > 0 && (
          <div className="space-y-1">
            {analysis.warnings.map((w, i) => (
              <div key={i} className="text-xs text-[#F59E0B] flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {w}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RiskManagementCard({ currentPrice }: { currentPrice: number }) {
  const [capital, setCapital] = useState('10000')
  const [riskPercent, setRiskPercent] = useState<'1' | '2'>('1')
  
  const capitalNum = parseFloat(capital) || 0
  const riskPercentNum = parseFloat(riskPercent) || 1
  const riskAmount = capitalNum * (riskPercentNum / 100)
  const stopLoss = currentPrice * 0.985
  const takeProfit = currentPrice * 1.025
  const positionSize = currentPrice > 0 ? riskAmount / (currentPrice * 0.015) : 0
  const positionValue = positionSize * currentPrice
  
  const highRisk = riskPercentNum > 1.5 || capitalNum < 500
  
  return (
    <Card className="bg-[#111827] border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Gestión de Riesgo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Capital Input */}
        <div>
          <Label className="text-xs text-muted-foreground">Capital</Label>
          <Input
            type="number"
            value={capital}
            onChange={(e) => setCapital(e.target.value)}
            className="bg-background/50 border-white/10 mt-1"
          />
        </div>
        
        {/* Risk Selection */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={riskPercent === '1' ? 'default' : 'outline'}
            className={`h-12 ${riskPercent === '1' ? 'bg-[#22C55E] hover:bg-[#22C55E]/80' : 'border-white/10'}`}
            onClick={() => setRiskPercent('1')}
          >
            <span className="font-bold">1%</span>
            <span className="text-xs ml-1">Conservador</span>
          </Button>
          <Button
            variant={riskPercent === '2' ? 'default' : 'outline'}
            className={`h-12 ${riskPercent === '2' ? 'bg-[#F59E0B] hover:bg-[#F59E0B]/80' : 'border-white/10'}`}
            onClick={() => setRiskPercent('2')}
          >
            <span className="font-bold">2%</span>
            <span className="text-xs ml-1">Moderado</span>
          </Button>
        </div>
        
        {/* Warning */}
        {highRisk && (
          <div className="p-2 rounded bg-[#F59E0B]/20 border border-[#F59E0B]/50 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-xs text-[#F59E0B]">
              {capitalNum < 500 ? 'Capital bajo' : 'Riesgo elevado'}
            </span>
          </div>
        )}
        
        {/* Results */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-background/30">
            <p className="text-xs text-muted-foreground">A Arriesgar</p>
            <p className="text-lg font-bold text-[#F59E0B]">${riskAmount.toFixed(2)}</p>
          </div>
          <div className="p-2 rounded bg-background/30">
            <p className="text-xs text-muted-foreground">Posición</p>
            <p className="text-lg font-bold text-cyan-500">{positionSize.toFixed(6)}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-[#EF4444]/20 border border-[#EF4444]/50">
            <p className="text-xs text-[#EF4444]">Stop Loss</p>
            <p className="text-sm font-bold text-[#EF4444]">${stopLoss.toFixed(2)}</p>
            <p className="text-xs text-[#EF4444]">-1.5%</p>
          </div>
          <div className="p-2 rounded bg-[#22C55E]/20 border border-[#22C55E]/50">
            <p className="text-xs text-[#22C55E]">Take Profit</p>
            <p className="text-sm font-bold text-[#22C55E]">${takeProfit.toFixed(2)}</p>
            <p className="text-xs text-[#22C55E]">+2.5%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TradingZonesCard({ zones, currentPrice }: { zones: TradingZones; currentPrice: number }) {
  const isBuy = zones.direction === 'buy'
  const isSell = zones.direction === 'sell'
  const isNeutral = zones.direction === 'neutral'
  
  // Message color based on type
  const messageColor = zones.message === 'entrada_optima' 
    ? 'text-[#22C55E] bg-[#22C55E]/20 border-[#22C55E]/50' 
    : zones.message === 'esperar_retroceso' 
    ? 'text-[#F59E0B] bg-[#F59E0B]/20 border-[#F59E0B]/50' 
    : zones.message === 'zona_no_segura'
    ? 'text-[#EF4444] bg-[#EF4444]/20 border-[#EF4444]/50'
    : 'text-[#9CA3AF] bg-[#374151]/30 border-[#374151]/60'
  
  // Direction color scheme
  const directionScheme = isBuy ? {
    bg: 'bg-[#22C55E]/20',
    border: 'border-[#22C55E]/50',
    text: 'text-[#22C55E]',
    icon: TrendingUp
  } : isSell ? {
    bg: 'bg-[#EF4444]/20',
    border: 'border-[#EF4444]/50',
    text: 'text-[#EF4444]',
    icon: TrendingDown
  } : {
    bg: 'bg-[#374151]/30',
    border: 'border-[#374151]/60',
    text: 'text-[#9CA3AF]',
    icon: Minus
  }
  
  const DirectionIcon = directionScheme.icon
  
  // Format price
  const formatZonePrice = (price: number) => {
    return price.toFixed(2)
  }
  
  return (
    <Card className="bg-[#111827] border-white/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-cyan-500" />
            Zonas de Trading
          </CardTitle>
          <Badge variant="outline" className={`${directionScheme.border} ${directionScheme.text}`}>
            {isBuy ? 'BUY' : isSell ? 'SELL' : 'NEUTRAL'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Smart Message */}
        <div className={`p-3 rounded-lg border ${messageColor} text-center`}>
          <p className="text-sm font-medium">{zones.messageText}</p>
        </div>
        
        {/* Price Progress Visual */}
        <div className="relative py-2">
          <div className="h-2 bg-[#1E293B] rounded-full relative">
            {/* Support line */}
            <div 
              className="absolute w-0.5 h-4 bg-amber-500 -top-1" 
              style={{ left: '20%' }}
              title="Soporte"
            />
            {/* Entry zone */}
            <div 
              className={`absolute h-2 ${isBuy ? 'bg-emerald-500/40' : 'bg-red-500/40'} rounded`}
              style={{ left: '25%', width: '20%' }}
            />
            {/* Current price */}
            <div 
              className="absolute w-1.5 h-4 bg-white rounded-full -top-1 shadow-lg"
              style={{ left: '50%' }}
            />
            {/* Resistance line */}
            <div 
              className="absolute w-0.5 h-4 bg-purple-500 -top-1" 
              style={{ left: '75%' }}
              title="Resistencia"
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span className="text-amber-500">S: ${formatZonePrice(zones.support)}</span>
            <span className="text-white font-medium">Act: ${formatZonePrice(currentPrice)}</span>
            <span className="text-purple-500">R: ${formatZonePrice(zones.resistance)}</span>
          </div>
        </div>
        
        {/* Entry Zone */}
        <div className="p-3 rounded-lg bg-[#22C55E]/20 border border-[#22C55E]/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#22C55E]" />
              <span className="text-sm font-medium text-[#22C55E]">Zona de Entrada</span>
            </div>
            <Badge variant="outline" className="border-[#22C55E]/50 text-[#22C55E] text-xs">
              {zones.riskRewardRatio}:1 R:R
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Mín</p>
              <p className="text-lg font-bold text-[#22C55E]">${formatZonePrice(zones.entryZone.low)}</p>
            </div>
            <div className="bg-[#22C55E]/20 rounded">
              <p className="text-xs text-muted-foreground">Medio</p>
              <p className="text-lg font-bold text-[#22C55E]">${formatZonePrice(zones.entryZone.mid)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Máx</p>
              <p className="text-lg font-bold text-[#22C55E]">${formatZonePrice(zones.entryZone.high)}</p>
            </div>
          </div>
        </div>
        
        {/* Stop Loss & Take Profit */}
        <div className="grid grid-cols-3 gap-2">
          {/* Stop Loss */}
          <div className="p-2 rounded-lg bg-[#EF4444]/20 border border-[#EF4444]/50 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
              <span className="text-xs text-[#EF4444] font-medium">Stop Loss</span>
            </div>
            <p className="text-base font-bold text-[#EF4444]">${formatZonePrice(zones.stopLoss)}</p>
            <p className="text-xs text-[#EF4444] mt-1">
              {isBuy ? '▼' : '▲'} Soporte
            </p>
          </div>
          
          {/* TP1 */}
          <div className="p-2 rounded-lg bg-[#3B82F6]/20 border border-[#3B82F6]/50 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
              <span className="text-xs text-[#3B82F6] font-medium">TP 2:1</span>
            </div>
            <p className="text-base font-bold text-[#3B82F6]">${formatZonePrice(zones.takeProfit1)}</p>
            <p className="text-xs text-[#3B82F6] mt-1">Mínimo</p>
          </div>
          
          {/* TP2 */}
          <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-cyan-500" />
              <span className="text-xs text-cyan-400 font-medium">TP 3:1</span>
            </div>
            <p className="text-base font-bold text-cyan-500">${formatZonePrice(zones.takeProfit2)}</p>
            <p className="text-xs text-cyan-400 mt-1">Extendido</p>
          </div>
        </div>
        
        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded bg-background/30">
            <span className="text-muted-foreground">ATR (Volatilidad): </span>
            <span className="text-cyan-500 font-medium">${formatZonePrice(zones.atr)}</span>
          </div>
          <div className="p-2 rounded bg-background/30">
            <span className="text-muted-foreground">Dist. Entrada: </span>
            <span className={`${currentPrice >= zones.entryZone.low && currentPrice <= zones.entryZone.high ? 'text-[#22C55E]' : 'text-[#F59E0B]'} font-medium`}>
              {currentPrice >= zones.entryZone.low && currentPrice <= zones.entryZone.high 
                ? '✓ En zona' 
                : currentPrice > zones.entryZone.high 
                  ? `${((currentPrice - zones.entryZone.high) / zones.entryZone.high * 100).toFixed(1)}% arriba`
                  : `${((zones.entryZone.low - currentPrice) / currentPrice * 100).toFixed(1)}% abajo`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// ALERT NOTIFICATION COMPONENT
// ============================================

function AlertNotification({ 
  alert, 
  onDismiss 
}: { 
  alert: TradingAlert
  onDismiss: () => void 
}) {
  const config = ALERT_CONFIG[alert.type]
  const Icon = config.icon
  
  // Auto-dismiss after 10 seconds for non-critical alerts
  useEffect(() => {
    if (alert.priority !== 'high') {
      const timer = setTimeout(onDismiss, 10000)
      return () => clearTimeout(timer)
    }
  }, [alert.priority, onDismiss])
  
  return (
    <div 
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[calc(100%-2rem)] animate-slide-down`}
    >
      <Card className={`${config.bgLight} border-2 ${config.borderColor} shadow-2xl`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className={`font-bold ${config.textColor}`}>{alert.title}</h4>
                <button 
                  onClick={onDismiss}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span>${alert.price.toFixed(2)}</span>
                <span>•</span>
                <span>{alert.timestamp.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================
// ALERTS PANEL COMPONENT
// ============================================

function AlertsPanel({ 
  alerts, 
  onToggleAlerts,
  alertsEnabled,
  onClearAll
}: { 
  alerts: TradingAlert[]
  onToggleAlerts: () => void
  alertsEnabled: boolean
  onClearAll: () => void
}) {
  const activeAlerts = alerts.filter(a => !a.dismissed).slice(0, 5)
  
  return (
    <Card className="bg-[#111827] border-white/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className={`w-4 h-4 ${alertsEnabled ? 'text-cyan-500' : 'text-zinc-500'}`} />
            Alertas Inteligentes
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              className={`h-7 px-2 ${alertsEnabled ? 'text-[#22C55E]' : 'text-zinc-500'}`}
              onClick={onToggleAlerts}
            >
              {alertsEnabled ? (
                <>
                  <BellRing className="w-3 h-3 mr-1" />
                  ON
                </>
              ) : (
                <>
                  <Bell className="w-3 h-3 mr-1" />
                  OFF
                </>
              )}
            </Button>
            {activeAlerts.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                className="h-7 px-2 text-zinc-400"
                onClick={onClearAll}
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {alertsEnabled ? (
          activeAlerts.length > 0 ? (
            <div className="space-y-2">
              {activeAlerts.map((alert) => {
                const config = ALERT_CONFIG[alert.type]
                const Icon = config.icon
                return (
                  <div 
                    key={alert.id}
                    className={`p-2 rounded ${config.bgLight} border ${config.borderColor} flex items-center gap-2`}
                  >
                    <Icon className={`w-4 h-4 ${config.textColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${config.textColor} truncate`}>{alert.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {alert.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-3 text-xs text-muted-foreground">
              <Bell className="w-6 h-6 mx-auto mb-1 opacity-50" />
              Sin alertas activas
            </div>
          )
        ) : (
          <div className="text-center py-3 text-xs text-muted-foreground">
            <BellOff className="w-6 h-6 mx-auto mb-1 opacity-50" />
            Alertas desactivadas
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// BellOff icon fallback
function BellOff(props: React.ComponentProps<typeof X>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18.8 4A6.3 8.7 0 0 1 20 9" />
      <path d="M9 9h.01" />
      <path d="M15.5 3.5a3.8 5.2 0 0 1 0 8.4" />
      <path d="M3 3l18 18" />
      <path d="M12 19v3" />
      <path d="M8 22h8" />
      <path d="M5 9c0 4.5-1.5 6-2.5 7.5-.5.6-.5 1.5.5 1.5h9" />
    </svg>
  )
}

// ============================================
// SCREENS
// ============================================

function DashboardScreen({ 
  marketData, 
  tradingAssistant,
  selectedAsset,
  onAssetChange
}: { 
  marketData: ReturnType<typeof useMarketData>
  tradingAssistant: ReturnType<typeof useTradingAssistant>
  selectedAsset: string
  onAssetChange: (assetId: string) => void
}) {
  const assetConfig = getAssetById(selectedAsset)
  
  // Alert state
  const [alerts, setAlerts] = useState<TradingAlert[]>([])
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [activeAlert, setActiveAlert] = useState<TradingAlert | null>(null)
  const lastAlertTimesRef = useRef<Record<AlertType, number>>({
    entry: 0,
    pre_entry: 0,
    stop_loss: 0,
    take_profit: 0,
    signal_change: 0
  })
  const previousSignalRef = useRef<string>('none')
  const confirmedSignalCountRef = useRef<number>(0) // Count of confirmed signals for stability
  
  // Step 1: Calculate preliminary signal without zones
  const preliminarySignal = useMemo(() => 
    generateTradingSignal(marketData.analysis, marketData.currentPrice),
    [marketData.analysis, marketData.currentPrice]
  )
  
  // Step 2: Calculate trading zones based on preliminary signal
  const tradingZones = useMemo(() => 
    calculateTradingZones(
      marketData.analysis,
      marketData.currentPrice,
      marketData.high24h,
      marketData.low24h,
      preliminarySignal
    ),
    [marketData.analysis, marketData.currentPrice, marketData.high24h, marketData.low24h, preliminarySignal]
  )
  
  // Step 3: Calculate final signal with zone information
  const tradingSignal = useMemo(() => 
    generateTradingSignal(marketData.analysis, marketData.currentPrice, tradingZones),
    [marketData.analysis, marketData.currentPrice, tradingZones]
  )
  
  const advancedAnalysis = useMemo(() => 
    generateAdvancedAnalysis(
      marketData.analysis, 
      tradingSignal, 
      tradingAssistant.newsState.summary,
      tradingAssistant.emotionalState
    ),
    [marketData.analysis, tradingSignal, tradingAssistant.newsState.summary, tradingAssistant.emotionalState]
  )
  
  // ============================================
  // ENHANCED ALERT LOGIC - Only confirmed signals
  // ============================================
  
  // Check if signal is fully confirmed (same as Operation tab)
  const isSignalFullyConfirmed = useMemo(() => {
    const analysis1D = marketData.analysis['1D']
    const analysis1H = marketData.analysis['1H']
    const analysis15M = marketData.analysis['15M']
    
    // 1. Trend alignment
    const trend1D = detectTrend(analysis1D.ema20, analysis1D.ema50)
    const trend1H = detectTrend(analysis1H.ema20, analysis1H.ema50)
    const trendAligned = trend1D !== 'sideways' && trend1D === trend1H
    
    // 2. Price in zone
    const priceInZone = marketData.currentPrice >= tradingZones.entryZone.low && 
                        marketData.currentPrice <= tradingZones.entryZone.high
    
    // 3. 15M confirmation
    const trend15M = detectTrend(analysis15M.ema20, analysis15M.ema50)
    const rsi15M = analysis15M.rsi
    let confirmation15M = false
    if (tradingZones.direction === 'buy') {
      confirmation15M = trend15M === 'bullish' || (trend15M === 'sideways' && rsi15M > 45)
    } else if (tradingZones.direction === 'sell') {
      confirmation15M = trend15M === 'bearish' || (trend15M === 'sideways' && rsi15M < 55)
    }
    
    // 4. Valid R:R ratio
    const validRR = tradingZones.riskRewardRatio >= 2
    
    // 5. Volume confirmation
    const volumeConfirm = analysis1H.volume > analysis1H.volumeAvg * 1.1
    
    // All conditions must be met for confirmed alert
    return trendAligned && priceInZone && confirmation15M && validRR && volumeConfirm
  }, [marketData.analysis, marketData.currentPrice, tradingZones])
  
  // Track signal stability
  useEffect(() => {
    if (tradingSignal.type !== 'none' && isSignalFullyConfirmed) {
      confirmedSignalCountRef.current = Math.min(confirmedSignalCountRef.current + 1, 10)
    } else {
      confirmedSignalCountRef.current = Math.max(confirmedSignalCountRef.current - 1, 0)
    }
  }, [tradingSignal.type, isSignalFullyConfirmed])
  
  // Add alert function with enhanced validation
  const addAlert = useCallback((type: AlertType, title: string, message: string, price: number) => {
    if (!alertsEnabled) return
    
    // Only show alerts when signal is FULLY CONFIRMED and STABLE
    const signalStabilityThreshold = 3 // Must be confirmed for 3+ checks
    if (confirmedSignalCountRef.current < signalStabilityThreshold) return
    
    // Don't alert if market is closed
    if (!getMarketStatus().isOpen) return
    
    const now = Date.now()
    const config = ALERT_CONFIG[type]
    const lastAlertTime = lastAlertTimesRef.current[type]
    
    // Extended cooldown for stability (avoid repeated alerts)
    const extendedCooldown = config.cooldown * 2
    if (now - lastAlertTime < extendedCooldown) return
    
    lastAlertTimesRef.current[type] = now
    
    const newAlert: TradingAlert = {
      id: `${type}-${now}`,
      type,
      title,
      message,
      timestamp: new Date(),
      price,
      dismissed: false,
      priority: config.priority
    }
    
    setAlerts(prev => [newAlert, ...prev].slice(0, 20))
    setActiveAlert(newAlert)
    
    // Auto-dismiss active alert after 8 seconds
    setTimeout(() => {
      setActiveAlert(prev => prev?.id === newAlert.id ? null : prev)
    }, 8000)
  }, [alertsEnabled])
  
  // Check alert conditions with enhanced validation
  useEffect(() => {
    if (!alertsEnabled || marketData.currentPrice === 0) return
    if (!isSignalFullyConfirmed) return // Only check when fully confirmed
    
    const price = marketData.currentPrice
    const zones = tradingZones
    
    // Only check if we have a valid direction
    if (zones.direction === 'neutral') return
    
    // Check ENTRY zone
    if (price >= zones.entryZone.low && price <= zones.entryZone.high) {
      addAlert(
        'entry',
        'SEÑAL CONFIRMADA - ENTRADA',
        `Precio en zona de entrada - ${zones.direction === 'buy' ? 'BUY' : 'SELL'}`,
        price
      )
    }
    
    // Check STOP LOSS
    const stopLossThreshold = zones.atr * 0.1
    if (zones.direction === 'buy' && price <= zones.stopLoss + stopLossThreshold) {
      addAlert('stop_loss', 'STOP LOSS ACTIVADO', 'Salir de la operación', price)
    } else if (zones.direction === 'sell' && price >= zones.stopLoss - stopLossThreshold) {
      addAlert('stop_loss', 'STOP LOSS ACTIVADO', 'Salir de la operación', price)
    }
    
    // Check TAKE PROFIT
    if (zones.direction === 'buy' && price >= zones.takeProfit1 - zones.atr * 0.1) {
      addAlert('take_profit', 'OBJETIVO ALCANZADO', 'TP1 - Considerar cerrar', price)
    } else if (zones.direction === 'sell' && price <= zones.takeProfit1 + zones.atr * 0.1) {
      addAlert('take_profit', 'OBJETIVO ALCANZADO', 'TP1 - Considerar cerrar', price)
    }
    
    // Signal change tracking
    const currentSignal = tradingSignal.type
    if (previousSignalRef.current !== 'none' && previousSignalRef.current !== currentSignal) {
      addAlert('signal_change', 'CAMBIO DE SEÑAL', `Nueva: ${tradingSignal.signalText}`, price)
    }
    previousSignalRef.current = currentSignal
    
  }, [marketData.currentPrice, tradingZones, tradingSignal.type, alertsEnabled, isSignalFullyConfirmed, addAlert])
  
  // Dismiss alert
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, dismissed: true } : a))
    setActiveAlert(prev => prev?.id === alertId ? null : prev)
  }, [])
  
  // Clear all alerts
  const clearAllAlerts = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, dismissed: true })))
    setActiveAlert(null)
  }, [])
  
  // Get top opportunities from scanner
  const topOpportunities = useMemo(() => {
    const ranking = scanAllForexPairs()
    return ranking.readyToTrade.slice(0, 5)
  }, [marketData.lastUpdate]) // Refresh when market updates
  
  return (
    <div className="space-y-4 pb-4">
      {/* Active Alert Notification */}
      {activeAlert && !activeAlert.dismissed && (
        <AlertNotification 
          alert={activeAlert} 
          onDismiss={() => dismissAlert(activeAlert.id)} 
        />
      )}
      
      {/* ============================================ */}
      {/* SECTION 0: ASSET SELECTOR */}
      {/* ============================================ */}
      
      <AssetSelector selectedAsset={selectedAsset} onAssetChange={onAssetChange} />
      
      {/* ============================================ */}
      {/* SECTION 1: MARKET INFO */}
      {/* ============================================ */}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#22C55E] to-cyan-400 bg-clip-text text-transparent">
            TradeMind AI
          </h1>
          <p className="text-xs text-muted-foreground">Asistente Profesional de Trading</p>
        </div>
        <div className="flex items-center gap-2">
          {marketData.isConnected ? (
            <Wifi className="w-5 h-5 text-[#22C55E]" />
          ) : (
            <WifiOff className="w-5 h-5 text-[#EF4444]" />
          )}
          <span className={`text-xs font-medium ${marketData.isConnected ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
            {marketData.isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>
      
      {/* Market Status & Sessions */}
      <MarketStatusCard />
      
      {/* Price Card - Market Info */}
      <Card className="bg-gradient-to-br from-[#111827] to-[#1E293B]/50 border-white/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{assetConfig?.icon}</span>
              <div>
                <p className="text-sm text-muted-foreground">{assetConfig?.name}</p>
                <p className="text-3xl font-bold">{marketData.formatPriceForAsset(marketData.currentPrice)}</p>
              </div>
            </div>
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${marketData.priceChangePercent >= 0 ? 'bg-[#22C55E]/25' : 'bg-[#EF4444]/25'}`}>
              {marketData.priceChangePercent >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-[#22C55E]" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-[#EF4444]" />
              )}
              <span className={marketData.priceChangePercent >= 0 ? 'text-[#22C55E] font-semibold' : 'text-[#EF4444] font-semibold'}>
                {marketData.priceChangePercent >= 0 ? '+' : ''}{marketData.priceChangePercent.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-2 rounded-lg bg-[#0F172A]/50">
              <p className="text-xs text-muted-foreground">Último Cierre</p>
              <p className="text-sm font-bold text-white">${marketData.formatPrice(marketData.lastClose)}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-[#0F172A]/50">
              <p className="text-xs text-muted-foreground">Volumen</p>
              <p className="text-sm font-bold text-cyan-400">{marketData.formatVolume(marketData.currentVolume)}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-[#0F172A]/50">
              <p className="text-xs text-muted-foreground">Actualización</p>
              <p className="text-sm font-bold text-white">{marketData.lastUpdate ? marketData.lastUpdate.toLocaleTimeString() : '--:--'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* ============================================ */}
      {/* SECTION 2: MARKET DECISION */}
      {/* ============================================ */}
      
      {!getMarketStatus().isOpen ? (
        <Card className="bg-[#EF4444]/20 border-2 border-[#EF4444]/50">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#EF4444]/25 flex items-center justify-center">
                <Ban className="w-8 h-8 text-[#EF4444]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#EF4444]">🚫 MERCADO CERRADO</h3>
                <p className="text-sm text-[#EF4444]/80 mt-1">No se pueden generar señales de trading</p>
              </div>
              <div className="p-3 rounded-lg bg-[#EF4444]/20 border border-[#EF4444]/50 w-full">
                <p className="text-xs text-[#EF4444]/70">{getMarketStatus().reason}</p>
                {getMarketStatus().nextOpen && (
                  <p className="text-xs text-[#F59E0B] mt-1">
                    ⏰ Próxima apertura: {getMarketStatus().nextOpen}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <UnifiedDecisionCard
          analysis={marketData.analysis}
          currentPrice={marketData.currentPrice}
          zones={tradingZones}
          symbol={selectedAsset}
          asset={assetConfig!}
          variant="full"
          showLevels={true}
          showConditions={true}
        />
      )}
      
      {/* ============================================ */}
      {/* SECTION 3: TRADING OPPORTUNITIES */}
      {/* ============================================ */}
      
      <Card className="bg-[#111827] border-white/10">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              Oportunidades de Trading
            </CardTitle>
            <Badge variant="outline" className="border-[#22C55E] text-[#22C55E]">
              {topOpportunities.length} listas
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {topOpportunities.length === 0 ? (
            <div className="text-center py-4">
              <Activity className="w-8 h-8 mx-auto text-zinc-500 mb-2" />
              <p className="text-sm text-muted-foreground">Sin oportunidades confirmadas</p>
              <p className="text-xs text-zinc-500 mt-1">Esperando condiciones óptimas</p>
            </div>
          ) : (
            topOpportunities.map((pair, index) => (
              <div 
                key={pair.pairId}
                className="flex items-center justify-between p-3 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#22C55E]/20 flex items-center justify-center text-xs font-bold text-[#22C55E]">
                    {index + 1}
                  </div>
                  <span className="text-lg">{pair.icon}</span>
                  <div>
                    <p className="font-bold">{pair.pairName}</p>
                    <p className="text-xs text-muted-foreground">{formatForexPrice(pair.price, pair.pairId)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${pair.signal === 'BUY' ? 'bg-[#22C55E]' : 'bg-[#EF4444]'} text-white`}>
                    {pair.signal}
                  </Badge>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#22C55E]">{pair.score}%</p>
                    <p className="text-xs text-muted-foreground">
                      {pair.priceChangePercent >= 0 ? '+' : ''}{pair.priceChangePercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      
      {/* ============================================ */}
      {/* SECTION 4: SMART ALERTS (AT THE END) */}
      {/* ============================================ */}
      
      <Card className="bg-[#111827] border-white/10">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className={`w-4 h-4 ${alertsEnabled && confirmedSignalCountRef.current >= 3 ? 'text-[#22C55E] animate-pulse' : 'text-zinc-500'}`} />
              Alertas Inteligentes
              {confirmedSignalCountRef.current >= 3 && (
                <Badge className="bg-[#22C55E]/20 text-[#22C55E] text-[10px] ml-1">
                  SEÑAL CONFIRMADA
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                className={`h-7 px-2 ${alertsEnabled ? 'text-[#22C55E]' : 'text-zinc-500'}`}
                onClick={() => setAlertsEnabled(!alertsEnabled)}
              >
                {alertsEnabled ? (
                  <>
                    <BellRing className="w-3 h-3 mr-1" />
                    ON
                  </>
                ) : (
                  <>
                    <Bell className="w-3 h-3 mr-1" />
                    OFF
                  </>
                )}
              </Button>
              {alerts.filter(a => !a.dismissed).length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-7 px-2 text-zinc-400"
                  onClick={clearAllAlerts}
                >
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Alert Status Info */}
          {!isSignalFullyConfirmed && (
            <div className="p-2 rounded-lg bg-[#FACC15]/10 border border-[#FACC15]/30 mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#FACC15]" />
                <p className="text-xs text-[#FACC15]">
                  Las alertas se activan solo cuando la señal está completamente confirmada
                </p>
              </div>
            </div>
          )}
          
          {alertsEnabled ? (
            alerts.filter(a => !a.dismissed).length > 0 ? (
              <div className="space-y-2">
                {alerts.filter(a => !a.dismissed).slice(0, 5).map((alert) => {
                  const config = ALERT_CONFIG[alert.type]
                  const Icon = config.icon
                  return (
                    <div 
                      key={alert.id}
                      className={`p-2 rounded ${config.bgLight} border ${config.borderColor} flex items-center gap-2`}
                    >
                      <Icon className={`w-4 h-4 ${config.textColor}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${config.textColor} truncate`}>{alert.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {alert.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-muted-foreground">
                <Bell className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p>Sin alertas activas</p>
                <p className="text-zinc-500 mt-1">Se mostrarán cuando las señales estén confirmadas</p>
              </div>
            )
          ) : (
            <div className="text-center py-4 text-xs text-muted-foreground">
              <BellOff className="w-6 h-6 mx-auto mb-2 opacity-50" />
              Alertas desactivadas
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Loading/Error */}
      {marketData.error && (
        <Card className="bg-[#EF4444]/20 border-[#EF4444]/50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertOctagon className="w-5 h-5 text-[#EF4444]" />
            <div>
              <p className="font-semibold text-[#EF4444]">Error al conectar con el mercado</p>
              <p className="text-xs text-muted-foreground">{marketData.error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {marketData.isLoading && (
        <Card className="bg-[#111827] border-white/10">
          <CardContent className="p-4 flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 text-[#22C55E] animate-spin" />
            <span className="text-sm text-muted-foreground">Cargando datos del mercado...</span>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ChartsScreen({ assetId, marketData }: { assetId: string; marketData: ReturnType<typeof useMarketData> }) {
  const assetConfig = getAssetById(assetId)
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">📊 Gráficos TradingView</h2>
          <p className="text-xs text-muted-foreground">
            Análisis visual multi-temporalidad
          </p>
        </div>
        <Badge 
          variant="outline" 
          className={assetConfig?.category === 'crypto' 
            ? 'border-orange-500/50 text-orange-500' 
            : 'border-[#3B82F6]/50 text-[#3B82F6]'
          }
        >
          {assetConfig?.category === 'crypto' ? '🪙 CRYPTO' : '💱 FOREX'}
        </Badge>
      </div>
      
      {/* Asset Info Card */}
      <Card className="bg-[#111827] border-white/10">
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{assetConfig?.icon || '📊'}</span>
            <div>
              <p className="font-bold">{assetConfig?.name || assetId}</p>
              <p className="text-xs text-muted-foreground">{assetConfig?.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Precio Actual</p>
            <p className="text-sm font-bold text-cyan-400">
              {marketData.formatPriceForAsset(marketData.currentPrice)}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Charts - Solo gráficas limpias */}
      <TradingViewCharts assetId={assetId} />
    </div>
  )
}

function AnalysisScreen({ marketData, tradingAssistant, selectedAsset }: { 
  marketData: ReturnType<typeof useMarketData>
  tradingAssistant: ReturnType<typeof useTradingAssistant>
  selectedAsset: string
}) {
  const assetConfig = getAssetById(selectedAsset)
  
  // Step 1: Calculate preliminary signal without zones
  const preliminarySignal = useMemo(() => 
    generateTradingSignal(marketData.analysis, marketData.currentPrice),
    [marketData.analysis, marketData.currentPrice]
  )
  
  // Step 2: Calculate trading zones based on preliminary signal
  const tradingZones = useMemo(() => 
    calculateTradingZones(
      marketData.analysis,
      marketData.currentPrice,
      marketData.high24h,
      marketData.low24h,
      preliminarySignal
    ),
    [marketData.analysis, marketData.currentPrice, marketData.high24h, marketData.low24h, preliminarySignal]
  )
  
  // Step 3: Calculate final signal with zone information
  const tradingSignal = useMemo(() => 
    generateTradingSignal(marketData.analysis, marketData.currentPrice, tradingZones),
    [marketData.analysis, marketData.currentPrice, tradingZones]
  )
  
  const advancedAnalysis = useMemo(() => 
    generateAdvancedAnalysis(
      marketData.analysis, 
      tradingSignal, 
      tradingAssistant.newsState.summary,
      tradingAssistant.emotionalState
    ),
    [marketData.analysis, tradingSignal, tradingAssistant.newsState.summary, tradingAssistant.emotionalState]
  )
  
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Análisis Completo</h2>
        <p className="text-sm text-muted-foreground">Tendencia + Noticias + Sentimiento</p>
      </div>

      {/* Trend Detection */}
      <Card className="bg-[#111827] border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#22C55E]" />
            Detección de Tendencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TrendDetectionPanel analyses={marketData.analysis} />
        </CardContent>
      </Card>

      {/* Signal */}
      <SignalCard signal={tradingSignal} />

      {/* Trading Zones */}
      <TradingZonesCard zones={tradingZones} currentPrice={marketData.currentPrice} />

      {/* Support & Resistance Zones */}
      <SupportResistanceZones
        klines1D={marketData.klines['1D']}
        klines1H={marketData.klines['1H']}
        klines15M={marketData.klines['15M']}
        currentPrice={marketData.currentPrice}
        trend={tradingSignal.type === 'buy' ? 'bullish' : tradingSignal.type === 'sell' ? 'bearish' : 'sideways'}
        asset={assetConfig!}
      />

      {/* Advanced Analysis */}
      <AdvancedAnalysisCard analysis={advancedAnalysis} />
    </div>
  )
}

function RiskScreen({ marketData }: { marketData: ReturnType<typeof useMarketData> }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Gestión de Riesgo</h2>
        <p className="text-sm text-muted-foreground">Calculadora de posición</p>
      </div>

      <RiskManagementCard currentPrice={marketData.currentPrice} />
    </div>
  )
}

// ============================================
// OPERATION SCREEN - Vista de Operación Activa
// ============================================

function OperationScreen({ 
  marketData, 
  selectedAsset 
}: { 
  marketData: ReturnType<typeof useMarketData>
  selectedAsset: string
}) {
  const assetConfig = getAssetById(selectedAsset)
  const tradingViewSymbol = getTradingViewSymbol(selectedAsset)
  
  // Helper function to format price correctly based on asset type
  const formatPrice = useCallback((price: number): string => {
    return formatAssetPrice(price, selectedAsset)
  }, [selectedAsset])
  
  // Calculate trading zones
  const preliminarySignal = useMemo(() => 
    generateTradingSignal(marketData.analysis, marketData.currentPrice),
    [marketData.analysis, marketData.currentPrice]
  )
  
  const tradingZones = useMemo(() => 
    calculateTradingZones(
      marketData.analysis,
      marketData.currentPrice,
      marketData.high24h,
      marketData.low24h,
      preliminarySignal
    ),
    [marketData.analysis, marketData.currentPrice, marketData.high24h, marketData.low24h, preliminarySignal]
  )
  
  const signal = useMemo(() => 
    generateTradingSignal(marketData.analysis, marketData.currentPrice, tradingZones),
    [marketData.analysis, marketData.currentPrice, tradingZones]
  )
  
  // ============================================
  // EVALUACIÓN DE 4 CONDICIONES
  // ============================================
  
  const evaluateConditions = useMemo(() => {
    const analysis1D = marketData.analysis['1D']
    const analysis1H = marketData.analysis['1H']
    const analysis15M = marketData.analysis['15M']
    const currentPrice = marketData.currentPrice
    
    // 1. Tendencia 1D y 1H alineadas
    const trend1D = detectTrend(analysis1D.ema20, analysis1D.ema50)
    const trend1H = detectTrend(analysis1H.ema20, analysis1H.ema50)
    const trendAligned = trend1D !== 'sideways' && trend1D === trend1H
    
    // 2. Precio en zona (soporte o resistencia)
    const entryZone = tradingZones.entryZone
    const priceInZone = currentPrice >= entryZone.low && currentPrice <= entryZone.high
    
    // 3. Confirmación en 15M
    const trend15M = detectTrend(analysis15M.ema20, analysis15M.ema50)
    const rsi15M = analysis15M.rsi
    let confirmation15M = false
    
    if (tradingZones.direction === 'buy') {
      confirmation15M = trend15M === 'bullish' || (trend15M === 'sideways' && rsi15M > 45)
    } else if (tradingZones.direction === 'sell') {
      confirmation15M = trend15M === 'bearish' || (trend15M === 'sideways' && rsi15M < 55)
    }
    
    // 4. Risk/Reward >= 1:2
    const validRR = tradingZones.riskRewardRatio >= 2
    
    // Contar condiciones cumplidas
    const conditions = [
      { id: 'trend', label: 'Tendencia 1D/1H alineada', passed: trendAligned, detail: `${trend1D} / ${trend1H}` },
      { id: 'price', label: 'Precio en zona', passed: priceInZone, detail: priceInZone ? 'En zona' : 'Fuera de zona' },
      { id: 'confirm', label: 'Confirmación 15M', passed: confirmation15M, detail: `RSI: ${rsi15M.toFixed(0)}` },
      { id: 'rr', label: 'Risk/Reward ≥ 1:2', passed: validRR, detail: `1:${tradingZones.riskRewardRatio.toFixed(1)}` }
    ]
    
    const passedCount = conditions.filter(c => c.passed).length
    
    // Determinar decisión
    let decision: 'ready' | 'wait' | 'no_operate'
    let decisionLabel: string
    let decisionColor: string
    let decisionBg: string
    
    const marketStatus = getMarketStatus()
    
    if (!marketStatus.isOpen) {
      decision = 'no_operate'
      decisionLabel = 'NO OPERAR'
      decisionColor = 'text-red-400'
      decisionBg = 'bg-red-500/20 border-red-500/50'
    } else if (passedCount === 4) {
      decision = 'ready'
      decisionLabel = 'LISTO PARA ENTRAR'
      decisionColor = 'text-[#22C55E]'
      decisionBg = 'bg-[#22C55E]/20 border-[#22C55E]/50'
    } else if (passedCount === 3) {
      decision = 'wait'
      decisionLabel = 'ESPERAR'
      decisionColor = 'text-[#FACC15]'
      decisionBg = 'bg-[#FACC15]/20 border-[#FACC15]/50'
    } else {
      decision = 'no_operate'
      decisionLabel = 'NO OPERAR'
      decisionColor = 'text-[#EF4444]'
      decisionBg = 'bg-[#EF4444]/20 border-[#EF4444]/50'
    }
    
    return {
      conditions,
      passedCount,
      decision,
      decisionLabel,
      decisionColor,
      decisionBg
    }
  }, [marketData.analysis, marketData.currentPrice, tradingZones])
  
  const { conditions, passedCount, decision, decisionLabel, decisionColor, decisionBg } = evaluateConditions
  const isBuy = tradingZones.direction === 'buy'
  const isSell = tradingZones.direction === 'sell'
  
  // Calculate price position relative to zones
  const priceToPercent = (price: number) => {
    const range = tradingZones.resistance - tradingZones.support
    if (range <= 0) return 50
    return ((price - tradingZones.support) / range) * 100
  }
  
  return (
    <div className="space-y-4 pb-4">
      
      {/* ============================================ */}
      {/* INDICADOR PRINCIPAL DE DECISIÓN */}
      {/* ============================================ */}
      <div className={`p-4 rounded-2xl border-2 ${decisionBg} text-center`}>
        {/* Icono grande */}
        <div className={`text-4xl mb-2`}>
          {decision === 'ready' ? '🟢' : decision === 'wait' ? '🟡' : '🔴'}
        </div>
        
        {/* Estado principal */}
        <h1 className={`text-2xl font-black ${decisionColor} tracking-wide`}>
          {decisionLabel}
        </h1>
        
        {/* Contador de condiciones */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="flex gap-1">
            {conditions.map((cond, idx) => (
              <div 
                key={cond.id}
                className={`w-3 h-3 rounded-full ${cond.passed ? 'bg-[#22C55E]' : 'bg-zinc-600'}`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-2">
            {passedCount}/4 condiciones
          </span>
        </div>
        
        {/* Condiciones detalladas */}
        <div className="grid grid-cols-4 gap-1 mt-3">
          {conditions.map((cond) => (
            <div 
              key={cond.id}
              className={`p-2 rounded-lg text-center ${cond.passed ? 'bg-[#22C55E]/10' : 'bg-zinc-700/30'}`}
            >
              {cond.passed ? (
                <CheckCircle className="w-4 h-4 mx-auto text-[#22C55E]" />
              ) : (
                <XCircle className="w-4 h-4 mx-auto text-zinc-500" />
              )}
              <p className={`text-[9px] mt-1 font-medium ${cond.passed ? 'text-[#22C55E]' : 'text-zinc-500'}`}>
                {cond.label}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Tipo de Operación y R:R */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          {isBuy && (
            <Badge className="bg-[#22C55E] text-white text-base px-4 py-1">
              <TrendingUp className="w-4 h-4 mr-1" />
              BUY
            </Badge>
          )}
          {isSell && (
            <Badge className="bg-[#EF4444] text-white text-base px-4 py-1">
              <TrendingDown className="w-4 h-4 mr-1" />
              SELL
            </Badge>
          )}
          {!isBuy && !isSell && (
            <Badge className="bg-zinc-600 text-white text-base px-4 py-1">
              <Minus className="w-4 h-4 mr-1" />
              NEUTRAL
            </Badge>
          )}
        </div>
        
        {/* Asset Info */}
        <div className="flex items-center gap-2">
          <span className="text-lg">{assetConfig?.icon}</span>
          <div className="text-right">
            <p className="text-sm font-bold">{assetConfig?.name}</p>
            <p className="text-xs text-cyan-400">{marketData.formatPriceForAsset(marketData.currentPrice)}</p>
          </div>
        </div>
      </div>
      
      {/* Panel de Zonas Visuales Amplias */}
      <div className="bg-[#111827] rounded-xl border border-white/10 p-4 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-white">Zonas de Trading - 1H</span>
        </div>
        
        {/* Zonas como franjas amplias */}
        <div className="relative h-52 bg-[#0F172A] rounded-lg overflow-hidden">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-30">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="w-full border-t border-white/10" />
            ))}
          </div>
          
          {/* ZONA DE RESISTENCIA - Rojo */}
          <div 
            className="absolute left-0 right-0 flex items-center justify-between px-3"
            style={{
              top: '5%',
              height: '12%',
              background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.4) 0%, rgba(239, 68, 68, 0.25) 50%, rgba(239, 68, 68, 0.4) 100%)',
              borderLeft: '4px solid #EF4444',
              borderRight: '4px solid #EF4444'
            }}
          >
            <span className="text-xs font-bold text-[#EF4444]">⬇️ RESISTENCIA</span>
            <span className="text-sm font-mono font-bold text-[#EF4444]">{formatPrice(tradingZones.resistance)}</span>
          </div>
          
          {/* ZONA DE TAKE PROFIT - Amarillo */}
          <div 
            className="absolute left-0 right-0 flex items-center justify-between px-3"
            style={{
              top: isBuy ? '18%' : '75%',
              height: '10%',
              background: 'linear-gradient(90deg, rgba(250, 204, 21, 0.4) 0%, rgba(250, 204, 21, 0.25) 50%, rgba(250, 204, 21, 0.4) 100%)',
              borderLeft: '4px solid #FACC15',
              borderRight: '4px solid #FACC15'
            }}
          >
            <span className="text-xs font-bold text-[#FACC15]">💰 TAKE PROFIT</span>
            <span className="text-sm font-mono font-bold text-[#FACC15]">{formatPrice(tradingZones.takeProfit1)}</span>
          </div>
          
          {/* ZONA DE ENTRADA - Azul */}
          <div 
            className="absolute left-0 right-0 flex items-center justify-between px-3"
            style={{
              top: isBuy ? '45%' : '35%',
              height: '14%',
              background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.45) 0%, rgba(59, 130, 246, 0.3) 50%, rgba(59, 130, 246, 0.45) 100%)',
              borderLeft: '4px solid #3B82F6',
              borderRight: '4px solid #3B82F6'
            }}
          >
            <span className="text-xs font-bold text-[#3B82F6]">🎯 ENTRADA</span>
            <span className="text-sm font-mono font-bold text-[#3B82F6]">
              {formatPrice(tradingZones.entryZone.low)} - {formatPrice(tradingZones.entryZone.high)}
            </span>
          </div>
          
          {/* ZONA DE STOP LOSS - Gris Oscuro */}
          <div 
            className="absolute left-0 right-0 flex items-center justify-between px-3"
            style={{
              top: isBuy ? '75%' : '18%',
              height: '10%',
              background: 'linear-gradient(90deg, rgba(55, 65, 81, 0.5) 0%, rgba(55, 65, 81, 0.35) 50%, rgba(55, 65, 81, 0.5) 100%)',
              borderLeft: '4px solid #4B5563',
              borderRight: '4px solid #4B5563'
            }}
          >
            <span className="text-xs font-bold text-zinc-400">🛑 STOP LOSS</span>
            <span className="text-sm font-mono font-bold text-zinc-300">{formatPrice(tradingZones.stopLoss)}</span>
          </div>
          
          {/* ZONA DE SOPORTE - Verde */}
          <div 
            className="absolute left-0 right-0 flex items-center justify-between px-3"
            style={{
              top: '83%',
              height: '12%',
              background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.4) 0%, rgba(34, 197, 94, 0.25) 50%, rgba(34, 197, 94, 0.4) 100%)',
              borderLeft: '4px solid #22C55E',
              borderRight: '4px solid #22C55E'
            }}
          >
            <span className="text-xs font-bold text-[#22C55E]">⬆️ SOPORTE</span>
            <span className="text-sm font-mono font-bold text-[#22C55E]">{formatPrice(tradingZones.support)}</span>
          </div>
          
          {/* Línea de Precio Actual */}
          {marketData.currentPrice > 0 && (
            <div 
              className="absolute left-0 right-0 flex items-center"
              style={{ top: `${100 - priceToPercent(marketData.currentPrice)}%` }}
            >
              <div className="w-2 h-2 bg-cyan-400 rounded-full ml-1" />
              <div className="flex-1 h-0.5 bg-cyan-400" />
              <div className="px-2 py-0.5 bg-cyan-500 text-black text-xs font-bold rounded ml-1">
                {formatPrice(marketData.currentPrice)}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Gráfica TradingView Grande - 1H */}
      <div className="bg-[#111827] rounded-xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-[#1E293B]/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">1H</Badge>
            <span className="text-xs text-muted-foreground">Temporalidad de ejecución</span>
          </div>
          <span className="text-xs font-mono text-zinc-500">{tradingViewSymbol}</span>
        </div>
        <iframe 
          src={`https://s.tradingview.com/widgetembed/?symbol=${tradingViewSymbol}&interval=60&theme=dark&style=1&timezone=America/Bogota&hide_top_toolbar=0&hide_legend=0&save_image=1&studies=[]`}
          width="100%" 
          height="350" 
          frameBorder="0"
          className="w-full"
          style={{ border: 'none' }}
          allowFullScreen
        />
      </div>
    </div>
  )
}

function NewsScreen({ tradingAssistant }: { tradingAssistant: ReturnType<typeof useTradingAssistant> }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Noticias del Mercado</h2>
        <p className="text-sm text-muted-foreground">Análisis de sentimiento</p>
      </div>

      <NewsCard newsState={tradingAssistant.newsState} formatTimeAgo={tradingAssistant.formatTimeAgo} />
      
      <Card className="bg-[#111827] border-white/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Última actualización</span>
            <span className="text-xs text-muted-foreground">
              {tradingAssistant.newsState.lastUpdate ? 
                tradingAssistant.newsState.lastUpdate.toLocaleTimeString() : 
                'Actualizando...'
              }
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full border-white/10"
            onClick={tradingAssistant.refreshNews}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar Noticias
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function HistoryScreen() {
  const { trades, closedTrades, isLoading, stats, error } = useTrades()
  const [showAddTrade, setShowAddTrade] = useState(false)
  
  // Format profit
  const formatProfit = (profit: number | null) => {
    if (profit === null) return '-'
    return profit >= 0 ? `+$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">📊 Historial de Trades</h2>
          <p className="text-xs text-muted-foreground">Registro de operaciones con persistencia</p>
        </div>
        <Button 
          size="sm" 
          className="bg-emerald-500 hover:bg-emerald-600"
          onClick={() => setShowAddTrade(!showAddTrade)}
        >
          {showAddTrade ? 'Cancelar' : '+ Nuevo Trade'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-emerald-500/10 border-emerald-500/30">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold text-emerald-500">{stats.winRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-cyan-500/10 border-cyan-500/30">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-cyan-500">{stats.totalTrades}</p>
          </CardContent>
        </Card>
        <Card className={`${stats.totalProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Profit</p>
            <p className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {formatProfit(stats.totalProfit)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="bg-[#111827] border-white/10">
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Wins / Losses</span>
              <span className="font-medium">
                <span className="text-[#22C55E]">{stats.wins}</span>
                <span className="text-zinc-500 mx-1">/</span>
                <span className="text-[#EF4444]">{stats.losses}</span>
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-white/10">
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Avg Confidence</span>
              <span className="font-medium text-cyan-500">{stats.avgConfidence.toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trades List */}
      <Card className="bg-[#111827] border-white/10">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Operaciones</CardTitle>
            <Badge variant="outline" className="text-xs">
              {closedTrades.length} cerradas
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
              <span className="ml-2 text-sm text-muted-foreground">Cargando trades...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-8 h-8 mx-auto text-amber-500 mb-2" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <p className="text-xs text-amber-400 mt-2">Verifica que las tablas estén creadas en Supabase</p>
            </div>
          ) : closedTrades.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-8 h-8 mx-auto text-zinc-500 mb-2" />
              <p className="text-sm text-muted-foreground">No hay trades registrados</p>
              <p className="text-xs text-zinc-400 mt-1">Agrega tu primera operación</p>
            </div>
          ) : (
            closedTrades.slice(0, 10).map((trade) => (
              <div 
                key={trade.id} 
                className={`p-3 rounded-lg border ${
                  (trade.profit || 0) >= 0 
                    ? 'bg-[#22C55E]/20 border-[#22C55E]/50' 
                    : 'bg-[#EF4444]/20 border-[#EF4444]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Badge className={trade.type === 'buy' ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}>
                      {trade.type.toUpperCase()}
                    </Badge>
                    <span className="font-medium">{trade.symbol}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(trade.entry_time).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    <span>Entry: ${trade.entry_price.toFixed(2)}</span>
                    {trade.exit_price && (
                      <span className="ml-2">Exit: ${trade.exit_price.toFixed(2)}</span>
                    )}
                  </div>
                  <p className={`text-sm font-medium ${(trade.profit || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {formatProfit(trade.profit)}
                    {trade.profit_percent && (
                      <span className="text-xs ml-1">({trade.profit_percent >= 0 ? '+' : ''}{trade.profit_percent.toFixed(2)}%)</span>
                    )}
                  </p>
                </div>
                {trade.notes && (
                  <p className="text-xs text-muted-foreground mt-2 italic">"{trade.notes}"</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
      
      {/* Connection Status */}
      <div className="p-3 rounded-lg bg-[#1E293B]/50 border border-white/5">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-500 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-cyan-400 mb-1">Persistencia con Supabase</p>
            <p>
              Los trades se guardan automáticamente en la base de datos. 
              Cierra la app y vuelve para ver tu historial completo.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// FOREX SCANNER SCREEN
// ============================================

function ForexScannerScreen() {
  const scanner = useForexScanner()
  const [showAllPairs, setShowAllPairs] = useState(false)
  // Default: Solo mostrar oportunidades (ready). Opcional: incluir preparing
  const [viewMode, setViewMode] = useState<'opportunities' | 'all'>('opportunities')
  
  const { ranking, isLoading, lastScanTime, isAutoRefresh, setAutoRefresh, refresh } = scanner
  
  // Filter pairs: SOLO ready, o ready + preparing. NUNCA mostrar avoid
  const filteredPairs = useMemo(() => {
    if (!ranking) return []
    
    // Combinar todos los pares
    let pairs = [...ranking.topPicks, ...ranking.readyToTrade.slice(5), ...ranking.preparing]
    
    if (viewMode === 'opportunities') {
      // Solo mostrar LISTO PARA ENTRAR
      pairs = pairs.filter(p => p.status === 'ready')
    } else {
      // Mostrar LISTO + ESPERAR (nunca NO OPERAR)
      pairs = pairs.filter(p => p.status === 'ready' || p.status === 'preparing')
    }
    
    // Ordenar por score descendente
    return pairs.sort((a, b) => b.score - a.score)
  }, [ranking, viewMode])
  
  const displayPairs = showAllPairs ? filteredPairs : filteredPairs.slice(0, 10)
  
  // Contadores para UI
  const readyCount = ranking?.readyCount || 0
  const preparingCount = ranking?.preparingCount || 0
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">🎯 Escáner Inteligente</h2>
          <p className="text-xs text-muted-foreground">
            {ranking?.totalScanned || 20} pares analizados • Solo oportunidades
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 px-2 ${isAutoRefresh ? 'text-[#22C55E]' : 'text-zinc-500'}`}
            onClick={() => setAutoRefresh(!isAutoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <div className="text-xs text-muted-foreground">
            {lastScanTime ? lastScanTime.toLocaleTimeString() : '--:--'}
          </div>
        </div>
      </div>
      
      {/* Summary Stats - Solo Oportunidades */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="bg-[#22C55E]/20 border-[#22C55E]/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-[#22C55E]">{readyCount}</p>
            <p className="text-xs text-[#22C55E]">🟢 Listos para entrar</p>
          </CardContent>
        </Card>
        <Card className="bg-[#FACC15]/20 border-[#FACC15]/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-[#FACC15]">{preparingCount}</p>
            <p className="text-xs text-[#FACC15]">🟡 Esperar</p>
          </CardContent>
        </Card>
      </div>
      
      {/* View Mode Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={viewMode === 'opportunities' ? 'default' : 'outline'}
          className={`h-10 ${viewMode === 'opportunities' ? 'bg-[#22C55E] hover:bg-[#22C55E]/80' : 'border-white/10'}`}
          onClick={() => setViewMode('opportunities')}
        >
          <Target className="w-4 h-4 mr-2" />
          Solo Oportunidades
        </Button>
        <Button
          variant={viewMode === 'all' ? 'default' : 'outline'}
          className={`h-10 ${viewMode === 'all' ? 'bg-cyan-500 hover:bg-cyan-600' : 'border-white/10'}`}
          onClick={() => setViewMode('all')}
        >
          <Eye className="w-4 h-4 mr-2" />
          Ver Todos
        </Button>
      </div>
      
      {/* Current filter info */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-muted-foreground">
          {viewMode === 'opportunities' 
            ? '📊 Mostrando solo activos listos para operar'
            : '📊 Mostrando listos y en espera'}
        </p>
        <p className="text-xs font-medium text-cyan-500">
          {filteredPairs.length} encontrados
        </p>
      </div>
      
      {/* Top 5 Ranking - Solo Oportunidades Listas */}
      {filteredPairs.length > 0 && viewMode === 'opportunities' && (
        <Card className="bg-gradient-to-br from-[#22C55E]/20 to-cyan-500/5 border-[#22C55E]/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Mejores Oportunidades Ahora
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredPairs.slice(0, 5).map((pair, index) => (
              <div 
                key={pair.pairId}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#22C55E]/20 border border-[#22C55E]/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-500 text-black' :
                    index === 1 ? 'bg-gray-300 text-black' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-[#22C55E] text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <span className="text-lg">{pair.icon}</span>
                    <span className="text-sm font-bold ml-1">{pair.pairName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#22C55E] text-white">
                    {pair.signal}
                  </Badge>
                  <span className="text-sm font-bold text-[#22C55E]">{pair.score}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Clean List - Oportunidades */}
      <Card className="bg-[#111827] border-white/10">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              {viewMode === 'opportunities' ? (
                <>
                  <Zap className="w-4 h-4 text-[#22C55E]" />
                  Oportunidades de Trading
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4 text-cyan-500" />
                  Todos los Activos
                </>
              )}
            </CardTitle>
            {filteredPairs.length > 0 && (
              <Badge variant="outline" className="border-cyan-500 text-cyan-500">
                {filteredPairs.length}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && !ranking ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
              <span className="ml-2 text-sm text-muted-foreground">Buscando oportunidades...</span>
            </div>
          ) : filteredPairs.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-8 h-8 mx-auto text-amber-500 mb-2" />
              <p className="text-sm text-muted-foreground">
                {viewMode === 'opportunities' 
                  ? 'No hay oportunidades listas para operar en este momento'
                  : 'No hay activos disponibles'}
              </p>
              {viewMode === 'opportunities' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 border-[#FACC15]/50 text-[#FACC15]"
                  onClick={() => setViewMode('all')}
                >
                  Ver activos en espera
                </Button>
              )}
            </div>
          ) : (
            <>
              {displayPairs.map((pair) => (
                <div 
                  key={pair.pairId}
                  className={`p-3 rounded-lg ${
                    pair.status === 'ready' 
                      ? 'bg-emerald-500/10 border border-emerald-500/20' 
                      : 'bg-amber-500/10 border border-amber-500/20'
                  }`}
                >
                  {/* Main row - Clean display */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{pair.icon}</span>
                      <div>
                        <p className="font-bold text-base">{pair.pairName}</p>
                        <p className="text-xs text-muted-foreground">{scanner.formatPrice(pair.price, pair.pairId)}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className={`text-lg font-bold ${pair.status === 'ready' ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {pair.score}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pair.priceChangePercent >= 0 ? '+' : ''}{pair.priceChangePercent.toFixed(2)}%
                        </p>
                      </div>
                      <Badge className={
                        pair.status === 'ready' ? 'bg-emerald-500' : 'bg-amber-500'
                      }>
                        {pair.signal}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Status indicator - SYNCHRONIZED WITH OPERATION TAB */}
                  <div className={`mt-2 p-1.5 rounded text-center text-xs font-medium ${
                    pair.status === 'ready' 
                      ? 'bg-[#22C55E]/20 text-[#22C55E]' 
                      : 'bg-[#FACC15]/20 text-[#FACC15]'
                  }`}>
                    {pair.status === 'ready' ? '🟢 LISTO PARA ENTRAR' : '🟡 ESPERAR'}
                  </div>
                </div>
              ))}
              
              {filteredPairs.length > 10 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs border border-white/10"
                  onClick={() => setShowAllPairs(!showAllPairs)}
                >
                  {showAllPairs ? 'Mostrar menos' : `Ver ${filteredPairs.length - 10} más`}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Info box */}
      <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-500 mt-0.5" />
          <div className="text-xs text-cyan-400">
            <p className="font-medium mb-1">Escáner Inteligente</p>
            <p className="text-cyan-500/70">
              Los activos 🔴 NO OPERAR están ocultos automáticamente para eliminar ruido y ayudarte a enfocarte solo en oportunidades reales.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Trophy icon component
function Trophy({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}

// ============================================
// MAIN APP
// ============================================

export default function TradeMindApp() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [selectedAsset, setSelectedAsset] = useState<string>('BTCUSDT')
  const marketData = useRealtimeMarketData(selectedAsset)
  const tradingAssistant = useTradingAssistant()
  
  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Zap },
    { id: 'scanner' as const, label: 'Escáner', icon: Activity },
    { id: 'operation' as const, label: 'Operación', icon: Target },
    { id: 'charts' as const, label: 'Gráficos', icon: BarChart3 },
    { id: 'analysis' as const, label: 'Análisis', icon: Brain },
    { id: 'risk' as const, label: 'Riesgo', icon: Shield },
    { id: 'history' as const, label: 'Historial', icon: History },
    { id: 'learn' as const, label: 'Aprende', icon: GraduationCap },
  ]
  
  return (
    <div className="min-h-screen bg-[#0F172A] text-white pb-20">
      <div className="max-w-md mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <DashboardScreen 
            marketData={marketData} 
            tradingAssistant={tradingAssistant}
            selectedAsset={selectedAsset}
            onAssetChange={setSelectedAsset}
          />
        )}
        {activeTab === 'scanner' && <ForexScannerScreen />}
        {activeTab === 'operation' && <OperationScreen marketData={marketData} selectedAsset={selectedAsset} />}
        {activeTab === 'charts' && <ChartsScreen assetId={selectedAsset} marketData={marketData} />}
        {activeTab === 'analysis' && <AnalysisScreen marketData={marketData} tradingAssistant={tradingAssistant} selectedAsset={selectedAsset} />}
        {activeTab === 'risk' && <RiskScreen marketData={marketData} />}
        {activeTab === 'news' && <NewsScreen tradingAssistant={tradingAssistant} />}
        {activeTab === 'history' && <HistoryScreen />}
        {activeTab === 'learn' && <LearnTradingScreen />}
      </div>
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#111827]/95 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-md mx-auto flex items-center justify-around py-1.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${
                  isActive ? 'text-[#22C55E] bg-[#22C55E]/20' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-[10px]">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
// Build fix
