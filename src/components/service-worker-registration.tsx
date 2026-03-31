'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export function ServiceWorkerRegistration() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })
        
        setRegistration(reg)
        console.log('SW registered:', reg.scope)

        // Check for updates immediately
        reg.update()

        // Check for updates every 30 seconds
        setInterval(() => {
          reg.update()
        }, 30000)

        // Listen for new versions
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New version available!')
                setShowUpdate(true)
              }
            })
          }
        })
      } catch (error) {
        console.error('SW registration failed:', error)
      }
    }

    registerSW()

    // Listen for controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Controller changed - reloading')
      window.location.reload()
    })
  }, [])

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Tell the waiting worker to activate
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    } else {
      window.location.reload()
    }
  }

  if (showUpdate) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg z-50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="font-medium">Nueva versión disponible</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleUpdate}
          >
            Actualizar
          </Button>
        </div>
      </div>
    )
  }

  return null
}
