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
2. Esegui le migrazioni SQL dal file `database/migrations.sql`
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

## API Endpoints

### Auth (`/api/auth`)
- `POST /register` - Registrazione utente
- `POST /login` - Login
- `POST /logout` - Logout
- `GET /me` - Utente corrente
- `POST /refresh` - Refresh token

### Organizations (`/api/organizations`)
- `GET /` - Lista organizzazioni
- `POST /` - Crea organizzazione
- `GET /:id` - Dettaglio organizzazione
- `PUT /:id` - Modifica organizzazione
- `DELETE /:id` - Elimina organizzazione

### Dashboard (`/api/dashboard`)
- `GET /services` - Lista servizi con stato
- `GET /stats` - Statistiche

### Subscriptions (`/api/subscriptions`)
- `GET /` - Abbonamenti attivi
- `POST /` - Attiva abbonamento
- `PUT /:id` - Modifica abbonamento
- `DELETE /:id` - Cancella abbonamento

### External API (`/api/external`)
- `POST /verify-token` - Verifica token JWT
- `GET /organization/:uuid` - Info organizzazione

## Struttura Progetto

```
backend/
├── src/
│   ├── config/
│   │   ├── supabase.js     # Client Supabase
│   │   └── services.js     # Configurazione servizi
│   ├── routes/
│   │   ├── auth.js         # Route autenticazione
│   │   ├── dashboard.js    # Route dashboard
│   │   ├── organizations.js # Route organizzazioni
│   │   ├── subscriptions.js # Route abbonamenti
│   │   └── api.js          # Route API esterne
│   ├── middleware/
│   │   ├── auth.js         # Middleware autenticazione
│   │   └── errorHandler.js # Gestione errori
│   ├── services/
│   │   ├── authService.js  # Logica autenticazione
│   │   ├── organizationService.js # Logica organizzazioni
│   │   └── subscriptionService.js # Logica abbonamenti
│   └── app.js              # Entry point
├── package.json
├── .env.example
└── README.md
```

## Licenza

MIT
