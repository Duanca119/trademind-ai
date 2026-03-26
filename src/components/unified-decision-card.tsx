'use client'

import { useMemo } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Zap,
  Shield,
  Activity,
  Layers,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Ban,
  Clock,
  Lightbulb,
  AlertCircle,
  HelpCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import useTradingDecision, { UseTradingDecisionOptions, UseTradingDecisionResult, ConditionsSummary } from '@/hooks/use-trading-decision'
import { TimeframeAnalysis } from '@/hooks/use-market-data'
import { TradingZones, formatAssetPrice, AssetConfig } from '@/types/trading'
import { ConditionExplanation } from '@/lib/decision-engine'

// ============================================
// TYPES
// ============================================

interface UnifiedDecisionCardProps {
  analysis: Record<'1D' | '1H' | '15M', TimeframeAnalysis>
  currentPrice: number
  zones: TradingZones | null
  symbol: string
  asset: AssetConfig
  variant?: 'full' | 'compact' | 'minimal'
  showLevels?: boolean
  showConditions?: boolean
}

// ============================================
// HELPER COMPONENTS
// ============================================

function ConditionBadge({ 
  passed, 
  label 
}: { 
  passed: boolean
  label: string
}) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs ${
      passed 
        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
        : 'bg-red-500/10 text-red-500 border border-red-500/20'
    }`}>
      {passed ? (
        <CheckCircle className="w-3.5 h-3.5" />
      ) : (
        <XCircle className="w-3.5 h-3.5" />
      )}
      <span className="font-medium">{label}</span>
    </div>
  )
}

function StatusIndicator({ decision }: { decision: UseTradingDecisionResult }) {
  const { status, statusIcon, statusText, direction, directionText, confidence, textColor, bgColor, borderColor } = decision
  
  const DirectionIcon = direction === 'buy' ? TrendingUp : direction === 'sell' ? TrendingDown : Ban
  
  return (
    <div className={`${bgColor} ${borderColor} border rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${direction === 'buy' ? 'bg-emerald-500/20' : direction === 'sell' ? 'bg-red-500/20' : 'bg-zinc-500/20'}`}>
            <DirectionIcon className={`w-6 h-6 ${textColor}`} />
          </div>
          <div>
            <Badge className={`text-lg font-bold ${
              direction === 'buy' ? 'bg-emerald-500 text-white' :
              direction === 'sell' ? 'bg-red-500 text-white' :
              'bg-zinc-600 text-white'
            }`}>
              {directionText}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">{statusIcon} {statusText}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Confianza</p>
          <p className={`text-2xl font-bold ${textColor}`}>{confidence.toFixed(0)}%</p>
          <Progress value={confidence} className="w-20 h-2 mt-1" />
        </div>
      </div>
      
      {/* Blocked reason */}
      {decision.blockedReason && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-xs text-red-400">{decision.blockedReason}</span>
        </div>
      )}
    </div>
  )
}

function ConditionsGrid({ decision }: { decision: UseTradingDecisionResult }) {
  const { conditionsSummary, allConditionsMet, conditions } = decision
  
  const conditionKeys = ['alignment', 'confirmation', 'zone', 'volume', 'confidence']
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Condiciones de Entrada
        </span>
        <Badge variant="outline" className={allConditionsMet ? 'border-emerald-500 text-emerald-500' : 'border-amber-500 text-amber-500'}>
          {allConditionsMet ? '✅ TODAS OK' : '⏳ PENDIENTES'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-5 gap-1">
        {conditionKeys.map((key) => {
          const condition = conditionsSummary[key]
          if (!condition) return null
          
          const labels: Record<string, string> = {
            alignment: '1D/1H',
            confirmation: '15M',
            zone: 'Zona',
            volume: 'Vol',
            confidence: 'Conf'
          }
          
          return (
            <div 
              key={key}
              className={`p-2 rounded text-center ${
                condition.passed ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'
              }`}
            >
              {condition.passed ? (
                <CheckCircle className="w-4 h-4 mx-auto text-emerald-500" />
              ) : (
                <XCircle className="w-4 h-4 mx-auto text-red-500" />
              )}
              <span className={`text-xs mt-1 block ${condition.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                {labels[key]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TradingLevels({ decision, decimals }: { decision: UseTradingDecisionResult; decimals: number }) {
  const { levels, direction } = decision
  
  if (!levels || direction === 'none') return null
  
  const formatPrice = (price: number) => {
    if (decimals === 2) return price.toFixed(2)
    if (decimals === 3) return price.toFixed(3)
    return price.toFixed(5)
  }
  
  return (
    <div className="grid grid-cols-4 gap-2">
      <div className="p-2 rounded bg-background/30 text-center border border-white/5">
        <p className="text-xs text-muted-foreground">Entrada</p>
        <p className="text-sm font-bold text-white">{formatPrice(levels.entry)}</p>
      </div>
      <div className="p-2 rounded bg-red-500/10 text-center border border-red-500/20">
        <p className="text-xs text-red-400">Stop Loss</p>
        <p className="text-sm font-bold text-red-500">{formatPrice(levels.stopLoss)}</p>
      </div>
      <div className="p-2 rounded bg-blue-500/10 text-center border border-blue-500/20">
        <p className="text-xs text-blue-400">TP 2:1</p>
        <p className="text-sm font-bold text-blue-500">{formatPrice(levels.takeProfit1)}</p>
      </div>
      <div className="p-2 rounded bg-cyan-500/10 text-center border border-cyan-500/20">
        <p className="text-xs text-cyan-400">TP 3:1</p>
        <p className="text-sm font-bold text-cyan-500">{formatPrice(levels.takeProfit2)}</p>
      </div>
    </div>
  )
}

function ReasonsList({ reasons, warnings }: { reasons: string[]; warnings: string[] }) {
  return (
    <div className="space-y-1">
      {reasons.map((reason, i) => (
        <div key={`reason-${i}`} className="text-xs text-emerald-400 flex items-start gap-1.5">
          <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{reason}</span>
        </div>
      ))}
      {warnings.map((warning, i) => (
        <div key={`warning-${i}`} className="text-xs text-amber-400 flex items-start gap-1.5">
          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{warning}</span>
        </div>
      ))}
    </div>
  )
}

// ============================================
// DECISION EXPLANATION SECTION
// ============================================

function DecisionExplanationSection({ decision }: { decision: UseTradingDecisionResult }) {
  const { status, explanation } = decision
  
  // Solo mostrar cuando NO está listo
  if (status === 'ready') return null
  
  const hasBlockingReasons = explanation.blockingReasons.length > 0
  const hasSuggestions = explanation.suggestions.length > 0
  const hasWhatToWait = explanation.whatToWait.length > 0
  
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-purple-500" />
        <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
          ¿Por qué no operar?
        </span>
      </div>
      
      {/* Condiciones detalladas */}
      <div className="space-y-2">
        {explanation.conditions.map((condition, i) => (
          <div 
            key={i}
            className={`p-2.5 rounded-lg border ${
              condition.passed 
                ? 'bg-emerald-500/5 border-emerald-500/20' 
                : 'bg-red-500/5 border-red-500/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-xs font-medium ${condition.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                {condition.passed ? '✅' : '❌'} {condition.name}
              </span>
              <span className="text-xs text-muted-foreground">{condition.value}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">{condition.explanation}</p>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <span className="font-medium">Requerido:</span>
              <span>{condition.required}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Razones de bloqueo */}
      {hasBlockingReasons && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-semibold text-red-400">Razones del Bloqueo</span>
          </div>
          <ul className="space-y-1">
            {explanation.blockingReasons.map((reason, i) => (
              <li key={i} className="text-xs text-red-300 flex items-start gap-1.5">
                <span className="text-red-500">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Sugerencias */}
      {hasSuggestions && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-amber-400">Sugerencias</span>
          </div>
          <ul className="space-y-1">
            {explanation.suggestions.map((suggestion, i) => (
              <li key={i} className="text-xs text-amber-300 flex items-start gap-1.5">
                <span className="text-amber-500">→</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Qué esperar */}
      {hasWhatToWait && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold text-blue-400">Qué Esperar</span>
          </div>
          <ul className="space-y-1">
            {explanation.whatToWait.map((item, i) => (
              <li key={i} className="text-xs text-blue-300 flex items-start gap-1.5">
                <span className="text-blue-500">⏳</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ============================================
// MAIN COMPONENT - FULL VARIANT
// ============================================

function FullDecisionCard({ decision, asset, showLevels, showConditions }: { 
  decision: UseTradingDecisionResult
  asset: AssetConfig
  showLevels: boolean
  showConditions: boolean
}) {
  return (
    <Card className={`bg-card/50 border-white/10 ${decision.borderColor}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Decisión Central Unificada
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs border-cyan-500 text-cyan-500">
              {asset.name}
            </Badge>
            <Badge variant="outline" className={`text-xs ${decision.borderColor} ${decision.textColor}`}>
              {decision.statusIcon}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-xs">
          Fuente única de verdad para Dashboard, Scanner y Señales
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status principal */}
        <StatusIndicator decision={decision} />
        
        {/* Condiciones */}
        {showConditions && <ConditionsGrid decision={decision} />}
        
        {/* Explicación detallada (solo cuando no está listo) */}
        {decision.status !== 'ready' && (
          <>
            <Separator className="bg-white/5" />
            <DecisionExplanationSection decision={decision} />
          </>
        )}
        
        <Separator className="bg-white/5" />
        
        {/* Niveles */}
        {showLevels && decision.levels && <TradingLevels decision={decision} decimals={asset.decimals} />}
        
        {/* Razones */}
        <ReasonsList reasons={decision.reasons} warnings={decision.warnings} />
        
        {/* Timestamp */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Actualizado: {decision.timestamp.toLocaleTimeString()}</span>
          <span>TF ejecución: {decision.timeframe}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// COMPACT VARIANT
// ============================================

function CompactDecisionCard({ decision, asset }: { 
  decision: UseTradingDecisionResult
  asset: AssetConfig
}) {
  const DirectionIcon = decision.direction === 'buy' ? TrendingUp : decision.direction === 'sell' ? TrendingDown : Minus
  
  return (
    <div className={`${decision.bgColor} ${decision.borderColor} border rounded-lg p-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DirectionIcon className={`w-5 h-5 ${decision.textColor}`} />
          <div>
            <Badge className={`text-sm font-bold ${
              decision.direction === 'buy' ? 'bg-emerald-500' :
              decision.direction === 'sell' ? 'bg-red-500' :
              'bg-zinc-500'
            }`}>
              {decision.directionText}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-lg font-bold ${decision.textColor}`}>{decision.confidence.toFixed(0)}%</span>
          <p className="text-xs text-muted-foreground">{decision.statusIcon} {decision.statusText}</p>
        </div>
      </div>
      
      {decision.blockedReason && (
        <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {decision.blockedReason}
        </div>
      )}
    </div>
  )
}

// ============================================
// MINIMAL VARIANT (for scanner lists)
// ============================================

function MinimalDecisionBadge({ decision }: { decision: UseTradingDecisionResult }) {
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${decision.bgColor} ${decision.borderColor} border`}>
      <span>{decision.statusIcon}</span>
      <span className={`text-xs font-bold ${decision.textColor}`}>{decision.directionText}</span>
      <span className="text-xs text-muted-foreground">{decision.confidence.toFixed(0)}%</span>
    </div>
  )
}

// ============================================
// MAIN EXPORT
// ============================================

export function UnifiedDecisionCard({
  analysis,
  currentPrice,
  zones,
  symbol,
  asset,
  variant = 'full',
  showLevels = true,
  showConditions = true
}: UnifiedDecisionCardProps) {
  const decision = useTradingDecision({
    analysis,
    currentPrice,
    zones,
    symbol
  })
  
  if (variant === 'minimal') {
    return <MinimalDecisionBadge decision={decision} />
  }
  
  if (variant === 'compact') {
    return <CompactDecisionCard decision={decision} asset={asset} />
  }
  
  return (
    <FullDecisionCard 
      decision={decision} 
      asset={asset} 
      showLevels={showLevels}
      showConditions={showConditions}
    />
  )
}

// Export hook for direct use
export { useTradingDecision }
export type { UseTradingDecisionResult, UnifiedDecisionCardProps }
