-- Migration: Service Assignment
-- Tabella per mappare attività Suite a account esterni dei servizi (Smart Review, Smart Page, Menu Digitale, Display Suite)
-- Eseguire su Supabase SQL Editor

-- =====================================================
-- TABELLA: activity_service_accounts
-- Mappa le attività di Suite agli account ID dei servizi esterni
-- =====================================================

CREATE TABLE IF NOT EXISTS activity_service_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Riferimento all'attività Suite
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,

    -- Codice servizio (smart_review, smart_page, menu_digitale, display_suite)
    service_code VARCHAR(50) NOT NULL,

    -- ID dell'account nel servizio esterno (es. UUID dell'account in review.doid)
    external_account_id VARCHAR(255) NOT NULL,

    -- Quando è stato collegato
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Admin che ha effettuato il collegamento
    linked_by_admin_id UUID,

    -- Note opzionali
    notes TEXT,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Vincoli:
    -- 1. Ogni attività può avere un solo account per servizio
    CONSTRAINT uq_activity_service UNIQUE(activity_id, service_code),

    -- 2. Ogni account esterno può essere collegato a una sola attività per servizio
    CONSTRAINT uq_external_account UNIQUE(external_account_id, service_code)
);

-- Commenti tabella
COMMENT ON TABLE activity_service_accounts IS 'Mappatura tra attività DOID Suite e account esterni dei servizi';
COMMENT ON COLUMN activity_service_accounts.activity_id IS 'ID attività in DOID Suite';
COMMENT ON COLUMN activity_service_accounts.service_code IS 'Codice servizio: smart_review, smart_page, menu_digitale, display_suite';
COMMENT ON COLUMN activity_service_accounts.external_account_id IS 'ID account nel servizio esterno';

-- =====================================================
-- INDICI
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_asa_activity_id
    ON activity_service_accounts(activity_id);

CREATE INDEX IF NOT EXISTS idx_asa_service_code
    ON activity_service_accounts(service_code);

CREATE INDEX IF NOT EXISTS idx_asa_external_account_id
    ON activity_service_accounts(external_account_id);

CREATE INDEX IF NOT EXISTS idx_asa_linked_at
    ON activity_service_accounts(linked_at DESC);

-- =====================================================
-- TRIGGER per updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_activity_service_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_activity_service_accounts_updated_at
    ON activity_service_accounts;

CREATE TRIGGER trigger_update_activity_service_accounts_updated_at
    BEFORE UPDATE ON activity_service_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_activity_service_accounts_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE activity_service_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Super admin può vedere e modificare tutto (bypass RLS con service key)
-- Policy: Utenti possono vedere solo i mapping delle proprie attività
CREATE POLICY "Users can view own activity service accounts"
    ON activity_service_accounts
    FOR SELECT
    USING (
        activity_id IN (
            SELECT activity_id FROM activity_users WHERE user_id = auth.uid()
        )
    );

-- Policy: Solo admin possono inserire/modificare (via service key, RLS bypassato)
-- Non serve policy INSERT/UPDATE perché gli admin usano supabaseAdmin che bypassa RLS
