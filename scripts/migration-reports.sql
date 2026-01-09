-- ============================================
-- DOID Suite - Migration Reports
-- Query per monitorare lo stato della migrazione utenti
-- ============================================

-- ============================================
-- 1. CONTEGGIO PER STATUS
-- ============================================

-- Conteggio totale per migration_status
SELECT
    COALESCE(p.migration_status, 'native') AS status,
    COUNT(*) AS count
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
GROUP BY p.migration_status
ORDER BY count DESC;

-- Conteggio dettagliato con percentuali
SELECT
    COALESCE(p.migration_status, 'native') AS status,
    COUNT(*) AS count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS percentage
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
GROUP BY p.migration_status
ORDER BY count DESC;

-- Conteggio per servizio di origine
SELECT
    COALESCE(p.migrated_from, 'native') AS source,
    p.migration_status,
    COUNT(*) AS count
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
GROUP BY p.migrated_from, p.migration_status
ORDER BY source, migration_status;


-- ============================================
-- 2. LISTA UTENTI PENDING (per export GHL)
-- ============================================

-- Lista completa utenti pending con email
SELECT
    u.id,
    u.email,
    u.raw_user_meta_data->>'full_name' AS full_name,
    p.migrated_from,
    p.created_at AS migration_date
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE p.migration_status = 'pending'
ORDER BY p.created_at DESC;

-- Export CSV-friendly per GHL (solo campi necessari)
SELECT
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', '') AS full_name,
    COALESCE(p.migrated_from, '') AS migrated_from,
    TO_CHAR(p.created_at, 'YYYY-MM-DD') AS migration_date
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE p.migration_status = 'pending'
ORDER BY u.email;


-- ============================================
-- 3. LISTA UTENTI CONFIRMED CON DATA PRIMO LOGIN
-- ============================================

-- Utenti che hanno confermato (primo login effettuato)
SELECT
    u.id,
    u.email,
    u.raw_user_meta_data->>'full_name' AS full_name,
    p.migrated_from,
    p.first_login_after_migration,
    p.password_changed,
    p.password_changed_at
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE p.migration_status = 'confirmed'
ORDER BY p.first_login_after_migration DESC;

-- Statistiche sui tempi di conferma
SELECT
    p.migrated_from,
    COUNT(*) AS total_confirmed,
    AVG(EXTRACT(EPOCH FROM (p.first_login_after_migration - p.created_at)) / 3600) AS avg_hours_to_login,
    MIN(p.first_login_after_migration) AS first_confirmation,
    MAX(p.first_login_after_migration) AS last_confirmation
FROM profiles p
WHERE p.migration_status = 'confirmed'
  AND p.first_login_after_migration IS NOT NULL
GROUP BY p.migrated_from;

-- Utenti confirmed che NON hanno ancora cambiato password
SELECT
    u.id,
    u.email,
    u.raw_user_meta_data->>'full_name' AS full_name,
    p.migrated_from,
    p.first_login_after_migration
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE p.migration_status = 'confirmed'
  AND p.password_changed = FALSE
ORDER BY p.first_login_after_migration DESC;


-- ============================================
-- 4. UTENTI PENDING IN SCADENZA (prossimi 3 giorni)
-- ============================================

-- Assumendo scadenza 30 giorni dalla migrazione
SELECT
    u.id,
    u.email,
    u.raw_user_meta_data->>'full_name' AS full_name,
    p.migrated_from,
    p.created_at AS migration_date,
    (p.created_at + INTERVAL '30 days') AS expiry_date,
    EXTRACT(DAY FROM (p.created_at + INTERVAL '30 days' - NOW())) AS days_remaining
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE p.migration_status = 'pending'
  AND (p.created_at + INTERVAL '30 days') <= (NOW() + INTERVAL '3 days')
ORDER BY expiry_date ASC;

-- Utenti già scaduti (oltre 30 giorni senza login)
SELECT
    u.id,
    u.email,
    u.raw_user_meta_data->>'full_name' AS full_name,
    p.migrated_from,
    p.created_at AS migration_date,
    (p.created_at + INTERVAL '30 days') AS expired_on,
    EXTRACT(DAY FROM (NOW() - (p.created_at + INTERVAL '30 days'))) AS days_overdue
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE p.migration_status = 'pending'
  AND (p.created_at + INTERVAL '30 days') < NOW()
ORDER BY days_overdue DESC;


-- ============================================
-- 5. REPORT GIORNALIERO (Dashboard Admin)
-- ============================================

-- Sommario migrazione
SELECT
    'Totale utenti' AS metric,
    COUNT(*)::TEXT AS value
FROM auth.users
UNION ALL
SELECT
    'Utenti migrati (totale)',
    COUNT(*)::TEXT
FROM profiles WHERE migration_status IS NOT NULL
UNION ALL
SELECT
    'Pending (in attesa login)',
    COUNT(*)::TEXT
FROM profiles WHERE migration_status = 'pending'
UNION ALL
SELECT
    'Confirmed (login effettuato)',
    COUNT(*)::TEXT
FROM profiles WHERE migration_status = 'confirmed'
UNION ALL
SELECT
    'Password cambiata',
    COUNT(*)::TEXT
FROM profiles WHERE password_changed = TRUE
UNION ALL
SELECT
    'In scadenza (3 giorni)',
    COUNT(*)::TEXT
FROM profiles
WHERE migration_status = 'pending'
  AND (created_at + INTERVAL '30 days') <= (NOW() + INTERVAL '3 days')
UNION ALL
SELECT
    'Scaduti',
    COUNT(*)::TEXT
FROM profiles
WHERE migration_status = 'pending'
  AND (created_at + INTERVAL '30 days') < NOW();


-- ============================================
-- 6. TREND GIORNALIERO (ultimi 7 giorni)
-- ============================================

-- Conferme per giorno
SELECT
    DATE(first_login_after_migration) AS date,
    COUNT(*) AS confirmations
FROM profiles
WHERE migration_status = 'confirmed'
  AND first_login_after_migration >= NOW() - INTERVAL '7 days'
GROUP BY DATE(first_login_after_migration)
ORDER BY date DESC;

-- Cambio password per giorno
SELECT
    DATE(password_changed_at) AS date,
    COUNT(*) AS password_changes
FROM profiles
WHERE password_changed = TRUE
  AND password_changed_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(password_changed_at)
ORDER BY date DESC;
