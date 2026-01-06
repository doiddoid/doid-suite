-- ============================================
-- DOID Suite - Password Reset Migration
-- Sistema di reset password custom (via GHL)
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TABELLA password_resets
-- Token per reset password
-- ============================================

CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,

    -- Stato
    used_at TIMESTAMP WITH TIME ZONE,

    -- Scadenza (1 ora)
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indici
    CONSTRAINT password_resets_token_unique UNIQUE (token)
);

-- Indici per lookup veloci
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at);

-- ============================================
-- 2. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

-- Service role full access
DROP POLICY IF EXISTS "Service role full access" ON password_resets;
CREATE POLICY "Service role full access" ON password_resets
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- 3. CLEANUP automatico token scaduti
-- ============================================

-- Funzione per pulire token scaduti
CREATE OR REPLACE FUNCTION cleanup_expired_password_resets()
RETURNS void AS $$
BEGIN
    DELETE FROM password_resets
    WHERE expires_at < NOW()
    AND used_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FINE MIGRAZIONE
-- ============================================
