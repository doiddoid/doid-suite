/**
 * Script di test per i webhook
 * Esegui con: node scripts/test-webhooks.js
 */

import webhookService from '../src/services/webhookService.js';
import dotenv from 'dotenv';

// Carica variabili ambiente
dotenv.config();

// Dati di test
const testUser = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  fullName: 'Mario Rossi',
  firstName: 'Mario',
  lastName: 'Rossi',
  phone: '+393331234567'
};

const testActivity = {
  id: 'test-activity-id-456',
  name: 'Ristorante da Mario',
  organizationId: 'test-org-id-789'
};

async function testUserVerified() {
  console.log('\n=== TEST: user.verified (GENERICO - senza servizio) ===');

  const result = await webhookService.sendUserVerified({
    email: testUser.email,
    fullName: testUser.fullName,
    activityName: testActivity.name,
    // NON includiamo requestedService - questo è il webhook generico
    organizationId: testActivity.organizationId,
    activityId: testActivity.id,
    utmSource: 'test',
    utmMedium: 'script',
    utmCampaign: 'webhook-test'
  });

  console.log('Risultato:', JSON.stringify(result, null, 2));
  return result;
}

async function testServiceTrialActivated() {
  console.log('\n=== TEST: service.trial_activated (SPECIFICO - con servizio) ===');

  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 30);

  const result = await webhookService.sendServiceTrialActivated({
    userId: testUser.id,
    email: testUser.email,
    fullName: testUser.fullName,
    firstName: testUser.firstName,
    lastName: testUser.lastName,
    activityId: testActivity.id,
    activityName: testActivity.name,
    organizationId: testActivity.organizationId,
    service: 'smart_review',
    plan: 'pro',
    trialEndDate: trialEndDate.toISOString(),
    daysRemaining: 30
  });

  console.log('Risultato:', JSON.stringify(result, null, 2));
  return result;
}

async function testTrialReminder() {
  console.log('\n=== TEST: trial.day_7 (reminder con servizio) ===');

  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 23); // 7 giorni usati, 23 rimanenti

  const result = await webhookService.sendTrialReminder({
    email: testUser.email,
    fullName: testUser.fullName,
    activityId: testActivity.id,
    activityName: testActivity.name,
    service: 'smart_review',
    serviceName: 'Smart Review',
    trialEndDate: trialEndDate.toISOString(),
    daysRemaining: 23
  });

  console.log('Risultato:', JSON.stringify(result, null, 2));
  return result;
}

async function runTests() {
  console.log('========================================');
  console.log('  TEST WEBHOOK DOID SUITE');
  console.log('========================================');
  console.log('');
  console.log('Configurazione:');
  console.log('- GHL_WEBHOOK_URL:', process.env.GHL_WEBHOOK_URL ? '✓ Configurato' : '✗ Non configurato');
  console.log('- GHL_WEBHOOK_USER_VERIFIED:', process.env.GHL_WEBHOOK_USER_VERIFIED ? '✓ Configurato' : '✗ Non configurato');
  console.log('- GHL_WEBHOOK_SERVICE_TRIAL_ACTIVATED:', process.env.GHL_WEBHOOK_SERVICE_TRIAL_ACTIVATED ? '✓ Configurato' : '✗ Non configurato');
  console.log('- GHL_WEBHOOK_TRIAL_DAY_7:', process.env.GHL_WEBHOOK_TRIAL_DAY_7 ? '✓ Configurato' : '✗ Non configurato');

  try {
    // Test 1: user.verified (generico)
    await testUserVerified();

    // Test 2: service.trial_activated (specifico)
    await testServiceTrialActivated();

    // Test 3: trial reminder
    await testTrialReminder();

    console.log('\n========================================');
    console.log('  TUTTI I TEST COMPLETATI');
    console.log('========================================');

  } catch (error) {
    console.error('\n❌ Errore durante i test:', error.message);
    process.exit(1);
  }
}

// Esegui i test
runTests();
