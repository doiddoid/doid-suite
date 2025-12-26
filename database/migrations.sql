-- DOID Suite Database Migrations
-- Run this in Supabase SQL Editor

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE organization_status AS ENUM ('active', 'suspended', 'cancelled');
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'manager', 'user');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'cancelled', 'expired');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');

-- ============================================
-- TABLES
-- ============================================

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    vat_number VARCHAR(50),
    logo_url VARCHAR(500),
    status organization_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization Users (junction table)
CREATE TABLE organization_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Services table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    app_url VARCHAR(255),
    icon VARCHAR(100),
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0
);

-- Plans table
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    price_monthly DECIMAL(10, 2) DEFAULT 0,
    price_yearly DECIMAL(10, 2) DEFAULT 0,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    UNIQUE(service_id, code)
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    status subscription_status DEFAULT 'trial',
    billing_cycle billing_cycle DEFAULT 'monthly',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_organization_users_user_id ON organization_users(user_id);
CREATE INDEX idx_organization_users_organization_id ON organization_users(organization_id);
CREATE INDEX idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX idx_plans_service_id ON plans(service_id);
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their organizations"
    ON organizations FOR SELECT
    USING (
        id IN (
            SELECT organization_id FROM organization_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Owners and admins can update organizations"
    ON organizations FOR UPDATE
    USING (
        id IN (
            SELECT organization_id FROM organization_users
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can insert organizations"
    ON organizations FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Only owners can delete organizations"
    ON organizations FOR DELETE
    USING (
        id IN (
            SELECT organization_id FROM organization_users
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- Organization Users policies
CREATE POLICY "Users can view organization members"
    ON organization_users FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Owners and admins can manage members"
    ON organization_users FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_users
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
        OR
        -- Allow users to add themselves as owners when creating new org
        (user_id = auth.uid() AND role = 'owner')
    );

CREATE POLICY "Owners and admins can update members"
    ON organization_users FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_users
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Owners can delete members"
    ON organization_users FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_users
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- Services policies (public read)
CREATE POLICY "Anyone can view active services"
    ON services FOR SELECT
    USING (is_active = true);

-- Plans policies (public read)
CREATE POLICY "Anyone can view active plans"
    ON plans FOR SELECT
    USING (is_active = true);

-- Subscriptions policies
CREATE POLICY "Users can view their organization subscriptions"
    ON subscriptions FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Owners and admins can manage subscriptions"
    ON subscriptions FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_users
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Owners and admins can update subscriptions"
    ON subscriptions FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_users
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Owners can cancel subscriptions"
    ON subscriptions FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_users
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- ============================================
-- SEED DATA - Services
-- ============================================

INSERT INTO services (code, name, description, app_url, icon, color, is_active, sort_order) VALUES
('smart_review', 'Smart Review', 'Gestione recensioni intelligente per la tua attività', 'https://review.doid.it', 'Star', '#FFB800', true, 1),
('smart_page', 'Smart Page', 'Crea pagine web professionali in pochi click', 'https://page.doid.it', 'FileText', '#3B82F6', true, 2),
('menu_digitale', 'Menu Digitale', 'Il tuo menu sempre aggiornato e accessibile', 'https://menu.doid.it', 'UtensilsCrossed', '#10B981', true, 3),
('display_suite', 'Display Suite', 'Digital signage per la tua attività', 'https://display.doid.it', 'Monitor', '#8B5CF6', true, 4);

-- ============================================
-- SEED DATA - Plans
-- ============================================

-- Smart Review Plans
INSERT INTO plans (service_id, code, name, price_monthly, price_yearly, features, is_active, sort_order)
SELECT
    id,
    'free',
    'Free',
    0,
    0,
    '["Fino a 50 recensioni/mese", "1 piattaforma", "Dashboard base"]'::jsonb,
    true,
    1
FROM services WHERE code = 'smart_review';

INSERT INTO plans (service_id, code, name, price_monthly, price_yearly, features, is_active, sort_order)
SELECT
    id,
    'pro',
    'Pro',
    19.99,
    199.99,
    '["Recensioni illimitate", "Tutte le piattaforme", "Risposte AI", "Report avanzati"]'::jsonb,
    true,
    2
FROM services WHERE code = 'smart_review';

INSERT INTO plans (service_id, code, name, price_monthly, price_yearly, features, is_active, sort_order)
SELECT
    id,
    'business',
    'Business',
    49.99,
    499.99,
    '["Tutto Pro", "Multi-location", "API access", "Support prioritario"]'::jsonb,
    true,
    3
FROM services WHERE code = 'smart_review';

-- Smart Page Plans
INSERT INTO plans (service_id, code, name, price_monthly, price_yearly, features, is_active, sort_order)
SELECT
    id,
    'free',
    'Free',
    0,
    0,
    '["1 pagina", "Template base", "Sottodominio doid.it"]'::jsonb,
    true,
    1
FROM services WHERE code = 'smart_page';

INSERT INTO plans (service_id, code, name, price_monthly, price_yearly, features, is_active, sort_order)
SELECT
    id,
    'pro',
    'Pro',
    14.99,
    149.99,
    '["5 pagine", "Tutti i template", "Dominio personalizzato", "Analytics"]'::jsonb,
    true,
    2
FROM services WHERE code = 'smart_page';

INSERT INTO plans (service_id, code, name, price_monthly, price_yearly, features, is_active, sort_order)
SELECT
    id,
    'business',
    'Business',
    39.99,
    399.99,
    '["Pagine illimitate", "Editor avanzato", "Integrazioni", "White label"]'::jsonb,
    true,
    3
FROM services WHERE code = 'smart_page';

-- Menu Digitale Plans
INSERT INTO plans (service_id, code, name, price_monthly, price_yearly, features, is_active, sort_order)
SELECT
    id,
    'free',
    'Free',
    0,
    0,
    '["1 menu", "50 prodotti", "QR Code base"]'::jsonb,
    true,
    1
FROM services WHERE code = 'menu_digitale';

INSERT INTO plans (service_id, code, name, price_monthly, price_yearly, features, is_active, sort_order)
SELECT
    id,
    'pro',
    'Pro',
    9.99,
    99.99,
    '["3 menu", "Prodotti illimitati", "QR personalizzato", "Allergeni"]'::jsonb,
    true,
    2
FROM services WHERE code = 'menu_digitale';

INSERT INTO plans (service_id, code, name, price_monthly, price_yearly, features, is_active, sort_order)
SELECT
    id,
    'business',
    'Business',
    29.99,
    299.99,
    '["Menu illimitati", "Multi-lingua", "Ordinazioni", "Integrazioni POS"]'::jsonb,
    true,
    3
FROM services WHERE code = 'menu_digitale';

-- Display Suite Plans
INSERT INTO plans (service_id, code, name, price_monthly, price_yearly, features, is_active, sort_order)
SELECT
    id,
    'free',
    'Free',
    0,
    0,
    '["1 display", "5 slide", "Template base"]'::jsonb,
    true,
    1
FROM services WHERE code = 'display_suite';

INSERT INTO plans (service_id, code, name, price_monthly, price_yearly, features, is_active, sort_order)
SELECT
    id,
    'pro',
    'Pro',
    24.99,
    249.99,
    '["5 display", "Slide illimitate", "Scheduling", "Widget meteo/news"]'::jsonb,
    true,
    2
FROM services WHERE code = 'display_suite';

INSERT INTO plans (service_id, code, name, price_monthly, price_yearly, features, is_active, sort_order)
SELECT
    id,
    'business',
    'Business',
    59.99,
    599.99,
    '["Display illimitati", "Multi-location", "Analytics", "API & Webhook"]'::jsonb,
    true,
    3
FROM services WHERE code = 'display_suite';

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get user's organizations with role
CREATE OR REPLACE FUNCTION get_user_organizations(p_user_id UUID)
RETURNS TABLE (
    organization_id UUID,
    organization_name VARCHAR,
    organization_slug VARCHAR,
    user_role user_role
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.name,
        o.slug,
        ou.role
    FROM organizations o
    JOIN organization_users ou ON o.id = ou.organization_id
    WHERE ou.user_id = p_user_id AND o.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to organization
CREATE OR REPLACE FUNCTION user_has_org_access(p_user_id UUID, p_organization_id UUID, p_min_role user_role DEFAULT 'user')
RETURNS BOOLEAN AS $$
DECLARE
    v_role user_role;
    v_role_order INTEGER;
    v_min_role_order INTEGER;
BEGIN
    SELECT role INTO v_role
    FROM organization_users
    WHERE user_id = p_user_id AND organization_id = p_organization_id;

    IF v_role IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Role hierarchy: owner > admin > manager > user
    v_role_order := CASE v_role
        WHEN 'owner' THEN 4
        WHEN 'admin' THEN 3
        WHEN 'manager' THEN 2
        WHEN 'user' THEN 1
    END;

    v_min_role_order := CASE p_min_role
        WHEN 'owner' THEN 4
        WHEN 'admin' THEN 3
        WHEN 'manager' THEN 2
        WHEN 'user' THEN 1
    END;

    RETURN v_role_order >= v_min_role_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organization services with subscription status
CREATE OR REPLACE FUNCTION get_organization_services(p_organization_id UUID)
RETURNS TABLE (
    service_id UUID,
    service_code VARCHAR,
    service_name VARCHAR,
    service_description TEXT,
    service_app_url VARCHAR,
    service_icon VARCHAR,
    service_color VARCHAR,
    subscription_id UUID,
    subscription_status subscription_status,
    plan_id UUID,
    plan_code VARCHAR,
    plan_name VARCHAR,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.code,
        s.name,
        s.description,
        s.app_url,
        s.icon,
        s.color,
        sub.id,
        sub.status,
        p.id,
        p.code,
        p.name,
        sub.trial_ends_at,
        sub.current_period_end
    FROM services s
    LEFT JOIN subscriptions sub ON sub.organization_id = p_organization_id
        AND sub.plan_id IN (SELECT id FROM plans WHERE service_id = s.id)
        AND sub.status NOT IN ('cancelled', 'expired')
    LEFT JOIN plans p ON sub.plan_id = p.id
    WHERE s.is_active = true
    ORDER BY s.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
