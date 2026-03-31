'use client'

import dynamic from 'next/dynamic'

// Dynamically import the main page with SSR disabled
const MainPage = dynamic(() => import('./page-client'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <div className="text-white">Cargando TradeMind AI...</div>
    </div>
  )
})

export default function PageWrapper() {
  return <MainPage />
}
