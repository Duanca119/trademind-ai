import { useState, useEffect, useCallback } from 'react';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relatedAssets: string[];
  publishedAt: number;
}

interface UseNewsReturn {
  news: NewsItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useNews(): UseNewsReturn {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      const response = await fetch('/api/news');
      const data = await response.json();

      if (data.success && data.data) {
        setNews(data.data);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Error al obtener noticias');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return { news, isLoading, error, refresh };
}
