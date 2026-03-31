'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  ForexPairAnalysis, 
  ScannerRanking, 
  FOREX_PAIRS 
} from '@/types/trading'
import { 
  scanAllForexPairs, 
  analyzeForexPair,
  formatForexPrice,
  getStatusColor,
  getStatusIcon,
  getStatusText
} from '@/lib/forex-api'

export interface UseForexScannerReturn {
  // Ranking data
  ranking: ScannerRanking | null
  
  // All pair analyses
  allPairs: ForexPairAnalysis[]
  
  // Selected pair for detail view
  selectedPair: ForexPairAnalysis | null
  setSelectedPairId: (pairId: string | null) => void
  
  // Loading state
  isLoading: boolean
  
  // Error state
  error: string | null
  
  // Last scan time
  lastScanTime: Date | null
  
  // Scan progress
  scanProgress: number
  
  // Manual refresh
  refresh: () => void
  
  // Helpers
  formatPrice: (price: number, pairId: string) => string
  getStatusColor: (status: 'ready' | 'preparing' | 'avoid') => string
  getStatusIcon: (status: 'ready' | 'preparing' | 'avoid') => string
  getStatusText: (status: 'ready' | 'preparing' | 'avoid') => string
  
  // Auto-refresh control
  isAutoRefresh: boolean
  setAutoRefresh: (enabled: boolean) => void
}

const SCAN_INTERVAL = 10000 // 10 seconds

export function useForexScanner(): UseForexScannerReturn {
  const [ranking, setRanking] = useState<ScannerRanking | null>(null)
  const [allPairs, setAllPairs] = useState<ForexPairAnalysis[]>([])
  const [selectedPairId, setSelectedPairId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [isAutoRefresh, setAutoRefresh] = useState(true)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  
  // Get selected pair analysis
  const selectedPair = selectedPairId 
    ? allPairs.find(p => p.pairId === selectedPairId) || null 
    : null
  
  // Scan function
  const performScan = useCallback(() => {
    if (!isMountedRef.current) return
    
    setIsLoading(true)
    setError(null)
    setScanProgress(0)
    
    try {
      // Simulate progressive scanning
      const totalPairs = FOREX_PAIRS.length
      let scanned = 0
      
      // Scan all pairs
      const newRanking = scanAllForexPairs()
      
      scanned = totalPairs
      setScanProgress((scanned / totalPairs) * 100)
      
      if (!isMountedRef.current) return
      
      // Update state
      setRanking(newRanking)
      setAllPairs(newRanking.topPicks.concat(newRanking.readyToTrade.slice(5)).concat(newRanking.preparing).concat(newRanking.avoid))
      setLastScanTime(new Date())
      setIsLoading(false)
      
    } catch (err) {
      console.error('Error scanning forex pairs:', err)
      if (isMountedRef.current) {
        setError('Error al escanear pares de Forex')
        setIsLoading(false)
      }
    }
  }, [])
  
  // Initial scan and setup interval
  useEffect(() => {
    isMountedRef.current = true
    
    // Initial scan
    performScan()
    
    // Setup auto-refresh interval
    if (isAutoRefresh) {
      intervalRef.current = setInterval(performScan, SCAN_INTERVAL)
    }
    
    // Cleanup
    return () => {
      isMountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [performScan, isAutoRefresh])
  
  // Update interval when auto-refresh changes
  useEffect(() => {
    if (isAutoRefresh && !intervalRef.current) {
      intervalRef.current = setInterval(performScan, SCAN_INTERVAL)
    } else if (!isAutoRefresh && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [isAutoRefresh, performScan])
  
  // Manual refresh
  const refresh = useCallback(() => {
    setIsLoading(true)
    setError(null)
    performScan()
  }, [performScan])
  
  return {
    ranking,
    allPairs,
    selectedPair,
    setSelectedPairId,
    isLoading,
    error,
    lastScanTime,
    scanProgress,
    refresh,
    formatPrice: formatForexPrice,
    getStatusColor,
    getStatusIcon,
    getStatusText,
    isAutoRefresh,
    setAutoRefresh
  }
}

export default useForexScanner
