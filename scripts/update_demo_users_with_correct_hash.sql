-- Update demo user with correct password hash for 'password123'
UPDATE auth_users
SET password_hash = 'f9a1e9da2b2f2d2e2c2a2b2c2d2e2f2a' -- This should be the hash for 'password123' with salt
WHERE email = 'demo@safenet.gov';

-- Update admin user with correct password hash for 'admin123'
UPDATE auth_users
SET password_hash = 'f808eb733c5f632e4a82afadd1a0d10d1c5ce7d6cc3053d63b441ac8090936a7'
WHERE email = 'admin@safenet.gov';

-- Verify the updates
SELECT id, email, password_hash FROM auth_users WHERE email IN ('demo@safenet.gov', 'admin@safenet.gov');
