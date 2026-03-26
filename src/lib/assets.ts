import { Asset, TimeframeConfig } from '@/types/trading';

// 22 Assets: 20 Forex + 2 Crypto
export const ASSETS: Asset[] = [
  // Major Pairs (8)
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', type: 'forex', category: 'major' },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', type: 'forex', category: 'major' },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', type: 'forex', category: 'major' },
  { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', type: 'forex', category: 'major' },
  { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', type: 'forex', category: 'major' },
  { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', type: 'forex', category: 'major' },
  { symbol: 'NZD/USD', name: 'New Zealand Dollar / US Dollar', type: 'forex', category: 'major' },
  { symbol: 'EUR/GBP', name: 'Euro / British Pound', type: 'forex', category: 'major' },
  
  // Minor Pairs (8)
  { symbol: 'EUR/JPY', name: 'Euro / Japanese Yen', type: 'forex', category: 'minor' },
  { symbol: 'GBP/JPY', name: 'British Pound / Japanese Yen', type: 'forex', category: 'minor' },
  { symbol: 'EUR/AUD', name: 'Euro / Australian Dollar', type: 'forex', category: 'minor' },
  { symbol: 'EUR/CAD', name: 'Euro / Canadian Dollar', type: 'forex', category: 'minor' },
  { symbol: 'EUR/CHF', name: 'Euro / Swiss Franc', type: 'forex', category: 'minor' },
  { symbol: 'GBP/CHF', name: 'British Pound / Swiss Franc', type: 'forex', category: 'minor' },
  { symbol: 'AUD/JPY', name: 'Australian Dollar / Japanese Yen', type: 'forex', category: 'minor' },
  { symbol: 'CAD/JPY', name: 'Canadian Dollar / Japanese Yen', type: 'forex', category: 'minor' },
  
  // Exotic Pairs (4)
  { symbol: 'USD/MXN', name: 'US Dollar / Mexican Peso', type: 'forex', category: 'exotic' },
  { symbol: 'USD/ZAR', name: 'US Dollar / South African Rand', type: 'forex', category: 'exotic' },
  { symbol: 'USD/TRY', name: 'US Dollar / Turkish Lira', type: 'forex', category: 'exotic' },
  { symbol: 'USD/SGD', name: 'US Dollar / Singapore Dollar', type: 'forex', category: 'exotic' },
  
  // Crypto (2)
  { symbol: 'BTC/USD', name: 'Bitcoin / US Dollar', type: 'crypto', category: 'crypto' },
  { symbol: 'ETH/USD', name: 'Ethereum / US Dollar', type: 'crypto', category: 'crypto' },
];

// Timeframe configurations
export const TIMEFRAMES: TimeframeConfig[] = [
  {
    id: '1D',
    name: 'Diario',
    purpose: 'Dirección - Define el sesgo general del mercado',
    tradingviewInterval: 'D',
  },
  {
    id: '1H',
    name: '1 Hora',
    purpose: 'Estrategia - Confirma patrones y zonas de entrada',
    tradingviewInterval: '60',
  },
  {
    id: '5M',
    name: '5 Minutos',
    purpose: 'Ejecución - Punto exacto de entrada',
    tradingviewInterval: '5',
  },
];

// Get TradingView symbol format
export function getTradingViewSymbol(symbol: string): string {
  const [base, quote] = symbol.split('/');
  
  // Forex
  if (['EUR', 'GBP', 'USD', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD', 'MXN', 'ZAR', 'TRY', 'SGD'].includes(base)) {
    return `FX:${base}${quote}`;
  }
  
  // Crypto
  if (base === 'BTC') return 'BINANCE:BTCUSDT';
  if (base === 'ETH') return 'BINANCE:ETHUSDT';
  
  return symbol.replace('/', '');
}

// Get Binance symbol for crypto
export function getBinanceSymbol(symbol: string): string {
  const [base, quote] = symbol.split('/');
  return `${base}${quote}`;
}

// Asset categories for filtering
export const ASSET_CATEGORIES = [
  { id: 'all', name: 'Todos', count: 22 },
  { id: 'major', name: 'Mayores', count: 8 },
  { id: 'minor', name: 'Menores', count: 8 },
  { id: 'exotic', name: 'Exóticos', count: 4 },
  { id: 'crypto', name: 'Cripto', count: 2 },
] as const;
