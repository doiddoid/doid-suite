-- ================================================================================
-- DOID Suite - Admin Logs Migration
-- ================================================================================
-- Tabella per tracciare tutte le azioni degli admin nel sistema
-- Eseguire in Supabase SQL Editor
-- ================================================================================

-- Crea tabella admin_logs
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL,                    -- ID dell'admin che ha eseguito l'azione
  action TEXT NOT NULL,                           -- Tipo azione (create_user, update_user, delete_user, etc.)
  entity_type TEXT NOT NULL,                      -- Tipo entità (user, organization, activity, subscription)
  entity_id UUID,                                 -- ID dell'entità modificata (opzionale)
  details JSONB DEFAULT '{}',                     -- Dettagli aggiuntivi in JSON
  ip_address INET,                                -- Indirizzo IP (opzionale)
  user_agent TEXT,                                -- User agent del browser (opzionale)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per query comuni
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_entity ON admin_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at DESC);

-- Commenti
COMMENT ON TABLE admin_logs IS 'Log di tutte le azioni eseguite dagli amministratori';
COMMENT ON COLUMN admin_logs.admin_user_id IS 'UUID dell''admin che ha eseguito l''azione';
COMMENT ON COLUMN admin_logs.action IS 'Tipo di azione: create_user, update_user, delete_user, create_organization, etc.';
COMMENT ON COLUMN admin_logs.entity_type IS 'Tipo di entità: user, organization, activity, subscription, package';
COMMENT ON COLUMN admin_logs.entity_id IS 'UUID dell''entità interessata dall''azione';
COMMENT ON COLUMN admin_logs.details IS 'Dettagli JSON dell''azione (campi modificati, note admin, etc.)';

-- Abilita RLS
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Policy: solo service_role può inserire
CREATE POLICY "admin_logs_insert_service_role" ON admin_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: solo service_role può leggere
CREATE POLICY "admin_logs_select_service_role" ON admin_logs
  FOR SELECT
  TO service_role
  USING (true);

-- ================================================================================
-- Azioni comuni da loggare:
-- ================================================================================
-- create_user          - Creazione nuovo utente
-- update_user          - Modifica utente
-- delete_user          - Eliminazione utente
-- create_organization  - Creazione organizzazione
-- update_organization  - Modifica organizzazione
-- delete_organization  - Eliminazione organizzazione
-- create_activity      - Creazione attività
-- update_activity      - Modifica attività
-- delete_activity      - Eliminazione attività
-- create_subscription  - Creazione abbonamento
-- update_subscription  - Modifica abbonamento (upgrade/downgrade)
-- cancel_subscription  - Cancellazione abbonamento
-- activate_package     - Attivazione pacchetto per organizzazione
-- cancel_package       - Cancellazione pacchetto
-- impersonate_user     - Login come altro utente
-- access_service       - Accesso a servizio come admin
-- ================================================================================

-- Funzione per ottenere log di un admin specifico
CREATE OR REPLACE FUNCTION get_admin_logs(
  p_admin_id UUID DEFAULT NULL,
  p_action TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  admin_user_id UUID,
  action TEXT,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.admin_user_id,
    al.action,
    al.entity_type,
    al.entity_id,
    al.details,
    al.ip_address,
    al.created_at
  FROM admin_logs al
  WHERE
    (p_admin_id IS NULL OR al.admin_user_id = p_admin_id)
    AND (p_action IS NULL OR al.action = p_action)
    AND (p_entity_type IS NULL OR al.entity_type = p_entity_type)
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ================================================================================
-- Migration completata
-- ================================================================================
