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

-- 2. Tabella admin_logs
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON admin_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_date ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_user_id);

-- RLS per admin_logs (solo super admin possono leggere/scrivere)
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Policy: solo service_role può inserire (il backend usa service_key)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_logs' AND policyname = 'Service role can manage admin_logs'
  ) THEN
    CREATE POLICY "Service role can manage admin_logs"
    ON admin_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);
  END IF;
END
$$;
