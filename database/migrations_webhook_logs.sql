-- ================================================================================
-- DOID Suite - Webhook Logs Migration
-- ================================================================================
-- Tabella per tracciare tutti i webhook inviati a servizi esterni (GHL)
-- Eseguire in Supabase SQL Editor
-- ================================================================================

-- Crea tabella webhook_logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,                       -- Tipo evento (user.verified, trial.expired, etc.)
  payload JSONB,                                  -- Payload inviato
  status TEXT NOT NULL,                           -- 'success', 'failed'
  details TEXT,                                   -- Dettagli risposta o errore
  target_url TEXT,                                -- URL webhook destinazione
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per query comuni
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON webhook_logs(created_at DESC);

-- Indice composito per query filtrate
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_status ON webhook_logs(event_type, status);

-- Commenti
COMMENT ON TABLE webhook_logs IS 'Log di tutti i webhook inviati a servizi esterni (GoHighLevel)';
COMMENT ON COLUMN webhook_logs.event_type IS 'Tipo di evento: user.verified, trial.expired, subscription.created, etc.';
COMMENT ON COLUMN webhook_logs.payload IS 'Payload JSON inviato al webhook';
COMMENT ON COLUMN webhook_logs.status IS 'Stato: success o failed';
COMMENT ON COLUMN webhook_logs.details IS 'Dettagli risposta HTTP o messaggio errore';
COMMENT ON COLUMN webhook_logs.target_url IS 'URL del webhook destinazione';

-- Abilita RLS
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policy: solo service_role può inserire
CREATE POLICY "webhook_logs_insert_service_role" ON webhook_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: solo service_role può leggere
CREATE POLICY "webhook_logs_select_service_role" ON webhook_logs
  FOR SELECT
  TO service_role
  USING (true);

-- ================================================================================
-- FUNZIONI UTILITY
-- ================================================================================

-- Funzione per ottenere statistiche webhook
CREATE OR REPLACE FUNCTION get_webhook_stats(
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  event_type TEXT,
  total_count BIGINT,
  success_count BIGINT,
  failed_count BIGINT,
  success_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wl.event_type,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE wl.status = 'success') as success_count,
    COUNT(*) FILTER (WHERE wl.status = 'failed') as failed_count,
    ROUND(
      COUNT(*) FILTER (WHERE wl.status = 'success')::NUMERIC /
      NULLIF(COUNT(*), 0) * 100, 2
    ) as success_rate
  FROM webhook_logs wl
  WHERE wl.created_at > NOW() - (p_days || ' days')::INTERVAL
  GROUP BY wl.event_type
  ORDER BY total_count DESC;
END;
$$;

-- Funzione per pulizia log vecchi
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs(
  p_days INT DEFAULT 90
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM webhook_logs
  WHERE created_at < NOW() - (p_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ================================================================================
-- TIPI DI EVENTI WEBHOOK
-- ================================================================================
--
-- REGISTRAZIONE (GENERICO - senza servizio):
--   user.registered         - Nuova registrazione (prima della verifica email)
--   user.verified           - Email verificata + setup completato (NO servizio)
--
-- ATTIVAZIONE SERVIZI (SPECIFICO - con servizio):
--   service.trial_activated - Utente ha scelto e attivato trial per un servizio
--
-- ADMIN:
--   admin.user_created      - Utente creato da admin
--   admin.setup_complete    - Setup completato per utente creato da admin
--
-- TRIAL REMINDERS (SPECIFICO - include servizio nel payload):
--   trial.started           - Trial avviato
--   trial.day_7             - Reminder 7 giorni dalla scadenza
--   trial.day_14            - Reminder 14 giorni dalla scadenza
--   trial.day_21            - Reminder 21 giorni dalla scadenza
--   trial.day_27            - Reminder 27 giorni (3 giorni alla scadenza)
--   trial.expiring          - Trial in scadenza (generico)
--   trial.expired           - Trial scaduto
--
-- SUBSCRIPTION:
--   subscription.created    - Abbonamento creato
--   subscription.activated  - Abbonamento attivato (upgrade da trial)
--   subscription.renewed    - Abbonamento rinnovato
--   subscription.cancelled  - Abbonamento cancellato
--   subscription.expired    - Abbonamento scaduto
--   payment.failed          - Pagamento fallito
--
-- PASSWORD:
--   password.reset_requested - Richiesta reset password
--
-- AGENCY (opzionali):
--   organization.upgraded   - Upgrade organizzazione ad agency
--   activity.created        - Nuova attività creata (agency)
--   member.invited          - Membro invitato
--   member.joined           - Membro ha accettato invito
--
-- ================================================================================

-- ================================================================================
-- Migration completata
-- ================================================================================
