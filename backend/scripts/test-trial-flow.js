/**
 * TEST FLUSSO TRIAL SMART REVIEW - VERSIONE REALE
 *
 * Questo script crea un utente REALE via API DOID e testa l'intero flusso:
 * 1. Registrazione utente
 * 2. Conferma email (via Supabase Admin)
 * 3. Login (attiva org + activity + trial)
 * 4. Invio webhook reminder trial (accelerati)
 *
 * Uso: node scripts/test-trial-flow.js [email_test]
 *
 * NOTA: L'email deve essere un indirizzo valido per ricevere le email da GHL
 */

import 'dotenv/config';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// ============================================
// CONFIGURAZIONE
// ============================================

const API_BASE_URL = process.env.API_BASE_URL || 'https://doid-suite-e9i5o.ondigitalocean.app';
// Per test locale: 'http://localhost:3001'

const TEST_CONFIG = {
  // Email per il test (da argomento o default)
  email: process.argv[2] || 'info.doid@gmail.com',

  // Dati utente test
  password: 'TestDoid2026!',
  fullName: 'Test DOID Flow',
  activityName: 'Ristorante Test GHL',

  // Servizio da testare
  requestedService: 'smart_review',

  // Timing (secondi tra un evento e l'altro)
  timingSeconds: {
    afterLogin: 10,        // Dopo login, aspetta prima dei reminder
    betweenReminders: 60   // Tra un reminder e l'altro
  }
};

// Supabase Admin Client (per confermare email)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ============================================
// WEBHOOK URLs (per reminder manuali)
// ============================================

const WEBHOOKS = {
  trialDay7: process.env.GHL_WEBHOOK_TRIAL_DAY_7,
  trialDay14: process.env.GHL_WEBHOOK_TRIAL_DAY_14,
  trialDay21: process.env.GHL_WEBHOOK_TRIAL_DAY_21,
  trialDay27: process.env.GHL_WEBHOOK_TRIAL_DAY_27,
  trialExpired: process.env.GHL_WEBHOOK_TRIAL_EXPIRED
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatDate(date) {
  return date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function sleep(seconds) {
  return new Promise(resolve => {
    console.log(`   \u23F3 Attendo ${seconds} secondi...`);
    setTimeout(resolve, seconds * 1000);
  });
}

async function sendWebhook(name, url, payload) {
  console.log(`\n\u{1F4E4} Invio webhook: ${name}`);

  if (!url) {
    console.log(`   \u274C URL non configurato! Controlla .env`);
    return false;
  }

  try {
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    console.log(`   \u2705 Webhook inviato con successo (status: ${response.status})`);
    return true;
  } catch (error) {
    console.log(`   \u274C Errore: ${error.message}`);
    return false;
  }
}

// ============================================
// API CALLS
// ============================================

async function registerUser() {
  console.log(`\n\u{1F4E4} Chiamata API: POST /api/auth/register`);

  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
      email: TEST_CONFIG.email,
      password: TEST_CONFIG.password,
      fullName: TEST_CONFIG.fullName,
      activityName: TEST_CONFIG.activityName,
      requestedService: TEST_CONFIG.requestedService
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    console.log(`   \u2705 Registrazione completata`);
    console.log(`   User ID: ${response.data.data?.user?.id}`);
    return response.data;
  } catch (error) {
    if (error.response?.data?.error?.includes('già registrata') ||
        error.response?.data?.error?.includes('already registered')) {
      console.log(`   \u26A0\uFE0F  Utente già registrato, procedo con login`);
      return { alreadyExists: true };
    }
    console.log(`   \u274C Errore: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

async function confirmEmail() {
  console.log(`\n\u{1F4E4} Conferma email via Supabase Admin`);

  try {
    // Trova l'utente per email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const user = users.users.find(u => u.email === TEST_CONFIG.email);
    if (!user) {
      throw new Error('Utente non trovato in Supabase');
    }

    // Conferma l'email
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email_confirm: true
    });

    if (confirmError) throw confirmError;

    console.log(`   \u2705 Email confermata per user ${user.id}`);
    return user;
  } catch (error) {
    console.log(`   \u274C Errore: ${error.message}`);
    throw error;
  }
}

async function loginUser() {
  console.log(`\n\u{1F4E4} Chiamata API: POST /api/auth/login`);

  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: TEST_CONFIG.email,
      password: TEST_CONFIG.password
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    console.log(`   \u2705 Login completato`);

    if (response.data.data?.autoSetup?.completed) {
      console.log(`   \u{1F389} Auto-setup completato:`);
      console.log(`      - Organization: ${response.data.data.autoSetup.organization?.id}`);
      console.log(`      - Activity: ${response.data.data.autoSetup.activity?.id}`);
      console.log(`      - Subscription: ${response.data.data.autoSetup.subscription?.id || 'N/A'}`);
      console.log(`      - Service: ${response.data.data.autoSetup.requestedService}`);
    }

    return response.data;
  } catch (error) {
    console.log(`   \u274C Errore: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// ============================================
// TRIAL REMINDER PAYLOADS
// ============================================

function getTrialReminderPayload(event, daysRemaining, userData) {
  const trialEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return {
    event: event,
    timestamp: new Date().toISOString(),
    data: {
      user_id: userData.userId,
      subscription_id: userData.subscriptionId || 'test-sub-id',
      email: TEST_CONFIG.email,
      first_name: TEST_CONFIG.fullName.split(' ')[0],
      activity_name: TEST_CONFIG.activityName,
      service: 'smart_review',
      service_label: 'Smart Review',
      days_remaining: daysRemaining,
      trial_ends_at: trialEndDate.toISOString().split('T')[0],
      trial_ends_at_formatted: formatDate(trialEndDate),
      dashboard_url: 'https://review.doid.it',
      upgrade_url: 'https://review.doid.it/upgrade',
      price: '9.90',
      has_free_plan: true
    }
  };
}

function getTrialExpiredPayload(userData) {
  return {
    event: 'trial.expired',
    timestamp: new Date().toISOString(),
    data: {
      user_id: userData.userId,
      subscription_id: userData.subscriptionId || 'test-sub-id',
      email: TEST_CONFIG.email,
      first_name: TEST_CONFIG.fullName.split(' ')[0],
      activity_name: TEST_CONFIG.activityName,
      service: 'smart_review',
      service_label: 'Smart Review',
      expired_at: new Date().toISOString(),
      dashboard_url: 'https://review.doid.it',
      upgrade_url: 'https://review.doid.it/upgrade',
      price: '9.90',
      has_free_plan: true
    }
  };
}

// ============================================
// MAIN TEST FLOW
// ============================================

async function runTestFlow() {
  console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
  console.log('     TEST FLUSSO TRIAL SMART REVIEW - UTENTE REALE');
  console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
  console.log(`\n\u{1F4E7} Email test: ${TEST_CONFIG.email}`);
  console.log(`\u{1F464} Utente: ${TEST_CONFIG.fullName}`);
  console.log(`\u{1F3EA} Attivita': ${TEST_CONFIG.activityName}`);
  console.log(`\u{1F527} Servizio: Smart Review`);
  console.log(`\u{1F310} API: ${API_BASE_URL}`);

  let userData = {};

  // ============================================
  // STEP 1: REGISTRAZIONE
  // ============================================
  console.log('\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('STEP 1: REGISTRAZIONE UTENTE');
  console.log('\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('Creo utente reale via API DOID Suite.');
  console.log('\u2192 Webhook user.registered inviato a GHL (crea contatto)');

  const registerResult = await registerUser();

  if (registerResult.data?.user?.id) {
    userData.userId = registerResult.data.user.id;
  }

  await sleep(3);

  // ============================================
  // STEP 2: CONFERMA EMAIL
  // ============================================
  console.log('\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('STEP 2: CONFERMA EMAIL');
  console.log('\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('Confermo email via Supabase Admin (simula click su link verifica).');

  const user = await confirmEmail();
  userData.userId = user.id;

  await sleep(2);

  // ============================================
  // STEP 3: LOGIN (ATTIVA ORG + ACTIVITY + TRIAL)
  // ============================================
  console.log('\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('STEP 3: PRIMO LOGIN (AUTO-SETUP)');
  console.log('\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('Il primo login processa la pending registration:');
  console.log('  - Crea Organization');
  console.log('  - Crea Activity');
  console.log('  - Attiva Trial Smart Review PRO');
  console.log('\u2192 Webhook user.verified inviato a GHL');
  console.log('\u2192 Webhook service.trial_activated inviato a GHL');

  const loginResult = await loginUser();

  if (loginResult.data?.autoSetup?.subscription?.id) {
    userData.subscriptionId = loginResult.data.autoSetup.subscription.id;
  }
  if (loginResult.data?.autoSetup?.activity?.id) {
    userData.activityId = loginResult.data.autoSetup.activity.id;
  }

  console.log('\n\u{1F4EC} A questo punto dovresti aver ricevuto:');
  console.log('   1. \u2709\uFE0F  Email "Account DOID attivo" (user.verified)');
  console.log('   2. \u2709\uFE0F  Email "Benvenuto Smart Review PRO" (service.trial_activated)');

  await sleep(TEST_CONFIG.timingSeconds.afterLogin);

  // ============================================
  // STEP 4-8: REMINDER TRIAL (WEBHOOK MANUALI)
  // ============================================
  console.log('\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('STEP 4: REMINDER GIORNO 7');
  console.log('\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('Simulo: "Come sta andando con Smart Review?"');
  await sendWebhook('trial.day_7', WEBHOOKS.trialDay7, getTrialReminderPayload('trial.day_7', 23, userData));

  await sleep(TEST_CONFIG.timingSeconds.betweenReminders);

  console.log('\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('STEP 5: REMINDER GIORNO 14');
  console.log('\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('Simulo: "Sei a meta\' della prova!"');
  await sendWebhook('trial.day_14', WEBHOOKS.trialDay14, getTrialReminderPayload('trial.day_14', 16, userData));

  await sleep(TEST_CONFIG.timingSeconds.betweenReminders);

  console.log('\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('STEP 6: REMINDER GIORNO 21');
  console.log('\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('Simulo: "Mancano solo 9 giorni!"');
  await sendWebhook('trial.day_21', WEBHOOKS.trialDay21, getTrialReminderPayload('trial.day_21', 9, userData));

  await sleep(TEST_CONFIG.timingSeconds.betweenReminders);

  console.log('\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('STEP 7: REMINDER GIORNO 27 - URGENTE');
  console.log('\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('\u26A0\uFE0F  Simulo: "ULTIMI 3 GIORNI!"');
  await sendWebhook('trial.day_27', WEBHOOKS.trialDay27, getTrialReminderPayload('trial.day_27', 3, userData));

  await sleep(TEST_CONFIG.timingSeconds.betweenReminders);

  console.log('\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('STEP 8: TRIAL SCADUTO');
  console.log('\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('\u274C Simulo: "Il tuo trial e\' scaduto"');
  await sendWebhook('trial.expired', WEBHOOKS.trialExpired, getTrialExpiredPayload(userData));

  // ============================================
  // FINE
  // ============================================
  console.log('\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
  console.log('     \u2705 TEST COMPLETATO');
  console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
  console.log(`\n\u{1F4EC} Controlla la casella email: ${TEST_CONFIG.email}`);
  console.log('   Dovresti aver ricevuto 7 email in sequenza:\n');
  console.log('   1. \u2709\uFE0F  Account DOID attivo (user.verified)');
  console.log('   2. \u2709\uFE0F  Benvenuto Smart Review PRO (service.trial_activated)');
  console.log('   3. \u2709\uFE0F  Come sta andando? (giorno 7)');
  console.log('   4. \u2709\uFE0F  Sei a meta\'! (giorno 14)');
  console.log('   5. \u2709\uFE0F  Mancano 9 giorni (giorno 21)');
  console.log('   6. \u26A0\uFE0F  ULTIMI 3 GIORNI! (giorno 27)');
  console.log('   7. \u274C  Trial scaduto');
  console.log('\n\u{1F4CA} Verifica anche i log in GHL per confermare i workflow attivati.');
  console.log('\n\u{1F464} User ID:', userData.userId);
  console.log('\u{1F4DD} Subscription ID:', userData.subscriptionId || 'N/A');
  console.log('\n');
}

// ============================================
// RUN
// ============================================

runTestFlow().catch(error => {
  console.error('\n\u274C Errore durante il test:', error.message);
  process.exit(1);
});
