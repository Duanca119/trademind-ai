/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['binance.com', 'tradingview.com'],
    unoptimized: true,
  },
}

module.exports = nextConfig
