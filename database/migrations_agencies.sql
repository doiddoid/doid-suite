-- ============================================
-- DOID Suite - Migration: Agenzie e Pacchetti
-- ============================================
-- Eseguire in Supabase SQL Editor DOPO migrations_activities.sql

-- ============================================
-- 1. ENUM PER TIPO ACCOUNT
-- ============================================

-- Tipo di account: agenzia (multi-attività) o singola attività
CREATE TYPE account_type AS ENUM ('single', 'agency');

-- ============================================
-- 2. MODIFICHE TABELLA ORGANIZATIONS
-- ============================================

-- Aggiunge tipo account (default: single per retrocompatibilità)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS account_type account_type DEFAULT 'single';

-- Aggiunge limiti per agenzia
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS max_activities INTEGER DEFAULT 1;

-- Aggiunge flag per indicare se creata da super admin
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS created_by_admin BOOLEAN DEFAULT false;

-- Commenti
COMMENT ON COLUMN organizations.account_type IS 'single = attività singola, agency = agenzia multi-attività';
COMMENT ON COLUMN organizations.max_activities IS 'Numero massimo di attività per agenzia (1 per single)';

-- ============================================
-- 3. MODIFICHE TABELLA ACTIVITIES
-- ============================================

-- Aggiunge relazione con organizzazione (agenzia)
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Indice per query veloci
CREATE INDEX IF NOT EXISTS idx_activities_organization_id ON activities(organization_id);

-- Commenti
COMMENT ON COLUMN activities.organization_id IS 'FK a organizzazione/agenzia proprietaria (NULL se attività indipendente)';

-- ============================================
-- 4. TABELLA PACCHETTI SERVIZI
-- ============================================

CREATE TABLE IF NOT EXISTS service_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0,
    max_activities INTEGER DEFAULT 5,          -- Quante attività possono usare il pacchetto
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger per updated_at
CREATE TRIGGER update_service_packages_updated_at
    BEFORE UPDATE ON service_packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE service_packages IS 'Pacchetti di servizi per agenzie';
COMMENT ON COLUMN service_packages.max_activities IS 'Numero di attività che possono usare i servizi del pacchetto';

-- ============================================
-- 5. TABELLA SERVIZI NEL PACCHETTO
-- ============================================

CREATE TABLE IF NOT EXISTS package_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(package_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_package_services_package_id ON package_services(package_id);
CREATE INDEX IF NOT EXISTS idx_package_services_service_id ON package_services(service_id);

COMMENT ON TABLE package_services IS 'Servizi inclusi in ogni pacchetto con relativo piano';

-- ============================================
-- 6. MODIFICHE TABELLA SUBSCRIPTIONS
-- ============================================

-- Aggiunge supporto per pacchetti
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES service_packages(id) ON DELETE SET NULL;

-- Flag per indicare se abbonamento ereditato da pacchetto agenzia
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS inherited_from_org BOOLEAN DEFAULT false;

-- Indice
CREATE INDEX IF NOT EXISTS idx_subscriptions_package_id ON subscriptions(package_id);

COMMENT ON COLUMN subscriptions.package_id IS 'FK a pacchetto (se abbonamento da pacchetto)';
COMMENT ON COLUMN subscriptions.inherited_from_org IS 'True se attività eredita abbonamento da agenzia';

-- ============================================
-- 7. TABELLA ABBONAMENTI PACCHETTO (per agenzia)
-- ============================================

CREATE TABLE IF NOT EXISTS organization_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE RESTRICT,
    status subscription_status DEFAULT 'trial',
    billing_cycle billing_cycle DEFAULT 'monthly',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, package_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_packages_org_id ON organization_packages(organization_id);

-- Trigger per updated_at
CREATE TRIGGER update_organization_packages_updated_at
    BEFORE UPDATE ON organization_packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE organization_packages IS 'Abbonamenti a pacchetti per agenzie';

-- ============================================
-- 8. RLS POLICIES
-- ============================================

-- Service Packages (tutti possono leggere, solo admin può modificare)
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages" ON service_packages
    FOR SELECT USING (is_active = true);

-- Package Services (tutti possono leggere)
ALTER TABLE package_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view package services" ON package_services
    FOR SELECT USING (true);

-- Organization Packages (solo membri org)
ALTER TABLE organization_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their packages" ON organization_packages
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Org admins can manage packages" ON organization_packages
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_users
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Activities: aggiunge policy per accesso tramite organizzazione
CREATE POLICY "Org members can view org activities" ON activities
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Org admins can manage org activities" ON activities
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_users
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- ============================================
-- 9. SEED DATA: PACCHETTI DI ESEMPIO
-- ============================================

-- Pacchetto Starter Agency
INSERT INTO service_packages (code, name, description, price_monthly, price_yearly, max_activities, sort_order) VALUES
('agency_starter', 'Agency Starter', 'Pacchetto base per agenzie: Smart Review + Menu Digitale per 5 attività', 49.90, 499.00, 5, 1),
('agency_pro', 'Agency Pro', 'Pacchetto completo: tutti i servizi Pro per 10 attività', 99.90, 999.00, 10, 2),
('agency_enterprise', 'Agency Enterprise', 'Pacchetto illimitato: tutti i servizi Business per attività illimitate', 199.90, 1999.00, -1, 3)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    max_activities = EXCLUDED.max_activities;

-- Associa servizi ai pacchetti (dopo aver verificato gli ID)
-- Questo va eseguito manualmente dopo aver controllato gli ID dei servizi e piani

-- ============================================
-- 10. FUNZIONI HELPER
-- ============================================

-- Funzione: verifica se utente ha accesso a un'attività (diretto o tramite org)
CREATE OR REPLACE FUNCTION user_has_activity_access(p_user_id UUID, p_activity_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_direct_access BOOLEAN;
    v_has_org_access BOOLEAN;
    v_org_id UUID;
BEGIN
    -- Accesso diretto tramite activity_users
    SELECT EXISTS(
        SELECT 1 FROM activity_users
        WHERE activity_id = p_activity_id AND user_id = p_user_id
    ) INTO v_has_direct_access;

    IF v_has_direct_access THEN
        RETURN TRUE;
    END IF;

    -- Accesso tramite organizzazione
    SELECT organization_id INTO v_org_id FROM activities WHERE id = p_activity_id;

    IF v_org_id IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM organization_users
            WHERE organization_id = v_org_id AND user_id = p_user_id
        ) INTO v_has_org_access;

        RETURN v_has_org_access;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione: ottieni ruolo utente in attività (considerando gerarchia org)
CREATE OR REPLACE FUNCTION get_user_activity_role(p_user_id UUID, p_activity_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_direct_role TEXT;
    v_org_role TEXT;
    v_org_id UUID;
BEGIN
    -- Ruolo diretto
    SELECT role INTO v_direct_role
    FROM activity_users
    WHERE activity_id = p_activity_id AND user_id = p_user_id;

    IF v_direct_role IS NOT NULL THEN
        RETURN v_direct_role;
    END IF;

    -- Ruolo tramite organizzazione
    SELECT organization_id INTO v_org_id FROM activities WHERE id = p_activity_id;

    IF v_org_id IS NOT NULL THEN
        SELECT role INTO v_org_role
        FROM organization_users
        WHERE organization_id = v_org_id AND user_id = p_user_id;

        IF v_org_role IS NOT NULL THEN
            -- Mappa ruolo org a ruolo attività (admin org = admin attività)
            RETURN v_org_role;
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione: conta attività di un'organizzazione
CREATE OR REPLACE FUNCTION count_org_activities(p_org_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM activities WHERE organization_id = p_org_id AND status = 'active');
END;
$$ LANGUAGE plpgsql;

-- Funzione: verifica se org può aggiungere attività
CREATE OR REPLACE FUNCTION org_can_add_activity(p_org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_max INTEGER;
    v_current INTEGER;
BEGIN
    SELECT max_activities INTO v_max FROM organizations WHERE id = p_org_id;
    SELECT count_org_activities(p_org_id) INTO v_current;

    -- -1 significa illimitato
    IF v_max = -1 THEN
        RETURN TRUE;
    END IF;

    RETURN v_current < v_max;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 11. AGGIORNA ORGANIZZAZIONI ESISTENTI
-- ============================================

-- Imposta account_type = 'single' per tutte le org esistenti senza attività collegate
UPDATE organizations
SET account_type = 'single', max_activities = 1
WHERE account_type IS NULL;

-- ============================================
-- FINE MIGRATION
-- ============================================
