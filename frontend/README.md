# DOID Suite - Frontend

Frontend React per DOID Suite, costruito con Vite e TailwindCSS.

## Requisiti

- Node.js >= 18.0.0
- npm o yarn

## Installazione

1. Installa le dipendenze:
   ```bash
   npm install
   ```
2. Copia il file `.env.example` in `.env`:
   ```bash
   cp .env.example .env
   ```
3. Configura le variabili d'ambiente nel file `.env`

## Avvio

### Sviluppo
```bash
npm run dev
```
Server di sviluppo su http://localhost:5173

### Build per produzione
```bash
npm run build
```

### Preview build
```bash
npm run preview
```

### Lint
```bash
npm run lint
```

## Variabili d'Ambiente

```env
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Struttura Progetto

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Login.jsx           # Login
│   │   ├── Register.jsx        # Registrazione con trial opzionale
│   │   ├── ForgotPassword.jsx  # Richiesta reset password
│   │   ├── ResetPassword.jsx   # Reset password con token
│   │   ├── Dashboard.jsx       # Dashboard principale con servizi
│   │   ├── Settings.jsx        # Impostazioni utente
│   │   ├── Activities.jsx      # Lista attività
│   │   ├── NewActivity.jsx     # Crea nuova attività
│   │   ├── ActivitySettings.jsx # Impostazioni attività
│   │   ├── NewOrganization.jsx # Crea organizzazione
│   │   └── Admin.jsx           # Pannello super admin
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Layout.jsx      # Layout principale
│   │   │   ├── Navbar.jsx      # Barra navigazione
│   │   │   ├── Sidebar.jsx     # Menu laterale
│   │   │   └── Header.jsx      # Header pagina
│   │   ├── Dashboard/
│   │   │   ├── StatsCards.jsx  # Statistiche
│   │   │   ├── ServiceCard.jsx # Card servizio
│   │   │   ├── ServicesGrid.jsx # Griglia servizi
│   │   │   ├── StatusBadge.jsx # Badge stato
│   │   │   └── WelcomeBanner.jsx # Banner benvenuto
│   │   ├── Activities/
│   │   │   └── ActivitySelector.jsx # Selettore attività
│   │   ├── Auth/
│   │   │   ├── LoginForm.jsx   # Form login
│   │   │   ├── RegisterForm.jsx # Form registrazione
│   │   │   └── ProtectedRoute.jsx # Route protetta
│   │   └── Services/
│   │       └── PlanModal.jsx   # Modal selezione piano
│   ├── hooks/
│   │   ├── useAuth.jsx         # Context autenticazione
│   │   ├── useActivities.jsx   # Context attività
│   │   └── useServices.jsx     # Context servizi
│   ├── contexts/
│   │   └── index.js            # Re-export contexts
│   ├── services/
│   │   └── api.js              # ApiService per chiamate API
│   ├── App.jsx                 # Entry point React
│   ├── main.jsx                # Bootstrap app
│   └── index.css               # Stili globali + Tailwind
├── public/
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Pagine

### Login (`/login`)
- Form login con email/password
- Link a registrazione e reset password
- Redirect automatico se già autenticato

### Register (`/register`)
- Form registrazione con campi:
  - Email, password, nome completo
  - Nome attività (opzionale)
  - Servizio richiesto per trial (opzionale)
- Supporto UTM parameters e referral code

### Forgot Password (`/forgot-password`)
- Form per richiedere reset password
- Inserimento email
- Mostra messaggio di conferma (non rivela se email esiste)
- Link per tornare al login

### Reset Password (`/reset-password`)
- Verifica token dal parametro URL `?token=xxx`
- Form per inserire nuova password (minimo 8 caratteri)
- Conferma password
- Mostra errore se token invalido/scaduto
- Redirect al login dopo reset completato

### Dashboard (`/dashboard`)
- Panoramica servizi con stato abbonamento
- Card per ogni servizio (Smart Review, Smart Page, etc.)
- Azioni: Gestisci, Attiva Trial, Upgrade
- Statistiche abbonamenti

### Activities (`/activities`)
- Lista attività utente
- Filtro per stato
- Link a impostazioni e creazione

### Activity Settings (`/activities/:id/settings`)
- Modifica dati attività
- Gestione membri (aggiungi/rimuovi)
- Gestione abbonamenti per servizio

### Admin (`/admin`) - Solo Super Admin
- **Utenti**: Lista, crea, modifica, elimina, impersona
- **Organizzazioni**: Lista, crea, modifica, assegna pacchetti
- **Attività**: Lista, visualizza servizi
- **Abbonamenti**: Lista, crea, modifica stato
- **Servizi**: Visualizza e modifica servizi/piani
- **Jobs**: Esegui trial reminder manualmente

## Hooks Principali

### useAuth
```javascript
const {
  user,           // Utente corrente
  isLoading,      // Stato caricamento
  login,          // Funzione login
  register,       // Funzione registrazione
  logout,         // Funzione logout
  isSuperAdmin    // Flag super admin
} = useAuth();
```

### useActivities
```javascript
const {
  activities,         // Lista attività
  currentActivity,    // Attività selezionata
  setCurrentActivity, // Seleziona attività
  createActivity,     // Crea attività
  updateActivity,     // Modifica attività
  deleteActivity,     // Elimina attività
  refreshActivities   // Ricarica lista
} = useActivities();
```

### useServices
```javascript
const {
  services,        // Servizi con stato abbonamento
  isLoading,       // Stato caricamento
  activateTrial,   // Attiva trial
  refreshServices  // Ricarica servizi
} = useServices();
```

## ApiService

Classe centralizzata per le chiamate API:

```javascript
import api from './services/api';

// GET
const response = await api.get('/activities');

// POST
const response = await api.post('/activities', { name: 'Nuova' });

// PUT
const response = await api.put('/activities/123', { name: 'Aggiornata' });

// DELETE
const response = await api.delete('/activities/123');
```

Features:
- Token refresh automatico su 401
- Gestione errori centralizzata
- Headers Authorization automatici

## Componenti Principali

### Layout
Wrapper principale con Sidebar e Header:
```jsx
<Layout>
  <Dashboard />
</Layout>
```

### ProtectedRoute
Route che richiede autenticazione:
```jsx
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

### ServiceCard
Card per visualizzare servizio con stato:
```jsx
<ServiceCard
  service={service}
  onManage={() => {}}
  onActivateTrial={() => {}}
/>
```

### ActivitySelector
Dropdown per selezionare attività:
```jsx
<ActivitySelector
  activities={activities}
  currentActivity={current}
  onChange={setActivity}
/>
```

## Stili

- **TailwindCSS** per utility classes
- **Tema custom** con colori DOID
- **Responsive** mobile-first

### Colori principali
- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Error: Red (#EF4444)

## Routing

```jsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
  <Route path="/reset-password" element={<ResetPassword />} />
  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
  <Route path="/activities/new" element={<ProtectedRoute><NewActivity /></ProtectedRoute>} />
  <Route path="/activities/:id/settings" element={<ProtectedRoute><ActivitySettings /></ProtectedRoute>} />
  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
  <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
</Routes>
```

## Build e Deploy

### Build
```bash
npm run build
```
Output in `dist/`

### Deploy DigitalOcean
Il frontend viene deployato come static site su DigitalOcean App Platform:
- Build command: `npm run build`
- Output directory: `dist`
- Environment: `NODE_ENV=production`

## Licenza

MIT
