// ============================================
// SUPABASE CLIENT CONFIGURATION
// ============================================

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if Supabase is properly configured
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('trades').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}

/**
 * Test database connection and return status
 */
export async function testConnection(): Promise<{ 
  connected: boolean
  tables: string[]
  error?: string 
}> {
  try {
    const tables = ['trades', 'trading_sessions', 'user_settings', 'watchlist', 'trading_notes']
    const results: string[] = []
    
    for (const table of tables) {
      const { error } = await supabase.from(table as any).select('id').limit(1)
      if (!error) results.push(table)
    }
    
    return { 
      connected: results.length > 0, 
      tables: results 
    }
  } catch (error: any) {
    return { 
      connected: false, 
      tables: [],
      error: error.message 
    }
  }
}

export default supabase
