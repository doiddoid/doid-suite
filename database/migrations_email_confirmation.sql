-- ============================================
-- DOID Suite - Email Confirmation Migration
-- Sistema di conferma email custom (via GHL)
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TABELLA email_confirmations
-- Token per conferma email
-- ============================================

CREATE TABLE IF NOT EXISTS email_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,

    -- Stato
    confirmed_at TIMESTAMP WITH TIME ZONE,

    -- Scadenza (24 ore)
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indici
    CONSTRAINT email_confirmations_token_unique UNIQUE (token)
);

-- Indici per lookup veloci
CREATE INDEX IF NOT EXISTS idx_email_confirmations_user ON email_confirmations(user_id);
CREATE INDEX IF NOT EXISTS idx_email_confirmations_token ON email_confirmations(token);
CREATE INDEX IF NOT EXISTS idx_email_confirmations_expires ON email_confirmations(expires_at);

-- ============================================
-- 2. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE email_confirmations ENABLE ROW LEVEL SECURITY;

-- Service role full access
DROP POLICY IF EXISTS "Service role full access" ON email_confirmations;
CREATE POLICY "Service role full access" ON email_confirmations
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- 3. CLEANUP automatico token scaduti
-- ============================================

-- Funzione per pulire token scaduti
CREATE OR REPLACE FUNCTION cleanup_expired_email_confirmations()
RETURNS void AS $$
BEGIN
    DELETE FROM email_confirmations
    WHERE expires_at < NOW()
    AND confirmed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FINE MIGRAZIONE
-- ============================================
