-- ================================================================================
-- DOID Suite - Sent Reminders Migration
-- ================================================================================
-- Tabella per tracciare i reminder inviati agli utenti durante il trial
-- Previene l'invio di reminder duplicati
-- Eseguire in Supabase SQL Editor
-- ================================================================================

-- Crea tabella sent_reminders
CREATE TABLE IF NOT EXISTS sent_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,              -- trial.day_7, trial.day_14, trial.day_21, trial.day_27, trial.expired
  user_id UUID,                             -- ID utente a cui è stato inviato
  details JSONB DEFAULT '{}',               -- Dettagli aggiuntivi (email, activity_name, etc.)
  sent_at TIMESTAMPTZ DEFAULT NOW(),

  -- Vincolo: un solo reminder per tipo per subscription
  UNIQUE(subscription_id, reminder_type)
);

-- Indici per query comuni
CREATE INDEX IF NOT EXISTS idx_sent_reminders_subscription ON sent_reminders(subscription_id);
CREATE INDEX IF NOT EXISTS idx_sent_reminders_type ON sent_reminders(reminder_type);
CREATE INDEX IF NOT EXISTS idx_sent_reminders_user ON sent_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_sent_reminders_sent_at ON sent_reminders(sent_at DESC);

-- Commenti
COMMENT ON TABLE sent_reminders IS 'Traccia i reminder trial inviati per evitare duplicati';
COMMENT ON COLUMN sent_reminders.subscription_id IS 'Subscription (trial) a cui si riferisce il reminder';
COMMENT ON COLUMN sent_reminders.reminder_type IS 'Tipo reminder: trial.day_7, trial.day_14, trial.day_21, trial.day_27, trial.expired';
COMMENT ON COLUMN sent_reminders.user_id IS 'UUID dell''utente che ha ricevuto il reminder';
COMMENT ON COLUMN sent_reminders.details IS 'Dettagli JSON: email, activity_name, days_remaining, etc.';

-- Abilita RLS
ALTER TABLE sent_reminders ENABLE ROW LEVEL SECURITY;

-- Policy: solo service_role può inserire (il job gira con service_role)
CREATE POLICY "sent_reminders_insert_service_role" ON sent_reminders
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: solo service_role può leggere
CREATE POLICY "sent_reminders_select_service_role" ON sent_reminders
  FOR SELECT
  TO service_role
  USING (true);

-- Policy: solo service_role può eliminare
CREATE POLICY "sent_reminders_delete_service_role" ON sent_reminders
  FOR DELETE
  TO service_role
  USING (true);

-- ================================================================================
-- FUNZIONI UTILITY
-- ================================================================================

-- Funzione per ottenere statistiche reminder
CREATE OR REPLACE FUNCTION get_reminder_stats(
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  reminder_type TEXT,
  total_sent BIGINT,
  unique_users BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sr.reminder_type,
    COUNT(*) as total_sent,
    COUNT(DISTINCT sr.user_id) as unique_users
  FROM sent_reminders sr
  WHERE sr.sent_at > NOW() - (p_days || ' days')::INTERVAL
  GROUP BY sr.reminder_type
  ORDER BY sr.reminder_type;
END;
$$;

-- Funzione per pulizia reminder vecchi (opzionale, per mantenere tabella snella)
-- I reminder sono comunque eliminati automaticamente quando la subscription viene eliminata (CASCADE)
CREATE OR REPLACE FUNCTION cleanup_old_reminders(
  p_days INT DEFAULT 180
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INT;
BEGIN
  -- Elimina reminder per subscription ormai terminate (più vecchie di p_days)
  DELETE FROM sent_reminders
  WHERE sent_at < NOW() - (p_days || ' days')::INTERVAL
    AND subscription_id IN (
      SELECT id FROM subscriptions
      WHERE status IN ('expired', 'cancelled')
    );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ================================================================================
-- TIPI DI REMINDER
-- ================================================================================
--
-- trial.day_7   : Inviato 7 giorni dopo l'inizio del trial (23 giorni rimanenti)
-- trial.day_14  : Inviato 14 giorni dopo l'inizio del trial (16 giorni rimanenti)
-- trial.day_21  : Inviato 21 giorni dopo l'inizio del trial (9 giorni rimanenti)
-- trial.day_27  : Inviato 27 giorni dopo l'inizio del trial (3 giorni rimanenti)
-- trial.expired : Inviato quando il trial scade (0 giorni rimanenti)
--
-- Nota: basato su trial di 30 giorni standard. Può essere adattato per trial
-- di durata diversa modificando REMINDER_MAP nel job.
--
-- ================================================================================

-- ================================================================================
-- Migration completata
-- ================================================================================
