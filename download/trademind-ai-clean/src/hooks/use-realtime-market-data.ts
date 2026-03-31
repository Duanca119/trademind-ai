import { useState, useEffect, useCallback, useRef } from 'react';

interface MarketDataItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume?: number;
  timestamp: number;
}

interface UseRealtimeMarketDataReturn {
  data: Record<string, MarketDataItem>;
  isLoading: boolean;
  error: string | null;
  lastUpdate: number | null;
  refresh: () => Promise<void>;
}

export function useRealtimeMarketData(
  refreshInterval: number = 3000
): UseRealtimeMarketDataReturn {
  const [data, setData] = useState<Record<string, MarketDataItem>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      // Fetch forex prices
      const forexResponse = await fetch('/api/forex-price');
      const forexData = await forexResponse.json();

      // Fetch crypto prices
      const cryptoResponse = await fetch('/api/market-data');
      const cryptoData = await cryptoResponse.json();

      if (!isMounted.current) return;

      const combinedData: Record<string, MarketDataItem> = {};

      // Process forex data
      if (forexData.success && forexData.data) {
        Object.entries(forexData.data).forEach(([symbol, value]: [string, unknown]) => {
          const typedValue = value as { price: number; timestamp: number };
          const previousData = data[symbol];
          const previousPrice = previousData?.price ?? typedValue.price;
          
          combinedData[symbol] = {
            symbol,
            price: typedValue.price,
            change: typedValue.price - previousPrice,
            changePercent: previousPrice > 0 
              ? ((typedValue.price - previousPrice) / previousPrice) * 100 
              : 0,
            high: typedValue.price * 1.001, // Simulated
            low: typedValue.price * 0.999, // Simulated
            timestamp: typedValue.timestamp,
          };
        });
      }

      // Process crypto data
      if (cryptoData.success && cryptoData.data) {
        Object.entries(cryptoData.data).forEach(([symbol, value]: [string, unknown]) => {
          const typedValue = value as {
            price: number;
            change: number;
            changePercent: number;
            high: number;
            low: number;
            volume: number;
            timestamp: number;
          };
          combinedData[symbol] = {
            symbol,
            price: typedValue.price,
            change: typedValue.change,
            changePercent: typedValue.changePercent,
            high: typedValue.high,
            low: typedValue.low,
            volume: typedValue.volume,
            timestamp: typedValue.timestamp,
          };
        });
      }

      setData(combinedData);
      setLastUpdate(Date.now());
      setError(null);
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError('Error al obtener datos del mercado');
    } finally {
      setIsLoading(false);
    }
  }, [data]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();

    intervalRef.current = setInterval(fetchData, refreshInterval);

    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval]);

  return { data, isLoading, error, lastUpdate, refresh };
}
