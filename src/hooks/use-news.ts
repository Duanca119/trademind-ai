'use client'

import { useState, useEffect, useCallback } from 'react'

export interface NewsArticle {
  id: string
  title: string
  source: string
  date: string
  url: string
  sentiment: 'positive' | 'negative' | 'neutral'
  sentimentLabel: string
  image: string | null
}

export interface NewsSummary {
  positive: number
  negative: number
  neutral: number
}

export interface NewsState {
  articles: NewsArticle[]
  summary: NewsSummary
  highVolatility: boolean
  lastUpdate: string | null
  isLoading: boolean
  error: string | null
}

const REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes

export function useNews() {
  const [state, setState] = useState<NewsState>({
    articles: [],
    summary: { positive: 0, negative: 0, neutral: 0 },
    highVolatility: false,
    lastUpdate: null,
    isLoading: true,
    error: null
  })
  
  const fetchNews = useCallback(async () => {
    try {
      const response = await fetch('/api/news')
      
      if (!response.ok) {
        throw new Error('Error al obtener noticias')
      }
      
      const data = await response.json()
      
      setState({
        articles: data.articles || [],
        summary: data.summary || { positive: 0, negative: 0, neutral: 0 },
        highVolatility: data.highVolatility || false,
        lastUpdate: data.lastUpdate || new Date().toISOString(),
        isLoading: false,
        error: null
      })
      
    } catch (error) {
      console.error('Error fetching news:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error al cargar noticias'
      }))
    }
  }, [])
  
  useEffect(() => {
    fetchNews()
    
    const interval = setInterval(fetchNews, REFRESH_INTERVAL)
    
    return () => clearInterval(interval)
  }, [fetchNews])
  
  return {
    ...state,
    refresh: fetchNews
  }
}

export default useNews
