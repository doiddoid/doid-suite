-- ============================================
-- DOID Suite - Color Light Migration
-- Aggiunge campo color_light alla tabella services
-- Run this in Supabase SQL Editor
-- ============================================

-- Aggiungi colonna color_light
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'services' AND column_name = 'color_light') THEN
        ALTER TABLE services ADD COLUMN color_light TEXT;
    END IF;
END $$;

-- Verifica
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'services'
ORDER BY ordinal_position;
