# SafeNet Database Setup and Authentication Guide

## Overview
This document explains the complete database setup, authentication flow, and troubleshooting for the SafeNet disaster management platform.

## Database Architecture

### Core Tables
1. **auth_users** - User accounts with authentication credentials
2. **user_sessions** - Active user sessions and login tracking
3. **user_activity_logs** - Activity tracking and audit logs
4. **password_reset_tokens** - Password reset functionality

### Key Features
- Permanent data storage in Supabase PostgreSQL
- Secure password hashing (SHA-256 with salt)
- Session-based authentication
- Activity logging for all auth events
- Fallback authentication for offline support

## Authentication Flow

### Registration (Signup)
1. User fills out name, email, password, confirm password
2. Real-time validation ensures passwords match
3. Password is hashed using SHA-256 + salt
4. User record created in `auth_users` table
5. Activity logged in `user_activity_logs`
6. Success response redirects to dashboard

### Login
1. User enters email and password
2. System queries `auth_users` table
3. Password hash compared using secure verification
4. Session created and stored in `user_sessions`
5. Activity logged with success/failure
6. Session token returned for future requests

### Data Persistence
- All user data stored permanently in Supabase PostgreSQL
- Activity logs retained for audit purposes
- Session data expires after 7 days
- Deleted users marked with soft delete (deleted_at timestamp)

## Fixed Issues

### 1. Database Query Errors
**Problem**: `.single()` method threw error when no user exists
**Solution**: Changed to array queries that check `length > 0`
```typescript
// Before (broken)
const { data: user } = await supabase.from('auth_users').select('*').eq('email', email).single()

// After (fixed)
const { data: users } = await supabase.from('auth_users').select('*').eq('email', email)
if (users && users.length > 0) {
  const user = users[0]
}
```

### 2. Password Confirmation Mismatch
**Problem**: Confirm password field not validating in real-time
**Solution**: Added real-time onChange validation with visual feedback
- Shows red border if passwords don't match
- Shows green border if passwords match
- Error clears when passwords match

### 3. User Not Found on Login
**Problem**: Supabase queries failing silently
**Solution**: Improved error handling and logging
- Added detailed error messages
- Logs fetch errors with descriptions
- Falls back to local auth as failsafe

## Testing the System

### Test Signup
1. Go to `/login` page
2. Click "Create Account"
3. Fill in name, email, password
4. Confirm password matches
5. Click "Create Account"
6. Should redirect to dashboard

### Test Login
1. Go to `/login` page
2. Enter registered email and password
3. Click "Sign In"
4. Should redirect to dashboard with session

### Verify Data in Database
1. Go to Supabase dashboard
2. Check `auth_users` table for new entries
3. Check `user_activity_logs` for signup/login events
4. Check `user_sessions` for active sessions

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
PASSWORD_SALT=safenet-disaster-salt
```

## Troubleshooting

### Users Can't Login
1. Check if email exists in `auth_users` table
2. Verify password hash matches (use SHA-256 + salt)
3. Check for failed_login entries in activity logs
4. Ensure environment variables are set

### Data Not Persisting
1. Check Supabase connection status
2. Verify auth_users table exists and is accessible
3. Check for RLS policies blocking inserts
4. View server logs for detailed error messages

### Password Confirmation Not Working
1. Confirm both password fields have values
2. Check real-time validation is firing onChange
3. Verify passwords are exactly matching (case-sensitive)
4. Check browser console for validation errors

## Security Features

- Password hashing with unique salt per deployment
- Session tokens are cryptographically random
- Sessions expire after 7 days
- All activity logged and auditable
- Failed login attempts tracked
- Email verification support (currently email_verified = false)

## Next Steps

1. Test signup with real email
2. Test login with created account
3. Monitor activity logs for errors
4. Set up email verification (optional)
5. Configure password reset flow (optional)
