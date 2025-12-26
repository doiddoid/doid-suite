-- Fix subscriptions schema per supportare activity-based subscriptions
-- Eseguire in Supabase SQL Editor

-- 1. Rendi organization_id nullable (ora usiamo activity_id)
ALTER TABLE subscriptions
ALTER COLUMN organization_id DROP NOT NULL;

-- 2. Aggiungi colonna cancelled_at se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'subscriptions' AND column_name = 'cancelled_at') THEN
        ALTER TABLE subscriptions ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 3. Verifica che activity_id esista (dovrebbe già esistere da migrations_activities.sql)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'subscriptions' AND column_name = 'activity_id') THEN
        ALTER TABLE subscriptions ADD COLUMN activity_id UUID REFERENCES activities(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_subscriptions_activity ON subscriptions(activity_id);
    END IF;
END $$;

-- 4. Verifica che service_id esista
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'subscriptions' AND column_name = 'service_id') THEN
        ALTER TABLE subscriptions ADD COLUMN service_id UUID REFERENCES services(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_subscriptions_service ON subscriptions(service_id);
    END IF;
END $$;

-- 5. Crea constraint unique per activity_id + service_id se non esiste
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

-- 6. Aggiorna le attività che non hanno organization_id
-- Associa le attività orfane all'organizzazione dell'owner
UPDATE activities a
SET organization_id = (
    SELECT ou.organization_id
    FROM activity_users au
    JOIN organization_users ou ON au.user_id = ou.user_id
    WHERE au.activity_id = a.id
    AND au.role = 'owner'
    LIMIT 1
)
WHERE a.organization_id IS NULL;

-- Mostra risultato
SELECT
    'Subscriptions schema fix completato!' as message,
    (SELECT COUNT(*) FROM subscriptions WHERE activity_id IS NOT NULL) as subscriptions_with_activity,
    (SELECT COUNT(*) FROM activities WHERE organization_id IS NOT NULL) as activities_with_org;
