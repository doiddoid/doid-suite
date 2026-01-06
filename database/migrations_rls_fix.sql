-- ============================================
-- DOID Suite - RLS Fix Migration
-- Abilita RLS su tabelle che lo richiedono
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. organizations - RLS con policy admin bypass
-- ============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Service role può fare tutto (backend usa service key)
DROP POLICY IF EXISTS "Service role full access" ON organizations;
CREATE POLICY "Service role full access" ON organizations
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Policy: Utenti vedono solo le proprie organizzazioni
DROP POLICY IF EXISTS "Users see own organizations" ON organizations;
CREATE POLICY "Users see own organizations" ON organizations
    FOR SELECT
    USING (
        id IN (
            SELECT organization_id
            FROM organization_users
            WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- 2. users table (se esiste - legacy)
-- ============================================
-- Nota: La tabella 'users' potrebbe essere legacy.
-- Il backend usa auth.users di Supabase.
-- Se la tabella esiste, abilitiamo RLS per sicurezza.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;

        -- Service role full access
        DROP POLICY IF EXISTS "Service role full access" ON users;
        CREATE POLICY "Service role full access" ON users
            FOR ALL
            USING (auth.role() = 'service_role')
            WITH CHECK (auth.role() = 'service_role');

        -- Users see own data
        DROP POLICY IF EXISTS "Users see own data" ON users;
        CREATE POLICY "Users see own data" ON users
            FOR SELECT
            USING (id = auth.uid());
    END IF;
END $$;

-- ============================================
-- 3. pois, comuni, tours, tour_contributions
-- Queste sembrano tabelle di un altro progetto
-- Le mettiamo in RLS con accesso pubblico in lettura
-- ============================================

-- pois
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pois') THEN
        ALTER TABLE pois ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Public read access" ON pois;
        CREATE POLICY "Public read access" ON pois
            FOR SELECT USING (true);

        DROP POLICY IF EXISTS "Service role full access" ON pois;
        CREATE POLICY "Service role full access" ON pois
            FOR ALL
            USING (auth.role() = 'service_role')
            WITH CHECK (auth.role() = 'service_role');
    END IF;
END $$;

-- comuni
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comuni') THEN
        ALTER TABLE comuni ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Public read access" ON comuni;
        CREATE POLICY "Public read access" ON comuni
            FOR SELECT USING (true);

        DROP POLICY IF EXISTS "Service role full access" ON comuni;
        CREATE POLICY "Service role full access" ON comuni
            FOR ALL
            USING (auth.role() = 'service_role')
            WITH CHECK (auth.role() = 'service_role');
    END IF;
END $$;

-- tours
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tours') THEN
        ALTER TABLE tours ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Public read access" ON tours;
        CREATE POLICY "Public read access" ON tours
            FOR SELECT USING (true);

        DROP POLICY IF EXISTS "Service role full access" ON tours;
        CREATE POLICY "Service role full access" ON tours
            FOR ALL
            USING (auth.role() = 'service_role')
            WITH CHECK (auth.role() = 'service_role');
    END IF;
END $$;

-- tour_contributions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tour_contributions') THEN
        ALTER TABLE tour_contributions ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Public read access" ON tour_contributions;
        CREATE POLICY "Public read access" ON tour_contributions
            FOR SELECT USING (true);

        DROP POLICY IF EXISTS "Service role full access" ON tour_contributions;
        CREATE POLICY "Service role full access" ON tour_contributions
            FOR ALL
            USING (auth.role() = 'service_role')
            WITH CHECK (auth.role() = 'service_role');
    END IF;
END $$;

-- ============================================
-- FINE MIGRAZIONE
-- ============================================
-- Dopo aver eseguito questa migrazione, gli alert
-- RLS in Supabase dovrebbero sparire.
-- ============================================
