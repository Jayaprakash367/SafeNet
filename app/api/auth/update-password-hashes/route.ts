import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Initialize Supabase admin client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase credentials not found')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

function hashPassword(password: string): string {
  return crypto
    .createHash('sha256')
    .update(password + 'safenet-disaster-salt')
    .digest('hex')
}

export async function POST() {
  try {
    console.log('[v0] Updating demo user password hashes...')

    // Hash for 'password123'
    const demoPasswordHash = hashPassword('password123')
    // Hash for 'admin123'
    const adminPasswordHash = hashPassword('admin123')

    console.log('[v0] Demo password hash:', demoPasswordHash)
    console.log('[v0] Admin password hash:', adminPasswordHash)

    // Update demo@safenet.gov
    const { error: demoError } = await supabase
      .from('auth_users')
      .update({ password_hash: demoPasswordHash })
      .eq('email', 'demo@safenet.gov')

    if (demoError) {
      console.error('[v0] Error updating demo user:', demoError)
      return NextResponse.json({ error: 'Failed to update demo user', details: demoError }, { status: 500 })
    }

    // Update admin@safenet.gov
    const { error: adminError } = await supabase
      .from('auth_users')
      .update({ password_hash: adminPasswordHash })
      .eq('email', 'admin@safenet.gov')

    if (adminError) {
      console.error('[v0] Error updating admin user:', adminError)
      return NextResponse.json({ error: 'Failed to update admin user', details: adminError }, { status: 500 })
    }

    console.log('[v0] Password hashes updated successfully')

    return NextResponse.json({
      success: true,
      message: 'Password hashes updated successfully',
      hashes: {
        demo: demoPasswordHash,
        admin: adminPasswordHash,
      },
    })
  } catch (error) {
    console.error('[v0] Error updating password hashes:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}
