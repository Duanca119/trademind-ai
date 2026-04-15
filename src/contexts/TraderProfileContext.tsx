'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

// ============================================
// TYPES
// ============================================

export type TraderProfileType = 'scalper' | 'dayTrader' | 'swingTrader'

export interface TraderProfileConfig {
  // Timeframes to use
  primaryTimeframe: string
  confirmationTimeframe: string
  entryTimeframe: string
  
  // Alert settings
  emaDistance: number // Percentage threshold for alerts
  alertCooldownMinutes: number
  checkIntervalMinutes: number
  
  // Display settings
  showHigherTimeframes: boolean
}

export interface TraderProfile {
  type: TraderProfileType
  name: string
  icon: string
  description: string
  config: TraderProfileConfig
}

export interface TraderProfileContextType {
  profile: TraderProfileType
  profileConfig: TraderProfile
  setProfile: (profile: TraderProfileType) => void
  customSettings: {
    emaDistance: number
    alertsEnabled: boolean
  }
  updateCustomSettings: (settings: Partial<{ emaDistance: number; alertsEnabled: boolean }>) => void
  isLoading: boolean
}

// ============================================
// PROFILE DEFINITIONS
// ============================================

export const TRADER_PROFILES: Record<TraderProfileType, TraderProfile> = {
  scalper: {
    type: 'scalper',
    name: 'Scalper',
    icon: '⚡',
    description: 'Operaciones rápidas en minutos. Alta frecuencia, objetivos pequeños.',
    config: {
      primaryTimeframe: '5M',
      confirmationTimeframe: '15M',
      entryTimeframe: '1M',
      emaDistance: 0.15,
      alertCooldownMinutes: 15,
      checkIntervalMinutes: 1,
      showHigherTimeframes: false
    }
  },
  dayTrader: {
    type: 'dayTrader',
    name: 'Day Trader',
    icon: '📊',
    description: 'Operaciones intradía. Balance entre frecuencia y calidad.',
    config: {
      primaryTimeframe: '1H',
      confirmationTimeframe: '1D',
      entryTimeframe: '5M',
      emaDistance: 0.2,
      alertCooldownMinutes: 60,
      checkIntervalMinutes: 2,
      showHigherTimeframes: true
    }
  },
  swingTrader: {
    type: 'swingTrader',
    name: 'Swing Trader',
    icon: '🧘',
    description: 'Operaciones de días a semanas. Menos ruido, más análisis.',
    config: {
      primaryTimeframe: '4H',
      confirmationTimeframe: '1D',
      entryTimeframe: '1H',
      emaDistance: 0.3,
      alertCooldownMinutes: 240,
      checkIntervalMinutes: 15,
      showHigherTimeframes: true
    }
  }
}

// ============================================
// CONTEXT
// ============================================

const TraderProfileContext = createContext<TraderProfileContextType | undefined>(undefined)

// ============================================
// PROVIDER
// ============================================

const LOCAL_STORAGE_KEY = 'trademind-trader-profile'
const LOCAL_STORAGE_SETTINGS_KEY = 'trademind-trader-settings'

export function TraderProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<TraderProfileType>('dayTrader')
  const [customSettings, setCustomSettings] = useState({
    emaDistance: 0.2,
    alertsEnabled: true
  })
  const [isLoading, setIsLoading] = useState(true)

  // Get current profile config
  const profileConfig = TRADER_PROFILES[profile]

  // Load from localStorage first, then sync with Supabase
  useEffect(() => {
    const loadProfile = async () => {
      // Try localStorage first
      try {
        const localProfile = localStorage.getItem(LOCAL_STORAGE_KEY) as TraderProfileType | null
        const localSettings = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY)
        
        if (localProfile && TRADER_PROFILES[localProfile]) {
          setProfileState(localProfile)
        }
        
        if (localSettings) {
          setCustomSettings(JSON.parse(localSettings))
        }
      } catch (e) {
        console.error('Error loading from localStorage:', e)
      }

      // Then sync with Supabase
      try {
        const response = await fetch('/api/market?action=get-trader-profile')
        const data = await response.json()
        
        if (data.profile && TRADER_PROFILES[data.profile as TraderProfileType]) {
          setProfileState(data.profile)
          localStorage.setItem(LOCAL_STORAGE_KEY, data.profile)
        }
        
        if (data.settings) {
          setCustomSettings(data.settings)
          localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(data.settings))
        }
      } catch (e) {
        console.error('Error loading from Supabase:', e)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  // Set profile and persist
  const setProfile = useCallback(async (newProfile: TraderProfileType) => {
    setProfileState(newProfile)
    
    // Save to localStorage
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, newProfile)
    } catch (e) {
      console.error('Error saving to localStorage:', e)
    }

    // Save to Supabase
    try {
      await fetch(`/api/market?action=set-trader-profile&profile=${newProfile}`)
    } catch (e) {
      console.error('Error saving to Supabase:', e)
    }
  }, [])

  // Update custom settings
  const updateCustomSettings = useCallback(async (settings: Partial<{ emaDistance: number; alertsEnabled: boolean }>) => {
    const newSettings = { ...customSettings, ...settings }
    setCustomSettings(newSettings)
    
    // Save to localStorage
    try {
      localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(newSettings))
    } catch (e) {
      console.error('Error saving settings to localStorage:', e)
    }

    // Save to Supabase
    try {
      const params = new URLSearchParams({
        action: 'set-trader-settings',
        emaDistance: String(newSettings.emaDistance),
        alertsEnabled: String(newSettings.alertsEnabled)
      })
      await fetch(`/api/market?${params}`)
    } catch (e) {
      console.error('Error saving settings to Supabase:', e)
    }
  }, [customSettings])

  return (
    <TraderProfileContext.Provider value={{ 
      profile, 
      profileConfig,
      setProfile,
      customSettings,
      updateCustomSettings,
      isLoading
    }}>
      {children}
    </TraderProfileContext.Provider>
  )
}

// ============================================
// HOOK
// ============================================

export function useTraderProfile() {
  const context = useContext(TraderProfileContext)
  if (context === undefined) {
    throw new Error('useTraderProfile must be used within a TraderProfileProvider')
  }
  return context
}
