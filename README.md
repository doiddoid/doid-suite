# DOID Suite

Piattaforma centralizzata per la gestione di servizi digitali DOID.

## Panoramica

DOID Suite è una dashboard unificata che permette agli utenti di gestire tutti i servizi DOID da un'unica interfaccia:

- **Smart Review** - Gestione recensioni intelligente
- **Smart Page** - Creazione pagine web professionali
- **Menu Digitale** - Menu digitali per ristoranti
- **Display Suite** - Digital signage

## Stack Tecnologico

- **Backend**: Node.js + Express
- **Frontend**: React + TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **Autenticazione**: Supabase Auth

## Struttura del Progetto

```
doid-suite/
├── backend/           # API Node.js/Express
├── frontend/          # App React
├── database/          # Migrazioni SQL
└── README.md
```

## Prerequisiti

- Node.js >= 18.0.0
- npm o yarn
- Account Supabase

## Installazione

### 1. Configurazione Database

1. Crea un nuovo progetto su [Supabase](https://supabase.com)
2. Vai su SQL Editor e esegui il file `database/migrations.sql`
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
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## API Endpoints

### Autenticazione (`/api/auth`)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | /register | Registrazione utente |
| POST | /login | Login |
| POST | /logout | Logout |
| GET | /me | Utente corrente |
| POST | /refresh | Refresh token |

### Organizzazioni (`/api/organizations`)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | / | Lista organizzazioni |
| POST | / | Crea organizzazione |
| GET | /:id | Dettaglio |
| PUT | /:id | Modifica |
| DELETE | /:id | Elimina |

### Dashboard (`/api/dashboard`)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | /services | Servizi con stato |
| GET | /stats | Statistiche |
| POST | /generate-token | Token per app esterna |

### Abbonamenti (`/api/subscriptions`)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | / | Lista abbonamenti |
| POST | / | Crea abbonamento |
| PUT | /:id | Modifica |
| DELETE | /:id | Cancella |

### API Esterne (`/api/external`)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | /verify-token | Verifica token JWT |
| GET | /organization/:uuid | Info organizzazione |

## Integrazione con App Esterne

Le app esterne (Smart Review, Smart Page, ecc.) possono integrarsi con DOID Suite tramite:

1. **Redirect con Token**: Quando un utente clicca "Gestisci" su un servizio, viene generato un JWT con scadenza 5 minuti e reindirizzato all'app esterna
2. **Verifica Token**: L'app esterna verifica il token chiamando `/api/external/verify-token`
3. **Recupero Dati**: L'app può recuperare i dati dell'organizzazione tramite `/api/external/organization/:uuid`

### Esempio di Integrazione

```javascript
// App esterna - callback page
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// Verifica il token
const response = await fetch('https://suite.doid.it/api/external/verify-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token })
});

const { data } = await response.json();
// data.user, data.organization, data.service, data.role
```

## Ruoli Utente

| Ruolo | Descrizione |
|-------|-------------|
| owner | Proprietario - accesso completo |
| admin | Amministratore - gestione completa |
| manager | Manager - gestione limitata |
| user | Utente - solo visualizzazione |

## Sicurezza

- Autenticazione con Supabase Auth (JWT)
- Row Level Security (RLS) su tutte le tabelle
- Rate limiting sulle API
- CORS configurato per domini autorizzati
- Token esterni con scadenza 5 minuti

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

### Dominio: suite.doid.it

1. Configura il DNS per puntare al server
2. Configura HTTPS con Let's Encrypt
3. Usa PM2 o Docker per il backend
4. Servi il frontend con Nginx

## Licenza

MIT © DOID
