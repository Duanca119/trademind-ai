'use client'

import { useMemo } from 'react'
import { 
  getUnifiedDecision, 
  TradingDecision, 
  DecisionStatus,
  DecisionExplanation,
  ConditionExplanation,
  getDecisionColor,
  getDecisionBgColor,
  getDecisionBorderColor,
  getDecisionTextColor
} from '@/lib/decision-engine'
import { TimeframeAnalysis } from '@/hooks/use-market-data'
import { TradingZones } from '@/types/trading'

export interface UseTradingDecisionOptions {
  analysis: Record<'1D' | '1H' | '15M', TimeframeAnalysis>
  currentPrice: number
  zones: TradingZones | null
  symbol: string
}

export interface ConditionSummary {
  passed: boolean
  label: string
}

export interface ConditionsSummary {
  [key: string]: ConditionSummary
}

export interface UseTradingDecisionResult extends TradingDecision {
  // UI Helpers
  color: string
  bgColor: string
  borderColor: string
  textColor: string
  
  // Condiciones resumidas para UI
  conditionsSummary: ConditionsSummary
  
  // Estado general
  allConditionsMet: boolean
  canOperate: boolean
  blockedReason: string | null
  
  // Helpers de formato
  formatStatus: () => string
  formatDirection: () => string
}

/**
 * Hook centralizado para la decisión de trading
 * Todos los componentes deben usar este hook para garantizar consistencia
 */
export function useTradingDecision(options: UseTradingDecisionOptions): UseTradingDecisionResult {
  const { analysis, currentPrice, zones, symbol } = options
  
  // Obtener decisión unificada
  const decision = useMemo(() => {
    // Verificar que tenemos datos válidos
    if (!analysis || !analysis['1D'] || !analysis['1H'] || !analysis['15M'] || currentPrice <= 0) {
      return null
    }
    return getUnifiedDecision(analysis, currentPrice, zones, symbol)
  }, [analysis, currentPrice, zones, symbol])
  
  // Obtener colores según status
  const color = decision ? getDecisionColor(decision.status) : 'red'
  const bgColor = decision ? getDecisionBgColor(decision.status) : 'bg-red-500/20'
  const borderColor = decision ? getDecisionBorderColor(decision.status) : 'border-red-500/30'
  const textColor = decision ? getDecisionTextColor(decision.status) : 'text-red-500'
  
  // Resumen de condiciones para UI
  const conditionsSummary: ConditionsSummary = useMemo(() => {
    if (!decision) {
      return {
        alignment: { passed: false, label: 'Sin datos' },
        confirmation: { passed: false, label: 'Sin datos' },
        zone: { passed: false, label: 'Sin datos' },
        volume: { passed: false, label: 'Sin datos' },
        confidence: { passed: false, label: 'Sin datos' }
      }
    }
    
    return {
      alignment: {
        passed: decision.conditions.alignment.isAligned,
        label: decision.conditions.alignment.isAligned
          ? `✅ 1D/1H ${decision.conditions.alignment.trend1D === 'bullish' ? 'alcistas' : 'bajistas'}`
          : '❌ Sin alineación'
      },
      confirmation: {
        passed: decision.conditions.confirmation.isConfirmed,
        label: decision.conditions.confirmation.isConfirmed
          ? '✅ 15M confirma'
          : '❌ 15M no confirma'
      },
      zone: {
        passed: decision.conditions.zone.isInZone,
        label: decision.conditions.zone.isInZone
          ? '✅ En zona de entrada'
          : `⏳ Fuera de zona (${decision.conditions.zone.distanceToZone.toFixed(2)}%)`
      },
      volume: {
        passed: decision.conditions.volume.isSufficient,
        label: decision.conditions.volume.isSufficient
          ? '✅ Volumen OK'
          : `⚠️ Volumen bajo (${(decision.conditions.volume.ratio * 100).toFixed(0)}%)`
      },
      confidence: {
        passed: decision.conditions.confidence.isSufficient,
        label: decision.conditions.confidence.isSufficient
          ? `✅ ${decision.confidence.toFixed(0)}% confianza`
          : `❌ ${decision.confidence.toFixed(0)}% (mín 70%)`
      }
    }
  }, [decision])
  
  // Verificar si todas las condiciones se cumplen
  const allConditionsMet = useMemo(() => {
    if (!decision) return false
    return Object.values(conditionsSummary).every(c => c.passed)
  }, [decision, conditionsSummary])
  
  // Verificar si se puede operar
  const canOperate = useMemo(() => {
    if (!decision) return false
    return decision.status === 'ready' && decision.confidence >= 70
  }, [decision])
  
  // Razón de bloqueo
  const blockedReason = useMemo(() => {
    if (!decision) return 'Sin datos'
    if (canOperate) return null
    
    if (decision.confidence < 70) {
      return `Confianza baja (${decision.confidence.toFixed(0)}%)`
    }
    if (!decision.conditions.alignment.isAligned) {
      return 'Sin alineación 1D/1H'
    }
    if (!decision.conditions.confirmation.isConfirmed) {
      return '15M no confirma'
    }
    if (!decision.conditions.zone.isInZone) {
      return 'Fuera de zona de entrada'
    }
    if (!decision.conditions.volume.isSufficient) {
      return 'Volumen insuficiente'
    }
    return 'Condiciones no cumplidas'
  }, [decision, canOperate])
  
  // Helpers de formato
  const formatStatus = () => decision ? `${decision.statusIcon} ${decision.statusText}` : '🔴 Cargando...'
  const formatDirection = () => decision ? decision.directionText : 'NO OPERAR'
  
  // Resultado por defecto si no hay decisión
  if (!decision) {
    return {
      status: 'avoid' as DecisionStatus,
      statusIcon: '🔴',
      statusText: 'Cargando...',
      direction: 'none',
      directionText: 'NO OPERAR',
      confidence: 0,
      conditions: {
        alignment: { isAligned: false, trend1D: 'sideways', trend1H: 'sideways', trend15M: 'sideways', description: '' },
        confirmation: { isConfirmed: false, trend15M: 'sideways', supportsDirection: false, description: '' },
        zone: { isInZone: false, distanceToZone: 100, zoneType: 'above', description: '' },
        volume: { isSufficient: false, currentVolume: 0, avgVolume: 0, ratio: 0, description: '' },
        confidence: { isSufficient: false, value: 0, description: '' }
      },
      explanation: {
        conditions: [],
        blockingReasons: ['Sin datos disponibles'],
        suggestions: ['Espere a que carguen los datos del mercado'],
        whatToWait: ['Datos del mercado']
      },
      reasons: [],
      warnings: ['Cargando datos...'],
      levels: null,
      timestamp: new Date(),
      symbol,
      timeframe: '1H',
      color,
      bgColor,
      borderColor,
      textColor,
      conditionsSummary,
      allConditionsMet,
      canOperate,
      blockedReason,
      formatStatus,
      formatDirection
    }
  }
  
  return {
    ...decision,
    color,
    bgColor,
    borderColor,
    textColor,
    conditionsSummary,
    allConditionsMet,
    canOperate,
    blockedReason,
    formatStatus,
    formatDirection
  }
}

export default useTradingDecision
