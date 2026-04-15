'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Square, 
  Trash2, 
  Save, 
  X, 
  ChevronDown, 
  ChevronUp,
  Layers
} from 'lucide-react'

interface Zone {
  id: string
  symbol: string
  interval: string
  zone_type: 'support' | 'resistance' | 'demand' | 'supply'
  price_top: number
  price_bottom: number
  color: string
  created_at: string
}

interface ZoneDrawerProps {
  symbol: string
  interval: string
  currentPrice: number
  onZonesChange?: (zones: Zone[]) => void
}

const ZONE_COLORS = {
  support: '#22c55e',      // green
  resistance: '#ef4444',   // red
  demand: '#3b82f6',       // blue
  supply: '#f59e0b',       // amber
}

const ZONE_TYPES = [
  { id: 'support', name: 'Soporte', color: '#22c55e' },
  { id: 'resistance', name: 'Resistencia', color: '#ef4444' },
  { id: 'demand', name: 'Demanda', color: '#3b82f6' },
  { id: 'supply', name: 'Oferta', color: '#f59e0b' },
]

export function ZoneDrawer({ symbol, interval, currentPrice, onZonesChange }: ZoneDrawerProps) {
  const [zones, setZones] = useState<Zone[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [selectedType, setSelectedType] = useState<'support' | 'resistance' | 'demand' | 'supply'>('support')
  const [showPanel, setShowPanel] = useState(false)
  const [startPrice, setStartPrice] = useState<number | null>(null)
  const [endPrice, setEndPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  // Load zones from Supabase
  const loadZones = useCallback(async () => {
    try {
      const response = await fetch(`/api/zones?symbol=${encodeURIComponent(symbol)}&interval=${interval}`)
      const data = await response.json()
      if (data.zones) {
        setZones(data.zones)
        onZonesChange?.(data.zones)
      }
    } catch (error) {
      console.error('Error loading zones:', error)
    }
  }, [symbol, interval, onZonesChange])

  useEffect(() => {
    loadZones()
  }, [loadZones])

  // Save zone to Supabase
  const saveZone = async () => {
    if (startPrice === null || endPrice === null) return

    setLoading(true)
    try {
      const priceTop = Math.max(startPrice, endPrice)
      const priceBottom = Math.min(startPrice, endPrice)

      const response = await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          interval,
          zoneType: selectedType,
          priceTop,
          priceBottom,
          color: ZONE_COLORS[selectedType],
        }),
      })

      const data = await response.json()
      if (data.success) {
        await loadZones()
        setStartPrice(null)
        setEndPrice(null)
        setIsDrawing(false)
      }
    } catch (error) {
      console.error('Error saving zone:', error)
    } finally {
      setLoading(false)
    }
  }

  // Delete zone
  const deleteZone = async (zoneId: string) => {
    try {
      await fetch(`/api/zones?id=${zoneId}`, { method: 'DELETE' })
      await loadZones()
    } catch (error) {
      console.error('Error deleting zone:', error)
    }
  }

  // Quick zone buttons (based on current price)
  const createQuickZone = (type: 'support' | 'resistance' | 'demand' | 'supply', percentOffset: number) => {
    const offset = currentPrice * (percentOffset / 100)
    const top = type === 'support' || type === 'demand' 
      ? currentPrice 
      : currentPrice + offset
    const bottom = type === 'support' || type === 'demand'
      ? currentPrice - offset
      : currentPrice

    setStartPrice(top)
    setEndPrice(bottom)
    setSelectedType(type)
    setIsDrawing(true)
  }

  return (
    <div className="relative">
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowPanel(!showPanel)}
        className="flex items-center gap-1"
      >
        <Layers className="w-4 h-4" />
        <span className="hidden sm:inline">Zonas</span>
        {zones.length > 0 && (
          <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
            {zones.length}
          </Badge>
        )}
        {showPanel ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </Button>

      {/* Zone Panel */}
      {showPanel && (
        <Card className="absolute top-10 right-0 w-72 z-50 shadow-lg">
          <CardContent className="p-3 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">Zonas Guardadas</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPanel(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Zone Type Selector */}
            <div className="grid grid-cols-2 gap-1">
              {ZONE_TYPES.map((type) => (
                <Button
                  key={type.id}
                  variant={selectedType === type.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type.id as any)}
                  className="text-xs justify-start"
                  style={{ 
                    borderLeft: `3px solid ${type.color}`,
                    paddingLeft: '8px'
                  }}
                >
                  {type.name}
                </Button>
              ))}
            </div>

            {/* Quick Zone Buttons */}
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Crear zona rápida:</span>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => createQuickZone('support', 0.5)}
                  className="text-xs"
                  style={{ borderLeft: '3px solid #22c55e' }}
                >
                  Soporte aquí
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => createQuickZone('resistance', 0.5)}
                  className="text-xs"
                  style={{ borderLeft: '3px solid #ef4444' }}
                >
                  Resistencia aquí
                </Button>
              </div>
            </div>

            {/* Drawing Mode */}
            {isDrawing && (
              <div className="space-y-2 p-2 bg-muted rounded-lg">
                <div className="text-xs font-medium">Dibujando zona:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Precio superior:</span>
                    <input
                      type="number"
                      step="0.00001"
                      value={startPrice?.toFixed(5) || ''}
                      onChange={(e) => setStartPrice(parseFloat(e.target.value))}
                      className="w-full mt-1 p-1 bg-background rounded border text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-muted-foreground">Precio inferior:</span>
                    <input
                      type="number"
                      step="0.00001"
                      value={endPrice?.toFixed(5) || ''}
                      onChange={(e) => setEndPrice(parseFloat(e.target.value))}
                      className="w-full mt-1 p-1 bg-background rounded border text-xs"
                    />
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={saveZone}
                    disabled={loading || startPrice === null || endPrice === null}
                    className="flex-1"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Guardar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsDrawing(false)
                      setStartPrice(null)
                      setEndPrice(null)
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Saved Zones List */}
            {zones.length > 0 && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                <span className="text-xs text-muted-foreground">Zonas guardadas:</span>
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: zone.color }}
                      />
                      <span className="capitalize">{zone.zone_type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {zone.price_bottom.toFixed(5)} - {zone.price_top.toFixed(5)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteZone(zone.id)}
                        className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* New Zone Button */}
            {!isDrawing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStartPrice(currentPrice * 1.001)
                  setEndPrice(currentPrice * 0.999)
                  setIsDrawing(true)
                }}
                className="w-full"
              >
                <Square className="w-4 h-4 mr-1" />
                Nueva Zona
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Zone Overlays (visual representation) */}
      {zones.map((zone) => (
        <div
          key={zone.id}
          className="absolute pointer-events-none"
          style={{
            backgroundColor: `${zone.color}20`,
            borderTop: `2px solid ${zone.color}`,
            borderBottom: `2px solid ${zone.color}`,
          }}
        />
      ))}
    </div>
  )
}
