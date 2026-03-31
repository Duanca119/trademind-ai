// News API Service for fetching cryptocurrency news

export interface NewsArticle {
  id: string
  title: string
  description: string | null
  source: string
  publishedAt: string
  url: string
  urlToImage: string | null
  sentiment: 'positive' | 'negative' | 'neutral'
  sentimentReason: string
}

export interface NewsSummary {
  total: number
  positive: number
  negative: number
  neutral: number
  alertLevel: 'low' | 'medium' | 'high'
  alertMessage: string
}

// Keywords for sentiment analysis
const POSITIVE_KEYWORDS = [
  'sube', 'récord', 'crece', 'aumenta', 'ganancia', 'alcista', 'positivo',
  'adopción', 'aprobar', 'éxito', 'subida', 'boom', 'histórico', 'máximo',
  'beneficio', 'rentable', 'inversión', 'crecimiento', 'expansión', 'mejora',
  'rally', 'bull', 'surge', 'gains', 'high', 'rise', 'soars'
]

const NEGATIVE_KEYWORDS = [
  'cae', 'crisis', 'prohibición', 'prohibir', 'baja', 'pérdida', 'bajista',
  'negativo', 'riesgo', 'colapso', 'caída', 'ban', 'regulación', 'multa',
  'fraude', 'estafa', 'hackeo', 'robado', 'desplome', 'crash', 'bear',
  'drops', 'falls', 'decline', 'loss', 'fear', 'panic', 'sell'
]

/**
 * Analyze sentiment of article title and description
 */
function analyzeSentiment(title: string, description: string | null): { 
  sentiment: 'positive' | 'negative' | 'neutral'
  reason: string 
} {
  const text = `${title} ${description || ''}`.toLowerCase()
  
  let positiveScore = 0
  let negativeScore = 0
  
  // Count positive keywords
  POSITIVE_KEYWORDS.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) {
      positiveScore++
    }
  })
  
  // Count negative keywords
  NEGATIVE_KEYWORDS.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) {
      negativeScore++
    }
  })
  
  // Determine sentiment
  if (positiveScore > negativeScore && positiveScore >= 1) {
    return { 
      sentiment: 'positive', 
      reason: positiveScore > 2 ? 'Múltiples indicadores positivos' : 'Indicadores positivos detectados'
    }
  } else if (negativeScore > positiveScore && negativeScore >= 1) {
    return { 
      sentiment: 'negative', 
      reason: negativeScore > 2 ? 'Múltiples indicadores negativos' : 'Indicadores negativos detectados'
    }
  }
  
  return { sentiment: 'neutral', reason: 'Sin indicadores claros' }
}

/**
 * Fetch crypto news from NewsAPI
 */
export async function fetchCryptoNews(): Promise<{ articles: NewsArticle[]; summary: NewsSummary }> {
  try {
    // Using the provided API key
    const apiKey = 'pub_c938a7f9fc5548c7b0504029bbb67791'
    const url = `https://newsapi.org/v2/everything?q=bitcoin&language=es&sortBy=publishedAt&apiKey=${apiKey}&pageSize=10`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      // Fallback to mock data if API fails
      console.warn('NewsAPI failed, using mock data')
      return getMockNews()
    }
    
    const data = await response.json()
    
    if (data.status !== 'ok') {
      return getMockNews()
    }
    
    // Process articles
    const articles: NewsArticle[] = data.articles.map((article: any, index: number) => {
      const { sentiment, reason } = analyzeSentiment(article.title, article.description)
      
      return {
        id: `news-${index}-${Date.now()}`,
        title: article.title,
        description: article.description,
        source: article.source?.name || 'Unknown',
        publishedAt: article.publishedAt,
        url: article.url,
        urlToImage: article.urlToImage,
        sentiment,
        sentimentReason: reason
      }
    })
    
    // Calculate summary
    const summary = calculateNewsSummary(articles)
    
    return { articles, summary }
    
  } catch (error) {
    console.error('Error fetching news:', error)
    return getMockNews()
  }
}

/**
 * Calculate news summary statistics
 */
function calculateNewsSummary(articles: NewsArticle[]): NewsSummary {
  const positive = articles.filter(a => a.sentiment === 'positive').length
  const negative = articles.filter(a => a.sentiment === 'negative').length
  const neutral = articles.filter(a => a.sentiment === 'neutral').length
  const total = articles.length
  
  let alertLevel: 'low' | 'medium' | 'high' = 'low'
  let alertMessage = 'Mercado estable según noticias'
  
  if (negative > positive + 2) {
    alertLevel = 'high'
    alertMessage = '⚠️ Alta volatilidad posible - Noticias negativas dominantes'
  } else if (negative > positive) {
    alertLevel = 'medium'
    alertMessage = '⚡ Posible volatilidad - Tendencia negativa en noticias'
  } else if (positive > negative + 2) {
    alertLevel = 'low'
    alertMessage = '📈 Sentimiento positivo en el mercado'
  }
  
  return { total, positive, negative, neutral, alertLevel, alertMessage }
}

/**
 * Get mock news data as fallback
 */
export function getMockNews(): { articles: NewsArticle[]; summary: NewsSummary } {
  const mockArticles: NewsArticle[] = [
    {
      id: 'mock-1',
      title: 'Bitcoin alcanza nuevos máximos en adopción institucional',
      description: 'Las grandes instituciones siguen aumentando su exposición a Bitcoin',
      source: 'CryptoNews',
      publishedAt: new Date().toISOString(),
      url: '#',
      urlToImage: null,
      sentiment: 'positive',
      sentimentReason: 'Indicadores positivos detectados'
    },
    {
      id: 'mock-2',
      title: 'Análisis técnico muestra señales de consolidación',
      description: 'El precio de Bitcoin se mantiene en rango lateral',
      source: 'TradingView',
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      url: '#',
      urlToImage: null,
      sentiment: 'neutral',
      sentimentReason: 'Sin indicadores claros'
    },
    {
      id: 'mock-3',
      title: 'Reguladores evalúan nuevas normas para criptomonedas',
      description: 'Nuevos marcos regulatorios podrían impactar el mercado',
      source: 'Reuters',
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      url: '#',
      urlToImage: null,
      sentiment: 'neutral',
      sentimentReason: 'Sin indicadores claros'
    },
    {
      id: 'mock-4',
      title: 'El volumen de Bitcoin crece significativamente',
      description: 'El interés institucional impulza el volumen de operaciones',
      source: 'Bloomberg',
      publishedAt: new Date(Date.now() - 10800000).toISOString(),
      url: '#',
      urlToImage: null,
      sentiment: 'positive',
      sentimentReason: 'Múltiples indicadores positivos'
    },
    {
      id: 'mock-5',
      title: 'Expertos predicen posible rally alcista',
      description: 'Análisis sugiere que Bitcoin podría subir en las próximas semanas',
      source: 'CoinDesk',
      publishedAt: new Date(Date.now() - 14400000).toISOString(),
      url: '#',
      urlToImage: null,
      sentiment: 'positive',
      sentimentReason: 'Indicadores positivos detectados'
    }
  ]
  
  const summary = calculateNewsSummary(mockArticles)
  
  return { articles: mockArticles, summary }
}

/**
 * Format time ago for display
 */
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 60) {
    return `Hace ${diffMins} min`
  } else if (diffHours < 24) {
    return `Hace ${diffHours}h`
  } else {
    return `Hace ${diffDays}d`
  }
}
