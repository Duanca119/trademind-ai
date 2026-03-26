'use client'

import { useEffect, useState } from 'react'

export function ServiceWorkerRegistration() {
  const [showUpdateToast, setShowUpdateToast] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope)
          
          // Check for updates every 30 minutes
          setInterval(() => {
            registration.update()
          }, 30 * 60 * 1000)

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available - auto-update
                  console.log('🔄 New version available! Updating...')
                  
                  // Tell the new service worker to activate immediately
                  newWorker.postMessage('skipWaiting')
                  
                  // Show update notification
                  setShowUpdateToast(true)
                  
                  // Auto-refresh after 1 second
                  setTimeout(() => {
                    window.location.reload()
                  }, 1000)
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })

      // Handle controller change (when new SW activates)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('✅ App updated to new version!')
      })
    }
  }, [])

  // Show update toast
  if (showUpdateToast) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Actualizando app...</span>
        </div>
      </div>
    )
  }

  return null
}
