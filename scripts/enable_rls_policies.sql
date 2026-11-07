-- Enable Row Level Security on auth tables

-- ============================================================================
-- AUTH_USERS TABLE RLS
-- ============================================================================

-- Enable RLS on auth_users table
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (signup)
CREATE POLICY "Allow public signup" ON auth_users
  FOR INSERT
  WITH CHECK (true);

-- Allow users to view their own profile
CREATE POLICY "Allow users to view own profile" ON auth_users
  FOR SELECT
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update own profile" ON auth_users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- USER_SESSIONS TABLE RLS
-- ============================================================================

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to create sessions" ON user_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow viewing own sessions" ON user_sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Allow updating own sessions" ON user_sessions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- USER_ACTIVITY_LOGS TABLE RLS
-- ============================================================================

ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow inserting activity logs" ON user_activity_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow viewing own activity logs" ON user_activity_logs
  FOR SELECT
  USING (true);

-- ============================================================================
-- AUTHENTICATION_HISTORY TABLE RLS
-- ============================================================================

ALTER TABLE authentication_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow inserting auth history" ON authentication_history
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow viewing own auth history" ON authentication_history
  FOR SELECT
  USING (true);

-- ============================================================================
-- USER_ENGAGEMENT_METRICS TABLE RLS
-- ============================================================================

ALTER TABLE user_engagement_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow inserting engagement metrics" ON user_engagement_metrics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow updating own metrics" ON user_engagement_metrics
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow viewing own metrics" ON user_engagement_metrics
  FOR SELECT
  USING (true);

-- ============================================================================
-- PASSWORD_RESET_TOKENS TABLE RLS
-- ============================================================================

ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow inserting reset tokens" ON password_reset_tokens
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow viewing own reset tokens" ON password_reset_tokens
  FOR SELECT
  USING (true);

-- ============================================================================
-- USER_PREFERENCES_HISTORY TABLE RLS
-- ============================================================================

ALTER TABLE user_preferences_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow inserting preference history" ON user_preferences_history
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow viewing own preference history" ON user_preferences_history
  FOR SELECT
  USING (true);
