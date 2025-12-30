<?php
/**
 * Esempio di integrazione DOID Sidebar in Smart Review (PHP)
 *
 * Questo file mostra come integrare la sidebar Suite in un'applicazione PHP esistente.
 *
 * REQUISITI:
 * 1. L'utente deve essere autenticato via SSO da Suite
 * 2. Il token SSO deve essere salvato in sessione
 * 3. La sidebar viene caricata con il token per autenticarsi
 */

session_start();

// Configurazione
$SUITE_API_URL = 'https://suite-api.doid.it';
$SUITE_URL = 'https://suite.doid.it';
$CURRENT_SERVICE = 'smart_review';

// Verifica se l'utente è autenticato
if (!isset($_SESSION['doid_token'])) {
    // Redirect al login di Suite se non autenticato
    header('Location: ' . $SUITE_URL . '/login?redirect=' . urlencode($_SERVER['REQUEST_URI']));
    exit;
}

$sso_token = $_SESSION['doid_token'];
$activity_id = $_SESSION['activity_id'] ?? null;
?>
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart Review - DOID</title>

    <!-- Permetti iframe solo da Suite -->
    <meta http-equiv="Content-Security-Policy" content="frame-ancestors 'self' https://suite.doid.it;">

    <!-- I tuoi CSS esistenti -->
    <link rel="stylesheet" href="/css/app.css">

    <style>
        /* Aggiungi padding per la sidebar */
        body.doid-sidebar-active {
            padding-right: 320px; /* Larghezza sidebar expanded */
            transition: padding-right 0.3s ease;
        }

        body.doid-sidebar-collapsed {
            padding-right: 60px; /* Larghezza sidebar collapsed */
        }

        @media (max-width: 768px) {
            body.doid-sidebar-active {
                padding-right: 0;
            }
        }
    </style>
</head>
<body>

<!-- Il tuo contenuto esistente -->
<div class="app-container">
    <header class="app-header">
        <h1>Smart Review</h1>
        <!-- ... il resto del tuo header ... -->
    </header>

    <main class="app-main">
        <!-- ... il tuo contenuto principale ... -->
        <p>Benvenuto nella dashboard di Smart Review!</p>
    </main>
</div>

<!-- DOID Sidebar SDK -->
<script src="https://suite.doid.it/sdk/doid-sidebar.min.js"></script>
<script>
    // Inizializza la sidebar
    DOIDSidebar.init({
        // Configurazione API
        apiUrl: '<?= $SUITE_API_URL ?>',
        suiteUrl: '<?= $SUITE_URL ?>',

        // Token SSO (generato dal login o passato via URL)
        token: '<?= htmlspecialchars($sso_token) ?>',

        // Servizio corrente (per evidenziarlo nel menu)
        currentService: '<?= $CURRENT_SERVICE ?>',

        // ID attività corrente (opzionale)
        activityId: <?= $activity_id ? "'$activity_id'" : 'null' ?>,

        // Posizione e aspetto
        position: 'right',  // 'left' o 'right'
        theme: 'light',     // 'light' o 'dark'

        // Opzioni
        showActivitySwitcher: true,
        showServiceNav: true,
        showNotifications: true,

        // Callbacks
        onReady: function(sidebar) {
            console.log('DOID Sidebar pronta!');
            document.body.classList.add('doid-sidebar-active');
        },

        onError: function(error) {
            console.error('Errore sidebar:', error);
            // Opzionale: redirect al login se token scaduto
            // if (error.message.includes('Token')) {
            //     window.location.href = '<?= $SUITE_URL ?>/login';
            // }
        },

        onActivityChange: function(activity) {
            console.log('Attività cambiata:', activity);
            // Ricarica i dati per la nuova attività
            // loadActivityData(activity.id);
        },

        onServiceChange: function(service) {
            console.log('Navigazione a:', service);
        }
    });

    // Esempio: toggle sidebar con tasto S
    document.addEventListener('keydown', function(e) {
        if (e.key === 's' && e.ctrlKey) {
            e.preventDefault();
            DOIDSidebar.toggle();

            if (DOIDSidebar.isExpanded()) {
                document.body.classList.remove('doid-sidebar-collapsed');
            } else {
                document.body.classList.add('doid-sidebar-collapsed');
            }
        }
    });
</script>

</body>
</html>
