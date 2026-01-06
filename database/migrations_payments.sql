-- ============================================
-- DOID Suite - Payments Migration
-- Integrazione pagamenti GHL + Stripe
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TABELLA payment_transactions
-- Log di tutte le transazioni di pagamento
-- ============================================

CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
    user_id UUID NOT NULL,
    service_code VARCHAR(50) NOT NULL,

    -- Dati transazione
    transaction_id VARCHAR(255), -- ID transazione GHL/Stripe
    external_subscription_id VARCHAR(255), -- ID abbonamento esterno
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',

    -- Stato e source
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
    source VARCHAR(50) DEFAULT 'gohighlevel', -- gohighlevel, stripe, manual
    payment_method VARCHAR(50), -- card, paypal, etc.

    -- Billing
    billing_cycle VARCHAR(20), -- monthly, yearly

    -- Metadata
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    raw_payload JSONB,
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_payment_transactions_activity ON payment_transactions(activity_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_service ON payment_transactions(service_code);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_email ON payment_transactions(customer_email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transactions_txn_id ON payment_transactions(transaction_id) WHERE transaction_id IS NOT NULL;

-- ============================================
-- 2. AGGIUNGI CAMPI A subscriptions
-- Per tracking pagamenti esterni
-- ============================================

ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS external_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS external_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_source VARCHAR(50) DEFAULT 'manual';

-- Indice per lookup
CREATE INDEX IF NOT EXISTS idx_subscriptions_external_id
ON subscriptions(external_subscription_id)
WHERE external_subscription_id IS NOT NULL;

-- ============================================
-- 3. TABELLA billing_profiles
-- Dati fatturazione utente (opzionale, per futuro)
-- ============================================

CREATE TABLE IF NOT EXISTS billing_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Dati azienda/persona
    billing_type VARCHAR(20) DEFAULT 'personal', -- personal, business
    company_name VARCHAR(255),
    vat_number VARCHAR(50),
    fiscal_code VARCHAR(50),

    -- Indirizzo
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2) DEFAULT 'IT',

    -- Contatto fatturazione
    billing_email VARCHAR(255),
    phone VARCHAR(50),

    -- PEC/SDI per fatturazione elettronica Italia
    pec_email VARCHAR(255),
    sdi_code VARCHAR(7),

    -- Metadata
    is_default BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, is_default) -- Solo un profilo default per utente
);

-- Indice
CREATE INDEX IF NOT EXISTS idx_billing_profiles_user ON billing_profiles(user_id);

-- Trigger updated_at
CREATE TRIGGER update_billing_profiles_updated_at
    BEFORE UPDATE ON billing_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================

-- payment_transactions: utenti vedono solo le proprie
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own transactions" ON payment_transactions;
CREATE POLICY "Users see own transactions" ON payment_transactions
    FOR SELECT USING (user_id = auth.uid());

-- billing_profiles: utenti gestiscono solo i propri
ALTER TABLE billing_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own billing" ON billing_profiles;
CREATE POLICY "Users manage own billing" ON billing_profiles
    FOR ALL USING (user_id = auth.uid());

-- ============================================
-- 5. FUNZIONE: trova utente per email
-- Usata per collegare pagamenti GHL a utenti DOID
-- ============================================

CREATE OR REPLACE FUNCTION find_user_by_email(p_email VARCHAR)
RETURNS TABLE (
    user_id UUID,
    full_name VARCHAR,
    primary_activity_id UUID,
    primary_activity_name VARCHAR,
    activity_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH user_data AS (
        SELECT
            u.id as uid,
            u.raw_user_meta_data->>'full_name' as uname
        FROM auth.users u
        WHERE u.email = p_email
        LIMIT 1
    ),
    user_activities AS (
        SELECT
            au.activity_id,
            a.name as activity_name,
            au.created_at,
            ROW_NUMBER() OVER (ORDER BY au.created_at ASC) as rn
        FROM activity_users au
        JOIN activities a ON a.id = au.activity_id
        JOIN user_data ud ON au.user_id = ud.uid
        WHERE a.status = 'active'
    )
    SELECT
        ud.uid,
        ud.uname::VARCHAR,
        ua.activity_id,
        ua.activity_name::VARCHAR,
        (SELECT COUNT(*)::INTEGER FROM user_activities)
    FROM user_data ud
    LEFT JOIN user_activities ua ON ua.rn = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. FUNZIONE: trova activity per email + servizio
-- Per casi dove utente ha multiple attività
-- ============================================

CREATE OR REPLACE FUNCTION find_activity_for_subscription(
    p_email VARCHAR,
    p_service_code VARCHAR
)
RETURNS TABLE (
    activity_id UUID,
    activity_name VARCHAR,
    has_existing_subscription BOOLEAN,
    existing_status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    WITH user_activities AS (
        SELECT
            a.id,
            a.name,
            au.created_at as joined_at
        FROM auth.users u
        JOIN activity_users au ON au.user_id = u.id
        JOIN activities a ON a.id = au.activity_id
        WHERE u.email = p_email
        AND a.status = 'active'
    ),
    activity_subscriptions AS (
        SELECT
            ua.id as act_id,
            ua.name as act_name,
            s.status as sub_status,
            CASE WHEN s.id IS NOT NULL THEN true ELSE false END as has_sub
        FROM user_activities ua
        LEFT JOIN subscriptions s ON s.activity_id = ua.id
        LEFT JOIN services srv ON s.service_id = srv.id AND srv.code = p_service_code
    )
    -- Priorità: attività SENZA abbonamento per questo servizio, poi la prima creata
    SELECT
        act_id,
        act_name::VARCHAR,
        has_sub,
        sub_status::VARCHAR
    FROM activity_subscriptions
    ORDER BY has_sub ASC, act_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FINE MIGRAZIONE
-- ============================================
