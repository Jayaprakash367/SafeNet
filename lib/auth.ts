// Authentication utilities and types
import crypto from 'crypto'

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'responder' | 'user'
  createdAt: string
  lastLogin: string
  isVerified: boolean
}

export interface AuthResponse {
  success: boolean
  message: string
  user?: User
  token?: string
  errors?: Record<string, string>
}

// Mock user database with hashed passwords
const mockUsers: Record<string, { email: string; passwordHash: string; name: string; role: string; isVerified: boolean }> = {
  'demo@safenet.gov': {
    email: 'demo@safenet.gov',
    passwordHash: hashPassword('password123'),
    name: 'Demo Responder',
    role: 'responder',
    isVerified: true,
  },
  'admin@safenet.gov': {
    email: 'admin@safenet.gov',
    passwordHash: hashPassword('admin123'),
    name: 'Admin User',
    role: 'admin',
    isVerified: true,
  },
}

// Store for user sessions
export const userSessions = new Map<string, User>()

/**
 * Hash password using crypto
 */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + process.env.PASSWORD_SALT || 'safenet-salt').digest('hex')
}

/**
 * Verify password
 */
function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; message?: string } {
  if (!email) {
    return { valid: false, message: 'Email is required' }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Please enter a valid email address' }
  }
  return { valid: true }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string, fieldName = 'Password'): { valid: boolean; message?: string } {
  if (!password) {
    return { valid: false, message: `${fieldName} is required` }
  }
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' }
  }
  if (password.length > 128) {
    return { valid: false, message: 'Password must be less than 128 characters' }
  }
  return { valid: true }
}

/**
 * Validate name
 */
export function validateName(name: string): { valid: boolean; message?: string } {
  if (!name) {
    return { valid: false, message: 'Name is required' }
  }
  if (name.trim().length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters' }
  }
  if (name.trim().length > 50) {
    return { valid: false, message: 'Name must be less than 50 characters' }
  }
  return { valid: true }
}

/**
 * Login user
 */
export function loginUser(email: string, password: string): AuthResponse {
  // Validate inputs
  const emailValidation = validateEmail(email)
  if (!emailValidation.valid) {
    return {
      success: false,
      message: emailValidation.message,
      errors: { email: emailValidation.message },
    }
  }

  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    return {
      success: false,
      message: passwordValidation.message,
      errors: { password: passwordValidation.message },
    }
  }

  const user = mockUsers[email.toLowerCase()]

  if (!user) {
    return {
      success: false,
      message: 'Email not found. Please sign up first.',
      errors: { email: 'No account found with this email' },
    }
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return {
      success: false,
      message: 'Incorrect password. Please try again.',
      errors: { password: 'Password is incorrect' },
    }
  }

  // Create user session
  const sessionUser: User = {
    id: `user-${Date.now()}`,
    email: user.email,
    name: user.name,
    role: user.role as 'admin' | 'responder' | 'user',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    isVerified: user.isVerified,
  }

  const token = `session-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`
  userSessions.set(token, sessionUser)

  return {
    success: true,
    message: 'Login successful',
    user: sessionUser,
    token,
  }
}

/**
 * Signup user
 */
export function signupUser(
  email: string,
  password: string,
  name: string,
  emergencyContacts: string[] = [],
): AuthResponse {
  // Validate inputs
  const emailValidation = validateEmail(email)
  if (!emailValidation.valid) {
    return {
      success: false,
      message: emailValidation.message,
      errors: { email: emailValidation.message },
    }
  }

  const nameValidation = validateName(name)
  if (!nameValidation.valid) {
    return {
      success: false,
      message: nameValidation.message,
      errors: { name: nameValidation.message },
    }
  }

  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    return {
      success: false,
      message: passwordValidation.message,
      errors: { password: passwordValidation.message },
    }
  }

  // Check if email already exists (case-insensitive)
  if (mockUsers[email.toLowerCase()]) {
    return {
      success: false,
      message: 'Email already registered. Please log in instead.',
      errors: { email: 'This email is already registered' },
    }
  }

  // Add new user to database with hashed password
  mockUsers[email.toLowerCase()] = {
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    name: name.trim(),
    role: 'responder',
    isVerified: false, // Email verification would happen here
  }

  // Create user session
  const sessionUser: User = {
    id: `user-${Date.now()}`,
    email: email.toLowerCase(),
    name: name.trim(),
    role: 'responder',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    isVerified: false,
  }

  const token = `session-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`
  userSessions.set(token, sessionUser)

  return {
    success: true,
    message: 'Account created successfully',
    user: sessionUser,
    token,
  }
}

/**
 * Logout user
 */
export function logoutUser(token: string): void {
  userSessions.delete(token)
}

/**
 * Verify session token
 */
export function verifySession(token: string): User | null {
  return userSessions.get(token) || null
}
