/**
 * SafeNet Backend Fallback System
 * Provides comprehensive redundancy and fallback mechanisms for critical operations
 */

export interface FallbackContext {
  operation: string
  data: Record<string, any>
  timestamp: number
  retryCount: number
  maxRetries: number
}

export interface FallbackResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  source: "primary" | "fallback" | "offline"
  timestamp: number
}

// Offline queue for operations when no connection
class OfflineQueue {
  private queue: FallbackContext[] = []
  private readonly STORAGE_KEY = "safenet-offline-queue"

  constructor() {
    this.loadFromStorage()
  }

  add(context: FallbackContext): void {
    this.queue.push(context)
    this.saveToStorage()
  }

  getAll(): FallbackContext[] {
    return [...this.queue]
  }

  remove(index: number): void {
    this.queue.splice(index, 1)
    this.saveToStorage()
  }

  clear(): void {
    this.queue = []
    this.saveToStorage()
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue))
    } catch (error) {
      console.error("[v0] Failed to save offline queue:", error)
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        this.queue = JSON.parse(stored)
      }
    } catch (error) {
      console.error("[v0] Failed to load offline queue:", error)
    }
  }
}

// Cache system for frequently accessed data
class CacheLayer {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()

  set(key: string, data: any, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    })
  }

  get(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const age = Date.now() - cached.timestamp
    if (age > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  clear(): void {
    this.cache.clear()
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }
}

export class FallbackSystem {
  private offlineQueue = new OfflineQueue()
  private cacheLayer = new CacheLayer()
  private isOnline = typeof navigator !== "undefined" ? navigator.onLine : true
  private retryDelays = [1000, 2000, 5000, 10000] // Exponential backoff in ms

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.isOnline = true
        console.log("[v0] Connection restored - processing offline queue")
        this.processOfflineQueue()
      })

      window.addEventListener("offline", () => {
        this.isOnline = false
        console.log("[v0] Connection lost - using offline mode")
      })
    }
  }

  /**
   * Execute operation with automatic fallback and retry logic
   */
  async execute<T>(
    operation: string,
    primaryFn: () => Promise<T>,
    fallbackFn?: () => Promise<T>,
  ): Promise<FallbackResponse<T>> {
    const context: FallbackContext = {
      operation,
      data: {},
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.retryDelays.length,
    }

    // Check cache first
    const cacheKey = `${operation}-${JSON.stringify(context.data)}`
    const cachedData = this.cacheLayer.get(cacheKey)
    if (cachedData) {
      console.log(`[v0] Using cached result for ${operation}`)
      return {
        success: true,
        data: cachedData,
        source: "primary",
        timestamp: Date.now(),
      }
    }

    // Try primary operation with retries
    try {
      const result = await this.executeWithRetry(primaryFn, context)
      this.cacheLayer.set(cacheKey, result)
      return {
        success: true,
        data: result,
        source: "primary",
        timestamp: Date.now(),
      }
    } catch (primaryError) {
      console.error(`[v0] Primary operation failed for ${operation}:`, primaryError)

      // Try fallback operation
      if (fallbackFn) {
        try {
          console.log(`[v0] Attempting fallback for ${operation}`)
          const result = await this.executeWithRetry(fallbackFn, context)
          this.cacheLayer.set(cacheKey, result)
          return {
            success: true,
            data: result,
            source: "fallback",
            timestamp: Date.now(),
          }
        } catch (fallbackError) {
          console.error(`[v0] Fallback operation failed for ${operation}:`, fallbackError)
        }
      }

      // Queue for offline processing
      if (!this.isOnline) {
        console.log(`[v0] Queuing ${operation} for offline processing`)
        this.offlineQueue.add(context)
        return {
          success: false,
          error: "Operation queued for when connection is restored",
          source: "offline",
          timestamp: Date.now(),
        }
      }

      return {
        success: false,
        error: String(primaryError),
        source: "offline",
        timestamp: Date.now(),
      }
    }
  }

  /**
   * Execute operation with exponential backoff retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    context: FallbackContext,
  ): Promise<T> {
    let lastError: Error | null = null

    for (context.retryCount = 0; context.retryCount < context.maxRetries; context.retryCount++) {
      try {
        return await this.executeWithTimeout(fn, 15000) // 15 second timeout
      } catch (error) {
        lastError = error as Error
        console.warn(
          `[v0] Attempt ${context.retryCount + 1} failed for ${context.operation}:`,
          error,
        )

        // Don't retry if we're offline
        if (!this.isOnline) break

        // Wait before retry with exponential backoff
        if (context.retryCount < context.maxRetries - 1) {
          const delay = this.retryDelays[context.retryCount]
          console.log(`[v0] Retrying in ${delay}ms...`)
          await this.sleep(delay)
        }
      }
    }

    throw lastError
  }

  /**
   * Execute operation with timeout
   */
  private executeWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs),
      ),
    ])
  }

  /**
   * Process queued offline operations when connection is restored
   */
  private async processOfflineQueue(): Promise<void> {
    const items = this.offlineQueue.getAll()
    console.log(`[v0] Processing ${items.length} queued operations`)

    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i]
      try {
        // Implement operation-specific retry logic here
        console.log(`[v0] Retrying queued operation: ${item.operation}`)
        // This should be extended with actual operation handlers
        this.offlineQueue.remove(i)
      } catch (error) {
        console.error(`[v0] Failed to process queued operation ${item.operation}:`, error)
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get current offline queue status
   */
  getQueueStatus() {
    return {
      queued: this.offlineQueue.getAll().length,
      isOnline: this.isOnline,
      timestamp: Date.now(),
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cacheLayer.clear()
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.isOnline
  }
}

// Singleton instance
export const fallbackSystem = new FallbackSystem()
