'use client'

import { useState } from 'react'
import { 
  Zap,
  TrendingUp,
  Clock,
  Check,
  ChevronRight,
  ChevronDown,
  Settings,
  Bell,
  BellOff,
  Target,
  Info
} from 'lucide-react'
import { useTraderProfile, TRADER_PROFILES, TraderProfileType } from '../contexts/TraderProfileContext'

// ============================================
// COMPONENT
// ============================================

export default function TraderProfileSettings() {
  const { profile, profileConfig, setProfile, customSettings, updateCustomSettings } = useTraderProfile()
  const [expandedProfile, setExpandedProfile] = useState<TraderProfileType | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const profiles: { type: TraderProfileType; icon: string; color: string; bgColor: string }[] = [
    { type: 'scalper', icon: '⚡', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    { type: 'dayTrader', icon: '📊', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    { type: 'swingTrader', icon: '🧘', color: 'text-green-400', bgColor: 'bg-green-500/20' }
  ]

  const handleSelectProfile = (type: TraderProfileType) => {
    setProfile(type)
    // Also update EMA distance to profile default
    updateCustomSettings({ emaDistance: TRADER_PROFILES[type].config.emaDistance })
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-purple-400" />
        <h2 className="font-semibold text-lg">Perfil Trader</h2>
      </div>

      {/* Active Profile Banner */}
      <div className={`${profileConfig.icon === '⚡' ? 'bg-yellow-500/10 border-yellow-500/30' : 
                       profileConfig.icon === '📊' ? 'bg-blue-500/10 border-blue-500/30' : 
                       'bg-green-500/10 border-green-500/30'} border rounded-xl p-3`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{profileConfig.icon}</span>
            <div>
              <p className="font-bold">{profileConfig.name}</p>
              <p className="text-xs text-zinc-400">{profileConfig.description}</p>
            </div>
          </div>
          <span className="text-xs px-2 py-1 bg-white/10 rounded-full">
            Perfil activo
          </span>
        </div>
      </div>

      {/* Profile Selection */}
      <div className="space-y-2">
        <p className="text-sm text-zinc-400">Selecciona tu estilo de trading:</p>
        
        <div className="grid gap-2">
          {profiles.map((p) => {
            const config = TRADER_PROFILES[p.type]
            const isSelected = profile === p.type
            const isExpanded = expandedProfile === p.type
            
            return (
              <div key={p.type} className="space-y-1">
                <button
                  onClick={() => handleSelectProfile(p.type)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    isSelected 
                      ? `${p.bgColor} border-2 ${p.color.replace('text-', 'border-')}/50` 
                      : 'bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.icon}</span>
                      <div>
                        <p className={`font-bold ${isSelected ? p.color : ''}`}>{config.name}</p>
                        <p className="text-xs text-zinc-500">{config.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <div className={`w-6 h-6 rounded-full ${p.bgColor} flex items-center justify-center`}>
                          <Check className={`w-4 h-4 ${p.color}`} />
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedProfile(isExpanded ? null : p.type)
                        }}
                        className="p-1 hover:bg-white/10 rounded"
                      >
                        <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
                  </div>
                </button>
                
                {/* Expanded Details */}
                {isExpanded && (
                  <div className="bg-zinc-800/30 rounded-lg p-3 ml-4 space-y-2">
                    <p className="text-xs font-medium text-zinc-400">Configuración del perfil:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-zinc-800/50 rounded p-2">
                        <p className="text-zinc-500">Temporalidad principal</p>
                        <p className="font-mono font-bold">{config.config.primaryTimeframe}</p>
                      </div>
                      <div className="bg-zinc-800/50 rounded p-2">
                        <p className="text-zinc-500">Confirmación</p>
                        <p className="font-mono font-bold">{config.config.confirmationTimeframe}</p>
                      </div>
                      <div className="bg-zinc-800/50 rounded p-2">
                        <p className="text-zinc-500">Entrada</p>
                        <p className="font-mono font-bold">{config.config.entryTimeframe}</p>
                      </div>
                      <div className="bg-zinc-800/50 rounded p-2">
                        <p className="text-zinc-500">Distancia EMA</p>
                        <p className="font-mono font-bold">{config.config.emaDistance}%</p>
                      </div>
                      <div className="bg-zinc-800/50 rounded p-2">
                        <p className="text-zinc-500">Cooldown alertas</p>
                        <p className="font-mono font-bold">{config.config.alertCooldownMinutes} min</p>
                      </div>
                      <div className="bg-zinc-800/50 rounded p-2">
                        <p className="text-zinc-500">Intervalo revisión</p>
                        <p className="font-mono font-bold">{config.config.checkIntervalMinutes} min</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full p-4 bg-zinc-900/50 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-zinc-400" />
            <span className="font-medium">Personalización avanzada</span>
          </div>
          <ChevronDown className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>
        
        {showAdvanced && (
          <div className="p-4 space-y-4 bg-zinc-900/30">
            {/* EMA Distance */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-zinc-400">Distancia a EMA para alertas</label>
                <span className="text-sm font-mono font-bold text-purple-400">
                  {customSettings.emaDistance}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.5"
                step="0.05"
                value={customSettings.emaDistance}
                onChange={(e) => updateCustomSettings({ emaDistance: parseFloat(e.target.value) })}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-xs text-zinc-500 mt-1">
                <span>0.1% (estricto)</span>
                <span>0.5% (flexible)</span>
              </div>
            </div>

            {/* Alerts Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Alertas</p>
                <p className="text-xs text-zinc-500">Activar/desactivar notificaciones</p>
              </div>
              <button
                onClick={() => updateCustomSettings({ alertsEnabled: !customSettings.alertsEnabled })}
                className={`w-12 h-7 rounded-full transition-colors ${
                  customSettings.alertsEnabled ? 'bg-purple-500' : 'bg-zinc-700'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  customSettings.alertsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Info Box */}
            <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-300">
                La configuración se adapta automáticamente según el perfil seleccionado. 
                Puedes ajustarla manualmente según tus preferencias.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Profile Benefits */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Tu perfil afecta:
        </h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5" />
            <div>
              <p className="font-medium">Mercado en Vivo</p>
              <p className="text-xs text-zinc-500">
                Temporalidades y umbrales de alerta según tu perfil
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Target className="w-4 h-4 text-purple-400 mt-0.5" />
            <div>
              <p className="font-medium">Price Action</p>
              <p className="text-xs text-zinc-500">
                Análisis en temporalidades relevantes para tu estilo
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Bell className="w-4 h-4 text-blue-400 mt-0.5" />
            <div>
              <p className="font-medium">Sistema de Alertas</p>
              <p className="text-xs text-zinc-500">
                Frecuencia y cooldown adaptados a tu estilo
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
