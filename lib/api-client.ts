/**
 * SafeNet Enhanced API Client
 * Integrates fallback system with intelligent error handling and retry logic
 */

import { fallbackSystem, FallbackResponse } from "./fallback-system"

export interface APIClientOptions {
  timeout?: number
  retries?: number
  cache?: boolean
  cacheTTL?: number
}

export class SafeNetAPIClient {
  private baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  private defaultOptions: APIClientOptions = {
    timeout: 15000,
    retries: 3,
    cache: true,
    cacheTTL: 5 * 60 * 1000, // 5 minutes
  }

  /**
   * Make API call with fallback support
   */
  async call<T = any>(
    endpoint: string,
    options: RequestInit & APIClientOptions = {},
  ): Promise<FallbackResponse<T>> {
    const mergedOptions = { ...this.defaultOptions, ...options }

    const primaryFn = () => this.makeRequest<T>(endpoint, options)

    // Fallback to cached data if available
    const fallbackFn = async () => {
      const cached = this.getCached<T>(endpoint)
      if (cached) {
        return cached
      }
      throw new Error("No cached data available")
    }

    return fallbackSystem.execute<T>(endpoint, primaryFn, mergedOptions.cache ? fallbackFn : undefined)
  }

  /**
   * Send SOS alert with intelligent fallback
   */
  async sendSOS(data: Record<string, any>): Promise<FallbackResponse<any>> {
    const primaryFn = () => this.makeRequest("/api/sos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    // Fallback: Queue for later or send via alternative method
    const fallbackFn = async () => {
      console.log("[v0] SOS fallback: Storing for offline retry")
      this.storeForOfflineRetry("/api/sos", data)
      return { queued: true, timestamp: Date.now() }
    }

    return fallbackSystem.execute("/api/sos", primaryFn, fallbackFn)
  }

  /**
   * Send SMS with fallback
   */
  async sendSMS(phoneNumber: string, message: string): Promise<FallbackResponse<any>> {
    const data = { phoneNumber, message }

    const primaryFn = () => this.makeRequest("/api/sos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, type: "SMS" }),
    })

    const fallbackFn = async () => {
      // Fallback to native SMS if available
      if (typeof window !== "undefined" && window.location.protocol === "https:") {
        const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`
        try {
          const link = document.createElement("a")
          link.href = smsUrl
          link.click()
          return { method: "native-sms", success: true }
        } catch (error) {
          console.error("[v0] Native SMS fallback failed:", error)
        }
      }
      throw new Error("All SMS methods failed")
    }

    return fallbackSystem.execute(`sms-${phoneNumber}`, primaryFn, fallbackFn)
  }

  /**
   * Get user location with fallback
   */
  async getLocation(): Promise<FallbackResponse<any>> {
    const primaryFn = () =>
      new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported"))
          return
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              source: "gps",
            })
          },
          (error) => {
            reject(new Error(`Geolocation error: ${error.message}`))
          },
          { timeout: 10000, enableHighAccuracy: true },
        )
      })

    // Fallback to cached location
    const fallbackFn = async () => {
      const cached = this.getCached("location")
      if (cached) {
        return { ...cached, source: "cached" }
      }
      throw new Error("No cached location available")
    }

    return fallbackSystem.execute("location", primaryFn, fallbackFn)
  }

  /**
   * Fetch disaster alerts with caching
   */
  async getDisasterAlerts(latitude?: number, longitude?: number): Promise<FallbackResponse<any>> {
    const endpoint = latitude && longitude ? `/api/disaster-alerts?lat=${latitude}&lng=${longitude}` : "/api/disaster-alerts"

    return this.call(endpoint, { cache: true, cacheTTL: 10 * 60 * 1000 })
  }

  /**
   * Fetch weather information with caching
   */
  async getWeather(latitude?: number, longitude?: number): Promise<FallbackResponse<any>> {
    const endpoint = latitude && longitude ? `/api/weather?lat=${latitude}&lng=${longitude}` : "/api/weather"

    return this.call(endpoint, { cache: true, cacheTTL: 15 * 60 * 1000 })
  }

  /**
   * Sync offline queue when connection is restored
   */
  async syncOfflineQueue(): Promise<void> {
    const queue = this.getOfflineQueue()
    const status = fallbackSystem.getQueueStatus()

    if (!status.isOnline || queue.length === 0) {
      return
    }

    console.log(`[v0] Syncing ${queue.length} offline operations`)

    for (const item of queue) {
      try {
        await this.call(item.endpoint, { method: item.method || "POST", body: JSON.stringify(item.data) })
        this.removeFromOfflineQueue(item.endpoint)
      } catch (error) {
        console.error(`[v0] Failed to sync ${item.endpoint}:`, error)
      }
    }
  }

  /**
   * Private helper methods
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith("http") ? endpoint : `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  private getCached<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(`safenet-cache-${key}`)
      if (!stored) return null

      const { data, timestamp, ttl } = JSON.parse(stored)
      if (Date.now() - timestamp > ttl) {
        localStorage.removeItem(`safenet-cache-${key}`)
        return null
      }

      return data
    } catch (error) {
      return null
    }
  }

  private getOfflineQueue() {
    try {
      const queue = localStorage.getItem("safenet-offline-queue")
      return queue ? JSON.parse(queue) : []
    } catch {
      return []
    }
  }

  private removeFromOfflineQueue(endpoint: string) {
    try {
      const queue = this.getOfflineQueue()
      const filtered = queue.filter((item: any) => item.endpoint !== endpoint)
      localStorage.setItem("safenet-offline-queue", JSON.stringify(filtered))
    } catch (error) {
      console.error("[v0] Failed to update offline queue:", error)
    }
  }

  private storeForOfflineRetry(endpoint: string, data: any) {
    try {
      const queue = this.getOfflineQueue()
      queue.push({ endpoint, data, method: "POST", timestamp: Date.now() })
      localStorage.setItem("safenet-offline-queue", JSON.stringify(queue))
      console.log("[v0] Operation stored for offline retry")
    } catch (error) {
      console.error("[v0] Failed to store offline operation:", error)
    }
  }
}

// Singleton instance
export const apiClient = new SafeNetAPIClient()
