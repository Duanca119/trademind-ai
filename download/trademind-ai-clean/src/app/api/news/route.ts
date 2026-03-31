import { NextResponse } from 'next/server';

// Mock news API - In production, integrate with real news API
const mockNews = [
  {
    id: '1',
    title: 'Fed signals potential rate pause amid inflation concerns',
    summary: 'The Federal Reserve indicated it may pause interest rate hikes as inflation shows signs of cooling.',
    source: 'Reuters',
    url: '#',
    sentiment: 'neutral' as const,
    relatedAssets: ['EUR/USD', 'GBP/USD', 'XAU/USD'],
    publishedAt: Date.now() - 3600000,
  },
  {
    id: '2',
    title: 'Bitcoin surges past key resistance level',
    summary: 'Bitcoin breaks through major resistance as institutional interest grows.',
    source: 'CoinDesk',
    url: '#',
    sentiment: 'positive' as const,
    relatedAssets: ['BTC/USDT'],
    publishedAt: Date.now() - 7200000,
  },
  {
    id: '3',
    title: 'ECB considers monetary policy adjustments',
    summary: 'European Central Bank officials discuss potential policy changes in upcoming meeting.',
    source: 'Bloomberg',
    url: '#',
    sentiment: 'neutral' as const,
    relatedAssets: ['EUR/USD', 'EUR/GBP', 'EUR/JPY'],
    publishedAt: Date.now() - 10800000,
  },
  {
    id: '4',
    title: 'Gold prices steady amid geopolitical tensions',
    summary: 'Safe-haven demand supports gold as global uncertainties persist.',
    source: 'MarketWatch',
    url: '#',
    sentiment: 'positive' as const,
    relatedAssets: ['XAU/USD'],
    publishedAt: Date.now() - 14400000,
  },
  {
    id: '5',
    title: 'US Dollar weakens against major currencies',
    summary: 'The dollar index falls as traders reassess Fed policy expectations.',
    source: 'CNBC',
    url: '#',
    sentiment: 'negative' as const,
    relatedAssets: ['EUR/USD', 'GBP/USD', 'AUD/USD'],
    publishedAt: Date.now() - 18000000,
  },
];

export async function GET() {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  return NextResponse.json({
    success: true,
    data: mockNews,
    timestamp: Date.now(),
  });
}
