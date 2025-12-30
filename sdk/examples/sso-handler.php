<?php
/**
 * SSO Handler per Smart Review
 *
 * Questo file gestisce l'autenticazione SSO proveniente da Suite.
 * Deve essere posizionato in: /auth/sso.php (o equivalente)
 *
 * FLUSSO:
 * 1. L'utente clicca su "Smart Review" nella Suite
 * 2. Suite genera un token JWT temporaneo (5 min)
 * 3. L'utente viene reindirizzato qui con ?token=xxx
 * 4. Questo script verifica il token con Suite API
 * 5. Se valido, crea una sessione locale e redirect alla dashboard
 */

session_start();

// Configurazione
$SUITE_API_URL = 'https://suite-api.doid.it';
$SUITE_URL = 'https://suite.doid.it';

// Ottieni il token dalla query string
$token = $_GET['token'] ?? null;

if (!$token) {
    http_response_code(400);
    die('Token mancante. <a href="' . $SUITE_URL . '">Torna a Suite</a>');
}

// Verifica il token con Suite API
$response = callSuiteAPI('/api/external/sso/authenticate', [
    'token' => $token
]);

if (!$response['success']) {
    http_response_code(401);
    die('Token non valido o scaduto. <a href="' . $SUITE_URL . '">Torna a Suite</a>');
}

$data = $response['data'];

// Estrai dati utente e attività
$user = $data['user'];
$activity = $data['activity'];
$organization = $data['organization'];
$license = $data['license'];
$role = $data['role'];

// Verifica che l'utente abbia accesso a Smart Review
$hasSmartReview = false;
if (isset($license['subscriptions'])) {
    foreach ($license['subscriptions'] as $sub) {
        if ($sub['serviceCode'] === 'smart_review' && $sub['status'] === 'active') {
            $hasSmartReview = true;
            break;
        }
    }
}

if (!$hasSmartReview) {
    http_response_code(403);
    die('Non hai un abbonamento attivo a Smart Review. <a href="' . $SUITE_URL . '">Torna a Suite</a>');
}

// Crea sessione locale
$_SESSION['doid_user'] = [
    'id' => $user['id'],
    'email' => $user['email'],
    'fullName' => $user['fullName'] ?? null,
    'avatarUrl' => $user['avatarUrl'] ?? null
];

$_SESSION['doid_activity'] = [
    'id' => $activity['id'],
    'name' => $activity['name'],
    'email' => $activity['email'] ?? null
];

$_SESSION['doid_organization'] = [
    'id' => $organization['id'],
    'name' => $organization['name']
];

$_SESSION['doid_license'] = $license;
$_SESSION['doid_role'] = $role;
$_SESSION['doid_token'] = $token; // Per la sidebar

// Flag per indicare che l'utente viene da Suite
$_SESSION['from_suite'] = true;

// Log dell'accesso (opzionale)
logAccess($user, $activity);

// Redirect alla dashboard di Smart Review
$redirectUrl = $_GET['redirect'] ?? '/dashboard';

// Parametro per UI iframe (se presente)
if (isset($_GET['iframe'])) {
    $redirectUrl .= (strpos($redirectUrl, '?') !== false ? '&' : '?') . 'iframe=1';
}

header('Location: ' . $redirectUrl);
exit;

// ============================================
// FUNZIONI HELPER
// ============================================

function callSuiteAPI($endpoint, $data = null) {
    global $SUITE_API_URL;

    $url = $SUITE_API_URL . $endpoint;

    $options = [
        'http' => [
            'method' => $data ? 'POST' : 'GET',
            'header' => [
                'Content-Type: application/json',
                'Accept: application/json'
            ],
            'timeout' => 10
        ]
    ];

    if ($data) {
        $options['http']['content'] = json_encode($data);
    }

    $context = stream_context_create($options);
    $response = @file_get_contents($url, false, $context);

    if ($response === false) {
        return ['success' => false, 'error' => 'Errore di connessione'];
    }

    return json_decode($response, true);
}

function logAccess($user, $activity) {
    // Implementa il logging secondo le tue esigenze
    // Esempio: salva in database o file
    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'user_id' => $user['id'],
        'user_email' => $user['email'],
        'activity_id' => $activity['id'],
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ];

    // error_log(json_encode($logEntry));
}
