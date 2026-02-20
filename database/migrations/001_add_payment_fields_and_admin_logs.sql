-- ============================================
-- FASE 1: Campi rinnovo/pagamento + Admin Logs
-- Data: 2026-02-20
-- ============================================

-- 1. Aggiungi campi pagamento/rinnovo manuale alla tabella subscriptions
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS manual_renew_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS manual_renew_notes TEXT,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);

-- Commento sulle colonne
COMMENT ON COLUMN subscriptions.payment_method IS 'Metodo pagamento: stripe | bonifico | manual';
COMMENT ON COLUMN subscriptions.manual_renew_date IS 'Data scadenza/rinnovo per pagamenti manuali (bonifico)';
COMMENT ON COLUMN subscriptions.manual_renew_notes IS 'Note admin sul pagamento manuale';
COMMENT ON COLUMN subscriptions.last_payment_date IS 'Data ultimo pagamento ricevuto';
COMMENT ON COLUMN subscriptions.payment_reference IS 'Riferimento bonifico/fattura';

-- Index per scadenze manuali (utile per query admin)
CREATE INDEX IF NOT EXISTS idx_subscriptions_manual_renew
ON subscriptions(manual_renew_date)
WHERE payment_method = 'bonifico' AND manual_renew_date IS NOT NULL;

-- 2. Aggiorna tabella admin_logs esistente (aggiunge colonne mancanti)
ALTER TABLE admin_logs
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);

-- Indici su admin_logs (colonne esistenti: entity_type, entity_id)
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_entity ON admin_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_date ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_user_id);
