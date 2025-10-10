-- ============================================================================
-- JarvisDaily Authentication System - Supabase Schema
-- ============================================================================
-- This schema extends Clerk authentication with advisor-specific data
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: users
-- Extends Clerk users with application-specific data
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  plan TEXT CHECK (plan IN ('trial', 'solo', 'professional', 'enterprise')) DEFAULT 'trial',
  subscription_status TEXT CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired')) DEFAULT 'trial',
  trial_ends_at TIMESTAMP DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- ============================================================================
-- TABLE: advisor_profiles
-- Stores advisor-specific data collected during onboarding
-- ============================================================================
CREATE TABLE IF NOT EXISTS advisor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT,
  arn TEXT, -- ARN (Advisor Registration Number for SEBI compliance)
  advisor_code TEXT,
  customer_segments TEXT[], -- Array: ['hni', 'salaried', 'business', 'retirees', 'young']
  phone_verified BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_advisor_profiles_user_id ON advisor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_advisor_profiles_arn ON advisor_profiles(arn);
CREATE INDEX IF NOT EXISTS idx_advisor_profiles_onboarding_completed ON advisor_profiles(onboarding_completed);

-- ============================================================================
-- TRIGGER: Auto-update updated_at column
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to advisor_profiles table
DROP TRIGGER IF EXISTS update_advisor_profiles_updated_at ON advisor_profiles;
CREATE TRIGGER update_advisor_profiles_updated_at
  BEFORE UPDATE ON advisor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS for security (users can only access their own data)
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY users_select_own
  ON users
  FOR SELECT
  USING (clerk_user_id = current_setting('app.clerk_user_id', TRUE));

-- Policy: Users can update their own data
CREATE POLICY users_update_own
  ON users
  FOR UPDATE
  USING (clerk_user_id = current_setting('app.clerk_user_id', TRUE));

-- Policy: Service role can do everything (for server-side operations)
CREATE POLICY users_service_role
  ON users
  FOR ALL
  USING (current_setting('role', TRUE) = 'service_role');

-- Policy: Users can read their own advisor profile
CREATE POLICY advisor_profiles_select_own
  ON advisor_profiles
  FOR SELECT
  USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('app.clerk_user_id', TRUE)
  ));

-- Policy: Users can update their own advisor profile
CREATE POLICY advisor_profiles_update_own
  ON advisor_profiles
  FOR UPDATE
  USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('app.clerk_user_id', TRUE)
  ));

-- Policy: Service role can do everything
CREATE POLICY advisor_profiles_service_role
  ON advisor_profiles
  FOR ALL
  USING (current_setting('role', TRUE) = 'service_role');

-- ============================================================================
-- HELPER FUNCTION: Get user by Clerk ID
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_by_clerk_id(clerk_id TEXT)
RETURNS TABLE (
  id UUID,
  clerk_user_id TEXT,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  plan TEXT,
  subscription_status TEXT,
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.clerk_user_id,
    u.email,
    u.full_name,
    u.phone,
    u.plan,
    u.subscription_status,
    u.trial_ends_at,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE u.clerk_user_id = clerk_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTION: Get complete user profile (user + advisor data)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_complete_profile(clerk_id TEXT)
RETURNS TABLE (
  user_id UUID,
  clerk_user_id TEXT,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  plan TEXT,
  subscription_status TEXT,
  business_name TEXT,
  arn TEXT,
  advisor_code TEXT,
  customer_segments TEXT[],
  onboarding_completed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.clerk_user_id,
    u.email,
    u.full_name,
    u.phone,
    u.plan,
    u.subscription_status,
    ap.business_name,
    ap.arn,
    ap.advisor_code,
    ap.customer_segments,
    ap.onboarding_completed
  FROM users u
  LEFT JOIN advisor_profiles ap ON u.id = ap.user_id
  WHERE u.clerk_user_id = clerk_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify schema creation
-- ============================================================================

-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'advisor_profiles');

-- Check indexes
SELECT indexname
FROM pg_indexes
WHERE tablename IN ('users', 'advisor_profiles');

-- Check triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('users', 'advisor_profiles');

-- ============================================================================
-- SAMPLE DATA (for testing - REMOVE in production)
-- ============================================================================

-- Uncomment to insert sample data for testing
/*
INSERT INTO users (clerk_user_id, email, full_name, phone, plan) VALUES
  ('user_test123', 'test@example.com', 'Test Advisor', '+919876543210', 'trial');

INSERT INTO advisor_profiles (user_id, business_name, arn, customer_segments, onboarding_completed)
SELECT id, 'Test Financial Services', 'ARN-12345', ARRAY['hni', 'salaried'], TRUE
FROM users WHERE clerk_user_id = 'user_test123';
*/

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
