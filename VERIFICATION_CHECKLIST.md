# SafeNet Authentication System - Verification Checklist

## Pre-Testing Setup
- [ ] Verify Supabase connection is active
- [ ] Check all environment variables are set
- [ ] Confirm database tables exist (auth_users, user_sessions, user_activity_logs)
- [ ] Clear browser cookies and localStorage
- [ ] Open browser dev tools console

## Registration (Signup) Testing

### Form Validation
- [ ] Name field shows error if empty
- [ ] Name field shows error if < 2 characters
- [ ] Email field shows error if empty
- [ ] Email field shows error with invalid format
- [ ] Password field shows error if empty
- [ ] Password field shows error if < 6 characters
- [ ] Confirm password field shows error if empty
- [ ] Confirm password shows red border when doesn't match
- [ ] Confirm password shows green border when matches
- [ ] Error messages disappear when field becomes valid

### Successful Registration
- [ ] Can submit form with valid data
- [ ] Loading spinner appears during submission
- [ ] Success message displays: "Account created successfully!"
- [ ] Redirects to dashboard after 1.5 seconds
- [ ] Browser console shows: `[v0] Attempting Supabase signup for: [email]`

### Database Verification (Registration)
- [ ] New user appears in `auth_users` table
- [ ] User email is lowercase
- [ ] User first_name populated correctly
- [ ] User last_name populated correctly
- [ ] password_hash stored (40 character hex string)
- [ ] role is 'responder'
- [ ] status is 'active'
- [ ] email_verified is false
- [ ] created_at has current timestamp

### Activity Logging (Registration)
- [ ] Entry in `user_activity_logs` with:
  - [ ] user_id matches new user
  - [ ] activity_type = 'signup'
  - [ ] status = 'success'
  - [ ] activity_description present

## Login Testing

### With Valid Credentials
- [ ] Enter registered email and password
- [ ] Loading spinner appears
- [ ] Console shows: `[v0] Attempting Supabase login for: [email]`
- [ ] Redirects to dashboard
- [ ] Success message: "Login successful!"
- [ ] Session cookie set (check Application tab)

### With Invalid Email
- [ ] Enter non-registered email
- [ ] Password field can be anything
- [ ] Submit form
- [ ] Error message: "Invalid email or password"
- [ ] Console shows: `[v0] User not found: [email]`
- [ ] Does NOT redirect

### With Invalid Password
- [ ] Enter registered email
- [ ] Enter wrong password
- [ ] Submit form
- [ ] Error message: "Invalid email or password"
- [ ] Console shows: `[v0] Password verification failed for: [email]`
- [ ] Does NOT redirect

### With Empty Fields
- [ ] Leave email empty
- [ ] Submit form
- [ ] Error: "Email is required"
- [ ] Leave password empty
- [ ] Submit form
- [ ] Error: "Password is required"

### Database Verification (Login)
- [ ] Entry in `user_sessions`:
  - [ ] user_id matches logged-in user
  - [ ] session_token present (40+ char)
  - [ ] is_active = true
  - [ ] expires_at is 7 days from now
  - [ ] created_at is current time

### Activity Logging (Login)
- [ ] Entry in `user_activity_logs` with:
  - [ ] user_id matches logged-in user
  - [ ] activity_type = 'login'
  - [ ] status = 'success'

### User Metadata Updates (Login)
- [ ] User's last_login_at updated to current time
- [ ] User's login_count incremented
- [ ] User's last_activity_at updated

## Edge Cases & Error Handling

### Duplicate Email Registration
- [ ] Try registering with existing email
- [ ] Error: "This email is already in use"
- [ ] Form does NOT submit
- [ ] No new entry in database

### Password Mismatch on Signup
- [ ] Type password "Test123"
- [ ] Type confirm "Test12" (not matching)
- [ ] Confirm field shows red border
- [ ] Error message appears: "Passwords do not match"
- [ ] Submit button disabled or error shown
- [ ] Fix confirm password to match
- [ ] Border turns green
- [ ] Error message disappears
- [ ] Can now submit

### Failed Database Connection
- [ ] Disable network briefly
- [ ] Try to login
- [ ] Should fall back to local auth
- [ ] Error message is helpful
- [ ] Console shows: `[v0] Supabase unavailable, using fallback auth`
- [ ] Re-enable network
- [ ] Subsequent requests use Supabase again

## UI/UX Verification

### Visual Design
- [ ] Login page uses dark theme
- [ ] Colors match disaster management theme
- [ ] Form fields have proper spacing
- [ ] Error messages in red
- [ ] Success messages in appropriate color
- [ ] Buttons have hover effects
- [ ] Animations are smooth (no stuttering)

### Responsive Design
- [ ] Mobile (375px width): Form centered, readable
- [ ] Tablet (768px width): Proper spacing maintained
- [ ] Desktop (1920px width): Form doesn't stretch too wide
- [ ] Touch targets are 44px minimum height

### Accessibility
- [ ] Can tab through form fields
- [ ] Enter key submits form
- [ ] Error messages announced to screen readers
- [ ] Labels associated with inputs
- [ ] Color contrast meets WCAG AA

## Data Persistence Verification

### User Data Survives
- [ ] Create account, logout
- [ ] Login with same email/password
- [ ] Works correctly (proves data persisted)
- [ ] User data in database unchanged

### Session Data Cleanup
- [ ] Create session
- [ ] Check user_sessions table
- [ ] Wait and verify expires_at is in future
- [ ] After 7 days, session should be invalid

### Activity Log Retention
- [ ] Check user_activity_logs has multiple entries
- [ ] Signup and login events both present
- [ ] Timestamps accurate
- [ ] Metadata stored correctly

## Performance Verification

### Response Times
- [ ] Login completes in < 2 seconds
- [ ] Signup completes in < 2 seconds
- [ ] No timeout errors
- [ ] Loading spinners smooth and responsive

### Database Efficiency
- [ ] Large form with many fields still responds quickly
- [ ] Multiple logins don't slow system down
- [ ] Activity logs don't impact performance
- [ ] Queries use proper indexes

## Security Verification

### Password Security
- [ ] Passwords never logged or displayed
- [ ] password_hash is 64 characters (SHA-256)
- [ ] Same password produces same hash (deterministic)
- [ ] Different passwords produce different hashes

### Session Security
- [ ] Session tokens are long (40+ characters)
- [ ] Each session has unique token
- [ ] Session stored with HttpOnly cookie flag
- [ ] SameSite=Strict for CSRF protection

### Input Safety
- [ ] Special characters handled safely
- [ ] SQL injection attempts blocked
- [ ] XSS attempts handled
- [ ] Email verification prevents abuse

## Final Sign-Off

### All Tests Passed?
- [ ] Registration fully tested
- [ ] Login fully tested
- [ ] Database fully verified
- [ ] Error handling verified
- [ ] UI/UX meets standards
- [ ] Security verified

### Status
- [ ] Ready for production
- [ ] Needs more fixes
- [ ] Additional testing required

---

## Notes for QA Team

**Test Environment:**
- Browser: Chrome/Firefox (latest)
- Network: Test with normal and slow connections
- Database: Use staging Supabase project
- Time: 30-45 minutes for complete verification

**Common Issues to Watch:**
- Password confirmation border not changing color
- Session not creating after login
- Activity logs not appearing
- Fallback auth being used when Supabase works
- Console errors or warnings

**Success Criteria:**
- User can register with real email
- User can login immediately after signup
- All data persists in Supabase
- No console errors
- Smooth user experience
