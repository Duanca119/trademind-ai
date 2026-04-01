'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  BookOpen, 
  BarChart3, 
  Target, 
  Shield, 
  Brain,
  ChevronRight,
  ChevronLeft,
  Check,
  Trophy,
  Star,
  Lightbulb,
  TrendingUp,
  Activity,
  Globe,
  RefreshCw,
  ArrowUpCircle,
  ArrowDownCircle,
  Info,
  Zap,
  Loader2,
  GraduationCap,
  LineChart,
  CandlestickChart,
  Settings,
  AlertTriangle,
  DollarSign
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface Lesson {
  id: string
  title: string
  content: string
  example?: string
}

interface Module {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  bgColor: string
  lessons: Lesson[]
  quiz?: QuizQuestion[]
}

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

interface UserProgress {
  completedLessons: string[]
  completedModules: string[]
  quizScores: Record<string, number>
}

// Market types
interface MarketStatus {
  sessions: {
    asia: { name: string; isOpen: boolean }
    london: { name: string; isOpen: boolean }
    newYork: { name: string; isOpen: boolean }
  }
  currentTime: string
  utcHour: number
  utcMinute: number
}

interface AnalysisResult {
  symbol: string
  trend1D: 'bullish' | 'bearish' | 'sideways'
  trend1H: 'bullish' | 'bearish' | 'sideways'
  ema50_5M: number
  currentPrice: number
  signal: 'BUY' | 'SELL' | 'WAIT'
  confidence: 'Alta' | 'Media' | 'Baja'
  explanation: string
  priceAboveEMA: boolean
  distanceToEMA: number
}

type TabId = 'learn' | 'market' | 'progress' | 'settings'

// ============================================
// MODULE DATA
// ============================================

const MODULES: Module[] = [
  {
    id: 'fundamentos',
    title: 'Fundamentos',
    description: 'Conceptos básicos del trading',
    icon: BookOpen,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    lessons: [
      {
        id: 'que-es-trading',
        title: '¿Qué es el Trading?',
        content: `El trading es la compra y venta de activos financieros (como divisas, acciones o criptomonedas) con el objetivo de obtener ganancias.

A diferencia de invertir a largo plazo, el trading busca aprovechar los movimientos de precios en el corto plazo.

Un trader analiza los mercados, identifica oportunidades y ejecuta operaciones con un plan definido.`,
        example: 'Ejemplo: Compras EUR/USD a 1.1000 y lo vendes a 1.1050. Ganancia = 50 pips.'
      },
      {
        id: 'tipos-mercado',
        title: 'Tipos de Mercado',
        content: `Forex (Divisas): El mercado más grande del mundo. Opera 24 horas de lunes a viernes.

Criptomonedas: Mercado descentralizado que opera 24/7. Alta volatilidad.

Acciones: Mercados de empresas con horarios específicos según el país.

CFDs: Contratos por diferencia que permiten operar sin poseer el activo.`,
        example: 'EUR/USD = Forex | BTC/USD = Crypto | AAPL = Acciones'
      },
      {
        id: 'velas-japonesas',
        title: 'Velas Japonesas',
        content: `Las velas japonesas muestran el movimiento del precio en un período de tiempo.

Cada vela tiene: Apertura, Cierre, Máximo y Mínimo.

Velas verdes/alcistas: El cierre fue mayor que la apertura.
Velas rojas/bajistas: El cierre fue menor que la apertura.`,
        example: 'Una vela verde grande indica fuerte presión compradora.'
      },
      {
        id: 'tendencias',
        title: 'Tendencias',
        content: `Tendencia Alcista: El precio forma máximos y mínimos más altos cada vez.

Tendencia Bajista: El precio forma máximos y mínimos más bajos cada vez.

Tendencia Lateral: El precio se mueve en un rango sin dirección clara.

"La tendencia es tu amiga" - Nunca operes en contra de la tendencia principal.`,
        example: 'En tendencia alcista, busca compras en los retrocesos.'
      }
    ],
    quiz: [
      {
        id: 'q1',
        question: '¿Qué indica una vela verde alcista?',
        options: ['El cierre fue menor que la apertura', 'El cierre fue mayor que la apertura', 'El precio no se movió', 'El volumen fue alto'],
        correctAnswer: 1,
        explanation: 'Una vela verde/alcista significa que el precio cerró por encima de donde abrió, indicando presión compradora.'
      },
      {
        id: 'q2',
        question: '¿Cuál es la característica de una tendencia alcista?',
        options: ['Máximos y mínimos más bajos', 'Precio constante', 'Máximos y mínimos más altos', 'Alta volatilidad sin dirección'],
        correctAnswer: 2,
        explanation: 'En una tendencia alcista, cada nuevo máximo supera al anterior y cada mínimo también es más alto.'
      }
    ]
  },
  {
    id: 'graficos',
    title: 'Gráficos',
    description: 'Lectura y análisis de gráficos',
    icon: BarChart3,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    lessons: [
      {
        id: 'temporalidades',
        title: 'Temporalidades',
        content: `1D (Diario): Muestra la tendencia principal. Úsalo para dirección.

1H (1 Hora): Ideal para análisis de entrada y zonas de valor.

15M (15 Minutos): Para confirmar entradas y ajustar stop loss.

5M (5 Minutos): Para ejecución precisa en day trading.`,
        example: 'Regla: Operar en dirección de 1D, buscar entradas en 1H, confirmar en 15M.'
      },
      {
        id: 'soportes-resistencias',
        title: 'Soportes y Resistencias',
        content: `Soporte: Zona donde el precio ha rebotado varias veces hacia arriba. Es un "piso".

Resistencia: Zona donde el precio ha rebotado varias veces hacia abajo. Es un "techo".

Más toques = Zona más importante.

Cuando el precio rompe un soporte, este se convierte en resistencia (y viceversa).`,
        example: 'EUR/USD rebota en 1.0800 tres veces = Soporte fuerte.'
      },
      {
        id: 'leer-grafico',
        title: 'Cómo Leer un Gráfico',
        content: `1. Identifica la tendencia principal (dirección de 1D)

2. Busca zonas clave (soportes y resistencias)

3. Ubica dónde está el precio respecto a las zonas

4. Espera a que el precio llegue a una zona importante

5. Busca confirmación de reversión en esa zona`,
        example: 'Tendencia alcista + Precio en soporte + Vela de rechazo = Oportunidad de compra'
      }
    ],
    quiz: [
      {
        id: 'q1',
        question: '¿Qué temporalidad usas para identificar la dirección principal?',
        options: ['5 minutos', '15 minutos', '1 hora', '1 día (Diario)'],
        correctAnswer: 3,
        explanation: 'El gráfico diario (1D) muestra la tendencia principal que guía tus operaciones.'
      },
      {
        id: 'q2',
        question: '¿Qué pasa cuando el precio rompe un soporte?',
        options: ['Continúa bajando sin parar', 'El soporte se convierte en resistencia', 'El precio vuelve al soporte', 'Nada significativo'],
        correctAnswer: 1,
        explanation: 'Cuando el precio rompe un soporte con fuerza, este nivel suele convertirse en resistencia futura.'
      }
    ]
  },
  {
    id: 'estrategia',
    title: 'Estrategia Básica',
    description: 'Tendencia + Retroceso + Continuación',
    icon: Target,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    lessons: [
      {
        id: 'concepto-basico',
        title: 'Concepto de la Estrategia',
        content: `Esta estrategia se basa en seguir la tendencia principal y esperar un retroceso para entrar.

Pasos:
1. IDENTIFICAR tendencia en 1D
2. ESPERAR retroceso en 1H  
3. CONFIRMAR entrada en 15M

Nunca operes en contra de la tendencia principal.`,
        example: '1D alcista → Precio retrocede → Entras en compra'
      },
      {
        id: 'paso1-identificar',
        title: 'Paso 1: Identificar Tendencia',
        content: `Abre el gráfico diario (1D) y determina la dirección:

ALCISTA: Máximos más altos + EMA20 sobre EMA50
BAJISTA: Máximos más bajos + EMA20 bajo EMA50
LATERAL: Precios en rango → NO OPERAR

Si el mercado está lateral, espera a que defina dirección.`,
        example: 'Si 1D muestra máximos ascendentes y EMA20 > EMA50 = Tendencia ALCISTA'
      },
      {
        id: 'paso2-esperar',
        title: 'Paso 2: Esperar Retroceso',
        content: `Una vez identificada la tendencia, NO entres inmediatamente.

Espera a que el precio retroceda hacia:
- Una zona de soporte/resistencia
- Una EMA importante (EMA 50)
- Una zona de valor

El retroceso es tu oportunidad de entrada con mejor riesgo/beneficio.`,
        example: 'Tendencia alcista → Precio baja a soporte → Preparas entrada larga'
      },
      {
        id: 'paso3-confirmar',
        title: 'Paso 3: Confirmar Entrada',
        content: `En el gráfico de 15M, busca confirmación:

- Vela de rechazo en la zona (mecha, martillo, envolvente)
- RSI saliendo de zona de sobreventa/sobrecompra
- Volumen aumentando en la reversión

Sin confirmación, NO entres. Mejor perder una oportunidad que perder dinero.`,
        example: 'Vela martillo en soporte + RSI subiendo de 30 = Confirmación de compra'
      }
    ],
    quiz: [
      {
        id: 'q1',
        question: '¿Cuál es el primer paso de la estrategia?',
        options: ['Entrar inmediatamente', 'Identificar tendencia en 1D', 'Poner stop loss', 'Ver las noticias'],
        correctAnswer: 1,
        explanation: 'El primer paso siempre es identificar la tendencia principal en el gráfico diario.'
      },
      {
        id: 'q2',
        question: '¿Qué haces si el mercado está lateral en 1D?',
        options: ['Operar igual', 'NO operar', 'Operar en contra', 'Usar más apalancamiento'],
        correctAnswer: 1,
        explanation: 'Cuando el mercado está lateral, no hay dirección clara. Es mejor esperar.'
      }
    ]
  },
  {
    id: 'riesgo',
    title: 'Gestión de Riesgo',
    description: 'Protege tu capital',
    icon: Shield,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    lessons: [
      {
        id: 'regla-1-2',
        title: 'Regla del 1-2%',
        content: `NUNCA arriesgues más del 1-2% de tu capital en una sola operación.

Si tienes $1000, arriesga máximo $10-$20 por operación.

Esta regla te permite sobrevivir rachas perdedoras y seguir operando.

El trading es maratón, no sprint. Proteger el capital es lo más importante.`,
        example: 'Capital: $5000 | Riesgo máximo: $50-$100 por operación'
      },
      {
        id: 'stop-loss',
        title: 'Stop Loss',
        content: `El Stop Loss es tu seguro. Siempre úsalo.

Colócalo más allá de:
- Un soporte/resistencia
- Un máximo/mínimo reciente
- Un nivel técnico importante

NUNCA muevas el stop loss contra ti. Solo a favor para proteger ganancias.`,
        example: 'Compras en 1.1000 → Stop Loss en 1.0950 (abajo del soporte)'
      },
      {
        id: 'take-profit',
        title: 'Take Profit',
        content: `El Take Profit es tu objetivo de ganancia.

Relación Riesgo/Beneficio mínima: 1:2
- Si arriesgas $50, busca ganar mínimo $100

No seas codicioso. Cierra en tus objetivos.

Puedes cerrar parcialmente en TP1 y dejar el resto para TP2.`,
        example: 'Entrada: 1.1000 | SL: 1.0950 | TP1: 1.1100 | TP2: 1.1150'
      },
      {
        id: 'calculadora-riesgo',
        title: 'Calculadora de Riesgo',
        content: `Para calcular el tamaño de posición:

1. Define tu riesgo (1-2% del capital)
2. Mide la distancia al stop loss en pips
3. Calcula lotes: Riesgo ÷ (Pips × Valor por pip)

Ejemplo:
- Capital: $1000
- Riesgo: $20 (2%)
- Stop Loss: 50 pips
- Lotes: $20 ÷ 50 = $0.40/pip`,
        example: 'Usa siempre la calculadora antes de entrar.'
      }
    ],
    quiz: [
      {
        id: 'q1',
        question: '¿Cuánto deberías arriesgar como máximo por operación?',
        options: ['El 50% del capital', 'El 10% del capital', 'El 1-2% del capital', 'Todo el capital'],
        correctAnswer: 2,
        explanation: 'La regla del 1-2% asegura que puedas sobrevivir a pérdidas consecutivas.'
      },
      {
        id: 'q2',
        question: '¿Cuál es la relación riesgo/beneficio mínima recomendada?',
        options: ['1:1', '1:2', '2:1', '1:0.5'],
        correctAnswer: 1,
        explanation: 'Con 1:2, si ganas el 50% de tus operaciones, serás rentable.'
      }
    ]
  },
  {
    id: 'psicologia',
    title: 'Psicología',
    description: 'Control emocional y disciplina',
    icon: Brain,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    lessons: [
      {
        id: 'errores-comunes',
        title: 'Errores Comunes',
        content: `❌ Sobreoperar: Entrar sin análisis por aburrimiento o emoción.

❌ No usar stop loss: "Ya va a volver" - La frase más cara del trading.

❌ Promediar a la baja: Añadir a una posición perdedora.

❌ Venganza: Operar grande para recuperar lo perdido.

❌ FOMO: Entrar tarde por miedo a perder una oportunidad.`,
        example: 'Identificar estos errores es el primer paso para corregirlos.'
      },
      {
        id: 'control-emocional',
        title: 'Control Emocional',
        content: `El trading activa emociones intensas. Aprende a manejarlas:

CODICIA: Cuando ganaste mucho → Cierra parcial, no aumentes riesgo.

MIEDO: Cuando pierdes → Pausa, no entres por venganza.

EUFORIA: Racha ganadora → Mantén el plan, no te confíes.

PÁNICO: Racha perdedora → PARA, cierra la plataforma.`,
        example: 'Las emociones son el peor enemigo del trader. El plan es tu mejor amigo.'
      },
      {
        id: 'disciplina',
        title: 'Disciplina',
        content: `La disciplina es la diferencia entre traders exitosos y los que fallan.

Crea reglas y síguelas SIEMPRE:
✓ Solo operar en horarios definidos
✓ Máximo X operaciones por día
✓ No operar si estás emocionalmente alterado
✓ Cerrar todo antes de eventos importantes

Un plan sin disciplina es solo un deseo.`,
        example: 'Traders disciplinados ganan consistentemente. Los demás, no.'
      },
      {
        id: 'rutina-trader',
        title: 'Rutina del Trader',
        content: `ANTES de operar:
- Revisa el calendario económico
- Analiza los pares que seguirás
- Define tu estado emocional

DURANTE la operación:
- Sigue tu plan sin desviarte
- No muevas el stop loss contra ti
- Registra cada operación

DESPUÉS de operar:
- Revisa tus operaciones del día
- Identifica errores y aciertos
- Descansa`,
        example: 'La rutina crea consistencia. La consistencia crea resultados.'
      }
    ],
    quiz: [
      {
        id: 'q1',
        question: '¿Qué es FOMO en trading?',
        options: [
          'Una estrategia de entrada',
          'Miedo a perder una oportunidad y entrar tarde',
          'Un indicador técnico',
          'Un tipo de stop loss'
        ],
        correctAnswer: 1,
        explanation: 'FOMO (Fear of Missing Out) te hace entrar en mal momento. Espera la próxima.'
      },
      {
        id: 'q2',
        question: '¿Qué debes hacer después de una racha perdedora?',
        options: [
          'Operar con más tamaño para recuperar',
          'PARAR y revisar qué salió mal',
          'Cambiar de estrategia inmediatamente',
          'No hacer nada diferente'
        ],
        correctAnswer: 1,
        explanation: 'Las rachas perdedoras requieren pausa y análisis, no más operaciones.'
      }
    ]
  }
]

// ============================================
// FOREX PAIRS
// ============================================

const FOREX_PAIRS = [
  // Major pairs
  { symbol: 'EUR/USD', name: 'Euro / Dólar', type: 'major' },
  { symbol: 'GBP/USD', name: 'Libra / Dólar', type: 'major' },
  { symbol: 'USD/JPY', name: 'Dólar / Yen', type: 'major' },
  { symbol: 'USD/CHF', name: 'Dólar / Franco', type: 'major' },
  { symbol: 'AUD/USD', name: 'Aussie / Dólar', type: 'major' },
  { symbol: 'USD/CAD', name: 'Dólar / Loonie', type: 'major' },
  { symbol: 'NZD/USD', name: 'Kiwi / Dólar', type: 'major' },
  // Cross pairs
  { symbol: 'EUR/GBP', name: 'Euro / Libra', type: 'cross' },
  { symbol: 'EUR/JPY', name: 'Euro / Yen', type: 'cross' },
  { symbol: 'GBP/JPY', name: 'Libra / Yen', type: 'cross' },
  { symbol: 'EUR/AUD', name: 'Euro / Aussie', type: 'cross' },
  { symbol: 'GBP/AUD', name: 'Libra / Aussie', type: 'cross' },
  { symbol: 'AUD/JPY', name: 'Aussie / Yen', type: 'cross' },
  { symbol: 'EUR/CHF', name: 'Euro / Franco', type: 'cross' },
  { symbol: 'GBP/CHF', name: 'Libra / Franco', type: 'cross' },
  { symbol: 'AUD/CHF', name: 'Aussie / Franco', type: 'cross' },
  { symbol: 'NZD/JPY', name: 'Kiwi / Yen', type: 'cross' },
  { symbol: 'EUR/CAD', name: 'Euro / Loonie', type: 'cross' },
  { symbol: 'GBP/CAD', name: 'Libra / Loonie', type: 'cross' },
  { symbol: 'AUD/CAD', name: 'Aussie / Loonie', type: 'cross' },
  { symbol: 'AUD/NZD', name: 'Aussie / Kiwi', type: 'cross' },
  { symbol: 'CAD/JPY', name: 'Loonie / Yen', type: 'cross' }
]

// ============================================
// RISK CALCULATOR COMPONENT
// ============================================

function RiskCalculator() {
  const [capital, setCapital] = useState<string>('1000')
  const [riskPercent, setRiskPercent] = useState<string>('2')
  const [stopLossPips, setStopLossPips] = useState<string>('50')

  const capitalNum = parseFloat(capital) || 0
  const riskPercentNum = parseFloat(riskPercent) || 0
  const stopLossPipsNum = parseFloat(stopLossPips) || 1

  const riskAmount = (capitalNum * riskPercentNum) / 100
  const valuePerPip = stopLossPipsNum > 0 ? riskAmount / stopLossPipsNum : 0
  const lotSize = valuePerPip / 10 // Approximate for forex

  return (
    <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-red-400" />
        <h3 className="font-semibold">Calculadora de Riesgo</h3>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-zinc-400">Capital ($)</label>
          <input
            type="number"
            value={capital}
            onChange={(e) => setCapital(e.target.value)}
            className="w-full p-2 bg-zinc-900/50 rounded-lg border border-zinc-700/50 text-sm mt-1 focus:border-red-500/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-400">Riesgo (%)</label>
          <input
            type="number"
            value={riskPercent}
            onChange={(e) => setRiskPercent(e.target.value)}
            className="w-full p-2 bg-zinc-900/50 rounded-lg border border-zinc-700/50 text-sm mt-1 focus:border-red-500/50 focus:outline-none"
            step="0.5"
            min="0.5"
            max="5"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-400">SL (pips)</label>
          <input
            type="number"
            value={stopLossPips}
            onChange={(e) => setStopLossPips(e.target.value)}
            className="w-full p-2 bg-zinc-900/50 rounded-lg border border-zinc-700/50 text-sm mt-1 focus:border-red-500/50 focus:outline-none"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-center mt-4">
        <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
          <p className="text-xs text-zinc-400">Riesgo Máx</p>
          <p className="text-xl font-bold text-red-400">${riskAmount.toFixed(2)}</p>
        </div>
        <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <p className="text-xs text-zinc-400">Valor/Pip</p>
          <p className="text-xl font-bold text-amber-400">${valuePerPip.toFixed(2)}</p>
        </div>
        <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <p className="text-xs text-zinc-400">Lotes</p>
          <p className="text-xl font-bold text-emerald-400">{lotSize.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// QUIZ COMPONENT
// ============================================

function QuizSection({ quiz, moduleId, onComplete }: { 
  quiz: QuizQuestion[]
  moduleId: string
  onComplete: (score: number) => void 
}) {
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)

  const question = quiz[currentQ]

  const handleAnswer = (index: number) => {
    if (answered) return
    setSelected(index)
    setAnswered(true)
    if (index === question.correctAnswer) {
      setScore(s => s + 1)
    }
  }

  const nextQuestion = () => {
    if (currentQ < quiz.length - 1) {
      setCurrentQ(c => c + 1)
      setSelected(null)
      setAnswered(false)
    } else {
      setShowResult(true)
      onComplete(Math.round((score / quiz.length) * 100))
    }
  }

  if (showResult) {
    const percentage = Math.round((score / quiz.length) * 100)
    return (
      <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/30 rounded-xl p-6 text-center">
        <div className="mb-4">
          {percentage >= 80 ? (
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto" />
          ) : percentage >= 50 ? (
            <Star className="w-16 h-16 text-blue-400 mx-auto" />
          ) : (
            <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto" />
          )}
        </div>
        <h3 className="text-2xl font-bold mb-2">¡Quiz Completado!</h3>
        <p className="text-4xl font-bold text-purple-400 mb-2">{percentage}%</p>
        <p className="text-zinc-400">{score} de {quiz.length} correctas</p>
        {percentage < 50 && (
          <p className="text-sm text-amber-400 mt-2">Te recomendamos repasar el módulo</p>
        )}
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Quiz</h3>
        <span className="text-sm text-zinc-400">{currentQ + 1}/{quiz.length}</span>
      </div>
      <p className="font-medium mb-4">{question.question}</p>
      
      <div className="space-y-2">
        {question.options.map((option, index) => {
          const isSelected = selected === index
          const isCorrect = index === question.correctAnswer
          const showCorrect = answered && isCorrect
          const showWrong = answered && isSelected && !isCorrect
          
          return (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              className={`w-full p-3 rounded-lg text-left text-sm transition-all ${
                showCorrect ? 'bg-emerald-500/20 border-emerald-500/50 border' :
                showWrong ? 'bg-red-500/20 border-red-500/50 border' :
                isSelected ? 'bg-purple-500/20 border-purple-500/50 border' :
                'bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-700/50'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>

      {answered && (
        <>
          <div className={`p-3 rounded-lg mt-4 ${selected === question.correctAnswer ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
            <p className="text-sm">{question.explanation}</p>
          </div>
          <button 
            onClick={nextQuestion}
            className="w-full mt-4 py-2 px-4 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium transition-colors"
          >
            {currentQ < quiz.length - 1 ? 'Siguiente Pregunta' : 'Ver Resultado'}
          </button>
        </>
      )}
    </div>
  )
}

// ============================================
// LESSON VIEW
// ============================================

function LessonView({ lesson, onBack, onComplete }: { 
  lesson: Lesson
  onBack: () => void
  onComplete: () => void 
}) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <button onClick={onBack} className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors">
        <ChevronLeft className="w-4 h-4" />
        <span className="text-sm">Volver</span>
      </button>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-bold mb-4">{lesson.title}</h2>
        <div className="whitespace-pre-line text-sm leading-relaxed text-zinc-300">
          {lesson.content}
        </div>
        
        {lesson.example && (
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-amber-400 mb-1">Ejemplo práctico:</p>
                <p className="text-sm text-amber-300">{lesson.example}</p>
              </div>
            </div>
          </div>
        )}

        <button 
          onClick={onComplete}
          className="w-full mt-5 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          Marcar como completado
        </button>
      </div>
    </div>
  )
}

// ============================================
// MODULE VIEW
// ============================================

function ModuleView({ module: mod, progress, onBack, onLessonComplete, onQuizComplete }: {
  module: Module
  progress: UserProgress
  onBack: () => void
  onLessonComplete: (moduleId: string, lessonId: string) => void
  onQuizComplete: (moduleId: string, score: number) => void
}) {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [showQuiz, setShowQuiz] = useState(false)
  
  const Icon = mod.icon
  const completedLessons = progress.completedLessons.filter(l => mod.lessons.some(ml => ml.id === l)).length
  const totalLessons = mod.lessons.length
  const progressPercent = (completedLessons / totalLessons) * 100

  if (activeLesson) {
    return (
      <LessonView 
        lesson={activeLesson} 
        onBack={() => setActiveLesson(null)}
        onComplete={() => {
          onLessonComplete(mod.id, activeLesson.id)
          setActiveLesson(null)
        }}
      />
    )
  }

  if (showQuiz && mod.quiz) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <button onClick={() => setShowQuiz(false)} className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">Volver al módulo</span>
        </button>
        <QuizSection 
          quiz={mod.quiz} 
          moduleId={mod.id}
          onComplete={(score) => {
            onQuizComplete(mod.id, score)
            setShowQuiz(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <button onClick={onBack} className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors">
        <ChevronLeft className="w-4 h-4" />
        <span className="text-sm">Volver a módulos</span>
      </button>

      {/* Module Header */}
      <div className={`${mod.bgColor} border-2 border-zinc-700/50 rounded-xl p-5`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-xl bg-zinc-900/50">
            <Icon className={`w-7 h-7 ${mod.color}`} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{mod.title}</h2>
            <p className="text-sm text-zinc-400">{mod.description}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Progreso</span>
            <span className="font-medium">{completedLessons}/{totalLessons} lecciones</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lessons List */}
      <div className="space-y-2">
        {mod.lessons.map((lesson, index) => {
          const isCompleted = progress.completedLessons.includes(lesson.id)
          
          return (
            <button
              key={lesson.id}
              onClick={() => setActiveLesson(lesson)}
              className={`w-full p-4 rounded-xl text-left transition-all hover:scale-[1.01] ${
                isCompleted ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-zinc-900/50 border border-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-emerald-500' : 'bg-zinc-800'
                }`}>
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{lesson.title}</p>
                  <p className="text-xs text-zinc-500">Lección {index + 1}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-500" />
              </div>
            </button>
          )
        })}
      </div>

      {/* Quiz Button */}
      {mod.quiz && completedLessons === totalLessons && (
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="font-bold">¡Módulo completado!</p>
                <p className="text-sm text-zinc-400">Haz el quiz para ganar tu insignia</p>
              </div>
            </div>
            <button 
              onClick={() => setShowQuiz(true)}
              className="py-2 px-4 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              Hacer Quiz
            </button>
          </div>
        </div>
      )}

      {/* Risk Calculator for Risk Module */}
      {mod.id === 'riesgo' && <RiskCalculator />}
    </div>
  )
}

// ============================================
// MAIN LEARN SCREEN
// ============================================

function LearnScreen() {
  const [activeModule, setActiveModule] = useState<Module | null>(null)
  const [progress, setProgress] = useState<UserProgress>({
    completedLessons: [],
    completedModules: [],
    quizScores: {}
  })
  const [isLoading, setIsLoading] = useState(true)

  // Load progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('trademind-learn-progress')
      if (saved) {
        setProgress(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Error loading progress')
    }
    setIsLoading(false)
  }, [])

  // Save progress
  const saveProgress = useCallback((newProgress: UserProgress) => {
    setProgress(newProgress)
    try {
      localStorage.setItem('trademind-learn-progress', JSON.stringify(newProgress))
    } catch (e) {
      console.error('Error saving progress')
    }
  }, [])

  const handleLessonComplete = useCallback((moduleId: string, lessonId: string) => {
    const newCompletedLessons = [...progress.completedLessons]
    if (!newCompletedLessons.includes(lessonId)) {
      newCompletedLessons.push(lessonId)
    }
    saveProgress({
      ...progress,
      completedLessons: newCompletedLessons
    })
  }, [progress, saveProgress])

  const handleQuizComplete = useCallback((moduleId: string, score: number) => {
    saveProgress({
      ...progress,
      quizScores: { ...progress.quizScores, [moduleId]: score },
      completedModules: progress.completedModules.includes(moduleId) 
        ? progress.completedModules 
        : [...progress.completedModules, moduleId]
    })
  }, [progress, saveProgress])

  // Calculate overall progress
  const totalLessons = MODULES.reduce((acc, m) => acc + m.lessons.length, 0)
  const completedCount = progress.completedLessons.length
  const overallProgress = (completedCount / totalLessons) * 100

  if (activeModule) {
    return (
      <ModuleView 
        module={activeModule}
        progress={progress}
        onBack={() => setActiveModule(null)}
        onLessonComplete={handleLessonComplete}
        onQuizComplete={handleQuizComplete}
      />
    )
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <GraduationCap className="w-7 h-7 text-amber-400" />
          <h1 className="text-2xl font-bold">Aprende Trading</h1>
        </div>
        <p className="text-sm text-zinc-400">Domina el trading paso a paso</p>
      </div>

      {/* Overall Progress */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="font-medium">Tu progreso</span>
          </div>
          <span className="text-sm font-bold">{Math.round(overallProgress)}%</span>
        </div>
        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <p className="text-xs text-zinc-400 mt-2">
          {completedCount} de {totalLessons} lecciones completadas
        </p>
      </div>

      {/* Modules Grid */}
      <div className="space-y-3">
        {MODULES.map((mod) => {
          const Icon = mod.icon
          const modLessons = mod.lessons.length
          const modCompleted = progress.completedLessons.filter(l => 
            mod.lessons.some(ml => ml.id === l)
          ).length
          const isCompleted = modCompleted === modLessons
          const quizScore = progress.quizScores[mod.id]

          return (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod)}
              className={`w-full p-4 rounded-xl text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${
                isCompleted ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20' : 'bg-zinc-900/50 border border-zinc-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${mod.bgColor}`}>
                  <Icon className={`w-6 h-6 ${mod.color}`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold">{mod.title}</h3>
                    {isCompleted && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Completado
                      </span>
                    )}
                    {quizScore !== undefined && (
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                        Quiz: {quizScore}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">{mod.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${(modCompleted / modLessons) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500">{modCompleted}/{modLessons}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-500" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// LIVE MARKET SCREEN
// ============================================

function LiveMarketScreen() {
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null)
  const [selectedPair, setSelectedPair] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<{ bestPair: AnalysisResult | null; allResults: AnalysisResult[]; timestamp: string; disclaimer: string } | null>(null)
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)

  // Fetch market status
  const fetchMarketStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/market?action=status')
      const data = await response.json()
      setMarketStatus(data)
    } catch (error) {
      console.error('Error fetching market status:', error)
    }
  }, [])

  // Run full analysis
  const runAnalysis = useCallback(async () => {
    setIsLoadingAnalysis(true)
    try {
      const response = await fetch('/api/market?action=analyze')
      const data = await response.json()
      setAnalysis(data)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error running analysis:', error)
    } finally {
      setIsLoadingAnalysis(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchMarketStatus()
    runAnalysis()
    
    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMarketStatus()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [fetchMarketStatus, runAnalysis])

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} UTC`
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity className="w-7 h-7 text-blue-400" />
          <h1 className="text-2xl font-bold">Mercado en Vivo</h1>
        </div>
        <p className="text-sm text-zinc-400">Análisis en tiempo real</p>
      </div>

      {/* Market Sessions */}
      <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold">Sesiones de Mercado</h3>
          {marketStatus && (
            <span className="ml-auto text-xs text-zinc-400">
              {formatTime(marketStatus.utcHour, marketStatus.utcMinute)}
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {marketStatus?.sessions && Object.entries(marketStatus.sessions).map(([key, session]) => (
            <div 
              key={key}
              className={`p-3 rounded-lg text-center transition-all ${
                session.isOpen 
                  ? 'bg-emerald-500/20 border border-emerald-500/30' 
                  : 'bg-zinc-800/50 border border-zinc-700/50'
              }`}
            >
              <p className="text-xs text-zinc-400">{session.name}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <div className={`w-2 h-2 rounded-full ${session.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                <span className={`text-sm font-medium ${session.isOpen ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {session.isOpen ? 'Abierta' : 'Cerrada'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best Pair Recommendation */}
      {analysis?.bestPair && (
        <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-2 border-amber-500/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h3 className="font-bold text-lg">Mejor Par para Operar</h3>
            <Zap className="w-5 h-5 text-amber-400 ml-auto" />
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-2xl font-bold">{analysis.bestPair.symbol}</p>
              <p className="text-sm text-zinc-400">Precio: {analysis.bestPair.currentPrice.toFixed(5)}</p>
            </div>
            <div className={`px-4 py-2 rounded-lg font-bold text-lg ${
              analysis.bestPair.signal === 'BUY' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {analysis.bestPair.signal === 'BUY' ? (
                <div className="flex items-center gap-2">
                  <ArrowUpCircle className="w-5 h-5" />
                  BUY
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ArrowDownCircle className="w-5 h-5" />
                  SELL
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2 bg-zinc-900/50 rounded-lg">
              <p className="text-xs text-zinc-400">Confianza</p>
              <p className={`font-bold ${
                analysis.bestPair.confidence === 'Alta' ? 'text-emerald-400' :
                analysis.bestPair.confidence === 'Media' ? 'text-amber-400' : 'text-zinc-400'
              }`}>
                {analysis.bestPair.confidence}
              </p>
            </div>
            <div className="p-2 bg-zinc-900/50 rounded-lg">
              <p className="text-xs text-zinc-400">EMA 50 (5M)</p>
              <p className="font-bold text-blue-400">{analysis.bestPair.ema50_5M.toFixed(5)}</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="w-full py-2 px-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Info className="w-4 h-4" />
            {showAnalysis ? 'Ocultar análisis' : 'Ver análisis completo'}
          </button>
          
          {showAnalysis && (
            <div className="mt-3 p-3 bg-zinc-900/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Tendencia 1D:</span>
                <span className={`font-medium ${
                  analysis.bestPair.trend1D === 'bullish' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {analysis.bestPair.trend1D === 'bullish' ? '↑ Alcista' : '↓ Bajista'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Confirmación 1H:</span>
                <span className="font-medium text-emerald-400">✓ Confirmada</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Precio vs EMA:</span>
                <span className={`font-medium ${analysis.bestPair.priceAboveEMA ? 'text-emerald-400' : 'text-red-400'}`}>
                  {analysis.bestPair.priceAboveEMA ? 'Por encima' : 'Por debajo'}
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-2 pt-2 border-t border-zinc-700">
                {analysis.bestPair.explanation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoadingAnalysis && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
          <Loader2 className="w-10 h-10 text-blue-400 mx-auto animate-spin mb-3" />
          <p className="text-sm text-zinc-400">Analizando {FOREX_PAIRS.length} pares...</p>
          <p className="text-xs text-zinc-500 mt-1">Esto puede tomar unos segundos</p>
        </div>
      )}

      {/* Other Opportunities */}
      {analysis?.allResults && analysis.allResults.length > 1 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-blue-400" />
            Otras Oportunidades
          </h3>
          <div className="space-y-2">
            {analysis.allResults.slice(1, 5).map((result) => (
              <div 
                key={result.symbol}
                className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{result.symbol}</p>
                  <p className="text-xs text-zinc-400">
                    Confianza: {result.confidence}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  result.signal === 'BUY' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {result.signal}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forex Pairs List */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <CandlestickChart className="w-5 h-5 text-blue-400" />
            Pares Forex
          </h3>
          <span className="text-xs text-zinc-500">{FOREX_PAIRS.length} pares</span>
        </div>
        
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {FOREX_PAIRS.map((pair) => (
            <button
              key={pair.symbol}
              onClick={() => setSelectedPair(selectedPair === pair.symbol ? null : pair.symbol)}
              className={`w-full p-2 rounded-lg text-left text-sm transition-all flex items-center justify-between ${
                selectedPair === pair.symbol 
                  ? 'bg-blue-500/20 border border-blue-500/30' 
                  : 'bg-zinc-800/30 hover:bg-zinc-800/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${pair.type === 'major' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                <span className="font-medium">{pair.symbol}</span>
                <span className="text-zinc-500 text-xs">{pair.name}</span>
              </div>
              <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${selectedPair === pair.symbol ? 'rotate-90' : ''}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={runAnalysis}
        disabled={isLoadingAnalysis}
        className="w-full py-3 px-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isLoadingAnalysis ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Analizando...
          </>
        ) : (
          <>
            <RefreshCw className="w-5 h-5" />
            Actualizar Análisis
          </>
        )}
      </button>

      {/* Last Update & Disclaimer */}
      <div className="text-center space-y-2">
        {lastUpdate && (
          <p className="text-xs text-zinc-500">
            Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}
          </p>
        )}
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-300">
            Este análisis es informativo, no garantiza resultados. El trading conlleva riesgo de pérdida.
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// PROGRESS SCREEN
// ============================================

function ProgressScreen() {
  const [progress, setProgress] = useState<UserProgress>({
    completedLessons: [],
    completedModules: [],
    quizScores: {}
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem('trademind-learn-progress')
      if (saved) {
        setProgress(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Error loading progress')
    }
  }, [])

  const totalLessons = MODULES.reduce((acc, m) => acc + m.lessons.length, 0)
  const completedCount = progress.completedLessons.length
  const overallProgress = (completedCount / totalLessons) * 100

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Tu Progreso</h1>
        <p className="text-sm text-zinc-400">Estadísticas de aprendizaje</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-400">{completedCount}</p>
          <p className="text-xs text-zinc-400 mt-1">Lecciones completadas</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-emerald-400">{progress.completedModules.length}</p>
          <p className="text-xs text-zinc-400 mt-1">Módulos completados</p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="font-medium">Progreso General</span>
          </div>
          <span className="text-xl font-bold">{Math.round(overallProgress)}%</span>
        </div>
        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <p className="text-xs text-zinc-400 mt-2">
          {completedCount} de {totalLessons} lecciones completadas
        </p>
      </div>

      {/* Module Progress */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <h3 className="font-semibold mb-4">Progreso por Módulo</h3>
        <div className="space-y-3">
          {MODULES.map((mod) => {
            const Icon = mod.icon
            const modCompleted = progress.completedLessons.filter(l => 
              mod.lessons.some(ml => ml.id === l)
            ).length
            const modTotal = mod.lessons.length
            const modProgress = (modCompleted / modTotal) * 100
            const quizScore = progress.quizScores[mod.id]

            return (
              <div key={mod.id} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${mod.bgColor}`}>
                  <Icon className={`w-4 h-4 ${mod.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{mod.title}</span>
                    <div className="flex items-center gap-2">
                      {quizScore !== undefined && (
                        <span className="text-xs text-purple-400">{quizScore}%</span>
                      )}
                      <span className="text-xs text-zinc-500">{modCompleted}/{modTotal}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${modProgress === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${modProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================
// SETTINGS SCREEN
// ============================================

function SettingsScreen() {
  const clearProgress = () => {
    if (confirm('¿Estás seguro de que quieres borrar todo tu progreso?')) {
      localStorage.removeItem('trademind-learn-progress')
      window.location.reload()
    }
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Ajustes</h1>
        <p className="text-sm text-zinc-400">Configuración de la app</p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
        <div className="p-4">
          <h3 className="font-medium mb-1">TradeMind</h3>
          <p className="text-sm text-zinc-400">Aprende Trading v1.0</p>
        </div>
        <div className="p-4">
          <h3 className="font-medium mb-1">Acerca de</h3>
          <p className="text-sm text-zinc-400">Aplicación educativa de trading</p>
        </div>
        <button 
          onClick={clearProgress}
          className="w-full p-4 text-left text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <h3 className="font-medium">Borrar progreso</h3>
          <p className="text-sm text-zinc-400">Elimina todo tu progreso guardado</p>
        </button>
      </div>
    </div>
  )
}

// ============================================
// BOTTOM NAVIGATION
// ============================================

function BottomNav({ activeTab, setActiveTab }: { activeTab: TabId, setActiveTab: (tab: TabId) => void }) {
  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'learn', label: 'Aprender', icon: GraduationCap },
    { id: 'market', label: 'Mercado', icon: Activity },
    { id: 'progress', label: 'Progreso', icon: BarChart3 },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800 safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
                isActive ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : ''}`} />
              <span className="text-xs">{tab.label}</span>
              {isActive && (
                <div className="w-1 h-1 bg-amber-400 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ============================================
// MAIN APP
// ============================================

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('learn')

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-lg">TradeMind</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
              <span className="text-xs text-amber-400">v1.0</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4">
        {activeTab === 'learn' && <LearnScreen />}
        {activeTab === 'market' && <LiveMarketScreen />}
        {activeTab === 'progress' && <ProgressScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}
