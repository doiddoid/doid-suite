# DOID Suite

Piattaforma centralizzata per la gestione di servizi digitali DOID.

## Panoramica

DOID Suite è una dashboard unificata che permette agli utenti di gestire tutti i servizi DOID da un'unica interfaccia:

- **Smart Review** - Gestione recensioni intelligente
- **Smart Page** - Creazione pagine web professionali / vCard
- **Menu Digitale** - Menu digitali per ristoranti
- **Display Suite** - Digital signage

## Stack Tecnologico

- **Backend**: Node.js + Express (ES Modules)
- **Frontend**: React + Vite + TailwindCSS
- **Database**: Supabase (PostgreSQL con RLS)
- **Autenticazione**: Supabase Auth con JWT
- **Deployment**: DigitalOcean App Platform

## Struttura del Progetto

```
doid-suite/
├── backend/           # API Node.js/Express
│   ├── src/
│   │   ├── routes/    # Endpoint API
│   │   ├── services/  # Business logic
│   │   ├── middleware/ # Auth, admin, activity middleware
│   │   ├── jobs/      # Job schedulati (trial reminders)
│   │   └── config/    # Configurazione Supabase e servizi
│   └── package.json
├── frontend/          # App React
│   ├── src/
│   │   ├── pages/     # Pagine (Dashboard, Admin, Activities, etc.)
│   │   ├── components/ # Componenti riutilizzabili
│   │   ├── hooks/     # Custom hooks (useAuth, useActivities, useServices)
│   │   └── services/  # ApiService per chiamate API
│   └── package.json
├── database/          # Migrazioni SQL
│   ├── migrations.sql           # Schema core
│   ├── migrations_services.sql  # Configurazione servizi
│   ├── migrations_activities.sql # Sistema attività
│   ├── migrations_agencies.sql  # Supporto agenzie/pacchetti
│   ├── migrations_admin_logs.sql # Log azioni admin
│   ├── migrations_sent_reminders.sql # Reminder trial
│   └── migrations_webhook_logs.sql # Log webhook
└── README.md
```

## Prerequisiti

- Node.js >= 18.0.0
- npm o yarn
- Account Supabase

## Installazione

### 1. Configurazione Database

1. Crea un nuovo progetto su [Supabase](https://supabase.com)
2. Vai su SQL Editor e esegui le migrazioni in ordine:
   - `database/migrations.sql`
   - `database/migrations_services.sql`
   - `database/migrations_activities.sql`
   - `database/migrations_agencies.sql`
   - `database/migrations_admin_logs.sql`
   - `database/migrations_sent_reminders.sql`
   - `database/migrations_webhook_logs.sql`
3. Copia le chiavi API dal pannello Settings > API

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Configura le variabili in .env
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Configura le variabili in .env
npm run dev
```

## Variabili d'Ambiente

### Backend (.env)

```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# Super Admin
SUPER_ADMIN_EMAILS=admin@example.com

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

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Architettura

### Modello Dati

```
organizations (1) ─── (N) activities (1) ─── (N) subscriptions
      │                      │
      │                      └── activity_users (N:M con users)
      │
      └── organization_users (N:M con users)
      └── organization_packages (per agenzie)
```

### Account Types

- **Single**: Un'organizzazione con una singola attività
- **Agency**: Un'organizzazione con multiple attività (gestita tramite pacchetti)

### Sistema Abbonamenti

Ogni attività può avere abbonamenti diretti per i servizi:
- **Trial**: 30 giorni gratuiti
- **Active**: Abbonamento attivo (monthly/yearly)
- **Expired**: Trial/abbonamento scaduto
- **Cancelled**: Abbonamento cancellato

Le agenzie possono anche ereditare servizi dai pacchetti dell'organizzazione.

## API Endpoints

### Autenticazione (`/api/auth`)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | /register | Registrazione utente |
| POST | /login | Login |
| POST | /logout | Logout |
| GET | /me | Utente corrente |
| POST | /refresh | Refresh token |
| POST | /forgot-password | Reset password |
| POST | /reset-password | Aggiorna password |

### Attività (`/api/activities`)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | / | Lista attività utente |
| POST | / | Crea attività |
| GET | /limits | Limiti creazione |
| GET | /services/all | Servizi disponibili |
| GET | /:id | Dettaglio |
| PUT | /:id | Modifica |
| DELETE | /:id | Elimina |
| GET | /:id/subscriptions/dashboard | Dashboard servizi |
| POST | /:id/subscriptions/trial | Attiva trial |
| POST | /:id/generate-token | Token SSO |

### Organizzazioni (`/api/organizations`)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | / | Lista organizzazioni |
| POST | / | Crea organizzazione |
| GET | /:id | Dettaglio |
| PUT | /:id | Modifica |
| DELETE | /:id | Elimina |

### Admin (`/api/admin`) - Solo Super Admin

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | /stats | Statistiche globali |
| GET | /users | Lista utenti |
| POST | /users | Crea utente |
| GET | /organizations | Lista organizzazioni |
| POST | /organizations | Crea organizzazione |
| GET | /activities | Lista attività |
| GET | /subscriptions | Lista abbonamenti |
| POST | /subscriptions | Crea abbonamento |
| GET | /packages | Lista pacchetti |
| POST | /access-service | Accedi come utente |
| POST | /impersonate | Impersona utente |
| POST | /jobs/trial-reminders/run | Esegui job reminder |

### API Esterne (`/api/external`)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | /verify-token | Verifica token JWT |
| POST | /sso/authenticate | SSO completo |
| POST | /webhook | Ricevi eventi |

## Integrazione con App Esterne (SSO)

Le app esterne (Smart Review, Smart Page, etc.) si integrano tramite SSO:

1. **Dashboard genera token**: L'utente clicca "Gestisci" su un servizio
2. **Redirect con token**: Redirect a `/auth/sso?token=...`
3. **App verifica token**: Chiamata a `/api/external/sso/authenticate`
4. **Crea sessione**: L'app riceve tutti i dati utente, attività, licenza

### Esempio di Integrazione

```javascript
// App esterna - callback SSO
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// Verifica e ottieni dati completi
const response = await fetch('https://suite.doid.it/api/external/sso/authenticate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token, service: 'smart_review' })
});

const { data } = await response.json();
// data.user - Dati utente
// data.activity - Attività corrente
// data.license - Stato abbonamento
// data.sidebarToken - Token per sidebar (24h)
```

## Ruoli Utente

| Ruolo | Livello | Descrizione |
|-------|---------|-------------|
| owner | 4 | Proprietario - accesso completo |
| admin | 3 | Amministratore - gestione completa |
| manager | 2 | Manager - gestione limitata |
| user | 1 | Utente - solo visualizzazione |

## Webhook Events

Il sistema invia webhook a GoHighLevel per automazioni:

- `user.registered` - Nuovo utente
- `user.email_confirmed` - Email confermata
- `service.trial_activated` - Trial attivato
- `service.subscription_activated` - Abbonamento attivato
- `service.subscription_cancelled` - Abbonamento cancellato
- `trial.day_7/14/21/27` - Reminder trial
- `trial.expired` - Trial scaduto

## Sicurezza

- Autenticazione con Supabase Auth (JWT)
- Row Level Security (RLS) su tutte le tabelle
- Rate limiting sulle API (100 req/15min, 10 req/ora per auth)
- CORS configurato per domini autorizzati
- Token esterni con scadenza 5 minuti
- Log completo azioni admin con redazione campi sensibili

## Sviluppo

### Avvio in sviluppo

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Build per produzione

```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run build
```

## Deployment

### DigitalOcean App Platform

Configurazione in `.do/app.yaml`:
- **Backend**: Node.js service ($5+/month)
- **Frontend**: Static site (gratuito)

### Health Check

- `/health` - Backend health check
- `/api/health` - API health check

## Jobs Schedulati

### Trial Reminder Job
Esegue ogni giorno alle 9:00 (Europe/Rome):
- Controlla trial in scadenza
- Invia reminder a GoHighLevel
- Marca trial scaduti come expired

## Licenza

MIT
