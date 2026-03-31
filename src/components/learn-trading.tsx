'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  GraduationCap, 
  BookOpen, 
  BarChart3, 
  Target, 
  Shield, 
  Brain,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Trophy,
  Star,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  CandlestickChart,
  Clock,
  DollarSign,
  Heart,
  AlertTriangle,
  Sparkles,
  Play,
  RotateCcw,
  Award,
  Lock,
  Unlock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'

// ============================================
// TYPES
// ============================================

interface Lesson {
  id: string
  title: string
  content: string
  example?: string
  imagePrompt?: string
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
    <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-red-400" />
          Calculadora de Riesgo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Capital ($)</label>
            <input
              type="number"
              value={capital}
              onChange={(e) => setCapital(e.target.value)}
              className="w-full p-2 bg-background rounded border text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Riesgo (%)</label>
            <input
              type="number"
              value={riskPercent}
              onChange={(e) => setRiskPercent(e.target.value)}
              className="w-full p-2 bg-background rounded border text-sm"
              step="0.5"
              min="0.5"
              max="5"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">SL (pips)</label>
            <input
              type="number"
              value={stopLossPips}
              onChange={(e) => setStopLossPips(e.target.value)}
              className="w-full p-2 bg-background rounded border text-sm"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 bg-red-500/20 rounded-lg border border-red-500/30">
            <p className="text-xs text-muted-foreground">Riesgo Máx</p>
            <p className="text-xl font-bold text-red-400">${riskAmount.toFixed(2)}</p>
          </div>
          <div className="p-3 bg-amber-500/20 rounded-lg border border-amber-500/30">
            <p className="text-xs text-muted-foreground">Valor/Pip</p>
            <p className="text-xl font-bold text-amber-400">${valuePerPip.toFixed(2)}</p>
          </div>
          <div className="p-3 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
            <p className="text-xs text-muted-foreground">Lotes</p>
            <p className="text-xl font-bold text-emerald-400">{lotSize.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
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
      <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30">
        <CardContent className="p-6 text-center">
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
          <p className="text-muted-foreground">{score} de {quiz.length} correctas</p>
          {percentage < 50 && (
            <p className="text-sm text-amber-400 mt-2">Te recomendamos repasar el módulo</p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Quiz</CardTitle>
          <Badge variant="outline">{currentQ + 1}/{quiz.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="font-medium">{question.question}</p>
        
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
                  showCorrect ? 'bg-green-500/30 border-green-500 border' :
                  showWrong ? 'bg-red-500/30 border-red-500 border' :
                  isSelected ? 'bg-purple-500/30 border-purple-500 border' :
                  'bg-background/50 border border-border hover:bg-background/80'
                }`}
              >
                {option}
              </button>
            )
          })}
        </div>

        {answered && (
          <>
            <div className={`p-3 rounded-lg ${selected === question.correctAnswer ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
              <p className="text-sm">{question.explanation}</p>
            </div>
            <Button onClick={nextQuestion} className="w-full">
              {currentQ < quiz.length - 1 ? 'Siguiente Pregunta' : 'Ver Resultado'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
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
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Volver
      </Button>

      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50">
        <CardHeader>
          <CardTitle>{lesson.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="whitespace-pre-line text-sm leading-relaxed">
            {lesson.content}
          </div>
          
          {lesson.example && (
            <div className="p-4 bg-amber-500/20 border border-amber-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-amber-400 mb-1">Ejemplo práctico:</p>
                  <p className="text-sm text-amber-300">{lesson.example}</p>
                </div>
              </div>
            </div>
          )}

          <Button onClick={onComplete} className="w-full">
            <Check className="w-4 h-4 mr-2" />
            Marcar como completado
          </Button>
        </CardContent>
      </Card>
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
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setShowQuiz(false)} className="mb-2">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Volver al módulo
        </Button>
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
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Volver a módulos
      </Button>

      {/* Module Header */}
      <Card className={`${mod.bgColor} border-2`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-xl bg-background/50">
              <Icon className={`w-8 h-8 ${mod.color}`} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{mod.title}</h2>
              <p className="text-sm text-muted-foreground">{mod.description}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso</span>
              <span>{completedLessons}/{totalLessons} lecciones</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Lessons List */}
      <div className="space-y-2">
        {mod.lessons.map((lesson, index) => {
          const isCompleted = progress.completedLessons.includes(lesson.id)
          
          return (
            <Card 
              key={lesson.id}
              className={`cursor-pointer transition-all hover:scale-[1.02] ${
                isCompleted ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800/50'
              }`}
              onClick={() => setActiveLesson(lesson)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-500' : 'bg-slate-700'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{lesson.title}</p>
                    <p className="text-xs text-muted-foreground">Lección {index + 1}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quiz Button */}
      {mod.quiz && completedLessons === totalLessons && (
        <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="font-bold">¡Módulo completado!</p>
                  <p className="text-sm text-muted-foreground">Haz el quiz para ganar tu insignia</p>
                </div>
              </div>
              <Button onClick={() => setShowQuiz(true)}>
                <Play className="w-4 h-4 mr-2" />
                Hacer Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Calculator for Risk Module */}
      {mod.id === 'riesgo' && <RiskCalculator />}
    </div>
  )
}

// ============================================
// MAIN LEARN SCREEN
// ============================================

export default function LearnTradingScreen() {
  const [activeModule, setActiveModule] = useState<Module | null>(null)
  const [progress, setProgress] = useState<UserProgress>({
    completedLessons: [],
    completedModules: [],
    quizScores: {}
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced')

  // Load progress from API (Supabase)
  const fetchProgress = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/learn-progress?userId=default_user')
      
      if (response.ok) {
        const data = await response.json()
        setProgress({
          completedLessons: data.completedLessons || [],
          completedModules: data.completedModules || [],
          quizScores: data.quizScores || {}
        })
        setSyncStatus('synced')
      } else {
        // Fallback to localStorage if API fails
        if (typeof window !== 'undefined') {
          const saved = typeof window !== "undefined" && localStorage.getItem('trademind-learn-progress')
          if (saved) {
            try {
              setProgress(JSON.parse(saved))
            } catch (e) {
              console.error('Error loading progress from localStorage')
            }
          }
        }
        setSyncStatus('error')
      }
    } catch (error) {
      console.error('Error fetching progress:', error)
      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('trademind-learn-progress')
        if (saved) {
          try {
            setProgress(JSON.parse(saved))
          } catch (e) {
            console.error('Error loading progress from localStorage')
          }
        }
      }
      setSyncStatus('error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  // Save progress to API
  const saveProgress = useCallback(async (newProgress: UserProgress) => {
    setProgress(newProgress)
    
    // Always save to localStorage as backup
    if (typeof window !== "undefined") localStorage.setItem('trademind-learn-progress', JSON.stringify(newProgress))
    
    // Try to sync with API
    try {
      setIsSaving(true)
      setSyncStatus('syncing')
      
      // Sync completed modules and quiz scores
      for (const moduleId of newProgress.completedModules) {
        await fetch('/api/learn-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'default_user',
            moduleId,
            completed: true
          })
        })
      }
      
      for (const [moduleId, score] of Object.entries(newProgress.quizScores)) {
        await fetch('/api/learn-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'default_user',
            moduleId,
            quizScore: score
          })
        })
      }
      
      setSyncStatus('synced')
    } catch (error) {
      console.error('Error saving progress to API:', error)
      setSyncStatus('error')
    } finally {
      setIsSaving(false)
    }
  }, [])

  // Save lesson completion to API
  const saveLessonProgress = useCallback(async (moduleId: string, lessonId: string) => {
    try {
      // Save to localStorage immediately
      const newCompletedLessons = [...progress.completedLessons]
      if (!newCompletedLessons.includes(lessonId)) {
        newCompletedLessons.push(lessonId)
      }
      const newProgress = {
        ...progress,
        completedLessons: newCompletedLessons
      }
      setProgress(newProgress)
      if (typeof window !== "undefined") localStorage.setItem('trademind-learn-progress', JSON.stringify(newProgress))
      
      // Sync with API
      setSyncStatus('syncing')
      await fetch('/api/learn-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'default_user',
          moduleId,
          lessonId,
          completed: true
        })
      })
      setSyncStatus('synced')
    } catch (error) {
      console.error('Error saving lesson progress:', error)
      setSyncStatus('error')
    }
  }, [progress])

  const handleLessonComplete = useCallback((moduleId: string, lessonId: string) => {
    if (!progress.completedLessons.includes(lessonId)) {
      saveLessonProgress(moduleId, lessonId)
    }
  }, [progress.completedLessons, saveLessonProgress])

  const handleQuizComplete = useCallback(async (moduleId: string, score: number) => {
    const newProgress = {
      ...progress,
      quizScores: { ...progress.quizScores, [moduleId]: score },
      completedModules: progress.completedModules.includes(moduleId) 
        ? progress.completedModules 
        : [...progress.completedModules, moduleId]
    }
    
    // Update local state immediately
    setProgress(newProgress)
    if (typeof window !== "undefined") localStorage.setItem('trademind-learn-progress', JSON.stringify(newProgress))
    
    // Sync with API
    try {
      setSyncStatus('syncing')
      await fetch('/api/learn-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'default_user',
          moduleId,
          quizScore: score,
          completed: true
        })
      })
      setSyncStatus('synced')
    } catch (error) {
      console.error('Error saving quiz progress:', error)
      setSyncStatus('error')
    }
  }, [progress])

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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <GraduationCap className="w-8 h-8 text-amber-400" />
          <h1 className="text-2xl font-bold">Aprende Trading</h1>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-amber-400" />}
        </div>
        <p className="text-sm text-muted-foreground">Domina el trading paso a paso</p>
        
        {/* Sync Status */}
        <div className="flex items-center justify-center gap-2 mt-2">
          {syncStatus === 'syncing' && (
            <span className="text-xs text-cyan-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Sincronizando...
            </span>
          )}
          {syncStatus === 'synced' && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Progreso guardado
            </span>
          )}
          {syncStatus === 'error' && (
            <span className="text-xs text-amber-400 flex items-center gap-1">
              Guardado localmente
            </span>
          )}
        </div>
      </div>

      {/* Overall Progress */}
      <Card className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span className="font-medium">Tu progreso</span>
            </div>
            <span className="text-sm font-bold">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {completedCount} de {totalLessons} lecciones completadas
          </p>
        </CardContent>
      </Card>

      {/* Modules Grid */}
      <div className="space-y-3">
        {MODULES.map((mod, index) => {
          const Icon = mod.icon
          const modLessons = mod.lessons.length
          const modCompleted = progress.completedLessons.filter(l => 
            mod.lessons.some(ml => ml.id === l)
          ).length
          const isCompleted = modCompleted === modLessons
          const quizScore = progress.quizScores[mod.id]

          return (
            <Card 
              key={mod.id}
              className={`cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
                isCompleted ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30' : 'bg-slate-800/50'
              }`}
              onClick={() => setActiveModule(mod)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${mod.bgColor}`}>
                    <Icon className={`w-6 h-6 ${mod.color}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{mod.title}</h3>
                      {isCompleted && (
                        <Badge className="bg-green-500 text-white text-xs">
                          <Check className="w-3 h-3 mr-1" />
                          Completado
                        </Badge>
                      )}
                      {quizScore !== undefined && (
                        <Badge className="bg-purple-500 text-white text-xs">
                          Quiz: {quizScore}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{mod.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={(modCompleted / modLessons) * 100} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground">{modCompleted}/{modLessons}</span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tips Section */}
      <Card className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-cyan-400 mt-0.5" />
            <div>
              <p className="font-medium text-cyan-400">Consejo del día</p>
              <p className="text-sm text-muted-foreground mt-1">
                "El trading no es sobre tener siempre la razón, sino sobre gestionar correctamente cuando estás equivocado."
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
