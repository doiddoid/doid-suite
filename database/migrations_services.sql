-- DOID Suite - Services & Subscriptions Migration
-- Run this in Supabase SQL Editor

-- ============================================
-- AGGIORNA TABELLA SERVICES (se esiste già)
-- ============================================

-- Aggiungi colonna description se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'services' AND column_name = 'description') THEN
        ALTER TABLE services ADD COLUMN description TEXT;
    END IF;
END $$;

-- Aggiungi colonna created_at se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'services' AND column_name = 'created_at') THEN
        ALTER TABLE services ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- ============================================
-- AGGIORNA TABELLA PLANS
-- ============================================

-- Aggiungi colonna description se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'plans' AND column_name = 'description') THEN
        ALTER TABLE plans ADD COLUMN description TEXT;
    END IF;
END $$;

-- Aggiungi colonna trial_days se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'plans' AND column_name = 'trial_days') THEN
        ALTER TABLE plans ADD COLUMN trial_days INTEGER DEFAULT 30;
    END IF;
END $$;

-- Aggiungi colonna created_at se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'plans' AND column_name = 'created_at') THEN
        ALTER TABLE plans ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- ============================================
-- AGGIORNA TABELLA SUBSCRIPTIONS
-- ============================================

-- Aggiungi colonna user_id se non esiste (per supporto user-based)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'subscriptions' AND column_name = 'user_id') THEN
        ALTER TABLE subscriptions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Aggiungi colonna service_id se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'subscriptions' AND column_name = 'service_id') THEN
        ALTER TABLE subscriptions ADD COLUMN service_id UUID REFERENCES services(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Aggiungi colonna cancelled_at se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'subscriptions' AND column_name = 'cancelled_at') THEN
        ALTER TABLE subscriptions ADD COLUMN cancelled_at TIMESTAMP;
    END IF;
END $$;

-- ============================================
-- INDICI
-- ============================================

-- Indice per user_id sulle subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- Indice per service_id sulle subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_service_id ON subscriptions(service_id);

-- Indice composto user_id + service_id (per UNIQUE constraint)
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_service
ON subscriptions(user_id, service_id)
WHERE user_id IS NOT NULL;

-- ============================================
-- AGGIORNA DATI SERVICES
-- ============================================

-- Aggiorna gli URL delle app DOID
UPDATE services SET
    app_url = 'https://review.doid.it/app',
    description = 'Gestisci le recensioni della tua attività con filtro intelligente'
WHERE code = 'smart_review';

UPDATE services SET
    app_url = 'https://page.doid.it',
    description = 'Crea landing page e biglietti da visita digitali'
WHERE code = 'smart_page';

UPDATE services SET
    app_url = 'https://menu.doid.it',
    description = 'Menu digitale per ristoranti con QR code'
WHERE code = 'menu_digitale';

UPDATE services SET
    app_url = 'https://display.doid.it',
    description = 'Gestisci contenuti su monitor e digital signage'
WHERE code = 'display_suite';

-- ============================================
-- AGGIORNA/INSERISCI PIANI
-- ============================================

-- Smart Review Plans
UPDATE plans SET trial_days = 0 WHERE code = 'free' AND service_id = (SELECT id FROM services WHERE code = 'smart_review');
UPDATE plans SET trial_days = 30 WHERE code = 'pro' AND service_id = (SELECT id FROM services WHERE code = 'smart_review');

-- Aggiorna features per Smart Review
UPDATE plans SET features = '{"platforms": 2, "filter": false}'::jsonb
WHERE code = 'free' AND service_id = (SELECT id FROM services WHERE code = 'smart_review');
UPDATE plans SET features = '{"platforms": 10, "filter": true}'::jsonb
WHERE code = 'pro' AND service_id = (SELECT id FROM services WHERE code = 'smart_review');

-- Smart Page Plans
UPDATE plans SET trial_days = 0 WHERE code = 'free' AND service_id = (SELECT id FROM services WHERE code = 'smart_page');
UPDATE plans SET trial_days = 30 WHERE code = 'pro' AND service_id = (SELECT id FROM services WHERE code = 'smart_page');

-- Aggiorna features per Smart Page
UPDATE plans SET features = '{"pages": 1, "custom_domain": false}'::jsonb
WHERE code = 'free' AND service_id = (SELECT id FROM services WHERE code = 'smart_page');
UPDATE plans SET features = '{"pages": 10, "custom_domain": true}'::jsonb
WHERE code = 'pro' AND service_id = (SELECT id FROM services WHERE code = 'smart_page');

-- Menu Digitale Plans
UPDATE plans SET trial_days = 0 WHERE code = 'free' AND service_id = (SELECT id FROM services WHERE code = 'menu_digitale');
UPDATE plans SET trial_days = 30 WHERE code = 'pro' AND service_id = (SELECT id FROM services WHERE code = 'menu_digitale');

-- Aggiorna features per Menu Digitale
UPDATE plans SET features = '{"menus": 1, "items": 20}'::jsonb
WHERE code = 'free' AND service_id = (SELECT id FROM services WHERE code = 'menu_digitale');
UPDATE plans SET features = '{"menus": 5, "items": -1}'::jsonb
WHERE code = 'pro' AND service_id = (SELECT id FROM services WHERE code = 'menu_digitale');

-- Display Suite Plans - rinomina business -> starter se esiste
UPDATE plans SET code = 'starter', name = 'Starter', trial_days = 30
WHERE code = 'free' AND service_id = (SELECT id FROM services WHERE code = 'display_suite');
UPDATE plans SET trial_days = 30
WHERE code = 'pro' AND service_id = (SELECT id FROM services WHERE code = 'display_suite');

-- Aggiorna features per Display Suite
UPDATE plans SET features = '{"displays": 1, "storage_gb": 5}'::jsonb
WHERE code = 'starter' AND service_id = (SELECT id FROM services WHERE code = 'display_suite');
UPDATE plans SET features = '{"displays": 5, "storage_gb": 20}'::jsonb
WHERE code = 'pro' AND service_id = (SELECT id FROM services WHERE code = 'display_suite');

-- ============================================
-- ROW LEVEL SECURITY PER USER-BASED SUBSCRIPTIONS
-- ============================================

-- Policy: utente vede solo le proprie subscriptions (user_id based)
DROP POLICY IF EXISTS "Users can view own user subscriptions" ON subscriptions;
CREATE POLICY "Users can view own user subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: utente può inserire le proprie subscriptions
DROP POLICY IF EXISTS "Users can insert own user subscriptions" ON subscriptions;
CREATE POLICY "Users can insert own user subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: utente può aggiornare le proprie subscriptions
DROP POLICY IF EXISTS "Users can update own user subscriptions" ON subscriptions;
CREATE POLICY "Users can update own user subscriptions" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- FUNZIONI HELPER
-- ============================================

-- Funzione per verificare se utente ha abbonamento attivo per un servizio
CREATE OR REPLACE FUNCTION user_has_active_subscription(p_user_id UUID, p_service_code VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    v_subscription RECORD;
BEGIN
    SELECT s.*, p.code as plan_code
    INTO v_subscription
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    JOIN services srv ON s.service_id = srv.id
    WHERE s.user_id = p_user_id
      AND srv.code = p_service_code
      AND s.status IN ('trial', 'active');

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Piano free è sempre attivo
    IF v_subscription.plan_code = 'free' THEN
        RETURN TRUE;
    END IF;

    -- Verifica se trial o periodo è scaduto
    IF v_subscription.status = 'trial' THEN
        RETURN v_subscription.trial_ends_at > NOW();
    ELSIF v_subscription.status = 'active' THEN
        RETURN v_subscription.current_period_end > NOW();
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per ottenere servizi con stato per utente
CREATE OR REPLACE FUNCTION get_user_services_with_status(p_user_id UUID)
RETURNS TABLE (
    service_id UUID,
    service_code VARCHAR,
    service_name VARCHAR,
    service_description TEXT,
    service_app_url VARCHAR,
    service_icon VARCHAR,
    service_color VARCHAR,
    subscription_id UUID,
    subscription_status VARCHAR,
    plan_id UUID,
    plan_code VARCHAR,
    plan_name VARCHAR,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        srv.id AS service_id,
        srv.code AS service_code,
        srv.name AS service_name,
        srv.description AS service_description,
        srv.app_url AS service_app_url,
        srv.icon AS service_icon,
        srv.color AS service_color,
        sub.id AS subscription_id,
        sub.status::VARCHAR AS subscription_status,
        p.id AS plan_id,
        p.code AS plan_code,
        p.name AS plan_name,
        sub.trial_ends_at,
        sub.current_period_end,
        user_has_active_subscription(p_user_id, srv.code) AS is_active
    FROM services srv
    LEFT JOIN subscriptions sub ON sub.user_id = p_user_id AND sub.service_id = srv.id
    LEFT JOIN plans p ON sub.plan_id = p.id
    WHERE srv.is_active = true
    ORDER BY srv.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
