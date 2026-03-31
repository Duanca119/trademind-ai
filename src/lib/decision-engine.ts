// ============================================
// CENTRAL DECISION ENGINE
// ============================================
// Sistema único de decisión que unifica todos los módulos
// Scanner, Dashboard y Señales usan esta MISMA lógica

import { TimeframeAnalysis } from '@/hooks/use-market-data'
import { TradingZones } from '@/types/trading'

// ============================================
// TYPES
// ============================================

export type Trend = 'bullish' | 'bearish' | 'sideways'
export type DecisionStatus = 'ready' | 'preparing' | 'avoid'
export type DecisionDirection = 'buy' | 'sell' | 'none'

export interface ConditionExplanation {
  name: string
  passed: boolean
  value: string
  required: string
  explanation: string
  suggestion: string
}

export interface DecisionConditions {
  // 1. Alineación: 1D y 1H deben coincidir
  alignment: {
    isAligned: boolean
    trend1D: Trend
    trend1H: Trend
    trend15M: Trend
    description: string
  }
  
  // 2. Confirmación: 15M debe apoyar la dirección
  confirmation: {
    isConfirmed: boolean
    trend15M: Trend
    supportsDirection: boolean
    description: string
  }
  
  // 3. Zona: Precio dentro de zona de entrada
  zone: {
    isInZone: boolean
    distanceToZone: number
    zoneType: 'entry' | 'above' | 'below'
    description: string
  }
  
  // 4. Volumen: Volumen suficiente
  volume: {
    isSufficient: boolean
    currentVolume: number
    avgVolume: number
    ratio: number
    description: string
  }
  
  // 5. Confianza: Mayor a 70%
  confidence: {
    isSufficient: boolean
    value: number
    description: string
  }
}

export interface DecisionExplanation {
  // Condición individual explicada
  conditions: ConditionExplanation[]
  
  // Resumen de por qué no se puede operar
  blockingReasons: string[]
  
  // Sugerencias para mejorar
  suggestions: string[]
  
  // Qué esperar
  whatToWait: string[]
}

export interface TradingDecision {
  // Status final
  status: DecisionStatus
  statusIcon: '🟢' | '🟡' | '🔴'
  statusText: string
  
  // Dirección
  direction: DecisionDirection
  directionText: 'BUY' | 'SELL' | 'NO OPERAR'
  
  // Confianza total
  confidence: number
  
  // Desglose de condiciones
  conditions: DecisionConditions
  
  // Explicación detallada
  explanation: DecisionExplanation
  
  // Razones de la decisión
  reasons: string[]
  warnings: string[]
  
  // Niveles de trading
  levels: {
    entry: number
    stopLoss: number
    takeProfit1: number
    takeProfit2: number
    riskReward: number
  } | null
  
  // Timestamp
  timestamp: Date
  
  // Metadatos
  symbol: string
  timeframe: string
}

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Confianza mínima para operar
  MIN_CONFIDENCE: 70,
  
  // Ratio mínimo de volumen
  MIN_VOLUME_RATIO: 1.0,
  
  // Distancia máxima a zona (%)
  MAX_ZONE_DISTANCE: 0.5,
  
  // Multiplicadores de Take Profit
  TP1_MULTIPLIER: 2.0,
  TP2_MULTIPLIER: 3.0,
  
  // Stop Loss (% del precio)
  STOP_LOSS_PERCENT: 1.5
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function detectTrend(ema20: number, ema50: number): Trend {
  if (!ema20 || !ema50) return 'sideways'
  const diff = ((ema20 - ema50) / ema50) * 100
  if (diff > 0.3) return 'bullish'
  if (diff < -0.3) return 'bearish'
  return 'sideways'
}

function calculateConfidence(
  conditions: DecisionConditions,
  trend: Trend
): number {
  if (trend === 'sideways') return 0
  
  let confidence = 0
  
  // Alineación (30 puntos)
  if (conditions.alignment.isAligned) {
    confidence += 30
  } else {
    confidence += 5 // Al menos hay alguna dirección
  }
  
  // Confirmación (25 puntos)
  if (conditions.confirmation.isConfirmed) {
    confidence += 25
  }
  
  // Zona (20 puntos)
  if (conditions.zone.isInZone) {
    confidence += 20
  } else if (conditions.zone.distanceToZone < 1) {
    confidence += 10 // Cerca de la zona
  }
  
  // Volumen (15 puntos)
  if (conditions.volume.isSufficient) {
    confidence += 15
  } else if (conditions.volume.ratio > 0.8) {
    confidence += 7 // Volumen casi suficiente
  }
  
  // Bonus por tendencias fuertes
  if (conditions.alignment.trend1D === conditions.alignment.trend1H && 
      conditions.alignment.trend1D !== 'sideways') {
    confidence += 5
  }
  
  // Penalty por conflictos
  if (conditions.confirmation.trend15M !== 'sideways' && 
      conditions.confirmation.trend15M !== conditions.alignment.trend1H) {
    confidence -= 10
  }
  
  return Math.max(0, Math.min(100, confidence))
}

function calculateStatus(
  conditions: DecisionConditions,
  confidence: number,
  direction: DecisionDirection
): { status: DecisionStatus; icon: '🟢' | '🟡' | '🔴'; text: string } {
  // REGLA CRÍTICA: Si confianza < 70%, FORZAR NO OPERAR
  if (confidence < CONFIG.MIN_CONFIDENCE) {
    return { status: 'avoid', icon: '🔴', text: 'NO OPERAR' }
  }
  
  // Verificar condiciones críticas
  const criticalConditions = [
    conditions.alignment.isAligned,
    conditions.confirmation.isConfirmed,
    conditions.zone.isInZone,
    conditions.volume.isSufficient
  ]
  
  const passedCount = criticalConditions.filter(Boolean).length
  
  // TODAS las condiciones se cumplen
  if (passedCount === 4 && direction !== 'none') {
    return { status: 'ready', icon: '🟢', text: 'LISTO PARA ENTRAR' }
  }
  
  // MAYORÍA de condiciones (3 de 4)
  if (passedCount >= 3 && direction !== 'none') {
    return { status: 'preparing', icon: '🟡', text: 'EN PREPARACIÓN' }
  }
  
  // Hay conflicto o muy pocas condiciones
  if (!conditions.alignment.isAligned) {
    return { status: 'avoid', icon: '🔴', text: 'NO OPERAR - Sin alineación' }
  }
  
  if (!conditions.confirmation.isConfirmed) {
    return { status: 'preparing', icon: '🟡', text: 'EN PREPARACIÓN - Esperar 15M' }
  }
  
  return { status: 'avoid', icon: '🔴', text: 'NO OPERAR' }
}

function calculateLevels(
  currentPrice: number,
  direction: DecisionDirection,
  zones: TradingZones | null
): TradingDecision['levels'] {
  if (direction === 'none' || !zones) return null
  
  const entry = zones.entryZone.mid
  const stopLoss = zones.stopLoss
  const risk = Math.abs(entry - stopLoss)
  
  if (direction === 'buy') {
    return {
      entry,
      stopLoss,
      takeProfit1: entry + risk * CONFIG.TP1_MULTIPLIER,
      takeProfit2: entry + risk * CONFIG.TP2_MULTIPLIER,
      riskReward: CONFIG.TP1_MULTIPLIER
    }
  } else {
    return {
      entry,
      stopLoss,
      takeProfit1: entry - risk * CONFIG.TP1_MULTIPLIER,
      takeProfit2: entry - risk * CONFIG.TP2_MULTIPLIER,
      riskReward: CONFIG.TP1_MULTIPLIER
    }
  }
}

// ============================================
// MAIN DECISION FUNCTION
// ============================================

export function generateTradingDecision(
  analysis: Record<'1D' | '1H' | '15M', TimeframeAnalysis>,
  currentPrice: number,
  zones: TradingZones | null,
  symbol: string
): TradingDecision {
  // ========================================
  // PASO 1: Detectar tendencias
  // ========================================
  const trend1D = detectTrend(analysis['1D'].ema20, analysis['1D'].ema50)
  const trend1H = detectTrend(analysis['1H'].ema20, analysis['1H'].ema50)
  const trend15M = detectTrend(analysis['15M'].ema20, analysis['15M'].ema50)
  
  // ========================================
  // PASO 2: Evaluar cada condición
  // ========================================
  
  // Condición 1: Alineación (1D y 1H deben coincidir)
  const alignment: DecisionConditions['alignment'] = {
    isAligned: trend1D === trend1H && trend1D !== 'sideways',
    trend1D,
    trend1H,
    trend15M,
    description: trend1D === trend1H && trend1D !== 'sideways'
      ? `✅ 1D y 1H alineados ${trend1D === 'bullish' ? 'alcistas' : 'bajistas'}`
      : trend1D === 'sideways' || trend1H === 'sideways'
        ? '⚠️ Mercado lateral, sin dirección clara'
        : `❌ 1D (${trend1D}) y 1H (${trend1H}) en conflicto`
  }
  
  // Condición 2: Confirmación (15M debe apoyar)
  const confirmation: DecisionConditions['confirmation'] = {
    isConfirmed: trend15M === trend1H || trend15M === 'sideways',
    trend15M,
    supportsDirection: trend15M === trend1H || trend15M === 'sideways',
    description: trend15M === trend1H
      ? '✅ 15M confirma la dirección'
      : trend15M === 'sideways'
        ? '✅ 15M neutral (no contradice)'
        : '❌ 15M contradice la dirección'
  }
  
  // Condición 3: Zona de entrada
  const isInZone = zones 
    ? currentPrice >= zones.entryZone.low && currentPrice <= zones.entryZone.high
    : false
  const distanceToZone = zones
    ? Math.min(
        Math.abs((currentPrice - zones.entryZone.low) / currentPrice * 100),
        Math.abs((currentPrice - zones.entryZone.high) / currentPrice * 100)
      )
    : 100
  
  const zone: DecisionConditions['zone'] = {
    isInZone,
    distanceToZone,
    zoneType: zones
      ? currentPrice < zones.entryZone.low ? 'below'
        : currentPrice > zones.entryZone.high ? 'above'
        : 'entry'
      : 'above',
    description: isInZone
      ? '✅ Precio en zona de entrada'
      : zones
        ? `⏳ Precio ${distanceToZone.toFixed(2)}% fuera de zona`
        : '⚠️ Sin zona definida'
  }
  
  // Condición 4: Volumen
  const volumeRatio = analysis['1H'].volumeAvg > 0
    ? analysis['1H'].volume / analysis['1H'].volumeAvg
    : 0
  
  const volume: DecisionConditions['volume'] = {
    isSufficient: volumeRatio >= CONFIG.MIN_VOLUME_RATIO,
    currentVolume: analysis['1H'].volume,
    avgVolume: analysis['1H'].volumeAvg,
    ratio: volumeRatio,
    description: volumeRatio >= CONFIG.MIN_VOLUME_RATIO
      ? `✅ Volumen suficiente (${(volumeRatio * 100).toFixed(0)}% del promedio)`
      : `⚠️ Volumen bajo (${(volumeRatio * 100).toFixed(0)}% del promedio)`
  }
  
  // Condición 5: Se calculará después de la confianza total
  const conditions: DecisionConditions = {
    alignment,
    confirmation,
    zone,
    volume,
    confidence: {
      isSufficient: false, // Se actualiza después
      value: 0,
      description: ''
    }
  }
  
  // ========================================
  // PASO 3: Determinar dirección
  // ========================================
  let direction: DecisionDirection = 'none'
  let directionText: 'BUY' | 'SELL' | 'NO OPERAR' = 'NO OPERAR'
  
  if (alignment.isAligned) {
    if (trend1D === 'bullish') {
      direction = 'buy'
      directionText = 'BUY'
    } else if (trend1D === 'bearish') {
      direction = 'sell'
      directionText = 'SELL'
    }
  }
  
  // ========================================
  // PASO 4: Calcular confianza
  // ========================================
  const confidence = calculateConfidence(conditions, direction)
  conditions.confidence = {
    isSufficient: confidence >= CONFIG.MIN_CONFIDENCE,
    value: confidence,
    description: confidence >= CONFIG.MIN_CONFIDENCE
      ? `✅ Confianza: ${confidence.toFixed(0)}%`
      : `❌ Confianza baja: ${confidence.toFixed(0)}% (mín: ${CONFIG.MIN_CONFIDENCE}%)`
  }
  
  // ========================================
  // PASO 5: Determinar status final
  // ========================================
  // REGLA CRÍTICA: Si confianza < 70%, forzar NO OPERAR
  if (confidence < CONFIG.MIN_CONFIDENCE) {
    direction = 'none'
    directionText = 'NO OPERAR'
  }
  
  const { status, icon, text } = calculateStatus(conditions, confidence, direction)
  
  // ========================================
  // PASO 6: Generar razones y advertencias
  // ========================================
  const reasons: string[] = []
  const warnings: string[] = []
  
  // Alineación
  if (alignment.isAligned) {
    reasons.push(`Tendencia ${trend1D === 'bullish' ? 'alcista' : 'bajista'} confirmada en 1D y 1H`)
  } else {
    warnings.push('Sin alineación entre 1D y 1H')
  }
  
  // Confirmación
  if (confirmation.isConfirmed) {
    reasons.push('15M confirma o no contradice')
  } else {
    warnings.push('15M contradice la dirección')
  }
  
  // Zona
  if (zone.isInZone) {
    reasons.push('Precio en zona de entrada óptima')
  } else if (zone.distanceToZone < 1) {
    warnings.push(`Precio cerca de zona (${zone.distanceToZone.toFixed(2)}%)`)
  } else {
    warnings.push('Precio fuera de zona de entrada')
  }
  
  // Volumen
  if (volume.isSufficient) {
    reasons.push('Volumen favorable')
  } else {
    warnings.push('Volumen bajo')
  }
  
  // Confianza
  if (confidence < CONFIG.MIN_CONFIDENCE) {
    warnings.push(`⚠️ BLOQUEO: Confianza ${confidence.toFixed(0)}% < ${CONFIG.MIN_CONFIDENCE}%`)
  }
  
  // ========================================
  // PASO 7: Generar explicación detallada
  // ========================================
  const explanation = generateExplanation(
    conditions,
    confidence,
    direction,
    status
  )
  
  // ========================================
  // PASO 8: Calcular niveles de trading
  // ========================================
  const levels = calculateLevels(currentPrice, direction, zones)
  
  // ========================================
  // RESULTADO FINAL
  // ========================================
  return {
    status,
    statusIcon: icon,
    statusText: text,
    direction,
    directionText,
    confidence,
    conditions,
    explanation,
    reasons,
    warnings,
    levels,
    timestamp: new Date(),
    symbol,
    timeframe: '1H' // Timeframe de ejecución
  }
}

// ============================================
// EXPLANATION GENERATOR
// ============================================

function generateExplanation(
  conditions: DecisionConditions,
  confidence: number,
  direction: DecisionDirection,
  status: DecisionStatus
): DecisionExplanation {
  const conditionExplanations: ConditionExplanation[] = []
  const blockingReasons: string[] = []
  const suggestions: string[] = []
  const whatToWait: string[] = []
  
  // 1. Tendencia (Alineación 1D/1H)
  const alignmentValue = conditions.alignment.trend1D === conditions.alignment.trend1H
    ? `${conditions.alignment.trend1D === 'bullish' ? '📈 Alcista' : conditions.alignment.trend1D === 'bearish' ? '📉 Bajista' : '➡️ Lateral'} en 1D y 1H`
    : `1D: ${conditions.alignment.trend1D === 'bullish' ? '📈' : conditions.alignment.trend1D === 'bearish' ? '📉' : '➡️'} | 1H: ${conditions.alignment.trend1H === 'bullish' ? '📈' : conditions.alignment.trend1H === 'bearish' ? '📉' : '➡️'}`
  
  conditionExplanations.push({
    name: 'Tendencia (1D/1H)',
    passed: conditions.alignment.isAligned,
    value: alignmentValue,
    required: '1D y 1H deben coincidir',
    explanation: conditions.alignment.isAligned
      ? 'Las tendencias están alineadas, confirmando la dirección principal'
      : 'Las tendencias están en conflicto, no hay dirección clara',
    suggestion: conditions.alignment.isAligned
      ? 'Mantener vigilancia'
      : 'Esperar a que 1D y 1H coincidan en la misma dirección'
  })
  
  if (!conditions.alignment.isAligned) {
    blockingReasons.push('❌ Tendencias en conflicto (1D ≠ 1H)')
    suggestions.push('Esperar alineación de tendencias en 1D y 1H')
    whatToWait.push('Que 1D y 1H coincidan en dirección alcista o bajista')
  }
  
  // 2. Confirmación (15M)
  const confirmationValue = conditions.confirmation.trend15M === 'bullish'
    ? '📈 Alcista'
    : conditions.confirmation.trend15M === 'bearish'
    ? '📉 Bajista'
    : '➡️ Neutral'
  
  conditionExplanations.push({
    name: 'Confirmación (15M)',
    passed: conditions.confirmation.isConfirmed,
    value: confirmationValue,
    required: '15M debe apoyar o no contradecir',
    explanation: conditions.confirmation.isConfirmed
      ? '15M confirma la dirección o está neutral'
      : '15M contradice la dirección principal',
    suggestion: conditions.confirmation.isConfirmed
      ? 'Confirmación recibida'
      : 'Esperar a que 15M confirme la dirección'
  })
  
  if (!conditions.confirmation.isConfirmed) {
    blockingReasons.push('❌ 15M no confirma la dirección')
    suggestions.push('Esperar señal en 15M que confirme la dirección')
    whatToWait.push('Que 15M muestre la misma dirección o se mantenga neutral')
  }
  
  // 3. Zona de entrada
  const zoneValue = conditions.zone.isInZone
    ? '✅ En zona'
    : `${conditions.zone.distanceToZone.toFixed(2)}% fuera`
  
  conditionExplanations.push({
    name: 'Zona de Entrada',
    passed: conditions.zone.isInZone,
    value: zoneValue,
    required: 'Precio debe estar en zona de entrada',
    explanation: conditions.zone.isInZone
      ? 'El precio está en la zona óptima para entrar'
      : `El precio está ${conditions.zone.distanceToZone.toFixed(2)}% fuera de la zona de entrada`,
    suggestion: conditions.zone.isInZone
      ? 'Zona óptima detectada'
      : conditions.zone.zoneType === 'above'
        ? 'Esperar retroceso del precio hacia abajo'
        : 'Esperar a que el precio suba a la zona'
  })
  
  if (!conditions.zone.isInZone) {
    blockingReasons.push(`❌ Precio fuera de zona (${conditions.zone.distanceToZone.toFixed(2)}%)`)
    suggestions.push(conditions.zone.zoneType === 'above' 
      ? 'Esperar a que el precio retroceda a la zona'
      : 'Esperar a que el precio alcance la zona')
    whatToWait.push('Que el precio llegue a la zona de entrada')
  }
  
  // 4. Volumen
  const volumeValue = `${(conditions.volume.ratio * 100).toFixed(0)}% del promedio`
  
  conditionExplanations.push({
    name: 'Volumen',
    passed: conditions.volume.isSufficient,
    value: volumeValue,
    required: 'Volumen ≥ 100% del promedio',
    explanation: conditions.volume.isSufficient
      ? 'El volumen es suficiente para validar el movimiento'
      : 'El volumen está por debajo del promedio, movimiento débil',
    suggestion: conditions.volume.isSufficient
      ? 'Volumen validado'
      : 'Esperar aumento de volumen'
  })
  
  if (!conditions.volume.isSufficient) {
    blockingReasons.push(`❌ Volumen bajo (${(conditions.volume.ratio * 100).toFixed(0)}%)`)
    suggestions.push('Esperar aumento de volumen antes de operar')
    whatToWait.push('Que el volumen supere el promedio')
  }
  
  // 5. Confianza
  conditionExplanations.push({
    name: 'Confianza',
    passed: conditions.confidence.isSufficient,
    value: `${confidence.toFixed(0)}%`,
    required: 'Mínimo 70%',
    explanation: conditions.confidence.isSufficient
      ? 'La confianza es suficiente para operar'
      : `La confianza de ${confidence.toFixed(0)}% está por debajo del mínimo requerido`,
    suggestion: conditions.confidence.isSufficient
      ? 'Confianza óptima'
      : 'Mejorar condiciones para aumentar la confianza'
  })
  
  if (!conditions.confidence.isSufficient) {
    blockingReasons.push(`❌ Confianza insuficiente (${confidence.toFixed(0)}% < 70%)`)
    suggestions.push('Resolver las condiciones pendientes para aumentar la confianza')
    whatToWait.push('Que la confianza supere el 70%')
  }
  
  return {
    conditions: conditionExplanations,
    blockingReasons,
    suggestions,
    whatToWait
  }
}

// ============================================
// HELPER FUNCTIONS FOR DISPLAY
// ============================================

export function getDecisionColor(status: DecisionStatus): string {
  switch (status) {
    case 'ready': return 'emerald'
    case 'preparing': return 'amber'
    case 'avoid': return 'red'
  }
}

export function getDecisionBgColor(status: DecisionStatus): string {
  switch (status) {
    case 'ready': return 'bg-emerald-500/20'
    case 'preparing': return 'bg-amber-500/20'
    case 'avoid': return 'bg-red-500/20'
  }
}

export function getDecisionBorderColor(status: DecisionStatus): string {
  switch (status) {
    case 'ready': return 'border-emerald-500/30'
    case 'preparing': return 'border-amber-500/30'
    case 'avoid': return 'border-red-500/30'
  }
}

export function getDecisionTextColor(status: DecisionStatus): string {
  switch (status) {
    case 'ready': return 'text-emerald-500'
    case 'preparing': return 'text-amber-500'
    case 'avoid': return 'text-red-500'
  }
}

// ============================================
// SINGLE SOURCE OF TRUTH
// ============================================

// Cache para evitar recálculos innecesarios
let cachedDecision: TradingDecision | null = null
let lastCalculationTime = 0
const CACHE_DURATION = 1000 // 1 segundo

/**
 * Obtener decisión única (usada por todos los módulos)
 * Esta es la FUNCIÓN PRINCIPAL que garantiza consistencia
 */
export function getUnifiedDecision(
  analysis: Record<'1D' | '1H' | '15M', TimeframeAnalysis>,
  currentPrice: number,
  zones: TradingZones | null,
  symbol: string,
  forceRefresh: boolean = false
): TradingDecision {
  const now = Date.now()
  
  // Verificar cache
  if (!forceRefresh && cachedDecision && (now - lastCalculationTime) < CACHE_DURATION) {
    // Solo actualizar timestamp
    return {
      ...cachedDecision,
      timestamp: new Date()
    }
  }
  
  // Calcular nueva decisión
  const decision = generateTradingDecision(analysis, currentPrice, zones, symbol)
  
  // Actualizar cache
  cachedDecision = decision
  lastCalculationTime = now
  
  return decision
}

/**
 * Limpiar cache (forzar recálculo)
 */
export function clearDecisionCache(): void {
  cachedDecision = null
  lastCalculationTime = 0
}
