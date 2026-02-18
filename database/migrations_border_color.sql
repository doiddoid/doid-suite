-- ============================================
-- DOID Suite - Border Color Migration
-- Aggiunge campo border_color alla tabella services
-- Run this in Supabase SQL Editor
-- ============================================

-- Aggiungi colonna border_color
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'services' AND column_name = 'border_color') THEN
        ALTER TABLE services ADD COLUMN border_color TEXT;
    END IF;
END $$;

-- Verifica
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'services'
ORDER BY ordinal_position;
