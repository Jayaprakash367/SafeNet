-- Seed demo users for testing
-- Script to insert test users into the auth_users table

-- Hash function simulation: SHA-256 hash of 'password123' with salt
-- You can use: SELECT encode(digest('password123safenet-disaster-salt', 'sha256'), 'hex')
-- This produces: a1b2c3d4e5f6... (actual hash would be computed)

-- For demo purposes, we'll use a common test hash
INSERT INTO auth_users (
  email,
  first_name,
  last_name,
  password_hash,
  role,
  status,
  email_verified,
  phone,
  timezone,
  preferred_language,
  created_at,
  updated_at,
  last_login_at
)
VALUES
  (
    'demo@safenet.gov',
    'Demo',
    'Responder',
    '8d969eef6ecad3c29a3a873fba1e83da61a75a8f50e6cfbae8f2e2a3a4f3c5d7e',
    'responder',
    'active',
    TRUE,
    '+1-202-555-0123',
    'America/New_York',
    'en',
    NOW(),
    NOW(),
    NOW()
  ),
  (
    'admin@safenet.gov',
    'Admin',
    'User',
    '8d969eef6ecad3c29a3a873fba1e83da61a75a8f50e6cfbae8f2e2a3a4f3c5d7e',
    'admin',
    'active',
    TRUE,
    '+1-202-555-0124',
    'America/New_York',
    'en',
    NOW(),
    NOW(),
    NOW()
  )
ON CONFLICT (email) DO NOTHING;

-- Verify the users were created
SELECT id, email, first_name, last_name, role, status FROM auth_users ORDER BY created_at DESC LIMIT 5;
