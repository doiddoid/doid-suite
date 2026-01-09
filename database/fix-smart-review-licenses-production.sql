-- =====================================================
-- FIX LICENZE SMART REVIEW PER UTENTI MIGRATI DA DOID SUITE
-- Database: dbtpchahdn2f3k (review.doid.it produzione)
-- Data: 2026-01-02
-- =====================================================
--
-- ISTRUZIONI:
-- 1. Accedi a phpMyAdmin o shell MySQL del server review.doid.it
-- 2. Seleziona il database dbtpchahdn2f3k
-- 3. Esegui questo script nella sezione SQL
-- =====================================================

-- STEP 1: Verifica che i piani esistano
SELECT 'VERIFICA PIANI:' AS step;
SELECT id, name, display_name, is_active FROM plans WHERE name IN ('professional', 'free');

-- Se non vedi piani, devi prima eseguire migration-new-plans-2025.sql

-- STEP 2: Conta utenti da sistemare
SELECT 'UTENTI DA SISTEMARE:' AS step;
SELECT COUNT(*) as utenti_da_fix
FROM users u
LEFT JOIN licenses l ON u.license_id = l.id
WHERE u.doid_user_id IS NOT NULL
AND (l.is_active = 0 OR l.plan_id IS NULL);

-- STEP 3: Mostra dettaglio utenti
SELECT 'DETTAGLIO UTENTI:' AS step;
SELECT
    u.email,
    u.doid_user_id,
    l.is_active as license_active,
    l.plan_id,
    CASE WHEN u.email = 'gelaterialeccalecca@libero.it' THEN 'PRO' ELSE 'FREE' END as piano_da_assegnare
FROM users u
LEFT JOIN licenses l ON u.license_id = l.id
WHERE u.doid_user_id IS NOT NULL
ORDER BY u.email;

-- =====================================================
-- STEP 4: FIX LICENZA GELATERIALECCALECCA (PRO)
-- =====================================================
SELECT 'FIX GELATERIALECCALECCA -> PROFESSIONAL:' AS step;

UPDATE licenses
SET is_active = 1,
    plan_id = (SELECT id FROM plans WHERE name = 'professional' AND is_active = 1 LIMIT 1),
    updated = UNIX_TIMESTAMP()
WHERE id = '31745d75-1794-485b-a2c5-fcfdbe8de672';

SELECT ROW_COUNT() as righe_aggiornate_pro;

-- =====================================================
-- STEP 5: FIX TUTTE LE ALTRE LICENZE (FREE)
-- =====================================================
SELECT 'FIX ALTRI UTENTI -> FREE:' AS step;

UPDATE licenses l
INNER JOIN users u ON u.license_id = l.id
SET l.is_active = 1,
    l.plan_id = (SELECT id FROM plans WHERE name = 'free' AND is_active = 1 LIMIT 1),
    l.updated = UNIX_TIMESTAMP()
WHERE u.doid_user_id IS NOT NULL
AND l.id != '31745d75-1794-485b-a2c5-fcfdbe8de672'
AND (l.is_active = 0 OR l.plan_id IS NULL);

SELECT ROW_COUNT() as righe_aggiornate_free;

-- =====================================================
-- STEP 6: VERIFICA RISULTATO
-- =====================================================
SELECT 'VERIFICA FINALE:' AS step;

SELECT
    u.email,
    l.is_active as license_active,
    p.name as plan_name,
    p.display_name as plan_display
FROM users u
JOIN licenses l ON u.license_id = l.id
LEFT JOIN plans p ON l.plan_id = p.id
WHERE u.doid_user_id IS NOT NULL
ORDER BY p.name DESC, u.email;

-- =====================================================
-- FINE SCRIPT
-- =====================================================
