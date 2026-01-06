# DOID Suite - Backend

Backend API per DOID Suite, costruito con Node.js, Express e Supabase.

## Requisiti

- Node.js >= 18.0.0
- Account Supabase

## Installazione

1. Clona il repository
2. Installa le dipendenze:
   ```bash
   npm install
   ```
3. Copia il file `.env.example` in `.env`:
   ```bash
   cp .env.example .env
   ```
4. Configura le variabili d'ambiente nel file `.env`

## Configurazione Supabase

1. Crea un nuovo progetto su [Supabase](https://supabase.com)
2. Esegui le migrazioni SQL in ordine:
   - `database/migrations.sql` - Schema core
   - `database/migrations_services.sql` - Configurazione servizi
   - `database/migrations_activities.sql` - Sistema attività
   - `database/migrations_agencies.sql` - Supporto agenzie
   - `database/migrations_admin_logs.sql` - Log admin
   - `database/migrations_sent_reminders.sql` - Reminder trial
   - `database/migrations_webhook_logs.sql` - Log webhook
3. Copia le chiavi API dal pannello Supabase:
   - `SUPABASE_URL`: URL del progetto
   - `SUPABASE_ANON_KEY`: Chiave anonima (pubblica)
   - `SUPABASE_SERVICE_KEY`: Chiave service role (segreta)

## Avvio

### Sviluppo
```bash
npm run dev
```

### Produzione
```bash
npm start
```

## Variabili d'Ambiente

```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# Super Admin (email separate da virgola)
SUPER_ADMIN_EMAILS=admin@doid.it

# Service URLs
SMART_REVIEW_URL=https://review.doid.it
SMART_PAGE_URL=https://page.doid.it
MENU_DIGITALE_URL=https://menu.doid.it
DISPLAY_SUITE_URL=https://display.doid.it

# Webhook GoHighLevel
GHL_WEBHOOK_URL=https://services.leadconnectorhq.com/hooks/...

# Trial Reminder Job
ENABLE_TRIAL_REMINDERS=true
```

## API Endpoints

### Auth (`/api/auth`)
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | /register | Registrazione utente con attività e trial opzionale |
| POST | /login | Login |
| POST | /logout | Logout |
| GET | /me | Utente corrente con organizzazioni e attività |
| POST | /refresh | Refresh token |
| POST | /forgot-password | Reset password via email |
| POST | /reset-password | Aggiorna password |

### Activities (`/api/activities`)
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | / | Lista attività utente |
| POST | / | Crea nuova attività |
| GET | /limits | Limiti creazione attività |
| GET | /services/all | Tutti i servizi disponibili |
| GET | /:activityId | Dettaglio attività |
| PUT | /:activityId | Modifica attività |
| DELETE | /:activityId | Elimina attività |
| GET | /:activityId/members | Lista membri |
| POST | /:activityId/members | Aggiungi membro |
| DELETE | /:activityId/members/:id | Rimuovi membro |
| GET | /:activityId/subscriptions | Lista abbonamenti |
| GET | /:activityId/subscriptions/dashboard | Dashboard servizi con stato |
| GET | /:activityId/subscriptions/stats | Statistiche abbonamenti |
| POST | /:activityId/subscriptions/trial | Attiva trial |
| POST | /:activityId/subscriptions/activate | Attiva abbonamento |
| POST | /:activityId/subscriptions/cancel | Cancella abbonamento |
| GET | /:activityId/subscriptions/check/:service | Verifica stato servizio |
| POST | /:activityId/generate-token | Genera token SSO per app esterna |

### Organizations (`/api/organizations`)
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | / | Lista organizzazioni utente |
| POST | / | Crea organizzazione |
| GET | /:id | Dettaglio organizzazione |
| PUT | /:id | Modifica organizzazione |
| DELETE | /:id | Elimina organizzazione |
| GET | /:id/members | Lista membri |
| POST | /:id/members | Aggiungi membro |
| DELETE | /:id/members/:userId | Rimuovi membro |

### Dashboard (`/api/dashboard`)
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | /services | Servizi con stato |
| GET | /stats | Statistiche |
| POST | /generate-token | Token per app esterna (legacy) |

### External API (`/api/external`)
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | /verify-token | Verifica token JWT |
| GET | /organization/:uuid | Info organizzazione |
| POST | /webhook | Ricevi eventi da app esterne |
| POST | /sso/authenticate | SSO completo per app esterne |

### Admin (`/api/admin`) - Solo Super Admin
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| **Stats** |
| GET | /stats | Statistiche globali |
| GET | /activity | Attività recenti |
| **Users** |
| GET | /users | Lista utenti con paginazione/ricerca |
| GET | /users/:id | Dettaglio utente |
| POST | /users | Crea utente |
| PUT | /users/:id | Modifica utente |
| DELETE | /users/:id | Elimina utente |
| GET | /users/:id/subscriptions | Abbonamenti utente |
| GET | /users/:id/billing | Riepilogo fatturazione |
| GET | /users/:id/details | Dettagli completi con attività |
| **Organizations** |
| GET | /organizations | Lista organizzazioni |
| POST | /organizations | Crea organizzazione |
| GET | /organizations/:id | Dettaglio organizzazione |
| PUT | /organizations/:id | Modifica organizzazione |
| DELETE | /organizations/:id | Elimina organizzazione |
| GET | /organizations/:id/packages | Pacchetti attivi |
| POST | /organizations/:id/packages | Attiva pacchetto |
| DELETE | /organizations/:id/packages/:pkgId | Cancella pacchetto |
| POST | /organizations/:id/activities | Crea attività per org |
| **Activities** |
| GET | /activities | Lista attività |
| GET | /activities/:id | Dettaglio attività |
| GET | /activities/:id/services | Servizi con stato |
| PUT | /activities/:id/services/:code | Modifica stato servizio |
| **Subscriptions** |
| GET | /subscriptions | Lista abbonamenti |
| POST | /subscriptions | Crea abbonamento |
| PUT | /subscriptions/:id | Modifica abbonamento |
| **Services & Plans** |
| GET | /services | Lista servizi |
| PUT | /services/:id | Modifica servizio |
| GET | /services/:id/plans | Piani di un servizio |
| GET | /plans | Tutti i piani |
| POST | /plans | Crea piano |
| PUT | /plans/:id | Modifica piano |
| DELETE | /plans/:id | Disattiva piano |
| **Packages** |
| GET | /packages | Lista pacchetti |
| GET | /packages/:id | Dettaglio pacchetto |
| POST | /packages | Crea pacchetto |
| PUT | /packages/:id | Modifica pacchetto |
| DELETE | /packages/:id | Disattiva pacchetto |
| **Volume Discounts** |
| GET | /discounts | Lista sconti volume |
| PUT | /discounts/:id | Modifica sconto |
| **Admin Access** |
| POST | /access-service | Accedi a servizio come utente |
| POST | /impersonate | Impersona utente |
| POST | /impersonate/organization | Impersona owner organizzazione |
| **Jobs** |
| POST | /jobs/trial-reminders/run | Esegui job reminder trial |
| GET | /jobs/trial-reminders/stats | Statistiche reminder |
| **Cron** |
| POST | /cron/check-trials | Controlla trial in scadenza |
| POST | /cron/check-subscriptions | Aggiorna abbonamenti scaduti |
| **Webhooks** |
| GET | /webhooks/pending | Webhook in coda |
| POST | /webhooks/:id/complete | Marca webhook completato |
| POST | /webhooks/:id/retry | Riprogramma webhook |
| **Communications** |
| GET | /communications | Log comunicazioni |

## Struttura Progetto

```
backend/
├── src/
│   ├── config/
│   │   ├── supabase.js     # Client Supabase (admin, user, public)
│   │   └── services.js     # Configurazione servizi e ruoli
│   ├── routes/
│   │   ├── auth.js         # Autenticazione
│   │   ├── activities.js   # CRUD attività e abbonamenti
│   │   ├── organizations.js # CRUD organizzazioni
│   │   ├── dashboard.js    # Dashboard (legacy)
│   │   ├── subscriptions.js # Abbonamenti (deprecato)
│   │   ├── admin.js        # Super admin endpoints
│   │   ├── api.js          # API esterne e SSO
│   │   └── services.js     # Configurazione servizi
│   ├── services/
│   │   ├── authService.js       # Logica autenticazione
│   │   ├── activityService.js   # Logica attività
│   │   ├── organizationService.js # Logica organizzazioni
│   │   ├── subscriptionService.js # Logica abbonamenti
│   │   ├── adminService.js      # Operazioni admin
│   │   ├── packageService.js    # Gestione pacchetti
│   │   ├── serviceService.js    # Definizione servizi
│   │   └── webhookService.js    # Invio webhook GoHighLevel
│   ├── middleware/
│   │   ├── auth.js         # authenticate, requireOrganization, verifyExternalToken
│   │   ├── adminAuth.js    # requireSuperAdmin, logAdminAction, isSuperAdmin
│   │   ├── activity.js     # loadActivity, requireActivityAccess, requireActivityRole
│   │   └── errorHandler.js # Gestione errori globale
│   ├── jobs/
│   │   └── trialReminderJob.js # Job giornaliero reminder trial
│   ├── utils/
│   │   └── ...             # Utility varie
│   └── app.js              # Entry point Express
├── package.json
├── .env.example
└── README.md
```

## Jobs Schedulati

### Trial Reminder Job
Job automatico che invia webhook a GoHighLevel per reminder trial:
- **trial.day_7**: 23 giorni rimanenti
- **trial.day_14**: 16 giorni rimanenti
- **trial.day_21**: 9 giorni rimanenti
- **trial.day_27**: 3 giorni rimanenti
- **trial.expired**: Trial scaduto

Esecuzione: ogni giorno alle 9:00 (Europe/Rome)

## Webhook Events

Il sistema invia webhook a GoHighLevel per i seguenti eventi:
- `user.registered` - Nuovo utente registrato
- `user.email_confirmed` - Email confermata
- `service.trial_activated` - Trial attivato
- `service.subscription_activated` - Abbonamento attivato
- `service.subscription_cancelled` - Abbonamento cancellato
- `trial.day_7`, `trial.day_14`, `trial.day_21`, `trial.day_27` - Reminder trial
- `trial.expired` - Trial scaduto

## Sicurezza

- Autenticazione JWT con Supabase Auth
- Row Level Security (RLS) su tutte le tabelle
- Rate limiting: 100 req/15min generale, 10 req/ora per auth
- CORS configurato per domini autorizzati
- Token esterni con scadenza 5 minuti
- Log completo di tutte le azioni admin

## Licenza

MIT
