-- ============================================================================
-- MIGRATION: Pending Registrations
-- Descrizione: Tabella per salvare i dati di registrazione in attesa di
--              verifica email (activity_name, servizio richiesto, UTM params)
-- Data: Gennaio 2025
-- ============================================================================

-- Crea tabella pending_registrations
CREATE TABLE IF NOT EXISTS pending_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_name TEXT NOT NULL,
  requested_service TEXT DEFAULT 'smart_review',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  referral_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  processed_at TIMESTAMPTZ DEFAULT NULL,
  CONSTRAINT pending_reg_user_unique UNIQUE (user_id)
);

-- Indice per ricerche veloci per user_id
CREATE INDEX IF NOT EXISTS idx_pending_reg_user ON pending_registrations(user_id);

-- Indice per pulizia registrazioni scadute
CREATE INDEX IF NOT EXISTS idx_pending_reg_expires ON pending_registrations(expires_at)
  WHERE processed_at IS NULL;

-- Indice per analytics UTM
CREATE INDEX IF NOT EXISTS idx_pending_reg_utm ON pending_registrations(utm_source, utm_campaign)
  WHERE utm_source IS NOT NULL;

-- RLS: Solo il super admin può accedere direttamente
ALTER TABLE pending_registrations ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti possono vedere solo la propria pending registration
CREATE POLICY pending_reg_select_own ON pending_registrations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Solo service role può inserire (backend)
CREATE POLICY pending_reg_insert_service ON pending_registrations
  FOR INSERT
  WITH CHECK (true);

-- Policy: Solo service role può aggiornare (backend)
CREATE POLICY pending_reg_update_service ON pending_registrations
  FOR UPDATE
  USING (true);

-- Policy: Solo service role può eliminare (backend)
CREATE POLICY pending_reg_delete_service ON pending_registrations
  FOR DELETE
  USING (true);

-- Commenti per documentazione
COMMENT ON TABLE pending_registrations IS 'Dati di registrazione in attesa di verifica email';
COMMENT ON COLUMN pending_registrations.activity_name IS 'Nome attività inserito dall utente in fase di registrazione';
COMMENT ON COLUMN pending_registrations.requested_service IS 'Servizio richiesto (smart_review, smart_page, menu_digitale, display_suite)';
COMMENT ON COLUMN pending_registrations.processed_at IS 'Timestamp di quando la registrazione è stata processata (org/activity create)';

-- ============================================================================
-- FUNZIONE: Pulizia registrazioni scadute
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_pending_registrations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM pending_registrations
  WHERE expires_at < NOW()
    AND processed_at IS NULL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNZIONE: Ottieni pending registration per user
-- ============================================================================
CREATE OR REPLACE FUNCTION get_pending_registration(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  activity_name TEXT,
  requested_service TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  referral_code TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.id,
    pr.activity_name,
    pr.requested_service,
    pr.utm_source,
    pr.utm_medium,
    pr.utm_campaign,
    pr.utm_content,
    pr.referral_code,
    pr.created_at
  FROM pending_registrations pr
  WHERE pr.user_id = p_user_id
    AND pr.processed_at IS NULL
    AND pr.expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
