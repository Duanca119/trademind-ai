'use client'

import { useMemo } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Layers,
  Info
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import useSupportResistance, { SupportResistanceResult, PriceZone } from '@/hooks/use-support-resistance'
import { Candlestick } from '@/lib/binance-api'
import { formatAssetPrice, AssetConfig } from '@/types/trading'

// ============================================
// TYPES
// ============================================

interface SupportResistanceZonesProps {
  klines1D: Candlestick[]
  klines1H: Candlestick[]
  klines15M: Candlestick[]
  currentPrice: number
  trend: 'bullish' | 'bearish' | 'sideways'
  asset: AssetConfig
}

type ZoneStatus = 'active' | 'testing' | 'broken'

// ============================================
// HELPER COMPONENTS
// ============================================

function ZoneCard({ 
  zone, 
  type, 
  currentPrice, 
  decimals,
  status 
}: { 
  zone: PriceZone
  type: 'support' | 'resistance'
  currentPrice: number
  decimals: number
  status: ZoneStatus
}) {
  const isSupport = type === 'support'
  
  const colors = {
    active: isSupport 
      ? { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-500' }
      : { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-500' },
    testing: { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-500' },
    broken: { bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', text: 'text-zinc-500' }
  }
  
  const color = colors[status]
  const Icon = isSupport ? ShieldCheck : ShieldAlert
  
  const formatPrice = (price: number) => {
    if (decimals === 2) return price.toFixed(2)
    if (decimals === 3) return price.toFixed(3)
    return price.toFixed(5)
  }
  
  const distancePercent = ((Math.abs(currentPrice - zone.mid) / currentPrice) * 100).toFixed(2)
  
  return (
    <div className={`${color.bg} ${color.border} border rounded-lg p-3`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color.text}`} />
          <span className={`text-xs font-semibold ${color.text} uppercase`}>
            {isSupport ? 'Soporte' : 'Resistencia'}
          </span>
          {status === 'testing' && (
            <Badge variant="outline" className="text-xs border-amber-500 text-amber-500">
              PROBANDO
            </Badge>
          )}
        </div>
        <Badge variant="outline" className={`text-xs ${color.border} ${color.text}`}>
          {zone.timeframe}
        </Badge>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Zona:</span>
          <span className={`text-sm font-mono font-bold ${color.text}`}>
            {formatPrice(zone.low)} – {formatPrice(zone.high)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Distancia:</span>
          <span className="text-xs text-muted-foreground">{distancePercent}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Fuerza:</span>
          <div className="flex items-center gap-1">
            <Progress value={zone.strength} className="w-16 h-1.5" />
            <span className="text-xs text-muted-foreground">{Math.round(zone.strength)}%</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Toques:</span>
          <span className="text-xs text-muted-foreground">{zone.touches} veces</span>
        </div>
      </div>
    </div>
  )
}

function PricePositionIndicator({ 
  position, 
  currentPrice, 
  support, 
  resistance,
  decimals 
}: { 
  position: SupportResistanceResult['pricePosition']
  currentPrice: number
  support: PriceZone | null
  resistance: PriceZone | null
  decimals: number
}) {
  const formatPrice = (price: number) => {
    if (decimals === 2) return price.toFixed(2)
    if (decimals === 3) return price.toFixed(3)
    return price.toFixed(5)
  }
  
  // Calculate visual position (0-100%)
  let visualPosition = 50
  if (support && resistance) {
    const range = resistance.mid - support.mid
    visualPosition = ((currentPrice - support.mid) / range) * 100
    visualPosition = Math.max(5, Math.min(95, visualPosition))
  }
  
  const positionConfig = {
    near_support: { icon: ArrowDownRight, color: 'text-emerald-500', label: 'Cerca de Soporte' },
    near_resistance: { icon: ArrowUpRight, color: 'text-red-500', label: 'Cerca de Resistencia' },
    mid_range: { icon: Minus, color: 'text-amber-500', label: 'En Rango Medio' },
    above_all: { icon: TrendingUp, color: 'text-emerald-500', label: 'Sobre Niveles' },
    below_all: { icon: TrendingDown, color: 'text-red-500', label: 'Bajo Niveles' }
  }
  
  const config = positionConfig[position]
  const Icon = config.icon
  
  return (
    <div className="bg-background/30 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">Posición del Precio</span>
        <Badge variant="outline" className={`text-xs ${config.color}`}>
          <Icon className="w-3 h-3 mr-1" />
          {config.label}
        </Badge>
      </div>
      
      {/* Visual price bar */}
      <div className="relative h-8 bg-zinc-800 rounded-lg overflow-hidden">
        {/* Resistance marker */}
        {resistance && (
          <div 
            className="absolute top-0 bottom-0 w-1 bg-red-500"
            style={{ left: '90%' }}
          />
        )}
        
        {/* Support marker */}
        {support && (
          <div 
            className="absolute top-0 bottom-0 w-1 bg-emerald-500"
            style={{ left: '10%' }}
          />
        )}
        
        {/* Current price marker */}
        <div 
          className="absolute top-0 bottom-0 w-2 bg-cyan-500 rounded"
          style={{ left: `${visualPosition}%`, transform: 'translateX(-50%)' }}
        />
      </div>
      
      {/* Labels */}
      <div className="flex justify-between mt-2 text-xs">
        <span className="text-emerald-500">{support ? formatPrice(support.mid) : '—'}</span>
        <span className="text-cyan-500 font-bold">{formatPrice(currentPrice)}</span>
        <span className="text-red-500">{resistance ? formatPrice(resistance.mid) : '—'}</span>
      </div>
    </div>
  )
}

function EntryRecommendation({ 
  recommendation,
  decimals
}: { 
  recommendation: SupportResistanceResult['entryRecommendation']
  decimals: number
}) {
  const formatPrice = (price: number) => {
    if (decimals === 2) return price.toFixed(2)
    if (decimals === 3) return price.toFixed(3)
    return price.toFixed(5)
  }
  
  const actionConfig = {
    WAIT_BOUNCE: { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    WAIT_REJECTION: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    NEAR_ENTRY: { icon: Target, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
    AWAIT_PULLBACK: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    NO_CLEAR_LEVEL: { icon: Info, color: 'text-zinc-500', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30' }
  }
  
  const config = actionConfig[recommendation.action]
  const Icon = config.icon
  
  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-3`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${config.color}`} />
        <span className={`text-sm font-semibold ${config.color}`}>
          Recomendación
        </span>
      </div>
      <p className="text-sm text-foreground">{recommendation.message}</p>
      {recommendation.zone && (
        <div className="mt-2 text-xs text-muted-foreground">
          Zona: {formatPrice(recommendation.zone.low)} – {formatPrice(recommendation.zone.high)}
        </div>
      )}
    </div>
  )
}

function TimeframeLevels({
  zones,
  currentPrice,
  decimals
}: {
  zones: { supports: PriceZone[]; resistances: PriceZone[] }
  currentPrice: number
  decimals: number
}) {
  const formatPrice = (price: number) => {
    if (decimals === 2) return price.toFixed(2)
    if (decimals === 3) return price.toFixed(3)
    return price.toFixed(5)
  }
  
  if (zones.supports.length === 0 && zones.resistances.length === 0) {
    return (
      <div className="text-xs text-muted-foreground text-center py-2">
        No hay niveles detectados
      </div>
    )
  }
  
  return (
    <div className="space-y-1.5">
      {/* Resistances (top to bottom) */}
      {zones.resistances.slice(0, 3).map((zone, i) => (
        <div key={`res-${i}`} className="flex items-center justify-between text-xs">
          <span className="text-red-400">R{i + 1}</span>
          <span className="font-mono text-red-500">{formatPrice(zone.mid)}</span>
          <span className="text-zinc-500">{Math.round(zone.strength)}%</span>
        </div>
      ))}
      
      {/* Current price */}
      <div className="flex items-center justify-between text-xs py-1 border-y border-zinc-700">
        <span className="text-cyan-400">ACTUAL</span>
        <span className="font-mono font-bold text-cyan-500">{formatPrice(currentPrice)}</span>
        <span className="text-zinc-500">—</span>
      </div>
      
      {/* Supports (bottom) */}
      {zones.supports.slice(0, 3).map((zone, i) => (
        <div key={`sup-${i}`} className="flex items-center justify-between text-xs">
          <span className="text-emerald-400">S{i + 1}</span>
          <span className="font-mono text-emerald-500">{formatPrice(zone.mid)}</span>
          <span className="text-zinc-500">{Math.round(zone.strength)}%</span>
        </div>
      ))}
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SupportResistanceZones({
  klines1D,
  klines1H,
  klines15M,
  currentPrice,
  trend,
  asset
}: SupportResistanceZonesProps) {
  const result = useSupportResistance({
    klines1D,
    klines1H,
    klines15M,
    currentPrice,
    trend
  })
  
  const decimals = asset.decimals
  
  return (
    <Card className="bg-card/50 border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-500" />
          Soportes y Resistencias
        </CardTitle>
        <CardDescription className="text-xs">
          Detección automática de zonas clave
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Price position visual */}
        <PricePositionIndicator
          position={result.pricePosition}
          currentPrice={currentPrice}
          support={result.nearestSupport}
          resistance={result.nearestResistance}
          decimals={decimals}
        />
        
        <Separator className="bg-white/5" />
        
        {/* Nearest levels */}
        <div className="grid grid-cols-2 gap-2">
          {result.nearestSupport && (
            <ZoneCard
              zone={result.nearestSupport}
              type="support"
              currentPrice={currentPrice}
              decimals={decimals}
              status={result.supportStatus || 'active'}
            />
          )}
          {result.nearestResistance && (
            <ZoneCard
              zone={result.nearestResistance}
              type="resistance"
              currentPrice={currentPrice}
              decimals={decimals}
              status={result.resistanceStatus || 'active'}
            />
          )}
        </div>
        
        {/* Entry recommendation */}
        <EntryRecommendation 
          recommendation={result.entryRecommendation}
          decimals={decimals}
        />
        
        <Separator className="bg-white/5" />
        
        {/* Timeframe breakdown */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">Niveles por Temporalidad</span>
          
          {(['1D', '1H', '15M'] as const).map((tf) => (
            <div key={tf} className="bg-background/20 rounded-lg p-2">
              <div className="flex items-center justify-between mb-1.5">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    tf === '1D' ? 'border-purple-500 text-purple-500' :
                    tf === '1H' ? 'border-cyan-500 text-cyan-500' :
                    'border-amber-500 text-amber-500'
                  }`}
                >
                  {tf}
                </Badge>
                <span className="text-xs text-zinc-500">
                  {tf === '1D' ? 'Principal' : tf === '1H' ? 'Confirmación' : 'Ajuste'}
                </span>
              </div>
              <TimeframeLevels
                zones={result.zonesByTimeframe[tf]}
                currentPrice={currentPrice}
                decimals={decimals}
              />
            </div>
          ))}
        </div>
        
        {/* Info note */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-zinc-800/50 rounded p-2">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>
            Los niveles de 1D tienen mayor peso. 1H confirma y 15M ajusta la entrada.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default SupportResistanceZones
