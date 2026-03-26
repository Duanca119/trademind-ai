import { NextResponse } from 'next/server'

// NewsAPI configuration
const NEWS_API_URL = 'https://newsapi.org/v2/everything'
const API_KEY = 'pub_c938a7f9fc5548c7b0504029bbb67791'

interface NewsArticle {
  source: { id: string | null; name: string }
  author: string | null
  title: string
  description: string | null
  url: string
  urlToImage: string | null
  publishedAt: string
  content: string | null
}

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
const positiveKeywords = ['sube', 'récord', 'crece', 'alcista', 'subida', 'ganancia', 'éxito', 'adopción', 'aprobación', 'bull', 'rally', 'all-time high', 'ath', 'positive', 'surge', 'soars', 'rise', 'gains', 'breakthrough']
const negativeKeywords = ['cae', 'crisis', 'prohibición', 'bajista', 'caída', 'pérdida', 'fraude', 'hack', 'baja', 'crash', 'bear', 'decline', 'drops', 'ban', 'regulation', 'sec', 'sues', 'plunge', 'sell-off']
const volatilityKeywords = ['volatilidad', 'volátil', 'incertidumbre', 'inestable', 'fluctuación', 'volatile', 'uncertainty']

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

export async function GET() {
  try {
    // Fetch Bitcoin news
    const url = `${NEWS_API_URL}?q=bitcoin OR btc OR cryptocurrency&language=en&sortBy=publishedAt&pageSize=10&apiKey=${API_KEY}`
    
    const response = await fetch(url, { next: { revalidate: 300 } }) // Cache for 5 minutes
    
    if (!response.ok) {
      throw new Error('Failed to fetch news')
    }
    
    const data = await response.json()
    const classifiedNews = classifyArticles(data.articles || [])
    
    return NextResponse.json({ 
      articles: classifiedNews,
      summary: generateSummary(classifiedNews),
      highVolatility: checkHighVolatility(classifiedNews),
      lastUpdate: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('News API error:', error)
    
    // Return fallback mock data
    return NextResponse.json({ 
      articles: getMockNews(),
      summary: { positive: 2, negative: 1, neutral: 2 },
      highVolatility: false,
      lastUpdate: new Date().toISOString(),
      error: 'Using cached data'
    })
  }
}

function classifyArticles(articles: NewsArticle[]): ClassifiedNews[] {
  return articles.map((article, index) => ({
    id: `news-${index}`,
    title: article.title,
    source: article.source.name,
    date: formatTimeAgo(article.publishedAt),
    url: article.url,
    sentiment: classifySentiment(article.title, article.description),
    sentimentLabel: getSentimentLabel(classifySentiment(article.title, article.description)),
    image: article.urlToImage
  }))
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
  return [
    {
      id: 'mock-1',
      title: 'Bitcoin maintains key support as investors await regulatory decisions',
      source: 'Crypto News',
      date: 'Hace 1h',
      url: '#',
      sentiment: 'neutral',
      sentimentLabel: 'Neutral',
      image: null
    },
    {
      id: 'mock-2',
      title: 'Institutions increase Bitcoin exposure in diversified portfolios',
      source: 'Finance Daily',
      date: 'Hace 2h',
      url: '#',
      sentiment: 'positive',
      sentimentLabel: 'Positiva',
      image: null
    },
    {
      id: 'mock-3',
      title: 'Technical analysis: Bitcoin in consolidation zone before next move',
      source: 'Trading View',
      date: 'Hace 3h',
      url: '#',
      sentiment: 'neutral',
      sentimentLabel: 'Neutral',
      image: null
    },
    {
      id: 'mock-4',
      title: 'Bitcoin adoption grows in countries with high inflation',
      source: 'Economic Times',
      date: 'Hace 4h',
      url: '#',
      sentiment: 'positive',
      sentimentLabel: 'Positiva',
      image: null
    },
    {
      id: 'mock-5',
      title: 'Volatility alert: Crypto market awaits important economic data',
      source: 'Market Watch',
      date: 'Hace 5h',
      url: '#',
      sentiment: 'negative',
      sentimentLabel: 'Negativa',
      image: null
    }
  ]
}
