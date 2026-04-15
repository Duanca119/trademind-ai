'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

// ============================================
// TYPES
// ============================================

interface SelectedPairContextType {
  selectedPair: string | null
  setSelectedPair: (pair: string | null) => void
  isLoading: boolean
  pairInfo: {
    name: string
    type: 'major' | 'cross'
  } | null
}

// ============================================
// CONTEXT
// ============================================

const SelectedPairContext = createContext<SelectedPairContextType | undefined>(undefined)

// ============================================
// FOREX PAIRS DATA
// ============================================

const FOREX_PAIRS_INFO: Record<string, { name: string; type: 'major' | 'cross' }> = {
  // Major pairs
  'EUR/USD': { name: 'Euro / Dólar', type: 'major' },
  'GBP/USD': { name: 'Libra / Dólar', type: 'major' },
  'USD/JPY': { name: 'Dólar / Yen', type: 'major' },
  'USD/CHF': { name: 'Dólar / Franco', type: 'major' },
  'AUD/USD': { name: 'Aussie / Dólar', type: 'major' },
  'USD/CAD': { name: 'Dólar / Loonie', type: 'major' },
  'NZD/USD': { name: 'Kiwi / Dólar', type: 'major' },
  // Cross pairs
  'EUR/GBP': { name: 'Euro / Libra', type: 'cross' },
  'EUR/JPY': { name: 'Euro / Yen', type: 'cross' },
  'GBP/JPY': { name: 'Libra / Yen', type: 'cross' },
  'EUR/AUD': { name: 'Euro / Aussie', type: 'cross' },
  'GBP/AUD': { name: 'Libra / Aussie', type: 'cross' },
  'AUD/JPY': { name: 'Aussie / Yen', type: 'cross' },
  'EUR/CHF': { name: 'Euro / Franco', type: 'cross' },
  'GBP/CHF': { name: 'Libra / Franco', type: 'cross' },
  'AUD/CHF': { name: 'Aussie / Franco', type: 'cross' },
  'NZD/JPY': { name: 'Kiwi / Yen', type: 'cross' },
  'EUR/CAD': { name: 'Euro / Loonie', type: 'cross' },
  'GBP/CAD': { name: 'Libra / Loonie', type: 'cross' },
  'AUD/CAD': { name: 'Aussie / Loonie', type: 'cross' },
  'AUD/NZD': { name: 'Aussie / Kiwi', type: 'cross' },
  'CAD/JPY': { name: 'Loonie / Yen', type: 'cross' }
}

// ============================================
// PROVIDER
// ============================================

const LOCAL_STORAGE_KEY = 'trademind-selected-pair'

export function SelectedPairProvider({ children }: { children: ReactNode }) {
  const [selectedPair, setSelectedPairState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Get pair info
  const pairInfo = selectedPair ? FOREX_PAIRS_INFO[selectedPair] || null : null

  // Load from localStorage first (fast), then sync with Supabase
  useEffect(() => {
    const loadSelectedPair = async () => {
      // Try localStorage first for fast load
      try {
        const localPair = localStorage.getItem(LOCAL_STORAGE_KEY)
        if (localPair) {
          setSelectedPairState(localPair)
        }
      } catch (e) {
        console.error('Error loading from localStorage:', e)
      }

      // Then sync with Supabase
      try {
        const response = await fetch('/api/market?action=get-selected-pair')
        const data = await response.json()
        
        if (data.selectedPair) {
          setSelectedPairState(data.selectedPair)
          // Update localStorage
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, data.selectedPair)
          } catch (e) {
            console.error('Error saving to localStorage:', e)
          }
        }
      } catch (e) {
        console.error('Error loading from Supabase:', e)
      } finally {
        setIsLoading(false)
      }
    }

    loadSelectedPair()
  }, [])

  // Set selected pair and persist
  const setSelectedPair = useCallback(async (pair: string | null) => {
    setSelectedPairState(pair)
    
    // Save to localStorage immediately
    try {
      if (pair) {
        localStorage.setItem(LOCAL_STORAGE_KEY, pair)
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY)
      }
    } catch (e) {
      console.error('Error saving to localStorage:', e)
    }

    // Save to Supabase
    try {
      if (pair) {
        await fetch(`/api/market?action=set-selected-pair&symbol=${encodeURIComponent(pair)}`)
      }
    } catch (e) {
      console.error('Error saving to Supabase:', e)
    }
  }, [])

  return (
    <SelectedPairContext.Provider value={{ 
      selectedPair, 
      setSelectedPair, 
      isLoading,
      pairInfo
    }}>
      {children}
    </SelectedPairContext.Provider>
  )
}

// ============================================
// HOOK
// ============================================

export function useSelectedPair() {
  const context = useContext(SelectedPairContext)
  if (context === undefined) {
    throw new Error('useSelectedPair must be used within a SelectedPairProvider')
  }
  return context
}
