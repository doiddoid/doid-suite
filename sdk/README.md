# DOID Suite Sidebar SDK

Componente JavaScript standalone per integrare la sidebar di DOID Suite in qualsiasi applicazione DOID.

## Caratteristiche

- **Zero dipendenze** - JavaScript vanilla, funziona ovunque
- **Leggero** - ~34KB minificato
- **Responsive** - Si adatta a tutti i dispositivi
- **Personalizzabile** - Tema chiaro/scuro, posizione, callbacks
- **SSO integrato** - Autenticazione automatica con Suite

## Installazione

### Via CDN (consigliato)

```html
<script src="https://suite.doid.it/sdk/doid-sidebar.min.js"></script>
```

### Via NPM

```bash
npm install @doid/sidebar-sdk
```

## Uso Base

```html
<script src="https://suite.doid.it/sdk/doid-sidebar.min.js"></script>
<script>
  DOIDSidebar.init({
    token: 'SSO_TOKEN_HERE',
    currentService: 'smart_review'
  });
</script>
```

## Configurazione Completa

```javascript
DOIDSidebar.init({
  // === REQUIRED ===
  token: 'xxx',           // Token SSO da Suite

  // === API ===
  apiUrl: 'https://suite-api.doid.it',  // URL API Suite
  suiteUrl: 'https://suite.doid.it',    // URL frontend Suite

  // === CONTESTO ===
  currentService: 'smart_review',  // Servizio corrente (evidenziato)
  activityId: 'uuid',              // ID attività corrente

  // === ASPETTO ===
  position: 'right',        // 'left' | 'right'
  theme: 'light',           // 'light' | 'dark'
  expandedWidth: '320px',   // Larghezza espansa
  collapsedWidth: '60px',   // Larghezza collassata
  zIndex: 9999,             // Z-index

  // === FUNZIONALITÀ ===
  autoHide: false,              // Nascondi automaticamente
  showActivitySwitcher: true,   // Mostra selettore attività
  showServiceNav: true,         // Mostra navigazione servizi
  showNotifications: true,      // Mostra notifiche

  // === CALLBACKS ===
  onReady: function(sidebar) {
    console.log('Sidebar pronta');
  },
  onError: function(error) {
    console.error('Errore:', error);
  },
  onActivityChange: function(activity) {
    console.log('Nuova attività:', activity);
  },
  onServiceChange: function(service) {
    console.log('Navigazione a:', service);
  }
});
```

## API Metodi

### Controllo Sidebar

```javascript
// Espandi/Collassa
DOIDSidebar.toggle();

// Mostra (se nascosta)
DOIDSidebar.show();

// Nascondi
DOIDSidebar.hide();

// Cambia tema
DOIDSidebar.setTheme('dark');

// Cambia posizione
DOIDSidebar.setPosition('left');

// Ricarica dati
DOIDSidebar.refresh();

// Rimuovi completamente
DOIDSidebar.destroy();
```

### Getter Stato

```javascript
// Utente corrente
const user = DOIDSidebar.getUser();

// Attività corrente
const activity = DOIDSidebar.getActivity();

// Lista attività
const activities = DOIDSidebar.getActivities();

// Abbonamenti attivi
const subs = DOIDSidebar.getSubscriptions();

// Stato UI
DOIDSidebar.isExpanded();  // true/false
DOIDSidebar.isHidden();    // true/false
```

## Integrazione PHP (Smart Review)

### 1. Crea endpoint SSO

Crea `/auth/sso.php` per gestire l'autenticazione da Suite:

```php
<?php
session_start();

$token = $_GET['token'] ?? null;
if (!$token) die('Token mancante');

// Verifica con Suite API
$response = file_get_contents(
  'https://suite-api.doid.it/api/external/sso/authenticate',
  false,
  stream_context_create([
    'http' => [
      'method' => 'POST',
      'header' => 'Content-Type: application/json',
      'content' => json_encode(['token' => $token])
    ]
  ])
);

$data = json_decode($response, true);
if (!$data['success']) die('Token non valido');

// Salva in sessione
$_SESSION['doid_user'] = $data['data']['user'];
$_SESSION['doid_activity'] = $data['data']['activity'];
$_SESSION['doid_token'] = $token;

// Redirect alla dashboard
header('Location: /dashboard');
```

### 2. Aggiungi sidebar alle pagine

```php
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Padding per la sidebar */
    body { padding-right: 320px; }
    body.collapsed { padding-right: 60px; }
  </style>
</head>
<body>
  <!-- Il tuo contenuto -->

  <script src="https://suite.doid.it/sdk/doid-sidebar.min.js"></script>
  <script>
    DOIDSidebar.init({
      token: '<?= $_SESSION['doid_token'] ?>',
      currentService: 'smart_review',
      activityId: '<?= $_SESSION['doid_activity']['id'] ?>',
      onReady: function() {
        document.body.classList.add('sidebar-ready');
      }
    });
  </script>
</body>
</html>
```

## CSS Personalizzato

La sidebar usa CSS custom properties che puoi sovrascrivere:

```css
.doid-sidebar {
  --doid-bg: #ffffff;
  --doid-bg-hover: #f3f4f6;
  --doid-bg-active: #e5e7eb;
  --doid-text: #1f2937;
  --doid-text-muted: #6b7280;
  --doid-border: #e5e7eb;
  --doid-primary: #3b82f6;
  --doid-primary-hover: #2563eb;
}
```

## Servizi Supportati

| Codice | Nome |
|--------|------|
| `smart_review` | Smart Review |
| `smart_page` | Smart Page |
| `menu_digitale` | Menu Digitale |
| `display_suite` | Display Suite |

## Headers CORS/CSP

Aggiungi questi headers nel tuo server per permettere l'integrazione:

```
Content-Security-Policy: frame-ancestors 'self' https://suite.doid.it
Access-Control-Allow-Origin: https://suite.doid.it
```

## Keyboard Shortcuts

| Shortcut | Azione |
|----------|--------|
| `Ctrl+S` | Toggle sidebar (esempio, da implementare) |
| `Escape` | Chiudi menu aperti |

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Changelog

### v1.0.0
- Release iniziale
- Autenticazione SSO
- Selettore attività
- Navigazione servizi
- Tema chiaro/scuro
- FAB quando nascosta
