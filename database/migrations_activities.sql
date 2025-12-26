-- DOID Suite - Activities & Subscriptions Migration
-- Run this in Supabase SQL Editor

-- ============================================
-- TABELLA: activities
-- ============================================

CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    vat_number VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    logo_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_slug ON activities(slug);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);

-- ============================================
-- TABELLA: activity_users
-- ============================================

CREATE TABLE IF NOT EXISTS activity_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(activity_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_users_user ON activity_users(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_users_activity ON activity_users(activity_id);

-- ============================================
-- TABELLA: services (se non esiste già)
-- ============================================

CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    app_url VARCHAR(255) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABELLA: plans (se non esiste già)
-- ============================================

CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) DEFAULT 0,
    price_yearly DECIMAL(10,2) DEFAULT 0,
    trial_days INTEGER DEFAULT 30,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(service_id, code)
);

-- ============================================
-- AGGIORNA TABELLA: subscriptions per activity-based
-- ============================================

-- Aggiungi colonna activity_id se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'subscriptions' AND column_name = 'activity_id') THEN
        ALTER TABLE subscriptions ADD COLUMN activity_id UUID REFERENCES activities(id) ON DELETE CASCADE;
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

-- Crea indici
CREATE INDEX IF NOT EXISTS idx_subscriptions_activity ON subscriptions(activity_id);

-- Crea constraint unique per activity_id + service_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'subscriptions_activity_service_unique'
    ) THEN
        ALTER TABLE subscriptions
        ADD CONSTRAINT subscriptions_activity_service_unique
        UNIQUE (activity_id, service_id);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- INSERISCI SERVIZI DOID
-- ============================================

INSERT INTO services (code, name, description, app_url, icon, color, sort_order) VALUES
('smart_review', 'Smart Review', 'Gestisci le recensioni della tua attività con filtro intelligente', 'https://review.doid.it/app', 'star', '#FFB800', 1),
('smart_page', 'Smart Page', 'Crea landing page e biglietti da visita digitali', 'https://page.doid.it', 'file-text', '#3B82F6', 2),
('menu_digitale', 'Menu Digitale', 'Menu digitale per ristoranti con QR code', 'https://menu.doid.it', 'utensils', '#10B981', 3),
('display_suite', 'Display Suite', 'Gestisci contenuti su monitor e digital signage', 'https://display.doid.it', 'monitor', '#8B5CF6', 4)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    app_url = EXCLUDED.app_url,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    sort_order = EXCLUDED.sort_order;

-- ============================================
-- INSERISCI PIANI
-- ============================================

-- Smart Review Plans
INSERT INTO plans (service_id, code, name, price_monthly, price_yearly, trial_days, features, sort_order)
SELECT id, 'free', 'Free', 0, 0, 0, '{"platforms": 2, "filter": false}'::jsonb, 1
FROM services WHERE code = 'smart_review'
ON CONFLICT (service_id, code) DO UPDATE SET
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    trial_days = EXCLUDED.trial_days,
    features = EXCLUDED.features;

INSERT INTO plans (service_id, code, name, price_monthly, price_yearly, trial_days, features, sort_order)
SELECT id, 'pro', 'Pro', 14.90, 149.00, 30, '{"platforms": 10, "filter": true}'::jsonb, 2
FROM services WHERE code = 'smart_review'
ON CONFLICT (service_id, code) DO UPDATE SET
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    trial_days = EXCLUDED.trial_days,
    features = EXCLUDED.features;

-- Smart Page Plans
INSERT INTO plans (service_id, code, name, price_monthly, price_yearly, trial_days, features, sort_order)
SELECT id, 'free', 'Free', 0, 0, 0, '{"pages": 1, "custom_domain": false}'::jsonb, 1
FROM services WHERE code = 'smart_page'
ON CONFLICT (service_id, code) DO UPDATE SET
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    trial_days = EXCLUDED.trial_days,
    features = EXCLUDED.features;

INSERT INTO plans (service_id, code, name, price_monthly, price_yearly, trial_days, features, sort_order)
SELECT id, 'pro', 'Pro', 9.90, 99.00, 30, '{"pages": 10, "custom_domain": true}'::jsonb, 2
FROM services WHERE code = 'smart_page'
ON CONFLICT (service_id, code) DO UPDATE SET
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    trial_days = EXCLUDED.trial_days,
    features = EXCLUDED.features;

-- Menu Digitale Plans
INSERT INTO plans (service_id, code, name, price_monthly, price_yearly, trial_days, features, sort_order)
SELECT id, 'free', 'Free', 0, 0, 0, '{"menus": 1, "items": 20}'::jsonb, 1
FROM services WHERE code = 'menu_digitale'
ON CONFLICT (service_id, code) DO UPDATE SET
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    trial_days = EXCLUDED.trial_days,
    features = EXCLUDED.features;

INSERT INTO plans (service_id, code, name, price_monthly, price_yearly, trial_days, features, sort_order)
SELECT id, 'pro', 'Pro', 12.90, 129.00, 30, '{"menus": 5, "items": -1}'::jsonb, 2
FROM services WHERE code = 'menu_digitale'
ON CONFLICT (service_id, code) DO UPDATE SET
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    trial_days = EXCLUDED.trial_days,
    features = EXCLUDED.features;

-- Display Suite Plans
INSERT INTO plans (service_id, code, name, price_monthly, price_yearly, trial_days, features, sort_order)
SELECT id, 'starter', 'Starter', 19.90, 199.00, 30, '{"displays": 1, "storage_gb": 5}'::jsonb, 1
FROM services WHERE code = 'display_suite'
ON CONFLICT (service_id, code) DO UPDATE SET
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    trial_days = EXCLUDED.trial_days,
    features = EXCLUDED.features;

INSERT INTO plans (service_id, code, name, price_monthly, price_yearly, trial_days, features, sort_order)
SELECT id, 'pro', 'Pro', 39.90, 399.00, 30, '{"displays": 5, "storage_gb": 20}'::jsonb, 2
FROM services WHERE code = 'display_suite'
ON CONFLICT (service_id, code) DO UPDATE SET
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    trial_days = EXCLUDED.trial_days,
    features = EXCLUDED.features;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own activities" ON activities;
CREATE POLICY "Users see own activities" ON activities
    FOR SELECT USING (
        id IN (SELECT activity_id FROM activity_users WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can create activities" ON activities;
CREATE POLICY "Users can create activities" ON activities
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Owners admins can update activities" ON activities;
CREATE POLICY "Owners admins can update activities" ON activities
    FOR UPDATE USING (
        id IN (
            SELECT activity_id FROM activity_users
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Activity Users
ALTER TABLE activity_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own activity memberships" ON activity_users;
CREATE POLICY "Users see own activity memberships" ON activity_users
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users see activity members" ON activity_users;
CREATE POLICY "Users see activity members" ON activity_users
    FOR SELECT USING (
        activity_id IN (SELECT activity_id FROM activity_users WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Can insert own membership" ON activity_users;
CREATE POLICY "Can insert own membership" ON activity_users
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Services (pubblici)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Services are public" ON services;
CREATE POLICY "Services are public" ON services FOR SELECT USING (true);

-- Plans (pubblici)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Plans are public" ON plans;
CREATE POLICY "Plans are public" ON plans FOR SELECT USING (true);

-- Subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see subscriptions of own activities" ON subscriptions;
CREATE POLICY "Users see subscriptions of own activities" ON subscriptions
    FOR SELECT USING (
        activity_id IN (SELECT activity_id FROM activity_users WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can insert subscriptions for own activities" ON subscriptions;
CREATE POLICY "Users can insert subscriptions for own activities" ON subscriptions
    FOR INSERT WITH CHECK (
        activity_id IN (
            SELECT activity_id FROM activity_users
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "Users can update subscriptions of own activities" ON subscriptions;
CREATE POLICY "Users can update subscriptions of own activities" ON subscriptions
    FOR UPDATE USING (
        activity_id IN (
            SELECT activity_id FROM activity_users
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- ============================================
-- TRIGGER updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
CREATE TRIGGER update_activities_updated_at
    BEFORE UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNZIONI HELPER
-- ============================================

-- Funzione per verificare se utente ha accesso all'attività
CREATE OR REPLACE FUNCTION user_has_activity_access(p_user_id UUID, p_activity_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM activity_users
        WHERE user_id = p_user_id AND activity_id = p_activity_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per ottenere ruolo utente in attività
CREATE OR REPLACE FUNCTION get_user_role_in_activity(p_user_id UUID, p_activity_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_role VARCHAR;
BEGIN
    SELECT role INTO v_role
    FROM activity_users
    WHERE user_id = p_user_id AND activity_id = p_activity_id;

    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per verificare abbonamento attivo
CREATE OR REPLACE FUNCTION activity_has_active_subscription(p_activity_id UUID, p_service_code VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    v_subscription RECORD;
BEGIN
    SELECT s.*, p.code as plan_code
    INTO v_subscription
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    JOIN services srv ON s.service_id = srv.id
    WHERE s.activity_id = p_activity_id
      AND srv.code = p_service_code
      AND s.status IN ('trial', 'active');

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Piano free è sempre attivo
    IF v_subscription.plan_code = 'free' THEN
        RETURN TRUE;
    END IF;

    -- Verifica scadenza
    IF v_subscription.status = 'trial' THEN
        RETURN v_subscription.trial_ends_at > NOW();
    ELSIF v_subscription.status = 'active' THEN
        RETURN v_subscription.current_period_end > NOW();
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
