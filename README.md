# TradeMind AI 🚀

Asistente Profesional de Trading con Inteligencia Artificial

## 🌐 Demo

**URL de Producción:** https://trademind-ai-sigma.vercel.app

## ✨ Características

### 📊 Datos en Tiempo Real
- **Precios actualizados cada 2-3 segundos** vía polling
- **Crypto:** Precios reales desde Binance API
- **Forex:** Precios desde ExchangeRate-API
- **Única fuente de datos** - Sin diferencias entre gráficos y precios

### 💹 Activos Soportados
- **Crypto (2):** BTC/USDT, ETH/USDT
- **Forex Majors (7):** EUR/USD, GBP/USD, USD/JPY, USD/CHF, AUD/USD, USD/CAD, NZD/USD
- **Forex Crosses (12):** EUR/GBP, EUR/JPY, GBP/JPY, y más
- **Commodities (1):** XAU/USD (Oro)

### 🎯 Análisis Multi-Temporalidad
- **1D (Diario):** Tendencia principal
- **1H (1 Hora):** Temporalidad de ejecución
- **15M (15 Minutos):** Confirmación de entrada

### 📈 Sistema de Señales
- **BUY/SELL/NO OPERAR** con 4 condiciones
- Zonas de trading automáticas
- Stop Loss y Take Profit calculados
- Risk/Reward Ratio 1:2 mínimo

### 🧠 Control Emocional
- Límite de operaciones diarias
- Alertas de trading impulsivo
- Registro de pérdidas consecutivas

### 📱 PWA (Progressive Web App)
- Instalable en móvil
- Funciona offline
- Notificaciones push

## 🛠️ Tecnologías

- **Frontend:** Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS 4, shadcn/ui
- **Base de datos:** Supabase (PostgreSQL)
- **Deployment:** Vercel
- **APIs externas:** Binance, ExchangeRate-API, TradingView

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/trademind-ai.git
cd trademind-ai

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Ejecutar en desarrollo
npm run dev
```

## ⚙️ Variables de Entorno

Crear archivo `.env.local` con:

```env
# Supabase (opcional - para persistencia)
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

## 📁 Estructura del Proyecto

```
trademind-ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── market-data/route.ts    # API de datos en tiempo real
│   │   │   ├── forex-price/route.ts    # API de precios Forex
│   │   │   └── news/route.ts           # API de noticias
│   │   ├── page.tsx                    # Página principal
│   │   ├── layout.tsx                  # Layout
│   │   └── globals.css                 # Estilos globales
│   ├── components/
│   │   ├── ui/                         # Componentes shadcn/ui
│   │   ├── support-resistance-zones.tsx
│   │   └── unified-decision-card.tsx
│   ├── hooks/
│   │   ├── use-realtime-market-data.ts # Hook de datos en tiempo real
│   │   ├── use-trading-assistant.ts
│   │   └── ...
│   ├── lib/
│   │   ├── indicators.ts               # Indicadores técnicos
│   │   ├── decision-engine.ts          # Motor de decisiones
│   │   └── ...
│   └── types/
│       └── trading.ts                  # Tipos y configuración de activos
├── public/
│   ├── manifest.json                   # PWA manifest
│   ├── sw.js                          # Service Worker
│   └── icons/
├── package.json
├── tailwind.config.ts
├── next.config.ts
└── vercel.json
```

## 🔧 API Endpoints

### GET /api/market-data
Obtiene precios en tiempo real

**Parámetros:**
- `symbol` - ID del activo (ej: BTCUSDT, EURUSD)
- `type` - 'crypto' o 'forex'

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "symbol": "EURUSD",
    "price": 1.08500,
    "bid": 1.08498,
    "ask": 1.08502,
    "high24h": 1.08800,
    "low24h": 1.08200,
    "change24h": 0.00150,
    "changePercent24h": 0.14,
    "timestamp": 1700000000000
  }
}
```

## 📱 Pestañas de la App

| Tab | Descripción |
|-----|-------------|
| **Dashboard** | Vista general con selector de activos |
| **Escáner** | Análisis de todos los pares Forex |
| **Operación** | Zonas de trading y señal actual |
| **Gráficos** | TradingView embebido (1D, 1H, 15M) |
| **Análisis** | Indicadores técnicos detallados |
| **Riesgo** | Calculadora de gestión de riesgo |
| **Historial** | Registro de operaciones |

## 🚀 Deploy en Vercel

1. Fork este repositorio
2. Importa en Vercel: https://vercel.com/new
3. Configura las variables de entorno
4. Deploy!

## 📄 Licencia

MIT License - Libre para uso personal y comercial

## 👤 Autor

TradeMind AI - Asistente de Trading Inteligente
