/**
 * Script di test LIVE per i webhook
 * Usa webhook.site per testare senza configurare GHL
 *
 * Esegui con: node scripts/test-webhooks-live.js [webhook-url]
 * Esempio: node scripts/test-webhooks-live.js https://webhook.site/your-uuid
 */

import dotenv from 'dotenv';
dotenv.config();

// Prendi URL da argomento o usa fallback
const testUrl = process.argv[2] || process.env.GHL_WEBHOOK_URL;

if (!testUrl) {
  console.log('');
  console.log('❌ Nessun URL webhook specificato!');
  console.log('');
  console.log('Uso: node scripts/test-webhooks-live.js <webhook-url>');
  console.log('');
  console.log('Per testare:');
  console.log('1. Vai su https://webhook.site');
  console.log('2. Copia il tuo URL univoco');
  console.log('3. Esegui: node scripts/test-webhooks-live.js https://webhook.site/your-uuid');
  console.log('');
  process.exit(1);
}

console.log('========================================');
console.log('  TEST WEBHOOK LIVE');
console.log('========================================');
console.log('');
console.log('Target URL:', testUrl);
console.log('');

// Test data
const testPayloads = [
  {
    name: 'user.verified (GENERICO)',
    event: 'user.verified',
    data: {
      event: 'user.verified',
      timestamp: new Date().toISOString(),
      source: 'doid-suite',
      support_email: 'info@doid.biz',
      support_whatsapp: '+393516781324',
      dashboard_url: 'https://suite.doid.it',
      email: 'test@example.com',
      firstName: 'Mario',
      lastName: 'Rossi',
      name: 'Mario Rossi',
      phone: '+393331234567',
      customField: {
        activity_name: 'Ristorante da Mario',
        organization_id: 'test-org-123',
        activity_id: 'test-activity-456',
        utm_source: 'test',
        utm_campaign: 'webhook-test'
        // NOTA: NON c'è requested_service - questo è il webhook generico
      },
      tags: ['user_verified', 'source_test', 'campaign_webhook-test']
    }
  },
  {
    name: 'service.trial_activated (Smart Review)',
    event: 'service.trial_activated',
    data: {
      event: 'service.trial_activated',
      timestamp: new Date().toISOString(),
      source: 'doid-suite',
      support_email: 'info@doid.biz',
      support_whatsapp: '+393516781324',
      dashboard_url: 'https://review.doid.it',
      email: 'test@example.com',
      firstName: 'Mario',
      lastName: 'Rossi',
      name: 'Mario Rossi',
      // Dati servizio arricchiti
      service: 'smart_review',
      service_label: 'Smart Review',
      upgrade_url: 'https://review.doid.it/upgrade',
      price: '9.90',
      has_free_plan: true,
      customField: {
        user_id: 'test-user-123',
        activity_id: 'test-activity-456',
        activity_name: 'Ristorante da Mario',
        organization_id: 'test-org-123',
        service: 'smart_review',
        service_label: 'Smart Review',
        plan: 'pro',
        trial_end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        trial_end_date_formatted: '5 febbraio 2026',
        days_remaining: 30
      },
      tags: ['trial_activated', 'service_smart_review', 'trial_active']
    }
  },
  {
    name: 'trial.day_7 (reminder)',
    event: 'trial.day_7',
    data: {
      event: 'trial.day_7',
      timestamp: new Date().toISOString(),
      source: 'doid-suite',
      support_email: 'info@doid.biz',
      support_whatsapp: '+393516781324',
      dashboard_url: 'https://review.doid.it',
      email: 'test@example.com',
      name: 'Mario Rossi',
      customField: {
        service: 'smart_review',
        service_name: 'Smart Review',
        activity_name: 'Ristorante da Mario',
        trial_end_date: new Date(Date.now() + 23*24*60*60*1000).toISOString(),
        days_remaining: 23,
        upgrade_url: 'https://suite.doid.it/activities/test-activity-456/upgrade'
      },
      tags: ['trial_reminder_23d', 'service_smart_review']
    }
  }
];

async function sendTestWebhook(payload) {
  console.log(`\n📤 Invio: ${payload.name}`);

  try {
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DOID-Event': payload.event,
        'X-DOID-Timestamp': payload.data.timestamp,
        'X-Webhook-Source': 'doid-suite-test'
      },
      body: JSON.stringify(payload.data)
    });

    if (response.ok) {
      console.log(`   ✅ Successo! Status: ${response.status}`);
      return true;
    } else {
      console.log(`   ❌ Errore! Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Errore: ${error.message}`);
    return false;
  }
}

async function runTests() {
  let success = 0;
  let failed = 0;

  for (const payload of testPayloads) {
    const result = await sendTestWebhook(payload);
    if (result) success++;
    else failed++;

    // Piccola pausa tra le richieste
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n========================================');
  console.log(`  RISULTATO: ${success}/${testPayloads.length} webhook inviati`);
  console.log('========================================');
  console.log('');
  console.log('🔍 Controlla i webhook ricevuti su:');
  console.log(`   ${testUrl}`);
  console.log('');
}

runTests();
