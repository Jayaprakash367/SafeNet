import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'responder' | 'user'
  isVerified: boolean
  createdAt: string
  lastLogin: string
}

export interface AuthResponse {
  success: boolean
  message: string
  user?: AuthUser
  token?: string
  errors?: Record<string, string>
}

/**
 * Hash password for storage
 */
export function hashPassword(password: string): string {
  return crypto
    .createHash('sha256')
    .update(password + (process.env.PASSWORD_SALT || 'safenet-disaster-salt'))
    .digest('hex')
}

/**
 * Verify password
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

/**
 * Register new user with Supabase
 */
export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: string = 'responder',
): Promise<AuthResponse> {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('auth_users')
      .select('email')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return {
        success: false,
        message: 'Email already registered',
        errors: { email: 'This email is already in use' },
      }
    }

    const passwordHash = hashPassword(password)

    // Parse name into first and last name
    const nameParts = name.trim().split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || nameParts[0]

    // Create user record
    const { data: user, error: insertError } = await supabase
      .from('auth_users')
      .insert([
        {
          email: email.toLowerCase(),
          first_name: firstName,
          last_name: lastName,
          password_hash: passwordHash,
          role: role,
          status: 'active',
          email_verified: false,
        },
      ])
      .select()
      .single()

    if (insertError) {
      console.error('[v0] Error registering user:', insertError)
      return {
        success: false,
        message: 'Failed to create account',
        errors: { form: 'An error occurred during registration' },
      }
    }

    // Create activity log entry
    if (user?.id) {
      await supabase.from('user_activity_logs').insert([
        {
          user_id: user.id,
          action: 'user_registered',
          description: 'User account created',
          metadata: { email: email.toLowerCase() },
        },
      ])
    }

    return {
      success: true,
      message: 'Account created successfully',
      user: {
        id: user?.id || '',
        email: email.toLowerCase(),
        name: name.trim(),
        role: role as 'admin' | 'responder' | 'user',
        isVerified: false,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error('[v0] Registration error:', error)
    return {
      success: false,
      message: 'An unexpected error occurred',
      errors: { form: 'Server error' },
    }
  }
}

/**
 * Login user with Supabase
 */
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  try {
    console.log('[v0] Attempting Supabase login for:', email)

    // Find user
    const { data: user, error: fetchError } = await supabase
      .from('auth_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (fetchError || !user) {
      console.log('[v0] User not found:', email)
      return {
        success: false,
        message: 'Invalid email or password',
        errors: { email: 'User not found' },
      }
    }

    // Verify password
    if (!verifyPassword(password, user.password_hash)) {
      console.log('[v0] Password verification failed for:', email)
      
      // Log failed attempt
      await supabase.from('user_activity_logs').insert([
        {
          user_id: user.id,
          action: 'login_failed',
          description: 'Failed login attempt',
          metadata: { email: email.toLowerCase() },
        },
      ]).catch((err) => console.log('[v0] Error logging failed login:', err))

      return {
        success: false,
        message: 'Invalid email or password',
        errors: { password: 'Password is incorrect' },
      }
    }

    // Update last login
    const now = new Date().toISOString()
    await supabase
      .from('auth_users')
      .update({
        last_login_at: now,
        login_count: (user.login_count || 0) + 1,
      })
      .eq('id', user.id)
      .catch((err) => console.log('[v0] Error updating last login:', err))

    // Log successful login
    await supabase.from('user_activity_logs').insert([
      {
        user_id: user.id,
        action: 'login_success',
        description: 'User logged in successfully',
        metadata: { email: email.toLowerCase() },
      },
    ]).catch((err) => console.log('[v0] Error logging login:', err))

    // Create session token
    const token = `session_${crypto.randomBytes(16).toString('hex')}`
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    // Store session
    await supabase.from('user_sessions').insert([
      {
        user_id: user.id,
        session_token: token,
        expires_at: expiresAt,
        is_active: true,
      },
    ]).catch((err) => console.log('[v0] Error creating session:', err))

    console.log('[v0] Login successful for:', email)

    return {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role as 'admin' | 'responder' | 'user',
        isVerified: user.email_verified,
        createdAt: user.created_at,
        lastLogin: user.last_login_at,
      },
      token,
    }
  } catch (error) {
    console.error('[v0] Login error:', error)
    return {
      success: false,
      message: 'An unexpected error occurred',
      errors: { form: 'Server error' },
    }
  }
}

/**
 * Verify session token
 */
export async function verifySessionToken(token: string): Promise<AuthUser | null> {
  try {
    const { data: session, error } = await supabase
      .from('sessions')
      .select('user_id, expires_at')
      .eq('token', token)
      .single()

    if (error || !session) {
      return null
    }

    // Check if session expired
    if (new Date(session.expires_at) < new Date()) {
      await supabase.from('sessions').delete().eq('token', token)
      return null
    }

    // Get user data
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user_id)
      .single()

    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.is_verified,
      createdAt: user.created_at,
      lastLogin: user.last_login,
    }
  } catch (error) {
    console.error('[v0] Session verification error:', error)
    return null
  }
}

/**
 * Logout user
 */
export async function logoutUser(token: string): Promise<void> {
  try {
    const { data: session } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('token', token)
      .single()

    if (session) {
      await supabase.from('auth_logs').insert([
        {
          user_id: session.user_id,
          event_type: 'logout',
          status: 'success',
          ip_address: 'unknown',
          user_agent: 'unknown',
          timestamp: new Date().toISOString(),
        },
      ])
    }

    await supabase.from('sessions').delete().eq('token', token)
  } catch (error) {
    console.error('[v0] Logout error:', error)
  }
}
