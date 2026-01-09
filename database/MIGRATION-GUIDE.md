# Guida Migrazione Utenti Smart Review -> DOID Suite

## Panoramica

Questa guida spiega come migrare gli utenti dal database MySQL di Smart Review a Supabase per DOID Suite.

## Prerequisiti

- Accesso a phpMyAdmin del server doid.it
- Node.js installato
- File `.env` configurato nella cartella `backend/`

---

## STEP 1: Export utenti da MySQL

### Opzione A: Via phpMyAdmin (Consigliata)

1. Vai su **phpMyAdmin** del server doid.it
2. Seleziona il database: `dbtpchahdn2f3k`
3. Clicca su **SQL**
4. Esegui questa query:

```sql
SELECT
    u.id,
    u.email,
    u.name,
    u.surname,
    u.phone,
    u.company_name,
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
```

5. Clicca **Esporta** sopra i risultati
6. Scegli formato **CSV**
7. Opzioni:
   - Colonne separate da: `,`
   - Colonne racchiuse da: `"`
   - Includi nomi colonne: **Sì**
8. Salva il file come: `users-smart.csv`
9. Copia il file in: `doid-suite/database/users-smart.csv`

### Opzione B: Via terminale SSH

```bash
# Connettiti al server
ssh -p 18765 u21-giqmtrzfgtsk@ssh.doid.it

# Esegui export
mysql -u ughvp8xgg6kgt -pa4yneqfrcuoe dbtpchahdn2f3k -e "
SELECT u.id, u.email, u.name, u.surname, u.phone, u.company_name,
       u.password_hash, u.is_admin, u.is_active, UNIX_TIMESTAMP(NOW()) as created_at,
       l.id as license_id, l.is_active as license_active, l.expiration as license_expiration
FROM users u
LEFT JOIN licenses l ON u.license_id = l.id
WHERE u.email IS NOT NULL AND u.email != '' AND u.is_active = 1
" | sed 's/\t/","/g;s/^/"/;s/$/"/' > users-smart.csv
```

---

## STEP 2: Verifica CSV

Prima di procedere, verifica che il CSV sia corretto:

```bash
cd doid-suite/database

# Conta righe (dovrebbe essere > 1)
wc -l users-smart.csv

# Visualizza prime 5 righe
head -5 users-smart.csv

# Cerca un utente specifico
grep "info.doid@gmail.com" users-smart.csv
```

---

## STEP 3: Test migrazione (Dry Run)

Esegui prima in modalità **dry-run** per vedere cosa verrà fatto senza modificare nulla:

```bash
cd doid-suite/backend

# Dry run - simula la migrazione
node scripts/migrate-users-full.js --dry-run
```

Controlla l'output per verificare:
- Quanti utenti verranno creati
- Quanti esistono già
- Eventuali errori

---

## STEP 4: Esegui migrazione

Se il dry-run è ok, esegui la migrazione vera:

```bash
cd doid-suite/backend

# Migrazione completa
node scripts/migrate-users-full.js
```

### Opzioni disponibili:

| Opzione | Descrizione |
|---------|-------------|
| `--dry-run` | Simula senza modificare nulla |
| `--no-skip-existing` | Aggiorna anche utenti esistenti |
| `--reset-password` | Resetta password per tutti gli utenti |

### Esempi:

```bash
# Solo nuovi utenti (default)
node scripts/migrate-users-full.js

# Aggiorna tutti gli utenti
node scripts/migrate-users-full.js --no-skip-existing

# Reset password per tutti
node scripts/migrate-users-full.js --reset-password

# Combinato
node scripts/migrate-users-full.js --no-skip-existing --reset-password
```

---

## STEP 5: Verifica risultati

Dopo la migrazione, verifica:

### File generati:
- `database/user-id-mapping.json` - Mappa ID Smart Review -> Supabase
- `database/migration-log.json` - Log completo della migrazione

### Verifica in Supabase:
1. Vai su [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleziona il progetto doidSuite
3. Vai su **Authentication > Users** - verifica utenti
4. Vai su **Table Editor > organizations** - verifica organizzazioni
5. Vai su **Table Editor > activities** - verifica attività
6. Vai su **Table Editor > subscriptions** - verifica abbonamenti

---

## STEP 6: Aggiorna mapping in Smart Review

Dopo la migrazione, aggiorna il database MySQL con i nuovi ID Supabase:

```bash
cd doid-suite/backend

# Genera SQL per aggiornare MySQL
node -e "
const mapping = require('../database/user-id-mapping.json');
mapping.forEach(m => {
  if (m.smart_review_id && m.supabase_id) {
    console.log(\`UPDATE users SET doid_user_id = '\${m.supabase_id}' WHERE id = '\${m.smart_review_id}';\`);
  }
});
" > ../database/update-mysql-mapping.sql
```

Poi esegui `update-mysql-mapping.sql` in phpMyAdmin.

---

## Troubleshooting

### Errore: "File CSV non trovato"
```
Assicurati che il file sia in: doid-suite/database/users-smart.csv
```

### Errore: "Email già registrata"
```
L'utente esiste già in Supabase. Usa --no-skip-existing per aggiornarlo.
```

### Errore: "Invalid email"
```
Verifica che l'email nel CSV sia valida. Rimuovi righe con email malformate.
```

### Utente non riesce ad accedere
```
Password temporanea: SmartReview2024!Migrate
Oppure usa "Password dimenticata" per reimpostare.
```

---

## Struttura dati creata

Per ogni utente migrato viene creato:

```
Utente (auth.users)
  └── Organizzazione (organizations)
        └── Attività (activities)
              └── Abbonamento (subscriptions) [se aveva licenza attiva]
```

---

## Contatti

Per problemi contatta lo sviluppatore o apri un issue su GitHub.
