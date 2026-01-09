-- DOID Suite - Profiles Table Migration
-- Run this in Supabase SQL Editor
-- Supports user migration tracking from legacy systems

-- ============================================
-- PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    migration_status VARCHAR(20) DEFAULT NULL, -- 'pending', 'confirmed', NULL (native users)
    first_login_after_migration TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    migrated_from VARCHAR(50) DEFAULT NULL, -- 'smart_review', 'smart_page', etc.
    password_changed BOOLEAN DEFAULT FALSE, -- TRUE dopo che l'utente migrato ha cambiato password
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookup of pending migrations
CREATE INDEX IF NOT EXISTS idx_profiles_migration_status ON profiles(migration_status) WHERE migration_status IS NOT NULL;

-- Updated_at trigger
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

-- Service role can insert/update any profile (for migration scripts)
CREATE POLICY "Service role full access"
    ON profiles FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- HELPER FUNCTION
-- ============================================

-- Function to check if user requires password change after migration
CREATE OR REPLACE FUNCTION check_migration_status(p_user_id UUID)
RETURNS TABLE (
    requires_password_change BOOLEAN,
    migration_status VARCHAR,
    migrated_from VARCHAR,
    password_changed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Richiede cambio password se: migrato E password non ancora cambiata
        CASE WHEN p.migration_status IS NOT NULL AND p.password_changed = FALSE THEN TRUE ELSE FALSE END,
        p.migration_status,
        p.migrated_from,
        p.password_changed
    FROM profiles p
    WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
