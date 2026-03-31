import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradeMind AI - Asistente de Trading Inteligente",
  description: "Plataforma de trading con análisis técnico automatizado, detección de soportes/resistencias y señales de IA en tiempo real para Forex y Criptomonedas.",
  keywords: ["trading", "forex", "crypto", "AI", "análisis técnico", "señales de trading"],
  authors: [{ name: "TradeMind AI" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TradeMind AI",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "TradeMind AI",
    title: "TradeMind AI - Asistente de Trading Inteligente",
    description: "Plataforma de trading con análisis técnico automatizado y señales de IA",
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeMind AI",
    description: "Plataforma de trading con análisis técnico automatizado y señales de IA",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="antialiased min-h-screen bg-background text-foreground">
        <div className="pwa-status-bar" />
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
