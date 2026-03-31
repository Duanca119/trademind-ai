'use client'

import { useMemo } from 'react'
import { detectSupportResistance, SupportResistanceAnalysis, PriceZone, formatZone, getZoneStatus } from '@/lib/support-resistance'
import { Candlestick } from '@/lib/binance-api'

export type { SupportResistanceAnalysis, PriceZone }

export interface UseSupportResistanceOptions {
  klines1D: Candlestick[]
  klines1H: Candlestick[]
  klines15M: Candlestick[]
  currentPrice: number
  trend?: 'bullish' | 'bearish' | 'sideways'
}

export interface SupportResistanceResult extends SupportResistanceAnalysis {
  // Formatted zones for display
  formattedNearestSupport: string | null
  formattedNearestResistance: string | null
  
  // Zone status
  supportStatus: 'active' | 'testing' | 'broken' | null
  resistanceStatus: 'active' | 'testing' | 'broken' | null
  
  // Entry recommendations
  entryRecommendation: {
    action: 'WAIT_BOUNCE' | 'WAIT_REJECTION' | 'NEAR_ENTRY' | 'AWAIT_PULLBACK' | 'NO_CLEAR_LEVEL'
    message: string
    zone: PriceZone | null
  }
  
  // Helper functions
  formatZone: (zone: PriceZone) => string
  getZoneStatus: (zone: PriceZone) => 'active' | 'testing' | 'broken'
}

export function useSupportResistance({
  klines1D,
  klines1H,
  klines15M,
  currentPrice,
  trend = 'sideways'
}: UseSupportResistanceOptions): SupportResistanceResult {
  
  const analysis = useMemo(() => {
    if (!klines1D.length || !klines1H.length || !klines15M.length || currentPrice <= 0) {
      return null
    }
    
    return detectSupportResistance(
      {
        '1D': klines1D,
        '1H': klines1H,
        '15M': klines15M
      },
      currentPrice,
      trend
    )
  }, [klines1D, klines1H, klines15M, currentPrice, trend])
  
  // Default result when no data
  const defaultResult: SupportResistanceResult = {
    supports: [],
    resistances: [],
    nearestSupport: null,
    nearestResistance: null,
    currentPrice,
    pricePosition: 'mid_range',
    zonesByTimeframe: {
      '1D': { supports: [], resistances: [] },
      '1H': { supports: [], resistances: [] },
      '15M': { supports: [], resistances: [] }
    },
    recommendedEntry: { zone: null, direction: 'none', confidence: 0 },
    formattedNearestSupport: null,
    formattedNearestResistance: null,
    supportStatus: null,
    resistanceStatus: null,
    entryRecommendation: {
      action: 'NO_CLEAR_LEVEL',
      message: 'No hay niveles claros identificados',
      zone: null
    },
    formatZone: () => '',
    getZoneStatus: () => 'active'
  }
  
  if (!analysis) {
    return defaultResult
  }
  
  // Format zones
  const formattedNearestSupport = analysis.nearestSupport 
    ? formatZone(analysis.nearestSupport, 5)
    : null
    
  const formattedNearestResistance = analysis.nearestResistance
    ? formatZone(analysis.nearestResistance, 5)
    : null
  
  // Get zone status
  const supportStatus = analysis.nearestSupport 
    ? getZoneStatus(analysis.nearestSupport, currentPrice)
    : null
    
  const resistanceStatus = analysis.nearestResistance
    ? getZoneStatus(analysis.nearestResistance, currentPrice)
    : null
  
  // Generate entry recommendation
  const entryRecommendation = generateEntryRecommendation(
    analysis,
    currentPrice,
    trend
  )
  
  return {
    ...analysis,
    formattedNearestSupport,
    formattedNearestResistance,
    supportStatus,
    resistanceStatus,
    entryRecommendation,
    formatZone: (zone: PriceZone) => formatZone(zone, 5),
    getZoneStatus: (zone: PriceZone) => getZoneStatus(zone, currentPrice)
  }
}

/**
 * Generate entry recommendation based on support/resistance analysis
 */
function generateEntryRecommendation(
  analysis: SupportResistanceAnalysis,
  currentPrice: number,
  trend: 'bullish' | 'bearish' | 'sideways'
): SupportResistanceResult['entryRecommendation'] {
  const { nearestSupport, nearestResistance, pricePosition, recommendedEntry } = analysis
  
  // No clear levels
  if (!nearestSupport && !nearestResistance) {
    return {
      action: 'NO_CLEAR_LEVEL',
      message: 'No hay niveles claros identificados. Esperar más datos.',
      zone: null
    }
  }
  
  // Near support zone
  if (pricePosition === 'near_support' && nearestSupport) {
    if (trend === 'bullish') {
      return {
        action: 'NEAR_ENTRY',
        message: '🎯 Zona de entrada alcista. Precio cerca de soporte clave.',
        zone: nearestSupport
      }
    } else if (trend === 'bearish') {
      return {
        action: 'AWAIT_PULLBACK',
        message: '⚠️ Soporte cercano pero tendencia bajista. Esperar rotura.',
        zone: nearestSupport
      }
    }
    return {
      action: 'WAIT_BOUNCE',
      message: '⏳ Esperar rebote en soporte para confirmar dirección.',
      zone: nearestSupport
    }
  }
  
  // Near resistance zone
  if (pricePosition === 'near_resistance' && nearestResistance) {
    if (trend === 'bearish') {
      return {
        action: 'NEAR_ENTRY',
        message: '🎯 Zona de entrada bajista. Precio cerca de resistencia clave.',
        zone: nearestResistance
      }
    } else if (trend === 'bullish') {
      return {
        action: 'AWAIT_PULLBACK',
        message: '⚠️ Resistencia cercana pero tendencia alcista. Esperar rotura.',
        zone: nearestResistance
      }
    }
    return {
      action: 'WAIT_REJECTION',
      message: '⏳ Esperar rechazo en resistencia para confirmar dirección.',
      zone: nearestResistance
    }
  }
  
  // Mid-range
  if (pricePosition === 'mid_range') {
    if (trend === 'bullish' && nearestSupport) {
      const distancePercent = ((currentPrice - nearestSupport.high) / currentPrice) * 100
      return {
        action: 'AWAIT_PULLBACK',
        message: `⏳ Esperar retroceso a soporte (${distancePercent.toFixed(2)}% abajo).`,
        zone: nearestSupport
      }
    }
    if (trend === 'bearish' && nearestResistance) {
      const distancePercent = ((nearestResistance.low - currentPrice) / currentPrice) * 100
      return {
        action: 'AWAIT_PULLBACK',
        message: `⏳ Esperar retroceso a resistencia (${distancePercent.toFixed(2)}% arriba).`,
        zone: nearestResistance
      }
    }
  }
  
  // Use recommended entry from analysis
  if (recommendedEntry.zone) {
    return {
      action: recommendedEntry.direction === 'buy' ? 'WAIT_BOUNCE' : 'WAIT_REJECTION',
      message: recommendedEntry.direction === 'buy'
        ? '📈 Zona de compra identificada. Esperar confirmación.'
        : '📉 Zona de venta identificada. Esperar confirmación.',
      zone: recommendedEntry.zone
    }
  }
  
  return {
    action: 'NO_CLEAR_LEVEL',
    message: 'Analizando niveles...',
    zone: null
  }
}

export default useSupportResistance
