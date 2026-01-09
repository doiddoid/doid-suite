-- ============================================
-- EXPORT UTENTI DA SMART REVIEW (MySQL)
-- ============================================
-- Esegui questa query in phpMyAdmin o MySQL client
-- Database: dbtpchahdn2f3k
--
-- ISTRUZIONI:
-- 1. Vai su phpMyAdmin del server doid.it
-- 2. Seleziona il database: dbtpchahdn2f3k
-- 3. Vai su "SQL" ed esegui questa query
-- 4. Clicca "Esporta" e scegli formato CSV
-- 5. Salva il file come: users-smart.csv
-- ============================================

SELECT
    u.id,
    u.email,
    u.name,
    u.surname,
    u.password_hash,
    u.is_admin,
    u.is_active,
    UNIX_TIMESTAMP(NOW()) as created_at,
    l.id as license_id,
    l.is_active as license_active,
    l.expiration as license_expiration
FROM users u
LEFT JOIN licenses l ON u.license_id = l.id
WHERE u.email IS NOT NULL
  AND u.email != ''
  AND u.is_active = 1
ORDER BY u.email;

-- ============================================
-- QUERY ALTERNATIVA (solo utenti base)
-- Se la query sopra non funziona, usa questa:
-- ============================================
/*
SELECT
    id,
    email,
    name,
    surname,
    phone,
    company_name,
    password_hash,
    is_admin,
    is_active,
    UNIX_TIMESTAMP(NOW()) as created_at
FROM users
WHERE email IS NOT NULL
  AND email != ''
  AND is_active = 1
ORDER BY email;
*/
