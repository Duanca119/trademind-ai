import { NextResponse } from 'next/server'

// Dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic'

interface ClassifiedNews {
  id: string
  title: string
  source: string
  date: string
  url: string
  sentiment: 'positive' | 'negative' | 'neutral'
  sentimentLabel: string
  image: string | null
}

// Keywords for sentiment classification
const positiveKeywords = ['sube', 'récord', 'crece', 'alcista', 'subida', 'ganancia', 'éxito', 'adopción', 'aprobación', 'bull', 'rally', 'all-time high', 'ath', 'positive', 'surge', 'soars', 'rise', 'gains', 'breakthrough', 'high', 'jump', 'soar']
const negativeKeywords = ['cae', 'crisis', 'prohibición', 'bajista', 'caída', 'pérdida', 'fraude', 'hack', 'baja', 'crash', 'bear', 'decline', 'drops', 'ban', 'regulation', 'sec', 'sues', 'plunge', 'sell-off', 'fall', 'drop', 'low', 'fear']
const volatilityKeywords = ['volatilidad', 'volátil', 'incertidumbre', 'inestable', 'fluctuación', 'volatile', 'uncertainty', 'alert', 'warning']

function classifySentiment(title: string, description: string | null): 'positive' | 'negative' | 'neutral' {
  const text = `${title} ${description || ''}`.toLowerCase()
  
  let positiveScore = 0
  let negativeScore = 0
  
  positiveKeywords.forEach(keyword => {
    if (text.includes(keyword)) positiveScore++
  })
  
  negativeKeywords.forEach(keyword => {
    if (text.includes(keyword)) negativeScore++
  })
  
  if (positiveScore > negativeScore) return 'positive'
  if (negativeScore > positiveScore) return 'negative'
  return 'neutral'
}

function checkHighVolatility(articles: ClassifiedNews[]): boolean {
  const recentNegative = articles.filter(a => a.sentiment === 'negative').length
  const volatilityMentions = articles.filter(a => {
    const text = a.title.toLowerCase()
    return volatilityKeywords.some(k => text.includes(k))
  }).length
  
  return recentNegative >= 2 || volatilityMentions >= 1
}

// Try multiple news sources
async function fetchNewsFromMultipleSources(): Promise<ClassifiedNews[]> {
  // Try CryptoPanic API (free, no key needed for basic)
  try {
    const response = await fetch('https://cryptopanic.com/api/v1/posts/?public=true&currencies=BTC', {
      next: { revalidate: 300 },
      headers: { 'Accept': 'application/json' }
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.results && data.results.length > 0) {
        return data.results.slice(0, 10).map((item: any, index: number) => ({
          id: `news-${index}`,
          title: item.title || 'Crypto News',
          source: item.source?.domain || 'CryptoPanic',
          date: formatTimeAgo(item.created_at),
          url: item.url || '#',
          sentiment: classifySentiment(item.title, ''),
          sentimentLabel: getSentimentLabel(classifySentiment(item.title, '')),
          image: null
        }))
      }
    }
  } catch (e) {
    console.log('CryptoPanic API not available, trying next source')
  }

  // Try Binance News API
  try {
    const response = await fetch('https://www.binance.com/bapi/composite/v1/public/cms/article/catalog/list/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 1,
        catalogId: 48,
        pageNo: 1,
        pageSize: 10
      }),
      next: { revalidate: 300 }
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.data?.articles?.length > 0) {
        return data.data.articles.slice(0, 10).map((item: any, index: number) => ({
          id: `news-${index}`,
          title: item.title || 'Crypto News',
          source: 'Binance News',
          date: formatTimeAgo(item.releaseDate),
          url: `https://www.binance.com/en/news/${item.id}`,
          sentiment: classifySentiment(item.title, ''),
          sentimentLabel: getSentimentLabel(classifySentiment(item.title, '')),
          image: null
        }))
      }
    }
  } catch (e) {
    console.log('Binance News API not available')
  }

  // Return mock data if all APIs fail
  return getMockNews()
}

export async function GET() {
  try {
    // Check if we're in build mode
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ 
        articles: getMockNews(),
        summary: { positive: 2, negative: 1, neutral: 2 },
        highVolatility: false,
        lastUpdate: new Date().toISOString(),
        source: 'mock'
      })
    }

    const articles = await fetchNewsFromMultipleSources()
    
    return NextResponse.json({ 
      articles,
      summary: generateSummary(articles),
      highVolatility: checkHighVolatility(articles),
      lastUpdate: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('News API error:', error)
    
    // Return fallback mock data
    const mockArticles = getMockNews()
    return NextResponse.json({ 
      articles: mockArticles,
      summary: generateSummary(mockArticles),
      highVolatility: false,
      lastUpdate: new Date().toISOString(),
      source: 'fallback'
    })
  }
}

function getSentimentLabel(sentiment: 'positive' | 'negative' | 'neutral'): string {
  switch (sentiment) {
    case 'positive': return 'Positiva'
    case 'negative': return 'Negativa'
    default: return 'Neutral'
  }
}

function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours}h`
    return `Hace ${diffDays}d`
  } catch {
    return 'Reciente'
  }
}

function generateSummary(articles: ClassifiedNews[]): { positive: number; negative: number; neutral: number } {
  return {
    positive: articles.filter(a => a.sentiment === 'positive').length,
    negative: articles.filter(a => a.sentiment === 'negative').length,
    neutral: articles.filter(a => a.sentiment === 'neutral').length
  }
}

function getMockNews(): ClassifiedNews[] {
  const now = new Date()
  return [
    {
      id: 'mock-1',
      title: 'Bitcoin mantiene soporte clave mientras inversores esperan decisiones regulatorias',
      source: 'Crypto News',
      date: 'Hace 1h',
      url: '#',
      sentiment: 'neutral',
      sentimentLabel: 'Neutral',
      image: null
    },
    {
      id: 'mock-2',
      title: 'Institucionales aumentan exposición a Bitcoin en carteras diversificadas',
      source: 'Finance Daily',
      date: 'Hace 2h',
      url: '#',
      sentiment: 'positive',
      sentimentLabel: 'Positiva',
      image: null
    },
    {
      id: 'mock-3',
      title: 'Análisis técnico: Bitcoin en zona de consolidación antes del siguiente movimiento',
      source: 'Trading View',
      date: 'Hace 3h',
      url: '#',
      sentiment: 'neutral',
      sentimentLabel: 'Neutral',
      image: null
    },
    {
      id: 'mock-4',
      title: 'Adopción de Bitcoin crece en países con alta inflación',
      source: 'Economic Times',
      date: 'Hace 4h',
      url: '#',
      sentiment: 'positive',
      sentimentLabel: 'Positiva',
      image: null
    },
    {
      id: 'mock-5',
      title: 'Alerta de volatilidad: Mercado crypto espera datos económicos importantes',
      source: 'Market Watch',
      date: 'Hace 5h',
      url: '#',
      sentiment: 'negative',
      sentimentLabel: 'Negativa',
      image: null
    }
  ]
}
