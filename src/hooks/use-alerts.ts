'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { TradingZones } from '@/types/trading'

// ============================================
// ALERT TYPES
// ============================================

export type AlertType = 'entry' | 'pre_entry' | 'stop_loss' | 'take_profit_1' | 'take_profit_2'

export interface TradingAlert {
  id: string
  type: AlertType
  title: string
  message: string
  timestamp: Date
  isRead: boolean
  price: number
  zone: string
}

export interface AlertsState {
  activeAlerts: TradingAlert[]
  alertHistory: TradingAlert[]
  lastAlertType: AlertType | null
  isAlertActive: boolean
  currentAlert: TradingAlert | null
}

// ============================================
// ALERT CONFIGURATION
// ============================================

const ALERT_CONFIG = {
  entry: {
    title: 'PRECIO EN ZONA DE ENTRADA',
    message: 'Revisar posible operación',
    color: 'emerald',
    icon: '🎯'
  },
  pre_entry: {
    title: 'PRECIO ACERCÁNDOSE',
    message: 'Precio acercándose a zona clave',
    color: 'amber',
    icon: '⚠️'
  },
  stop_loss: {
    title: 'STOP LOSS ACTIVADO',
    message: 'Salir de la operación',
    color: 'red',
    icon: '🛑'
  },
  take_profit_1: {
    title: 'OBJETIVO 2:1 ALCANZADO',
    message: 'Considerar cerrar operación',
    color: 'blue',
    icon: '🎯'
  },
  take_profit_2: {
    title: 'OBJETIVO 3:1 ALCANZADO',
    message: 'Excelente resultado - Considerar cerrar',
    color: 'cyan',
    icon: '⭐'
  }
}

const ALERT_COOLDOWN = 30000 // 30 seconds between same alert types

// ============================================
// HOOK
// ============================================

export function useAlerts(
  currentPrice: number,
  zones: TradingZones,
  isConnected: boolean
) {
  const [state, setState] = useState<AlertsState>({
    activeAlerts: [],
    alertHistory: [],
    lastAlertType: null,
    isAlertActive: false,
    currentAlert: null
  })
  
  const lastAlertTimeRef = useRef<Record<AlertType, number>>({
    entry: 0,
    pre_entry: 0,
    stop_loss: 0,
    take_profit_1: 0,
    take_profit_2: 0
  })
  
  const lastPriceRef = useRef<number>(0)
  const lastZoneStateRef = useRef<{
    wasInEntryZone: boolean
    wasNearEntryZone: boolean
    wasBelowStopLoss: boolean
    wasAboveTP1: boolean
    wasAboveTP2: boolean
  }>({
    wasInEntryZone: false,
    wasNearEntryZone: false,
    wasBelowStopLoss: false,
    wasAboveTP1: false,
    wasAboveTP2: false
  })
  
  // Create a new alert
  const createAlert = useCallback((type: AlertType, price: number): TradingAlert => {
    const config = ALERT_CONFIG[type]
    return {
      id: `${type}_${Date.now()}`,
      type,
      title: config.title,
      message: config.message,
      timestamp: new Date(),
      isRead: false,
      price,
      zone: type === 'entry' || type === 'pre_entry' ? 'Entrada' : 
            type === 'stop_loss' ? 'Stop Loss' : 'Take Profit'
    }
  }, [])
  
  // Check if alert should be triggered (avoid spam)
  const canTriggerAlert = useCallback((type: AlertType): boolean => {
    const now = Date.now()
    const lastTime = lastAlertTimeRef.current[type]
    
    if (now - lastTime < ALERT_COOLDOWN) {
      return false
    }
    
    lastAlertTimeRef.current[type] = now
    return true
  }, [])
  
  // Trigger an alert
  const triggerAlert = useCallback((alert: TradingAlert) => {
    setState(prev => ({
      ...prev,
      activeAlerts: [alert, ...prev.activeAlerts].slice(0, 5),
      alertHistory: [alert, ...prev.alertHistory].slice(0, 20),
      lastAlertType: alert.type,
      isAlertActive: true,
      currentAlert: alert
    }))
  }, [])
  
  // Dismiss current alert
  const dismissAlert = useCallback(() => {
    setState(prev => ({
      ...prev,
      isAlertActive: false,
      currentAlert: null
    }))
  }, [])
  
  // Mark alert as read
  const markAsRead = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      activeAlerts: prev.activeAlerts.map(a => 
        a.id === alertId ? { ...a, isRead: true } : a
      )
    }))
  }, [])
  
  // Clear all alerts
  const clearAlerts = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeAlerts: [],
      isAlertActive: false,
      currentAlert: null
    }))
  }, [])
  
  // Check conditions and trigger alerts
  useEffect(() => {
    if (!currentPrice || !zones || zones.direction === 'neutral' || !isConnected) {
      return
    }
    
    const prev = lastZoneStateRef.current
    
    // Calculate current states
    const isInEntryZone = currentPrice >= zones.entryZone.low && currentPrice <= zones.entryZone.high
    
    // Pre-entry: within 1% of entry zone
    const preEntryRange = zones.entryZone.low * 0.01
    const isNearEntryZone = !isInEntryZone && (
      (currentPrice >= zones.entryZone.low - preEntryRange && currentPrice < zones.entryZone.low) ||
      (currentPrice > zones.entryZone.high && currentPrice <= zones.entryZone.high + preEntryRange)
    )
    
    // Stop loss check
    const isStopLossHit = zones.direction === 'buy' 
      ? currentPrice <= zones.stopLoss 
      : zones.direction === 'sell' 
        ? currentPrice >= zones.stopLoss 
        : false
    
    // Take profit checks
    const isTP1Hit = zones.direction === 'buy'
      ? currentPrice >= zones.takeProfit1
      : zones.direction === 'sell'
        ? currentPrice <= zones.takeProfit1
        : false
    
    const isTP2Hit = zones.direction === 'buy'
      ? currentPrice >= zones.takeProfit2
      : zones.direction === 'sell'
        ? currentPrice <= zones.takeProfit2
        : false
    
    // Check for state changes and trigger alerts
    
    // Entry zone alert - only when entering the zone
    if (isInEntryZone && !prev.wasInEntryZone && canTriggerAlert('entry')) {
      triggerAlert(createAlert('entry', currentPrice))
    }
    
    // Pre-entry alert
    if (isNearEntryZone && !prev.wasNearEntryZone && !isInEntryZone && canTriggerAlert('pre_entry')) {
      triggerAlert(createAlert('pre_entry', currentPrice))
    }
    
    // Stop loss alert - critical
    if (isStopLossHit && !prev.wasBelowStopLoss && canTriggerAlert('stop_loss')) {
      triggerAlert(createAlert('stop_loss', currentPrice))
    }
    
    // Take Profit 1 alert
    if (isTP1Hit && !prev.wasAboveTP1 && canTriggerAlert('take_profit_1')) {
      triggerAlert(createAlert('take_profit_1', currentPrice))
    }
    
    // Take Profit 2 alert
    if (isTP2Hit && !prev.wasAboveTP2 && canTriggerAlert('take_profit_2')) {
      triggerAlert(createAlert('take_profit_2', currentPrice))
    }
    
    // Update previous state
    lastZoneStateRef.current = {
      wasInEntryZone: isInEntryZone,
      wasNearEntryZone: isNearEntryZone,
      wasBelowStopLoss: isStopLossHit,
      wasAboveTP1: isTP1Hit,
      wasAboveTP2: isTP2Hit
    }
    
    lastPriceRef.current = currentPrice
    
  }, [currentPrice, zones, isConnected, canTriggerAlert, createAlert, triggerAlert])
  
  // Auto-dismiss alert after 10 seconds
  useEffect(() => {
    if (state.isAlertActive && state.currentAlert) {
      const timer = setTimeout(() => {
        dismissAlert()
      }, 10000)
      
      return () => clearTimeout(timer)
    }
  }, [state.isAlertActive, state.currentAlert, dismissAlert])
  
  return {
    ...state,
    dismissAlert,
    markAsRead,
    clearAlerts,
    alertConfig: ALERT_CONFIG
  }
}

export default useAlerts
