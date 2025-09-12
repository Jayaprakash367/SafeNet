-- SafeNet Emergency SOS Database Schema
-- This script creates the necessary tables for the SafeNet application

-- Users table for storing user profiles and emergency information
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    blood_group VARCHAR(10),
    medical_conditions TEXT[],
    allergies TEXT,
    medications TEXT,
    emergency_contact_1 VARCHAR(20),
    emergency_contact_2 VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SOS alerts table for tracking emergency incidents
CREATE TABLE IF NOT EXISTS sos_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    alert_type VARCHAR(50) NOT NULL,
    urgency VARCHAR(20) NOT NULL CHECK (urgency IN ('critical', 'high', 'medium', 'low')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'processing', 'dispatched', 'resolved', 'cancelled')),
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lng DECIMAL(11, 8) NOT NULL,
    location_accuracy DECIMAL(8, 2),
    additional_info TEXT,
    voice_recording_url TEXT,
    ai_classification JSONB,
    estimated_response_time INTEGER, -- in minutes
    assigned_units TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Voice recordings table for AI analysis
CREATE TABLE IF NOT EXISTS voice_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sos_alert_id UUID REFERENCES sos_alerts(id),
    user_id UUID REFERENCES users(id),
    audio_data BYTEA, -- Store audio file data
    duration INTEGER NOT NULL, -- in seconds
    ai_analysis JSONB, -- Store AI analysis results
    classification VARCHAR(20) CHECK (classification IN ('urgent', 'moderate', 'false_alarm')),
    confidence_score DECIMAL(5, 2),
    keywords TEXT[],
    emotional_state VARCHAR(20),
    background_noise VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    relationship VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS messages table for tracking communications
CREATE TABLE IF NOT EXISTS sms_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sos_alert_id UUID REFERENCES sos_alerts(id),
    user_id UUID REFERENCES users(id),
    recipient_phone VARCHAR(20) NOT NULL,
    message_content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('sos', 'update', 'test')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency resources table
CREATE TABLE IF NOT EXISTS emergency_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('hospital', 'police', 'fire', 'shelter', 'pharmacy', 'gas_station')),
    address TEXT NOT NULL,
    phone VARCHAR(20),
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lng DECIMAL(11, 8) NOT NULL,
    is_open BOOLEAN DEFAULT TRUE,
    specialties TEXT[],
    capacity INTEGER,
    rating DECIMAL(3, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disaster alerts table
CREATE TABLE IF NOT EXISTS disaster_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('weather', 'earthquake', 'flood', 'fire', 'storm', 'heat', 'other')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe', 'extreme')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    area VARCHAR(255) NOT NULL,
    source VARCHAR(255) NOT NULL,
    action_required BOOLEAN DEFAULT FALSE,
    instructions TEXT[],
    affected_radius INTEGER, -- in kilometers
    center_lat DECIMAL(10, 8) NOT NULL,
    center_lng DECIMAL(11, 8) NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_emergency_contacts ON users(emergency_contact_1, emergency_contact_2);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_user_id ON sos_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_status ON sos_alerts(status);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_location ON sos_alerts(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_created_at ON sos_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_recordings_sos_alert_id ON voice_recordings(sos_alert_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_sos_alert_id ON sms_messages(sos_alert_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_status ON sms_messages(status);
CREATE INDEX IF NOT EXISTS idx_emergency_resources_type ON emergency_resources(type);
CREATE INDEX IF NOT EXISTS idx_emergency_resources_location ON emergency_resources(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_disaster_alerts_type ON disaster_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_disaster_alerts_severity ON disaster_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_disaster_alerts_location ON disaster_alerts(center_lat, center_lng);
CREATE INDEX IF NOT EXISTS idx_disaster_alerts_expires_at ON disaster_alerts(expires_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_resources_updated_at BEFORE UPDATE ON emergency_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample emergency resources data
INSERT INTO emergency_resources (name, type, address, phone, location_lat, location_lng, specialties, capacity, rating) VALUES
('City General Hospital', 'hospital', '123 Medical Center Dr, New York, NY 10001', '+1-555-0123', 40.7150, -74.0080, ARRAY['Emergency', 'Trauma', 'Cardiology'], 450, 4.2),
('Metropolitan Medical Center', 'hospital', '456 Health Ave, New York, NY 10002', '+1-555-0124', 40.7200, -74.0050, ARRAY['Emergency', 'Surgery', 'Maternity'], 320, 4.5),
('Police Precinct 12', 'police', '789 Safety St, New York, NY 10003', '+1-555-0456', 40.7140, -74.0070, NULL, NULL, 4.0),
('Fire Station #7', 'fire', '321 Rescue Ave, New York, NY 10004', '+1-555-0789', 40.7160, -74.0090, NULL, NULL, 4.8),
('Community Emergency Shelter', 'shelter', '654 Safe Haven Blvd, New York, NY 10005', '+1-555-0321', 40.7100, -74.0100, NULL, 200, 3.9),
('24/7 Emergency Pharmacy', 'pharmacy', '987 Health St, New York, NY 10006', '+1-555-0654', 40.7135, -74.0065, ARRAY['Emergency Medications', 'First Aid Supplies'], NULL, 4.1);

-- Create a view for active SOS alerts with user information
CREATE OR REPLACE VIEW active_sos_alerts AS
SELECT 
    sa.id,
    sa.alert_type,
    sa.urgency,
    sa.status,
    sa.location_lat,
    sa.location_lng,
    sa.created_at,
    u.name as user_name,
    u.age,
    u.blood_group,
    u.medical_conditions,
    u.emergency_contact_1,
    u.emergency_contact_2
FROM sos_alerts sa
JOIN users u ON sa.user_id = u.id
WHERE sa.status IN ('active', 'processing', 'dispatched');

-- Create a view for current disaster alerts
CREATE OR REPLACE VIEW current_disaster_alerts AS
SELECT *
FROM disaster_alerts
WHERE expires_at > NOW()
ORDER BY severity DESC, issued_at DESC;

COMMIT;
