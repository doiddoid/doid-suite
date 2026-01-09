-- =====================================================
-- FIX LICENZE SMART REVIEW PER UTENTI MIGRATI DA DOID SUITE
-- Data: 2026-01-02
-- =====================================================
--
-- Problema: Gli utenti migrati da DOID Suite hanno:
-- 1. doid_user_id e doid_activity_id popolati
-- 2. license_id che punta a una licenza, MA:
--    - La licenza ha is_active = 0
--    - La licenza ha plan_id = NULL
--
-- Soluzione: Attivare le licenze e assegnare il piano corretto
-- =====================================================

-- STEP 1: Trova o crea il piano "professional"
-- (gelaterialeccalecca deve avere PRO)

-- Prima verifica se esiste il piano professional
SELECT id, name, display_name FROM plans WHERE name = 'professional' AND is_active = 1;

-- STEP 2: Trova o crea il piano "free"
-- (tutti gli altri utenti avranno FREE)

SELECT id, name, display_name FROM plans WHERE name = 'free' AND is_active = 1;

-- STEP 3: Mostra gli utenti con doid_user_id (migrati) e le loro licenze
SELECT
    u.id as user_id,
    u.email,
    u.license_id,
    u.doid_user_id,
    l.id as license_id_check,
    l.is_active as license_is_active,
    l.plan_id
FROM users u
LEFT JOIN licenses l ON u.license_id = l.id
WHERE u.doid_user_id IS NOT NULL
ORDER BY u.email;

-- =====================================================
-- ESEGUIRE QUESTI COMANDI DOPO AVER VERIFICATO I PIANI:
-- =====================================================

-- Sostituire @pro_plan_id e @free_plan_id con gli ID reali
-- SET @pro_plan_id = 'ID_DEL_PIANO_PROFESSIONAL';
-- SET @free_plan_id = 'ID_DEL_PIANO_FREE';

-- STEP 4: Attiva licenza di gelaterialeccalecca e assegna piano PRO
UPDATE licenses
SET is_active = 1,
    plan_id = (SELECT id FROM plans WHERE name = 'professional' AND is_active = 1 LIMIT 1),
    updated = UNIX_TIMESTAMP()
WHERE id = '31745d75-1794-485b-a2c5-fcfdbe8de672';

-- STEP 5: Attiva tutte le altre licenze degli utenti migrati e assegna piano FREE
UPDATE licenses l
INNER JOIN users u ON u.license_id = l.id
SET l.is_active = 1,
    l.plan_id = (SELECT id FROM plans WHERE name = 'free' AND is_active = 1 LIMIT 1),
    l.updated = UNIX_TIMESTAMP()
WHERE u.doid_user_id IS NOT NULL
AND l.id != '31745d75-1794-485b-a2c5-fcfdbe8de672'
AND (l.is_active = 0 OR l.plan_id IS NULL);

-- STEP 6: Verifica risultato
SELECT
    u.email,
    l.is_active,
    p.name as plan_name,
    p.display_name as plan_display_name
FROM users u
JOIN licenses l ON u.license_id = l.id
LEFT JOIN plans p ON l.plan_id = p.id
WHERE u.doid_user_id IS NOT NULL
ORDER BY u.email;
