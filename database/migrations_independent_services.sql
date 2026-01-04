-- ============================================
-- DOID Suite - Independent Services Migration
-- Modello "Servizi Indipendenti" per Admin Panel
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. ESTENDI ENUM subscription_status
-- ============================================

-- Aggiungi nuovi valori all'enum (PostgreSQL 9.1+)
DO $$
BEGIN
    -- Aggiungi 'inactive' se non esiste
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'inactive'
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_status')) THEN
        ALTER TYPE subscription_status ADD VALUE 'inactive';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    -- Aggiungi 'free' se non esiste
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'free'
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_status')) THEN
        ALTER TYPE subscription_status ADD VALUE 'free';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. AGGIUNGI CAMPI A services
-- ============================================

-- Prezzo PRO mensile diretto sul servizio
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_pro_monthly DECIMAL(10,2) DEFAULT 0;

-- Prezzo PRO annuale diretto sul servizio
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_pro_yearly DECIMAL(10,2) DEFAULT 0;

-- Flag se il servizio offre un tier gratuito
ALTER TABLE services ADD COLUMN IF NOT EXISTS has_free_tier BOOLEAN DEFAULT false;

-- Giorni di trial per questo servizio
ALTER TABLE services ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 30;

-- ============================================
-- 3. AGGIUNGI CAMPI A subscriptions
-- ============================================

-- Flag per cancellazione a fine periodo (invece di immediata)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- Data di upgrade a PRO
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS upgraded_at TIMESTAMP WITH TIME ZONE;

-- Data ultimo rinnovo
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS last_renewed_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- 4. TABELLA volume_discounts
-- Sconti per numero di attivita (modello agenzia)
-- ============================================

CREATE TABLE IF NOT EXISTS volume_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    min_activities INTEGER NOT NULL,
    max_activities INTEGER, -- NULL = illimitato
    discount_percentage DECIMAL(5,2) NOT NULL, -- es. 10.00 = 10%
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice per lookup veloce
CREATE INDEX IF NOT EXISTS idx_volume_discounts_activities
ON volume_discounts(min_activities, max_activities)
WHERE is_active = true;

-- ============================================
-- 5. TABELLA communication_logs
-- Log di tutte le comunicazioni (email, webhook, azioni admin)
-- ============================================

CREATE TABLE IF NOT EXISTS communication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'email', 'webhook', 'admin_action', 'system'
    event VARCHAR(100) NOT NULL, -- 'trial_started', 'trial_expiring', 'trial_expired', 'payment_failed', etc.
    recipient VARCHAR(255), -- email o endpoint
    subject VARCHAR(255),
    content TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'delivered'
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE
);

-- Indici per query comuni
CREATE INDEX IF NOT EXISTS idx_communication_logs_activity ON communication_logs(activity_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_user ON communication_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_type ON communication_logs(type);
CREATE INDEX IF NOT EXISTS idx_communication_logs_event ON communication_logs(event);
CREATE INDEX IF NOT EXISTS idx_communication_logs_created ON communication_logs(created_at DESC);

-- ============================================
-- 6. TABELLA webhooks_queue
-- Coda webhook per eventi da processare
-- ============================================

CREATE TABLE IF NOT EXISTS webhooks_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL, -- 'trial_started', 'trial_expiring', 'trial_expired', 'subscription_activated', etc.
    activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    service_code VARCHAR(50),
    payload JSONB NOT NULL,
    target_url VARCHAR(500),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per processamento coda
CREATE INDEX IF NOT EXISTS idx_webhooks_queue_status ON webhooks_queue(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_queue_scheduled ON webhooks_queue(scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_webhooks_queue_activity ON webhooks_queue(activity_id);

-- ============================================
-- 7. FUNZIONI HELPER
-- ============================================

-- Funzione: conta attivita di un utente (attraverso activity_users)
CREATE OR REPLACE FUNCTION count_user_activities(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(DISTINCT au.activity_id)
        FROM activity_users au
        JOIN activities a ON a.id = au.activity_id
        WHERE au.user_id = p_user_id
        AND a.status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione: verifica se utente e considerato "agenzia" (>= 5 attivita)
CREATE OR REPLACE FUNCTION is_agency(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN count_user_activities(p_user_id) >= 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione: calcola sconto volume per utente
CREATE OR REPLACE FUNCTION get_user_discount(p_user_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_activity_count INTEGER;
    v_discount DECIMAL(5,2);
BEGIN
    v_activity_count := count_user_activities(p_user_id);

    SELECT discount_percentage INTO v_discount
    FROM volume_discounts
    WHERE is_active = true
      AND v_activity_count >= min_activities
      AND (max_activities IS NULL OR v_activity_count <= max_activities)
    ORDER BY min_activities DESC
    LIMIT 1;

    RETURN COALESCE(v_discount, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione: ottieni stato effettivo servizio per attivita
CREATE OR REPLACE FUNCTION get_activity_service_status(p_activity_id UUID, p_service_code VARCHAR)
RETURNS TABLE (
    subscription_id UUID,
    status VARCHAR,
    plan_code VARCHAR,
    is_active BOOLEAN,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sub.id,
        sub.status::VARCHAR,
        p.code,
        CASE
            WHEN sub.status IN ('free', 'active', 'trial') THEN
                CASE
                    WHEN sub.status::VARCHAR = 'trial' THEN sub.trial_ends_at > NOW()
                    WHEN sub.status::VARCHAR = 'active' THEN sub.current_period_end > NOW()
                    WHEN sub.status::VARCHAR = 'free' THEN true
                    ELSE false
                END
            ELSE false
        END AS is_active,
        sub.trial_ends_at,
        sub.current_period_end,
        sub.cancel_at_period_end
    FROM subscriptions sub
    JOIN services srv ON sub.service_id = srv.id
    LEFT JOIN plans p ON sub.plan_id = p.id
    WHERE sub.activity_id = p_activity_id
      AND srv.code = p_service_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. ROW LEVEL SECURITY
-- ============================================

-- volume_discounts: leggibile da tutti (read-only per non-admin)
ALTER TABLE volume_discounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active discounts" ON volume_discounts;
CREATE POLICY "Anyone can view active discounts" ON volume_discounts
    FOR SELECT USING (is_active = true);

-- communication_logs: utenti vedono solo i propri log
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own activity logs" ON communication_logs;
CREATE POLICY "Users see own activity logs" ON communication_logs
    FOR SELECT USING (
        activity_id IN (SELECT activity_id FROM activity_users WHERE user_id = auth.uid())
        OR user_id = auth.uid()
    );

-- webhooks_queue: solo admin via service role (nessuna policy per utenti normali)
ALTER TABLE webhooks_queue ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. SEED DATA
-- ============================================

-- Inserisci sconti volume
INSERT INTO volume_discounts (min_activities, max_activities, discount_percentage) VALUES
(1, 5, 0),      -- 1-5 attivita: nessuno sconto
(6, 15, 10),    -- 6-15 attivita: 10% sconto
(16, 30, 15),   -- 16-30 attivita: 15% sconto
(31, 50, 20),   -- 31-50 attivita: 20% sconto
(51, NULL, 25)  -- 51+ attivita: 25% sconto
ON CONFLICT DO NOTHING;

-- Aggiorna servizi esistenti con has_free_tier dai piani esistenti
UPDATE services s SET
    has_free_tier = EXISTS(
        SELECT 1 FROM plans p
        WHERE p.service_id = s.id
        AND p.code = 'free'
        AND p.is_active = true
    ),
    price_pro_monthly = COALESCE((
        SELECT p.price_monthly FROM plans p
        WHERE p.service_id = s.id
        AND p.code = 'pro'
        AND p.is_active = true
        LIMIT 1
    ), 0),
    price_pro_yearly = COALESCE((
        SELECT p.price_yearly FROM plans p
        WHERE p.service_id = s.id
        AND p.code = 'pro'
        AND p.is_active = true
        LIMIT 1
    ), 0),
    trial_days = COALESCE((
        SELECT p.trial_days FROM plans p
        WHERE p.service_id = s.id
        AND p.code = 'pro'
        AND p.is_active = true
        LIMIT 1
    ), 30)
WHERE s.code IN ('smart_review', 'smart_page', 'menu_digitale', 'display_suite');

-- Aggiungi servizio "Accessi" (non attivo per ora)
INSERT INTO services (code, name, description, app_url, icon, color, price_pro_monthly, price_pro_yearly, has_free_tier, trial_days, is_active, sort_order)
VALUES (
    'accessi',
    'Accessi',
    'Gestione accessi e controllo ingressi per attivita',
    'https://accessi.doid.it',
    'key',
    '#6B7280',
    14.90,
    143.04,
    false,
    30,
    false,
    5
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_pro_monthly = EXCLUDED.price_pro_monthly,
    price_pro_yearly = EXCLUDED.price_pro_yearly,
    has_free_tier = EXCLUDED.has_free_tier,
    trial_days = EXCLUDED.trial_days,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order;

-- ============================================
-- 10. TRIGGER per updated_at
-- ============================================

-- Trigger per volume_discounts (se necessario in futuro)
DROP TRIGGER IF EXISTS update_volume_discounts_updated_at ON volume_discounts;

-- ============================================
-- FINE MIGRAZIONE
-- ============================================
