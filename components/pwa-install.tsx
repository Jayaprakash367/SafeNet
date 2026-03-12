"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("[v0] Service Worker registered"))
        .catch((error) => console.log("[v0] Service Worker registration failed:", error))
    }

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      console.log("[v0] PWA installed")
    }

    setDeferredPrompt(null)
    setShowInstall(false)
  }

  if (!showInstall) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Download className="h-5 w-5" />
        <div>
          <p className="font-semibold">Install SafeNet SOS</p>
          <p className="text-sm opacity-90">Add to home screen for quick emergency access</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={handleInstall}
          variant="secondary"
          size="sm"
          className="bg-white text-red-600 hover:bg-gray-100"
        >
          Install
        </Button>
        <Button onClick={() => setShowInstall(false)} variant="ghost" size="sm" className="text-white hover:bg-red-700">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
