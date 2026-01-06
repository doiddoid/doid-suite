/**
 * TEST ACCELERATO FLUSSO TRIAL SMART REVIEW
 *
 * Converte i giorni in ore per test rapidi:
 * - Giorno 0 (attivazione) → Ora 0
 * - Giorno 7 → 60 secondi dopo
 * - Giorno 14 → 120 secondi dopo
 * - Giorno 21 → 180 secondi dopo
 * - Giorno 27 → 240 secondi dopo
 * - Giorno 30 (scadenza) → 300 secondi dopo
 *
 * Uso: node scripts/test-trial-flow.js [email_test]
 */

import 'dotenv/config';
import axios from 'axios';

// ============================================
// CONFIGURAZIONE TEST
// ============================================

const TEST_CONFIG = {
  // Email per il test (default o da argomento)
  email: process.argv[2] || 'info.doid@gmail.com',

  // Dati utente test
  firstName: 'Mario',
  lastName: 'Rossi',
  phone: '+393481234567',
  activityName: 'Ristorante Test',

  // Servizio da testare
  service: 'smart_review',
  serviceLabel: 'Smart Review',
  price: '9.90',
  hasFree: true,

  // Timing (secondi tra un evento e l'altro)
  // In produzione: giorni, in test: secondi
  timingSeconds: {
    afterVerified: 5,      // Dopo verifica, attiva trial
    day7: 60,              // Dopo 60s = reminder giorno 7
    day14: 60,             // Dopo altri 60s = reminder giorno 14
    day21: 60,             // Dopo altri 60s = reminder giorno 21
    day27: 60,             // Dopo altri 60s = reminder giorno 27 (urgente)
    expired: 60            // Dopo altri 60s = trial scaduto
  }
};

// ============================================
// WEBHOOK URLs
// ============================================

const WEBHOOKS = {
  userVerified: process.env.GHL_WEBHOOK_USER_VERIFIED,
  trialActivated: process.env.GHL_WEBHOOK_SERVICE_TRIAL_ACTIVATED,
  trialDay7: process.env.GHL_WEBHOOK_TRIAL_DAY_7,
  trialDay14: process.env.GHL_WEBHOOK_TRIAL_DAY_14,
  trialDay21: process.env.GHL_WEBHOOK_TRIAL_DAY_21,
  trialDay27: process.env.GHL_WEBHOOK_TRIAL_DAY_27,
  trialExpired: process.env.GHL_WEBHOOK_TRIAL_EXPIRED
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
  console.log(`   URL: ${url}`);

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
    if (error.response) {
      console.log(`   Response status: ${error.response.status}`);
      console.log(`   Response data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// ============================================
// PAYLOADS
// ============================================

const userId = generateUUID();
const subscriptionId = generateUUID();
const activityId = generateUUID();
const trialStartDate = new Date();
const trialEndDate = new Date(trialStartDate.getTime() + 30 * 24 * 60 * 60 * 1000);

function getPayload_UserVerified() {
  return {
    event: 'user.verified',
    timestamp: new Date().toISOString(),
    data: {
      user_id: userId,
      email: TEST_CONFIG.email,
      first_name: TEST_CONFIG.firstName,
      last_name: TEST_CONFIG.lastName,
      phone: TEST_CONFIG.phone,
      activity_name: TEST_CONFIG.activityName,
      dashboard_url: 'https://suite.doid.it',
      support_email: 'info@doid.biz',
      support_whatsapp: '+393480890477'
    }
  };
}

function getPayload_TrialActivated() {
  return {
    event: 'service.trial_activated',
    timestamp: new Date().toISOString(),
    data: {
      user_id: userId,
      subscription_id: subscriptionId,
      activity_id: activityId,
      email: TEST_CONFIG.email,
      first_name: TEST_CONFIG.firstName,
      last_name: TEST_CONFIG.lastName,
      activity_name: TEST_CONFIG.activityName,
      service: TEST_CONFIG.service,
      service_label: TEST_CONFIG.serviceLabel,
      plan: 'pro',
      trial_ends_at: trialEndDate.toISOString().split('T')[0],
      trial_ends_at_formatted: formatDate(trialEndDate),
      dashboard_url: 'https://review.doid.it',
      upgrade_url: 'https://review.doid.it/upgrade',
      price: TEST_CONFIG.price,
      has_free_plan: TEST_CONFIG.hasFree
    }
  };
}

function getPayload_TrialReminder(event, daysRemaining) {
  return {
    event: event,
    timestamp: new Date().toISOString(),
    data: {
      user_id: userId,
      subscription_id: subscriptionId,
      email: TEST_CONFIG.email,
      first_name: TEST_CONFIG.firstName,
      activity_name: TEST_CONFIG.activityName,
      service: TEST_CONFIG.service,
      service_label: TEST_CONFIG.serviceLabel,
      days_remaining: daysRemaining,
      trial_ends_at: trialEndDate.toISOString().split('T')[0],
      trial_ends_at_formatted: formatDate(trialEndDate),
      dashboard_url: 'https://review.doid.it',
      upgrade_url: 'https://review.doid.it/upgrade',
      price: TEST_CONFIG.price,
      has_free_plan: TEST_CONFIG.hasFree
    }
  };
}

function getPayload_TrialExpired() {
  return {
    event: 'trial.expired',
    timestamp: new Date().toISOString(),
    data: {
      user_id: userId,
      subscription_id: subscriptionId,
      email: TEST_CONFIG.email,
      first_name: TEST_CONFIG.firstName,
      activity_name: TEST_CONFIG.activityName,
      service: TEST_CONFIG.service,
      service_label: TEST_CONFIG.serviceLabel,
      expired_at: new Date().toISOString(),
      dashboard_url: 'https://review.doid.it',
      upgrade_url: 'https://review.doid.it/upgrade',
      price: TEST_CONFIG.price,
      has_free_plan: TEST_CONFIG.hasFree
    }
  };
}

// ============================================
// MAIN TEST FLOW
// ============================================

async function runTestFlow() {
  console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
  console.log('     TEST FLUSSO TRIAL SMART REVIEW - MODALITA\' ACCELERATA');
  console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
  console.log(`\n\u{1F4E7} Email test: ${TEST_CONFIG.email}`);
  console.log(`\u{1F464} Utente: ${TEST_CONFIG.firstName} ${TEST_CONFIG.lastName}`);
  console.log(`\u{1F3EA} Attivita': ${TEST_CONFIG.activityName}`);
  console.log(`\u{1F527} Servizio: ${TEST_CONFIG.serviceLabel}`);
  console.log(`\n\u23F1\uFE0F  Timing accelerato:`);
  console.log(`   - Giorni 7, 14, 21, 27 \u2192 ${TEST_CONFIG.timingSeconds.day7}s tra ogni step`);
  console.log(`   - Durata totale test: ~${
    (TEST_CONFIG.timingSeconds.afterVerified +
     TEST_CONFIG.timingSeconds.day7 * 5) / 60
  } minuti\n`);

  // Verifica configurazione webhook
  console.log('\u{1F50D} Verifica configurazione webhook...');
  let missingWebhooks = [];
  for (const [name, url] of Object.entries(WEBHOOKS)) {
    if (!url) missingWebhooks.push(name);
  }
  if (missingWebhooks.length > 0) {
    console.log(`\n\u26A0\uFE0F  ATTENZIONE: Webhook mancanti nel .env:`);
    missingWebhooks.forEach(w => console.log(`   - ${w}`));
    console.log('\nContinuo comunque il test...\n');
  } else {
    console.log('   \u2705 Tutti i webhook configurati\n');
  }

  // STEP 1: User Verified
  console.log('\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('STEP 1: ACCOUNT VERIFICATO');
  console.log('\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('L\'utente ha verificato la sua email. Ricevera\' email di benvenuto generica.');
  await sendWebhook('user.verified', WEBHOOKS.userVerified, getPayload_UserVerified());

  await sleep(TEST_CONFIG.timingSeconds.afterVerified);

  // STEP 2: Trial Activated
  console.log('\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('STEP 2: TRIAL SMART REVIEW ATTIVATO');
  console.log('\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('L\'utente ha attivato il trial Smart Review PRO. Ricevera\' email di benvenuto servizio.');
  await sendWebhook('service.trial_activated', WEBHOOKS.trialActivated, getPayload_TrialActivated());

  await sleep(TEST_CONFIG.timingSeconds.day7);

  // STEP 3: Trial Day 7
  console.log('\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('STEP 3: REMINDER GIORNO 7 (simulato)');
  console.log('\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('Sono passati 7 giorni. "Come sta andando con Smart Review?"');
  await sendWebhook('trial.day_7', WEBHOOKS.trialDay7, getPayload_TrialReminder('trial.day_7', 23));

  await sleep(TEST_CONFIG.timingSeconds.day14);

  // STEP 4: Trial Day 14
  console.log('\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('STEP 4: REMINDER GIORNO 14 (simulato)');
  console.log('\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('Sono passati 14 giorni. "Sei a meta\' della prova!"');
  await sendWebhook('trial.day_14', WEBHOOKS.trialDay14, getPayload_TrialReminder('trial.day_14', 16));

  await sleep(TEST_CONFIG.timingSeconds.day21);

  // STEP 5: Trial Day 21
  console.log('\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('STEP 5: REMINDER GIORNO 21 (simulato)');
  console.log('\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('Sono passati 21 giorni. "Mancano solo 9 giorni!"');
  await sendWebhook('trial.day_21', WEBHOOKS.trialDay21, getPayload_TrialReminder('trial.day_21', 9));

  await sleep(TEST_CONFIG.timingSeconds.day27);

  // STEP 6: Trial Day 27 (URGENTE)
  console.log('\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('STEP 6: REMINDER GIORNO 27 - URGENTE (simulato)');
  console.log('\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('\u26A0\uFE0F  Sono passati 27 giorni. "ULTIMI 3 GIORNI!"');
  await sendWebhook('trial.day_27', WEBHOOKS.trialDay27, getPayload_TrialReminder('trial.day_27', 3));

  await sleep(TEST_CONFIG.timingSeconds.expired);

  // STEP 7: Trial Expired
  console.log('\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('STEP 7: TRIAL SCADUTO');
  console.log('\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  console.log('\u274C Il trial e\' scaduto. L\'utente passa a FREE o puo\' fare upgrade.');
  await sendWebhook('trial.expired', WEBHOOKS.trialExpired, getPayload_TrialExpired());

  // FINE
  console.log('\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
  console.log('     \u2705 TEST COMPLETATO');
  console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
  console.log(`\n\u{1F4EC} Controlla la casella email: ${TEST_CONFIG.email}`);
  console.log('   Dovresti aver ricevuto 7 email in sequenza:\n');
  console.log('   1. \u2709\uFE0F  Account DOID attivo');
  console.log('   2. \u2709\uFE0F  Benvenuto Smart Review PRO');
  console.log('   3. \u2709\uFE0F  Come sta andando? (giorno 7)');
  console.log('   4. \u2709\uFE0F  Sei a meta\'! (giorno 14)');
  console.log('   5. \u2709\uFE0F  Mancano 9 giorni (giorno 21)');
  console.log('   6. \u26A0\uFE0F  ULTIMI 3 GIORNI! (giorno 27)');
  console.log('   7. \u274C  Trial scaduto');
  console.log('\n\u{1F4CA} Verifica anche i log in GHL per confermare i workflow attivati.\n');
}

// ============================================
// RUN
// ============================================

runTestFlow().catch(error => {
  console.error('\n\u274C Errore durante il test:', error);
  process.exit(1);
});
