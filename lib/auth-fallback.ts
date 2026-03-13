import crypto from 'crypto'

/**
 * Fallback authentication system when database is unavailable
 * Uses in-memory storage with local storage for persistence
 */

export interface FallbackUser {
  id: string
  email: string
  name: string
  passwordHash: string
  role: string
  createdAt: string
  lastLogin: string
}

interface FallbackAuthState {
  users: Map<string, FallbackUser>
  sessions: Map<string, { userId: string; expiresAt: number }>
  activities: Array<{
    userId: string
    action: string
    timestamp: string
  }>
}

class FallbackAuthSystem {
  private state: FallbackAuthState

  constructor() {
    this.state = {
      users: new Map(),
      sessions: new Map(),
      activities: [],
    }
    this.loadFromLocalStorage()
  }

  /**
   * Load fallback data from local storage
   */
  private loadFromLocalStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('safenet_fallback_auth')
      if (stored) {
        const data = JSON.parse(stored)
        this.state.users = new Map(data.users)
        this.state.sessions = new Map(data.sessions)
        this.state.activities = data.activities || []
      }
    } catch (error) {
      console.warn('[v0] Could not load fallback auth data:', error)
    }
  }

  /**
   * Save fallback data to local storage
   */
  private saveToLocalStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const data = {
        users: Array.from(this.state.users.entries()),
        sessions: Array.from(this.state.sessions.entries()),
        activities: this.state.activities,
      }
      localStorage.setItem('safenet_fallback_auth', JSON.stringify(data))
    } catch (error) {
      console.warn('[v0] Could not save fallback auth data:', error)
    }
  }

  /**
   * Hash password
   */
  private hashPassword(password: string): string {
    return crypto
      .createHash('sha256')
      .update(password + 'safenet-fallback-salt')
      .digest('hex')
  }

  /**
   * Register user (fallback)
   */
  registerUser(email: string, password: string, name: string, role = 'responder'): FallbackUser | null {
    const lowerEmail = email.toLowerCase()

    // Check if user exists
    if (this.state.users.has(lowerEmail)) {
      return null
    }

    const userId = `fallback_${crypto.randomBytes(8).toString('hex')}`
    const user: FallbackUser = {
      id: userId,
      email: lowerEmail,
      name: name.trim(),
      passwordHash: this.hashPassword(password),
      role,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    }

    this.state.users.set(lowerEmail, user)
    this.saveToLocalStorage()

    this.logActivity(userId, 'signup')

    return user
  }

  /**
   * Login user (fallback)
   */
  loginUser(email: string, password: string): { user: FallbackUser; token: string } | null {
    const lowerEmail = email.toLowerCase()
    const user = this.state.users.get(lowerEmail)

    if (!user) {
      return null
    }

    // Verify password
    if (this.hashPassword(password) !== user.passwordHash) {
      this.logActivity(user.id, 'failed_login')
      return null
    }

    // Generate session
    const token = `fallback_${crypto.randomBytes(16).toString('hex')}`
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

    this.state.sessions.set(token, { userId: user.id, expiresAt })
    user.lastLogin = new Date().toISOString()
    this.state.users.set(lowerEmail, user)

    this.saveToLocalStorage()
    this.logActivity(user.id, 'login')

    return { user, token }
  }

  /**
   * Verify session token
   */
  verifySession(token: string): FallbackUser | null {
    const session = this.state.sessions.get(token)

    if (!session) {
      return null
    }

    // Check if session expired
    if (session.expiresAt < Date.now()) {
      this.state.sessions.delete(token)
      this.saveToLocalStorage()
      return null
    }

    // Find user by ID
    for (const user of this.state.users.values()) {
      if (user.id === session.userId) {
        return user
      }
    }

    return null
  }

  /**
   * Logout user
   */
  logout(token: string, userId?: string): void {
    this.state.sessions.delete(token)
    if (userId) {
      this.logActivity(userId, 'logout')
    }
    this.saveToLocalStorage()
  }

  /**
   * Log activity
   */
  private logActivity(userId: string, action: string): void {
    this.state.activities.push({
      userId,
      action,
      timestamp: new Date().toISOString(),
    })

    // Keep only last 1000 activities
    if (this.state.activities.length > 1000) {
      this.state.activities = this.state.activities.slice(-1000)
    }

    this.saveToLocalStorage()
  }

  /**
   * Get user activities
   */
  getUserActivities(userId: string): typeof this.state.activities {
    return this.state.activities.filter((a) => a.userId === userId)
  }
}

export const fallbackAuth = new FallbackAuthSystem()
