import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import { Suspense } from "react"
import "./globals.css"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"

export const metadata: Metadata = {
  title: "SafeNet - Enterprise Emergency Response System",
  description: "Professional disaster management and emergency response coordination platform trusted by government agencies and emergency services",
  keywords: "disaster management, emergency response, SOS alert, GPS tracking, emergency coordination, crisis management",
  generator: "SafeNet v1.0",
  manifest: "/manifest.json",
  themeColor: "#c41e3a",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SafeNet",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.jpg", sizes: "192x192", type: "image/jpeg" },
      { url: "/icon-512x512.jpg", sizes: "512x512", type: "image/jpeg" },
    ],
    shortcut: [{ url: "/icon-192x192.jpg", sizes: "192x192" }],
    apple: [
      { url: "/icon-192x192.jpg", sizes: "192x192", type: "image/jpeg" },
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  other: {
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-capable": "yes",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="SafeNet SOS" />
        <meta name="msapplication-TileColor" content="#dc2626" />
        <meta name="msapplication-tap-highlight" content="no" />
        <Script
          id="pwa-sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('[PWA] SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('[PWA] SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className="font-sans">
        <Suspense fallback={null}>{children}</Suspense>
        <PWAInstallPrompt />
      </body>
    </html>
  )
}
