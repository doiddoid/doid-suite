/**
 * Script per testare il flusso SSO completo
 *
 * Esegui con: node scripts/test-sso.js
 */

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const API_URL = 'http://localhost:3001/api';
const JWT_SECRET = process.env.JWT_SECRET;

// Colori per output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, prefix, message) {
  console.log(`${colors[color]}${prefix}${colors.reset} ${message}`);
}

async function testSSO() {
  console.log('\n========================================');
  console.log('  TEST SSO REVIEW');
  console.log('========================================\n');

  // 1. Prima facciamo login per ottenere un token utente valido
  log('cyan', '[1/4]', 'Login utente di test...');

  const loginResponse = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@doid.it',  // Utente di test esistente
      password: 'Test1234'
    })
  });

  const loginData = await loginResponse.json();

  if (!loginData.success) {
    log('red', '❌', `Login fallito: ${loginData.error}`);
    console.log('\n⚠️  Assicurati di avere un utente test@doid.it con password Test1234');
    return;
  }

  log('green', '✅', `Login OK - User: ${loginData.data.user.email}`);
  const accessToken = loginData.data.session.accessToken;
  const userId = loginData.data.user.id;

  // 2. Ottieni lista attività dell'utente
  log('cyan', '[2/4]', 'Recupero attività utente...');

  const activitiesResponse = await fetch(`${API_URL}/activities`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  const activitiesData = await activitiesResponse.json();

  if (!activitiesData.success || !activitiesData.data.activities?.length) {
    log('yellow', '⚠️', 'Nessuna attività trovata. Creo attività di test...');

    // Crea attività di test
    const createResponse = await fetch(`${API_URL}/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        name: 'Attività Test SSO',
        email: 'test-sso@example.com'
      })
    });

    const createData = await createResponse.json();
    if (!createData.success) {
      log('red', '❌', `Impossibile creare attività: ${createData.error}`);
      return;
    }

    activitiesData.data = { activities: [createData.data.activity] };
    log('green', '✅', `Attività creata: ${createData.data.activity.name}`);
  }

  const activity = activitiesData.data.activities[0];
  log('green', '✅', `Attività: ${activity.name} (${activity.id})`);

  // 3. Genera token per Review
  log('cyan', '[3/4]', 'Generazione token SSO per review...');

  const tokenResponse = await fetch(`${API_URL}/activities/${activity.id}/generate-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      serviceCode: 'review'
    })
  });

  const tokenData = await tokenResponse.json();

  if (!tokenData.success) {
    log('yellow', '⚠️', `Generazione token: ${tokenData.error}`);

    // Se non ha abbonamento, creiamo un trial
    if (tokenData.error?.includes('abbonamento')) {
      log('cyan', '   ', 'Attivo trial per review...');

      const trialResponse = await fetch(`${API_URL}/activities/${activity.id}/subscriptions/trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          serviceCode: 'review'
        })
      });

      const trialData = await trialResponse.json();
      if (trialData.success) {
        log('green', '✅', 'Trial attivato! Riprovo generazione token...');

        // Riprova
        const retryResponse = await fetch(`${API_URL}/activities/${activity.id}/generate-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            serviceCode: 'review'
          })
        });

        const retryData = await retryResponse.json();
        if (!retryData.success) {
          log('red', '❌', `Generazione token fallita: ${retryData.error}`);
          return;
        }
        tokenData.success = true;
        tokenData.data = retryData.data;
      } else {
        log('red', '❌', `Attivazione trial fallita: ${trialData.error}`);
        return;
      }
    } else {
      return;
    }
  }

  log('green', '✅', 'Token generato!');
  console.log(`    Token: ${tokenData.data.token.substring(0, 50)}...`);
  console.log(`    Redirect URL: ${tokenData.data.redirectUrl}`);

  // 4. Simula chiamata SSO da Review
  log('cyan', '[4/4]', 'Test endpoint SSO authenticate...');

  const ssoResponse = await fetch(`${API_URL}/external/sso/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: tokenData.data.token,
      service: 'review'
    })
  });

  const ssoData = await ssoResponse.json();

  if (!ssoData.success) {
    log('red', '❌', `SSO fallito: ${ssoData.error}`);
    return;
  }

  log('green', '✅', 'SSO authenticate OK!');

  console.log('\n========================================');
  console.log('  DATI RICEVUTI DA SSO');
  console.log('========================================\n');

  console.log('👤 USER:');
  console.log(`   ID:       ${ssoData.data.user.id}`);
  console.log(`   Email:    ${ssoData.data.user.email}`);
  console.log(`   Nome:     ${ssoData.data.user.fullName || '(non impostato)'}`);

  console.log('\n🏢 ORGANIZATION:');
  console.log(`   ID:       ${ssoData.data.organization.id}`);
  console.log(`   Nome:     ${ssoData.data.organization.name}`);
  console.log(`   Tipo:     ${ssoData.data.organization.accountType}`);

  if (ssoData.data.activity) {
    console.log('\n📍 ACTIVITY:');
    console.log(`   ID:       ${ssoData.data.activity.id}`);
    console.log(`   Nome:     ${ssoData.data.activity.name}`);
  }

  console.log('\n📜 LICENSE:');
  console.log(`   Valida:   ${ssoData.data.license.isValid ? '✅ SÌ' : '❌ NO'}`);
  console.log(`   Scadenza: ${ssoData.data.license.expiresAt || 'N/A'}`);
  console.log(`   Piano:    ${ssoData.data.license.planCode || 'N/A'}`);
  if (ssoData.data.license.subscription?.inherited) {
    console.log(`   Eredit.:  Da pacchetto "${ssoData.data.license.subscription.packageName}"`);
  }

  console.log('\n🔐 AUTH:');
  console.log(`   Ruolo:    ${ssoData.data.role}`);
  console.log(`   Servizio: ${ssoData.data.service}`);
  console.log(`   Timestamp: ${ssoData.data.authenticatedAt}`);

  console.log('\n========================================');
  console.log('  TEST COMPLETATO CON SUCCESSO! ✅');
  console.log('========================================\n');

  // Output JSON completo per debug
  console.log('📋 JSON completo (per debug):');
  console.log(JSON.stringify(ssoData.data, null, 2));
}

testSSO().catch(err => {
  log('red', '❌', `Errore: ${err.message}`);
  console.error(err);
});
