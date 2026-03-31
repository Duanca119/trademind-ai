# TradeMind AI - Asistente de Trading Inteligente

## Descripción

TradeMind AI es una plataforma de trading con análisis técnico automatizado, detección de soportes/resistencias y señales de IA en tiempo real para Forex y Criptomonedas.

## Características

- **Datos en Tiempo Real**: Precios actualizados cada 3 segundos para Forex y Criptomonedas
- **Gráficos TradingView**: Integración completa con gráficos avanzados
- **Detección de Soportes/Resistencias**: Análisis automático de niveles clave
- **Señales de Trading**: Recomendaciones de compra/venta con niveles de entrada, SL y TP
- **Scanner de Mercado**: Vista rápida de todos los activos disponibles
- **Noticias del Mercado**: Últimas noticias financieras con análisis de sentimiento
- **PWA**: Instalable como aplicación móvil

## Activos Soportados

### Criptomonedas
- BTC/USDT (Bitcoin)
- ETH/USDT (Ethereum)

### Forex
- EUR/USD, GBP/USD, USD/JPY, USD/CHF
- AUD/USD, USD/CAD, NZD/USD
- EUR/GBP, EUR/JPY, GBP/JPY
- XAU/USD (Oro)

## Requisitos

- Node.js 18+
- npm o pnpm

## Instalación

```bash
# Clonar el repositorio
git clone <tu-repo-url>

# Entrar al directorio
cd trademind-ai

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar en producción
npm start
```

## Despliegue en Vercel

1. Sube el código a GitHub
2. Conecta tu repositorio en Vercel
3. Despliega automáticamente

## Tecnologías

- **Next.js 15** - Framework React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **shadcn/ui** - Componentes UI
- **TradingView** - Gráficos
- **Binance API** - Datos de crypto
- **ExchangeRate-API** - Datos de Forex

## Estructura del Proyecto

```
trademind-ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── market-data/route.ts    # API de crypto
│   │   │   ├── forex-price/route.ts    # API de forex
│   │   │   └── news/route.ts           # API de noticias
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   └── ui/                         # Componentes shadcn
│   ├── hooks/
│   │   ├── use-realtime-market-data.ts
│   │   ├── use-support-resistance.ts
│   │   ├── use-trading-decision.ts
│   │   └── use-news.ts
│   ├── lib/
│   │   └── utils.ts
│   └── types/
│       └── trading.ts
├── public/
│   ├── icons/
│   ├── manifest.json
│   └── sw.js
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Licencia

MIT
