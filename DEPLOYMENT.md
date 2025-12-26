# Deployment su DigitalOcean App Platform

Questa guida spiega come deployare DOID Suite su DigitalOcean App Platform.

## Prerequisiti

1. Account DigitalOcean (https://cloud.digitalocean.com)
2. Repository GitHub con il codice del progetto
3. Progetto Supabase già configurato

## Step 1: Preparazione Repository GitHub

### 1.1 Crea repository su GitHub

```bash
cd doid-suite
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/doid-suite.git
git push -u origin main
```

### 1.2 Aggiorna il file app.yaml

Modifica `.do/app.yaml` e sostituisci `YOUR_GITHUB_USERNAME` con il tuo username GitHub:

```yaml
github:
  repo: YOUR_GITHUB_USERNAME/doid-suite
```

## Step 2: Deploy su DigitalOcean

### 2.1 Crea App

1. Vai su https://cloud.digitalocean.com/apps
2. Clicca **"Create App"**
3. Seleziona **"GitHub"** come source
4. Autorizza DigitalOcean ad accedere al tuo repository
5. Seleziona il repository `doid-suite`
6. Seleziona il branch `main`

### 2.2 Configurazione Automatica

DigitalOcean rileverà automaticamente il file `.do/app.yaml` e configurerà:
- **api**: Backend Node.js sulla porta 3001
- **frontend**: Static site React

### 2.3 Configura Variabili d'Ambiente

Nella sezione **"Environment Variables"**, aggiungi queste variabili SECRET:

| Variabile | Valore | Tipo |
|-----------|--------|------|
| `SUPABASE_URL` | `https://xxx.supabase.co` | Secret |
| `SUPABASE_ANON_KEY` | La tua anon key | Secret |
| `SUPABASE_SERVICE_KEY` | La tua service role key | Secret |
| `JWT_SECRET` | Una stringa casuale sicura (32+ caratteri) | Secret |
| `SUPER_ADMIN_EMAILS` | Email admin separate da virgola | Secret |

Per generare un JWT_SECRET sicuro:
```bash
openssl rand -base64 32
```

### 2.4 Completa il Deploy

1. Clicca **"Next"** per rivedere le risorse
2. Scegli il piano (Basic: ~$12/mese, o Pro per production)
3. Seleziona la region (consigliato: `fra` - Frankfurt per l'Europa)
4. Clicca **"Create Resources"**

## Step 3: Post-Deployment

### 3.1 Ottieni URL App

Dopo il deploy, DigitalOcean assegnerà un URL tipo:
- `https://doid-suite-xxxxx.ondigitalocean.app`

### 3.2 Aggiorna Supabase

Nel pannello Supabase, vai su **Authentication > URL Configuration** e aggiungi:
- **Site URL**: `https://doid-suite-xxxxx.ondigitalocean.app`
- **Redirect URLs**: `https://doid-suite-xxxxx.ondigitalocean.app/*`

### 3.3 Configura Dominio Custom (opzionale)

1. In DigitalOcean App Platform, vai su **Settings > Domains**
2. Clicca **"Add Domain"**
3. Inserisci il tuo dominio (es. `suite.doid.it`)
4. Aggiungi il record CNAME indicato nel tuo DNS provider

## Struttura Costi

| Componente | Piano Basic | Piano Pro |
|------------|-------------|-----------|
| Backend (api) | $5/mese | $12/mese |
| Frontend (static) | Gratis | Gratis |
| **Totale** | ~$5/mese | ~$12/mese |

## Troubleshooting

### Il backend non si avvia

Verifica i log in: **App > Insights > Runtime Logs**

Cause comuni:
- Variabili d'ambiente mancanti
- Errore di connessione a Supabase (verifica SUPABASE_URL)

### Errori CORS

Assicurati che `FRONTEND_URL` sia impostato correttamente nelle env del backend.
Il backend già include le origini DigitalOcean nelle CORS config.

### Frontend non carica i dati

1. Verifica che `VITE_API_URL` punti all'URL corretto
2. Controlla la console del browser per errori
3. Verifica che l'API risponda su `/api/health`

## Comandi Utili

### Verifica Health Check
```bash
curl https://YOUR-APP-URL.ondigitalocean.app/api/health
```

### Rebuild Manuale
Nella dashboard DigitalOcean: **Actions > Force Rebuild and Deploy**

## Aggiornamenti

Ogni push al branch `main` triggererà automaticamente un nuovo deploy.

Per disabilitare il deploy automatico:
1. Vai su **Settings > App Spec**
2. Modifica `deploy_on_push: false`
