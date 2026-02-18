-- ============================================
-- DOID Suite - Service Subscriptions Schema Migration
-- Verifica e aggiorna le tabelle services, activities, service_subscriptions
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABELLA: services
-- Verifica e aggiungi campi mancanti
-- ============================================

-- Crea la tabella se non esiste
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_pro_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_pro_yearly DECIMAL(10,2),
    price_addon_monthly DECIMAL(10,2) DEFAULT 7.90,
    has_free_tier BOOLEAN DEFAULT FALSE,
    trial_days INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    icon VARCHAR(50),
    color_primary VARCHAR(20),
    color_dark VARCHAR(20),
    color_light VARCHAR(20),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggiungi colonne mancanti a services (se la tabella esiste gia)

-- price_addon_monthly
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'services' AND column_name = 'price_addon_monthly') THEN
        ALTER TABLE services ADD COLUMN price_addon_monthly DECIMAL(10,2) DEFAULT 7.90;
    END IF;
END $$;

-- color_primary (se non esiste, ma esiste 'color', copia il valore)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'services' AND column_name = 'color_primary') THEN
        ALTER TABLE services ADD COLUMN color_primary VARCHAR(20);
        -- Copia da 'color' se esiste
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'services' AND column_name = 'color') THEN
            UPDATE services SET color_primary = color WHERE color_primary IS NULL;
        END IF;
    END IF;
END $$;

-- color_dark
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'services' AND column_name = 'color_dark') THEN
        ALTER TABLE services ADD COLUMN color_dark VARCHAR(20);
    END IF;
END $$;

-- color_light
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'services' AND column_name = 'color_light') THEN
        ALTER TABLE services ADD COLUMN color_light VARCHAR(20);
    END IF;
END $$;

-- updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'services' AND column_name = 'updated_at') THEN
        ALTER TABLE services ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- price_pro_monthly (assicurati che esista)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'services' AND column_name = 'price_pro_monthly') THEN
        ALTER TABLE services ADD COLUMN price_pro_monthly DECIMAL(10,2) NOT NULL DEFAULT 0;
    END IF;
END $$;

-- price_pro_yearly
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'services' AND column_name = 'price_pro_yearly') THEN
        ALTER TABLE services ADD COLUMN price_pro_yearly DECIMAL(10,2);
    END IF;
END $$;

-- has_free_tier
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'services' AND column_name = 'has_free_tier') THEN
        ALTER TABLE services ADD COLUMN has_free_tier BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- trial_days
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'services' AND column_name = 'trial_days') THEN
        ALTER TABLE services ADD COLUMN trial_days INTEGER DEFAULT 30;
    END IF;
END $$;

-- ============================================
-- 2. TABELLA: activities
-- Verifica e aggiungi campi mancanti
-- ============================================

-- Crea la tabella se non esiste
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggiungi colonne mancanti a activities

-- user_id (owner diretto dell'attivita)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'activities' AND column_name = 'user_id') THEN
        -- Aggiungi colonna nullable prima
        ALTER TABLE activities ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

        -- Popola con owner da activity_users se disponibile
        UPDATE activities a
        SET user_id = (
            SELECT au.user_id
            FROM activity_users au
            WHERE au.activity_id = a.id AND au.role = 'owner'
            LIMIT 1
        )
        WHERE a.user_id IS NULL;

        -- Se ancora NULL, prendi qualsiasi utente associato
        UPDATE activities a
        SET user_id = (
            SELECT au.user_id
            FROM activity_users au
            WHERE au.activity_id = a.id
            LIMIT 1
        )
        WHERE a.user_id IS NULL;
    END IF;
END $$;

-- is_active (se esiste 'status', converti)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'activities' AND column_name = 'is_active') THEN
        ALTER TABLE activities ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        -- Converti da status se esiste
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'activities' AND column_name = 'status') THEN
            UPDATE activities SET is_active = (status = 'active') WHERE is_active IS NULL;
        END IF;
    END IF;
END $$;

-- Assicurati che slug non sia NOT NULL (alcuni record potrebbero non averlo)
-- Non modificare il constraint se esiste gia

-- ============================================
-- 3. TABELLA: service_subscriptions
-- Crea se non esiste
-- ============================================

CREATE TABLE IF NOT EXISTS service_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id),
    status VARCHAR(20) NOT NULL DEFAULT 'inactive',
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    is_addon BOOLEAN DEFAULT FALSE,
    trial_started_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    pro_started_at TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    ghl_subscription_id VARCHAR(100),
    stripe_subscription_id VARCHAR(100),
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    price_override DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT service_subscriptions_activity_service_addon_unique UNIQUE(activity_id, service_id, is_addon)
);

-- Aggiungi colonne mancanti a service_subscriptions (se la tabella esiste gia)

-- ghl_subscription_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'service_subscriptions' AND column_name = 'ghl_subscription_id') THEN
        ALTER TABLE service_subscriptions ADD COLUMN ghl_subscription_id VARCHAR(100);
    END IF;
END $$;

-- stripe_subscription_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'service_subscriptions' AND column_name = 'stripe_subscription_id') THEN
        ALTER TABLE service_subscriptions ADD COLUMN stripe_subscription_id VARCHAR(100);
    END IF;
END $$;

-- cancel_at_period_end
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'service_subscriptions' AND column_name = 'cancel_at_period_end') THEN
        ALTER TABLE service_subscriptions ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- price_override
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'service_subscriptions' AND column_name = 'price_override') THEN
        ALTER TABLE service_subscriptions ADD COLUMN price_override DECIMAL(10,2);
    END IF;
END $$;

-- pro_started_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'service_subscriptions' AND column_name = 'pro_started_at') THEN
        ALTER TABLE service_subscriptions ADD COLUMN pro_started_at TIMESTAMPTZ;
    END IF;
END $$;

-- is_addon
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'service_subscriptions' AND column_name = 'is_addon') THEN
        ALTER TABLE service_subscriptions ADD COLUMN is_addon BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- billing_cycle
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'service_subscriptions' AND column_name = 'billing_cycle') THEN
        ALTER TABLE service_subscriptions ADD COLUMN billing_cycle VARCHAR(20) DEFAULT 'monthly';
    END IF;
END $$;

-- ============================================
-- 4. INDICI
-- ============================================

-- Indice su activities.user_id
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);

-- Indice su service_subscriptions.activity_id
CREATE INDEX IF NOT EXISTS idx_subs_activity ON service_subscriptions(activity_id);

-- Indice su service_subscriptions.status
CREATE INDEX IF NOT EXISTS idx_subs_status ON service_subscriptions(status);

-- Indice su service_subscriptions.service_id
CREATE INDEX IF NOT EXISTS idx_subs_service ON service_subscriptions(service_id);

-- ============================================
-- 5. TRIGGER updated_at per services
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_subscriptions_updated_at ON service_subscriptions;
CREATE TRIGGER update_service_subscriptions_updated_at
    BEFORE UPDATE ON service_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ROW LEVEL SECURITY
-- ============================================

-- services (pubblici, solo lettura)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Services are public read" ON services;
CREATE POLICY "Services are public read" ON services
    FOR SELECT USING (true);

-- service_subscriptions
ALTER TABLE service_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own activity subscriptions" ON service_subscriptions;
CREATE POLICY "Users see own activity subscriptions" ON service_subscriptions
    FOR SELECT USING (
        activity_id IN (
            SELECT id FROM activities WHERE user_id = auth.uid()
            UNION
            SELECT activity_id FROM activity_users WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert subscriptions for own activities" ON service_subscriptions;
CREATE POLICY "Users can insert subscriptions for own activities" ON service_subscriptions
    FOR INSERT WITH CHECK (
        activity_id IN (
            SELECT id FROM activities WHERE user_id = auth.uid()
            UNION
            SELECT activity_id FROM activity_users
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "Users can update own activity subscriptions" ON service_subscriptions;
CREATE POLICY "Users can update own activity subscriptions" ON service_subscriptions
    FOR UPDATE USING (
        activity_id IN (
            SELECT id FROM activities WHERE user_id = auth.uid()
            UNION
            SELECT activity_id FROM activity_users
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- ============================================
-- 7. CATALOGO SERVIZI
-- INSERT ... ON CONFLICT DO UPDATE
-- ============================================

INSERT INTO services (
    code, name, description,
    price_pro_monthly, price_pro_yearly, price_addon_monthly,
    has_free_tier, trial_days, is_active,
    icon, color_primary, color_dark, color_light,
    sort_order
) VALUES
-- review: Smart Review
(
    'review', 'Smart Review', 'Trasforma ogni recensione in un cliente fedele',
    14.90, 149.00, 12.90,
    TRUE, 30, TRUE,
    'star', '#F59E0B', '#D97706', '#FFFBEB',
    1
),
-- page: Smart Page
(
    'page', 'Smart Page', 'Il tuo biglietto da visita digitale che converte',
    14.90, 149.00, 12.90,
    TRUE, 30, TRUE,
    'file-text', '#3B82F6', '#2563EB', '#EFF6FF',
    2
),
-- menu: Smart Menu
(
    'menu', 'Smart Menu', 'Il menu che fa ordinare di piu',
    24.90, 249.00, 24.90,
    FALSE, 30, TRUE,
    'utensils-crossed', '#10B981', '#059669', '#ECFDF5',
    3
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_pro_monthly = EXCLUDED.price_pro_monthly,
    price_pro_yearly = EXCLUDED.price_pro_yearly,
    price_addon_monthly = EXCLUDED.price_addon_monthly,
    has_free_tier = EXCLUDED.has_free_tier,
    trial_days = EXCLUDED.trial_days,
    is_active = EXCLUDED.is_active,
    icon = EXCLUDED.icon,
    color_primary = EXCLUDED.color_primary,
    color_dark = EXCLUDED.color_dark,
    color_light = EXCLUDED.color_light,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

-- ============================================
-- 8. CHECKPOINT: Verifica servizi inseriti
-- ============================================

SELECT
    code,
    name,
    price_pro_monthly,
    price_pro_yearly,
    price_addon_monthly,
    has_free_tier,
    trial_days,
    is_active,
    icon,
    color_primary,
    color_dark,
    color_light,
    sort_order
FROM services
ORDER BY sort_order;
