-- ============================================
-- DOID Suite - Service Details Migration
-- Aggiunge campi per tagline, headline, benefits, contact_required
-- Run this in Supabase SQL Editor
-- ============================================

-- Aggiungi colonna tagline (claim)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'services' AND column_name = 'tagline') THEN
        ALTER TABLE services ADD COLUMN tagline TEXT;
    END IF;
END $$;

-- Aggiungi colonna headline (titolo principale)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'services' AND column_name = 'headline') THEN
        ALTER TABLE services ADD COLUMN headline TEXT;
    END IF;
END $$;

-- Aggiungi colonna benefits (vantaggi - array JSON)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'services' AND column_name = 'benefits') THEN
        ALTER TABLE services ADD COLUMN benefits JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Aggiungi colonna contact_required (flag richiedi info)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'services' AND column_name = 'contact_required') THEN
        ALTER TABLE services ADD COLUMN contact_required BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Verifica
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'services'
ORDER BY ordinal_position;
