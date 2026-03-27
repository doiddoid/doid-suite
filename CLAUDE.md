# DOID Suite Dashboard — Istruzioni per Claude Code

## Documentazione
La documentazione completa dell'ecosistema DOID Suite si trova in:
- 📖 Documentazione generale: [/docs/README.md](../docs/README.md)
- 🏗️ Architettura: [/docs/01-architettura.md](../docs/01-architettura.md)
- 🔐 Autenticazione e SSO: [/docs/02-autenticazione.md](../docs/02-autenticazione.md)
- 📋 Questo servizio: [/docs/03-servizio-suite.md](../docs/03-servizio-suite.md)
- 💰 Abbonamenti: [/docs/04-abbonamenti.md](../docs/04-abbonamenti.md)
- 🔄 Integrazioni GHL: [/docs/08-integrazione-ghl.md](../docs/08-integrazione-ghl.md)
- 📝 Changelog: [/docs/06-changelog.md](../docs/06-changelog.md)

**LEGGI la documentazione PRIMA di modificare qualsiasi file.**

## Regole di sviluppo
Consulta [/docs/07-regole-sviluppo.md](../docs/07-regole-sviluppo.md) per le regole complete.

Regole critiche:
1. Non modificare le funzionalità marcate 🔒 senza approvazione esplicita
2. Un cambiamento alla volta, testa dopo ogni modifica
3. Se tocchi auth/SSO/Supabase → testa TUTTI i servizi
4. Se tocchi tag/webhook GHL → verifica dipendenze in [/docs/08-integrazione-ghl.md](../docs/08-integrazione-ghl.md)
5. Aggiorna [/docs/06-changelog.md](../docs/06-changelog.md) dopo ogni modifica
6. La fonte di verità per i dati è Supabase, non MySQL

## Specifiche di questo progetto
- **Servizio**: DOID Suite Dashboard
- **URL produzione**: https://suite.doid.it
- **Stack**: Node.js + Express (backend), React + Vite + Tailwind (frontend)
- **Database primario**: Supabase PostgreSQL
- **Doc dettagliata**: [/docs/03-servizio-suite.md](../docs/03-servizio-suite.md)

## Comandi

### Backend (`backend/`)
```bash
npm run dev          # Dev server con nodemon (port 3001)
npm start            # Production server
npm run lint         # ESLint
npm test             # Jest tests
```

### Frontend (`frontend/`)
```bash
npm run dev          # Vite dev server (port 5173)
npm run build        # Production build
npm run lint         # ESLint
npm run preview      # Preview production build
```

### SDK (`sdk/`)
```bash
npm run build        # Minify → dist/doid-sidebar.min.js
npm run watch        # Watch for changes
```

## Struttura chiave

| Directory/File | Descrizione |
|----------------|-------------|
| `backend/src/app.js` | Entry point Express con middleware |
| `backend/src/routes/` | API routes (auth, activities, admin, api) |
| `backend/src/services/` | Business logic (authService, subscriptionService, webhookService) |
| `backend/src/middleware/` | Auth, adminAuth, activity, errorHandler |
| `frontend/src/App.jsx` | React Router con AuthProvider e ActivityProvider |
| `frontend/src/services/api.js` | ApiService centralizzato con token refresh |
| `sdk/src/doid-sidebar.js` | Sidebar SDK (~34KB) per servizi esterni |
| `database/` | Migration files SQL per Supabase |

## ⚠️ File e flussi critici (NON TOCCARE)

| Funzionalità | File Coinvolti | Motivo |
|--------------|----------------|--------|
| Registrazione + Email Confirm | `authService.js`, `auth.js` | Flusso testato e validato |
| Login + Token Refresh | `authService.js`, `auth.js` | Core auth funzionante |
| Password Reset via GHL | `authService.js`, `webhookService.js` | Integrazione GHL attiva |
| SSO Token Generation | `authService.js`, `api.js` | Usato da tutti i servizi |
| Trial Activation | `subscriptionService.js` | Logica trial validata |
| Admin Impersonation | `adminAuth.js`, `admin.js` | Security-critical |
| Webhook to GHL | `webhookService.js` | Automazioni email attive |

> Modifiche a questi componenti impattano Review, Page e Menu Digitale.
