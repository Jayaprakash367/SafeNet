# Setting Up Row Level Security (RLS) Policies

Your SafeNet application is experiencing authentication errors because the Supabase database needs Row Level Security policies to be enabled. Without these policies, the database blocks all insert/select operations.

## Why This Matters

Row Level Security (RLS) is a Supabase security feature that controls access to data at the row level. By default, when RLS is enabled on a table, **all access is denied** until you create specific policies that allow operations.

The error you're seeing:
```
SyntaxError: Unexpected token 'I', "Invalid re"... is not valid JSON
```

This happens because Supabase is returning an HTML error page (instead of JSON) when RLS policies reject the request.

## How to Fix It

### Step 1: Go to Supabase Console

1. Open [https://supabase.com](https://supabase.com)
2. Login to your account
3. Select your SafeNet project

### Step 2: Open SQL Editor

1. Click on "SQL Editor" in the left sidebar
2. Click "New Query"

### Step 3: Copy and Execute the RLS Setup Script

Copy the entire contents of `/scripts/enable_rls_policies.sql` and paste it into the SQL Editor.

Then click "Run" to execute all the policies at once.

### Step 4: Verify the Policies Were Created

After execution, you should see:
```
✓ 19 policies created
```

If you see errors, they are likely policy conflicts. That's okay - it means policies already exist from a previous run.

## What These Policies Do

The RLS policies enable:

- **Public Signup**: Anyone can insert new user records into `auth_users`
- **Login Access**: Users can query their own profile to verify passwords
- **Session Management**: Users can create and manage their login sessions
- **Activity Logging**: The system can log all authentication events
- **Error Tracking**: Authentication history is properly recorded

## Testing After Setup

Once the RLS policies are enabled:

1. Go to `/login` on your SafeNet app
2. Click "Create Account"
3. Fill in:
   - Name: Your full name
   - Email: Your real email address
   - Password: Your secure password
   - Confirm Password: Must match password field
4. Click "Create Account"
5. You should see a success message
6. You can now login with your credentials

## Troubleshooting

### If signup still fails:

1. Check that the SQL executed without errors
2. Go to Supabase Console → Tables → `auth_users`
3. Click on "Policies" tab
4. You should see policies like:
   - "Allow public signup"
   - "Allow users to view own profile"
   - "Allow users to update own profile"

### If you see "SyntaxError: Unexpected token 'I'":

This means RLS policies are still missing or not configured correctly. Run the setup script again.

### If you see "Invalid credentials":

This is a normal error when:
- Email doesn't exist (not yet signed up)
- Password is incorrect

First, make sure you can sign up successfully, then try logging in.

## Support

If you continue to have issues:

1. Check that you're using the Supabase console SQL Editor correctly
2. Make sure no errors appeared when executing the script
3. Verify all 7 tables have the policies enabled
4. Clear your browser cache and try again

The RLS policies are a one-time setup required for the database to work properly with authentication.
