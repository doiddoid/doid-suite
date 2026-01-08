#!/usr/bin/env node
/**
 * Test Script: License Sync Webhooks
 *
 * Testa il sistema di sincronizzazione licenze via webhook verso Review e Page.
 *
 * Uso:
 *   node scripts/test-webhook-sync.js [activityId] [serviceCode]
 *
 * Esempio:
 *   node scripts/test-webhook-sync.js abc-123 smart_review
 *   node scripts/test-webhook-sync.js abc-123 smart_page
 *   node scripts/test-webhook-sync.js  # usa valori di test
 *
 * Opzioni ambiente:
 *   TEST_USER_ID       - UUID utente per test
 *   TEST_ACTIVITY_ID   - UUID attività per test
 *   DRY_RUN=true       - Solo simula, non invia realmente
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carica .env dal backend
dotenv.config({ path: join(__dirname, '../.env') });

// Import dopo aver caricato .env
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Colori per output console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

function logResult(label, success, details = '') {
  const icon = success ? '✓' : '✗';
  const color = success ? 'green' : 'red';
  log(`  ${icon} ${label}${details ? ': ' + details : ''}`, color);
}

// Configurazione webhook
const licenseSyncUrls = {
  'smart_review': process.env.DOID_WEBHOOK_SMART_REVIEW || 'https://review.doid.it/api/webhook/sync-license',
  'smart_page': process.env.DOID_WEBHOOK_SMART_PAGE || 'https://page.doid.it/api/webhook/sync-license'
};

const licenseSyncSecret = process.env.DOID_LICENSE_SYNC_SECRET || process.env.SSO_SECRET_KEY || '';

// Genera firma HMAC
import crypto from 'crypto';

function generateSignature(payload) {
  const dataString = JSON.stringify(payload);
  return crypto.createHmac('sha256', licenseSyncSecret).update(dataString).digest('hex');
}

// Invia webhook di test
async function sendTestWebhook(serviceCode, action, user, activity, subscription) {
  const webhookUrl = licenseSyncUrls[serviceCode];

  if (!webhookUrl) {
    return { success: false, error: 'No webhook URL configured' };
  }

  const timestamp = new Date().toISOString();

  const payload = {
    event: 'license.updated',
    timestamp,
    action,
    service: serviceCode,
    test: true, // Flag per indicare che è un test
    data: {
      user: {
        id: user.id,
        email: user.email
      },
      activity: {
        id: activity?.id,
        name: activity?.name
      },
      license: {
        isValid: ['trial', 'active'].includes(subscription.status),
        subscription: {
          status: subscription.status,
          planCode: subscription.planCode || 'pro',
          billingCycle: subscription.billingCycle || 'monthly',
          expiresAt: subscription.expiresAt,
          trialEndsAt: subscription.trialEndsAt
        }
      }
    }
  };

  // Genera firma
  const signature = crypto.createHmac('sha256', licenseSyncSecret)
    .update(JSON.stringify(payload))
    .digest('hex');

  if (process.env.DRY_RUN === 'true') {
    log('\n  [DRY RUN] Payload che verrebbe inviato:', 'yellow');
    console.log(JSON.stringify(payload, null, 2));
    return { success: true, dryRun: true };
  }

  try {
    const startTime = Date.now();
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DOID-Event': 'license.updated',
        'X-DOID-Signature': signature,
        'X-DOID-Timestamp': timestamp,
        'X-Webhook-Source': 'doid-suite-test'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000)
    });

    const elapsed = Date.now() - startTime;
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      elapsed,
      response: responseData
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Test health endpoint
async function testHealthEndpoint(serviceCode) {
  const baseUrl = licenseSyncUrls[serviceCode]?.replace('/sync-license', '/health');

  if (!baseUrl) {
    return { success: false, error: 'No URL configured' };
  }

  try {
    const response = await fetch(baseUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });

    const data = await response.json();
    return {
      success: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Ottieni dati da database per test
async function getTestData(activityId) {
  // Se fornito activityId, usa quello
  if (activityId) {
    const { data: activity, error: actError } = await supabaseAdmin
      .from('activities')
      .select(`
        id, name, organization_id,
        activity_users!inner(user_id, role)
      `)
      .eq('id', activityId)
      .single();

    if (actError || !activity) {
      log(`Attività ${activityId} non trovata`, 'red');
      return null;
    }

    // Ottieni dati utente
    const userId = activity.activity_users[0]?.user_id;
    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);

    return {
      user: { id: userId, email: authData?.user?.email || 'test@example.com' },
      activity: { id: activity.id, name: activity.name }
    };
  }

  // Altrimenti cerca una attività con subscription attiva
  const { data: subscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select(`
      *,
      activity:activities(id, name, organization_id)
    `)
    .in('status', ['trial', 'active'])
    .limit(1);

  if (!subscriptions?.length) {
    log('Nessuna subscription attiva trovata per test', 'yellow');
    return null;
  }

  const sub = subscriptions[0];

  // Trova l'owner dell'attività
  const { data: activityUsers } = await supabaseAdmin
    .from('activity_users')
    .select('user_id')
    .eq('activity_id', sub.activity_id)
    .eq('role', 'owner')
    .limit(1);

  const userId = activityUsers?.[0]?.user_id;
  let userEmail = 'test@example.com';

  if (userId) {
    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
    userEmail = authData?.user?.email || userEmail;
  }

  return {
    user: { id: userId || '00000000-0000-0000-0000-000000000000', email: userEmail },
    activity: { id: sub.activity.id, name: sub.activity.name },
    subscription: sub
  };
}

// Controlla webhook_logs
async function checkWebhookLogs(limit = 5) {
  const { data: logs, error } = await supabaseAdmin
    .from('webhook_logs')
    .select('*')
    .eq('event_type', 'license.sync')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, logs };
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const activityId = args[0] || process.env.TEST_ACTIVITY_ID;
  const serviceCode = args[1] || 'smart_review';

  logSection('🧪 TEST WEBHOOK LICENSE SYNC');

  log(`\nConfigurazione:`, 'cyan');
  log(`  Secret configurato: ${licenseSyncSecret ? 'Sì (' + licenseSyncSecret.substring(0, 8) + '...)' : 'No'}`);
  log(`  Review URL: ${licenseSyncUrls.smart_review}`);
  log(`  Page URL: ${licenseSyncUrls.smart_page}`);
  log(`  Activity ID: ${activityId || 'Auto (cerca nel DB)'}`);
  log(`  Service: ${serviceCode}`);
  log(`  DRY_RUN: ${process.env.DRY_RUN || 'false'}`);

  // Test 1: Health check
  logSection('1. TEST HEALTH ENDPOINTS');

  for (const service of ['smart_review', 'smart_page']) {
    log(`\n  Testing ${service}...`, 'cyan');
    const healthResult = await testHealthEndpoint(service);

    if (healthResult.success) {
      logResult('Health check', true, `status=${healthResult.status}`);
      if (healthResult.data) {
        log(`    Response: ${JSON.stringify(healthResult.data)}`, 'cyan');
      }
    } else {
      logResult('Health check', false, healthResult.error);
    }
  }

  // Test 2: Ottieni dati per test
  logSection('2. PREPARAZIONE DATI TEST');

  const testData = await getTestData(activityId);

  if (!testData) {
    log('\n  ⚠️  Impossibile ottenere dati per test. Uso dati fittizi.', 'yellow');
    testData = {
      user: { id: '00000000-0000-0000-0000-000000000001', email: 'test@doid.it' },
      activity: { id: '00000000-0000-0000-0000-000000000002', name: 'Test Activity' }
    };
  }

  log(`\n  User: ${testData.user.email} (${testData.user.id})`, 'cyan');
  log(`  Activity: ${testData.activity.name} (${testData.activity.id})`, 'cyan');

  // Test 3: Invio webhook
  logSection('3. TEST INVIO WEBHOOK');

  const testSubscription = {
    status: 'trial',
    planCode: 'pro',
    billingCycle: 'monthly',
    trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };

  const actions = ['trial_activated', 'activated', 'renewed', 'cancelled'];

  for (const action of actions) {
    log(`\n  Testing action: ${action}`, 'cyan');

    // Aggiorna status in base all'action
    const subForAction = { ...testSubscription };
    if (action === 'activated' || action === 'renewed') {
      subForAction.status = 'active';
    } else if (action === 'cancelled') {
      subForAction.status = 'cancelled';
    }

    const result = await sendTestWebhook(
      serviceCode,
      action,
      testData.user,
      testData.activity,
      subForAction
    );

    if (result.dryRun) {
      logResult(action, true, 'DRY RUN - non inviato');
    } else if (result.success) {
      logResult(action, true, `${result.status} in ${result.elapsed}ms`);
      if (result.response) {
        log(`    Response: ${JSON.stringify(result.response)}`, 'cyan');
      }
    } else {
      logResult(action, false, result.error || `HTTP ${result.status}`);
      if (result.response) {
        log(`    Response: ${JSON.stringify(result.response)}`, 'yellow');
      }
    }

    // Piccola pausa tra le richieste
    await new Promise(r => setTimeout(r, 500));
  }

  // Test 4: Verifica webhook_logs
  logSection('4. VERIFICA WEBHOOK LOGS');

  const logsResult = await checkWebhookLogs();

  if (logsResult.success) {
    if (logsResult.logs?.length) {
      log(`\n  Ultimi ${logsResult.logs.length} log trovati:`, 'cyan');
      for (const log_ of logsResult.logs) {
        const status = log_.status === 'success' ? '✓' : '✗';
        const color = log_.status === 'success' ? 'green' : 'red';
        const date = new Date(log_.created_at).toLocaleString('it-IT');
        log(`    ${status} [${date}] ${log_.response || log_.error || '-'}`, color);
      }
    } else {
      log('\n  Nessun log license.sync trovato', 'yellow');
    }
  } else {
    logResult('Lettura logs', false, logsResult.error);
  }

  // Riepilogo
  logSection('📊 RIEPILOGO');
  log(`\nPer vedere i log in real-time sul server:`, 'cyan');
  log(`  tail -f /var/log/apache2/error.log | grep WEBHOOK`);
  log(`\nPer testare manualmente con curl:`, 'cyan');
  log(`  curl -X GET ${licenseSyncUrls.smart_review.replace('/sync-license', '/health')}`);

  console.log('\n');
}

main().catch(err => {
  console.error('Errore:', err);
  process.exit(1);
});
