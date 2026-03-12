const CACHE_NAME = "safenet-sos-v2"
const urlsToCache = ["/", "/manifest.json", "/icon-192x192.jpg", "/icon-512x512.jpg", "/globals.css"]

// Install event - cache resources
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker")
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching app shell")
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        console.log("[SW] Skip waiting")
        return self.skipWaiting()
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker")
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[SW] Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("[SW] Claiming clients")
        return self.clients.claim()
      }),
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response
        }
        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (event.request.destination === "document") {
          return caches.match("/")
        }
      }),
  )
})

// Background sync for offline SOS alerts
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sos") {
    console.log("[SW] Background sync: SOS alert")
    event.waitUntil(sendPendingSOSAlerts())
  }
})

async function sendPendingSOSAlerts() {
  // This would handle offline SOS alerts when connection is restored
  console.log("[SW] Checking for pending SOS alerts...")
}
