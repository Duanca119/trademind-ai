'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <Card className="bg-red-500/10 border-red-500/30 max-w-md w-full">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Algo salió mal</h2>
          <p className="text-sm text-zinc-400 mb-4">
            Ha ocurrido un error inesperado
          </p>
          
          {/* Show error details in development */}
          <div className="bg-zinc-800/50 rounded p-3 mb-4 text-left">
            <p className="text-xs text-red-300 font-mono break-all">
              {error?.message || 'Error desconocido'}
            </p>
            {error?.digest && (
              <p className="text-xs text-zinc-500 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
          
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-zinc-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Recargar página
            </Button>
            <Button onClick={reset}>
              Intentar de nuevo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
