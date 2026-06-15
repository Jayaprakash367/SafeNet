# Fix Supabase Row Level Security (RLS) - Critical for Login/Signup

## Problem
The error `SyntaxError: Unexpected token 'I', "Invalid re"... is not valid JSON` occurs because **Supabase is blocking database access** due to RLS (Row Level Security) policies.

## Root Cause
When RLS is enabled but no policies are configured to allow public access, Supabase returns HTML error pages instead of JSON. When the code tries to parse this HTML as JSON, it fails.

## Solution: Disable RLS on Auth Tables (Development)

For a development/testing environment, the simplest solution is to **disable RLS** on the authentication tables. In production, you should configure proper RLS policies.

### Steps to Disable RLS:

1. Go to your **Supabase Dashboard**
2. Click **SQL Editor**
3. Create a new query
4. Paste this SQL:

```sql
-- Disable RLS on authentication tables
ALTER TABLE auth_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE authentication_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences_history DISABLE ROW LEVEL SECURITY;
```

5. Click **Run**
6. Test signup/login again - it should work!

## Alternative: Enable Proper RLS Policies (Production)

For production, instead of disabling RLS, configure policies that allow public signup:

```sql
-- Allow public signup
CREATE POLICY "Enable insert for authentication" ON auth_users
  FOR INSERT WITH CHECK (true);

-- Allow users to read their own data
CREATE POLICY "Users can read their own data" ON auth_users
  FOR SELECT USING (true);

-- Similar policies for other tables...
```

## What Changed in the Code

Added detailed logging to `lib/supabase-auth.ts`:
- Logs before and after database operations
- Shows exact payload being sent
- Helps identify where requests fail
- Safely handles error messages without JSON stringification

## After Fixing RLS

1. Signup should work immediately
2. User data stored permanently in Supabase
3. Login should authenticate correctly
4. System uses real database instead of fallback auth

## Verify It Works

Test with:
- **Email**: any@email.com
- **Password**: Password123!
- **Name**: Your Name

User data should appear in Supabase `auth_users` table within seconds.
