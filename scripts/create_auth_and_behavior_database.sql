-- SafeNet Authentication and User Behavior Tracking Database Schema
-- This script creates tables for user authentication and activity tracking

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- AUTHENTICATION TABLES
-- ============================================================================

-- Auth users table - extended from basic users table with authentication fields
CREATE TABLE IF NOT EXISTS auth_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    password_hash VARCHAR(255) NOT NULL,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'responder' CHECK (role IN ('admin', 'responder', 'operator', 'user')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification')),
    
    -- Profile information
    profile_picture_url TEXT,
    date_of_birth DATE,
    gender VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    
    -- Emergency information
    blood_group VARCHAR(10),
    allergies TEXT,
    medical_conditions TEXT,
    emergency_contact_1_name VARCHAR(255),
    emergency_contact_1_phone VARCHAR(20),
    emergency_contact_1_relationship VARCHAR(100),
    emergency_contact_2_name VARCHAR(255),
    emergency_contact_2_phone VARCHAR(20),
    emergency_contact_2_relationship VARCHAR(100),
    
    -- Preferences
    preferred_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "push": true}',
    
    -- Metadata
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- User sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    operating_system VARCHAR(100),
    location VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- USER BEHAVIOR AND ACTIVITY TRACKING TABLES
-- ============================================================================

-- User activity log table
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL CHECK (activity_type IN (
        'login', 'logout', 'signup', 'password_change', 'profile_update',
        'sos_alert', 'emergency_contact_update', 'app_install', 'app_uninstall',
        'location_share', 'alert_view', 'resource_search', 'contact_emergency_service',
        'message_sent', 'profile_view', 'settings_change', 'file_upload', 'failed_login'
    )),
    activity_description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type VARCHAR(50),
    location VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    metadata JSONB,
    status VARCHAR(50) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User engagement metrics table
CREATE TABLE IF NOT EXISTS user_engagement_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Session metrics
    session_count INTEGER DEFAULT 0,
    total_session_duration_seconds INTEGER DEFAULT 0,
    average_session_duration_seconds INTEGER DEFAULT 0,
    
    -- Feature usage
    sos_alerts_triggered INTEGER DEFAULT 0,
    alerts_viewed INTEGER DEFAULT 0,
    emergency_resources_searched INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    location_shares INTEGER DEFAULT 0,
    
    -- Interaction metrics
    features_used TEXT[],
    pages_visited TEXT[],
    buttons_clicked INTEGER DEFAULT 0,
    forms_completed INTEGER DEFAULT 0,
    
    -- Device info
    device_type VARCHAR(50),
    operating_system VARCHAR(100),
    app_version VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, date)
);

-- User authentication history table
CREATE TABLE IF NOT EXISTS authentication_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'successful_login', 'failed_login', 'password_change', 'password_reset',
        'email_verification', 'account_locked', 'account_unlocked', 'session_expired'
    )),
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type VARCHAR(50),
    location VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences history table (for audit trail)
CREATE TABLE IF NOT EXISTS user_preferences_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    changed_by VARCHAR(50),
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);
CREATE INDEX IF NOT EXISTS idx_auth_users_role ON auth_users(role);
CREATE INDEX IF NOT EXISTS idx_auth_users_status ON auth_users(status);
CREATE INDEX IF NOT EXISTS idx_auth_users_created_at ON auth_users(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_users_last_login_at ON auth_users(last_login_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_activity_type ON user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_ip_address ON user_activity_logs(ip_address);

CREATE INDEX IF NOT EXISTS idx_user_engagement_metrics_user_id ON user_engagement_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_engagement_metrics_date ON user_engagement_metrics(date);

CREATE INDEX IF NOT EXISTS idx_authentication_history_user_id ON authentication_history(user_id);
CREATE INDEX IF NOT EXISTS idx_authentication_history_event_type ON authentication_history(event_type);
CREATE INDEX IF NOT EXISTS idx_authentication_history_created_at ON authentication_history(created_at);

CREATE INDEX IF NOT EXISTS idx_user_preferences_history_user_id ON user_preferences_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_history_created_at ON user_preferences_history(created_at);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update auth_users updated_at
CREATE TRIGGER update_auth_users_updated_at
BEFORE UPDATE ON auth_users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update user_sessions updated_at
CREATE TRIGGER update_user_sessions_updated_at
BEFORE UPDATE ON user_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update user_engagement_metrics updated_at
CREATE TRIGGER update_user_engagement_metrics_updated_at
BEFORE UPDATE ON user_engagement_metrics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR ANALYTICS AND REPORTING
-- ============================================================================

-- Active users view
CREATE OR REPLACE VIEW active_users AS
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    last_login_at,
    last_activity_at,
    created_at
FROM auth_users
WHERE status = 'active'
AND deleted_at IS NULL
AND last_activity_at > NOW() - INTERVAL '30 days';

-- User activity summary view
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    user_id,
    DATE(created_at) as activity_date,
    COUNT(*) as total_activities,
    COUNT(DISTINCT activity_type) as unique_activities,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_activities,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_activities,
    COUNT(DISTINCT ip_address) as unique_ips,
    COUNT(DISTINCT device_type) as unique_devices,
    MIN(created_at) as first_activity,
    MAX(created_at) as last_activity
FROM user_activity_logs
GROUP BY user_id, DATE(created_at);

-- Failed login attempts view
CREATE OR REPLACE VIEW failed_login_attempts_summary AS
SELECT 
    user_id,
    ip_address,
    COUNT(*) as attempt_count,
    MAX(created_at) as last_attempt,
    array_agg(DISTINCT device_type) as device_types
FROM authentication_history
WHERE event_type = 'failed_login'
AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id, ip_address;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert demo users for testing (passwords should be hashed in production)
-- These are demo accounts only and should be deleted or disabled in production
INSERT INTO auth_users (
    email, first_name, last_name, password_hash, role, status, 
    emergency_contact_1_phone, blood_group, email_verified, email_verified_at
) VALUES (
    'demo@safenet.gov',
    'Demo',
    'Responder',
    crypt('password123', gen_salt('bf')),
    'responder',
    'active',
    '8825516088',
    'O+',
    TRUE,
    NOW()
), (
    'admin@safenet.gov',
    'Admin',
    'User',
    crypt('admin123', gen_salt('bf')),
    'admin',
    'active',
    '8825516088',
    'A+',
    TRUE,
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
