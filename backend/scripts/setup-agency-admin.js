/**
 * Setup admin@doid.biz come Agenzia e Super Admin
 *
 * Questo script:
 * 1. Trova l'utente admin@doid.biz
 * 2. Converte la sua organizzazione in tipo 'agency'
 * 3. Imposta max_activities alto per gestire più clienti
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ADMIN_EMAIL = 'admin@doid.biz';

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  SETUP ADMIN@DOID.BIZ COME AGENZIA');
  console.log('='.repeat(60) + '\n');

  // 1. Trova l'utente (in auth.users via admin API)
  console.log('📋 Ricerca utente admin@doid.biz...\n');

  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Errore ricerca utenti:', authError.message);
    process.exit(1);
  }

  const user = authData.users.find(u => u.email === ADMIN_EMAIL);

  if (!user) {
    console.error('❌ Utente admin@doid.biz non trovato!');
    console.log('\nUtenti disponibili:');
    authData.users.slice(0, 10).forEach(u => console.log('  -', u.email));
    process.exit(1);
  }
  console.log(`✅ Utente trovato: ${user.email} (${user.id})\n`);

  // 2. Trova la sua organizzazione
  console.log('📋 Ricerca organizzazione...\n');

  const { data: orgUsers, error: orgUserError } = await supabase
    .from('organization_users')
    .select(`
      organization_id,
      role,
      organization:organizations (
        id,
        name,
        account_type,
        max_activities,
        status
      )
    `)
    .eq('user_id', user.id);

  if (orgUserError) {
    console.error('❌ Errore ricerca organizzazione:', orgUserError.message);
    process.exit(1);
  }

  if (!orgUsers || orgUsers.length === 0) {
    console.log('⚠️  Nessuna organizzazione trovata per questo utente.');
    console.log('   Potrebbe essere necessario creare un\'organizzazione prima.\n');
    process.exit(1);
  }

  // Mostra tutte le organizzazioni
  console.log('Organizzazioni trovate:');
  orgUsers.forEach(ou => {
    const org = ou.organization;
    console.log(`  - ${org.name} (${org.id})`);
    console.log(`    Ruolo: ${ou.role}`);
    console.log(`    Tipo: ${org.account_type || 'single'}`);
    console.log(`    Max attività: ${org.max_activities || 1}`);
    console.log(`    Status: ${org.status}`);
    console.log('');
  });

  // Prendi l'organizzazione dove è owner
  const ownerOrg = orgUsers.find(ou => ou.role === 'owner');
  if (!ownerOrg) {
    console.log('⚠️  L\'utente non è owner di nessuna organizzazione.');
    console.log('   Uso la prima organizzazione disponibile.\n');
  }

  const targetOrg = ownerOrg || orgUsers[0];
  const org = targetOrg.organization;

  console.log(`📋 Organizzazione target: ${org.name} (${org.id})\n`);

  // 3. Converti in agenzia
  if (org.account_type === 'agency') {
    console.log('✅ L\'organizzazione è già di tipo agency!\n');
  } else {
    console.log('🔄 Conversione in agenzia...\n');

    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        account_type: 'agency',
        max_activities: 100  // Limite alto per admin
      })
      .eq('id', org.id);

    if (updateError) {
      console.error('❌ Errore conversione:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Organizzazione convertita in agency con max 100 attività!\n');
  }

  // 4. Verifica attività esistenti
  console.log('📋 Attività esistenti:\n');

  const { data: activities, error: actError } = await supabase
    .from('activities')
    .select('id, name, status, created_at')
    .eq('organization_id', org.id);

  if (actError) {
    console.log('⚠️  Errore lettura attività:', actError.message);
  } else if (!activities || activities.length === 0) {
    console.log('   Nessuna attività collegata a questa organizzazione.\n');
  } else {
    activities.forEach(a => {
      console.log(`  - ${a.name} (${a.status})`);
    });
    console.log('');
  }

  // 5. Verifica activity_users per l'utente
  console.log('📋 Attività accessibili dall\'utente:\n');

  const { data: userActivities, error: uaError } = await supabase
    .from('activity_users')
    .select(`
      role,
      activity:activities (
        id,
        name,
        status,
        organization_id
      )
    `)
    .eq('user_id', user.id);

  if (uaError) {
    console.log('⚠️  Errore lettura activity_users:', uaError.message);
  } else if (!userActivities || userActivities.length === 0) {
    console.log('   Nessuna attività direttamente accessibile.\n');
  } else {
    userActivities.forEach(ua => {
      const orgNote = ua.activity.organization_id === org.id ? ' (della sua org)' : ' (altra org)';
      console.log(`  - ${ua.activity.name} [${ua.role}]${orgNote}`);
    });
    console.log('');
  }

  // 6. Riepilogo
  console.log('='.repeat(60));
  console.log('  RIEPILOGO');
  console.log('='.repeat(60));
  console.log(`
  Utente: ${user.email}
  Organizzazione: ${org.name}
  Tipo account: agency
  Max attività: 100

  PROSSIMI PASSI:
  1. Aggiungi admin@doid.biz a SUPER_ADMIN_EMAILS nel .env
  2. Dal pannello admin, potrai creare/gestire attività per i clienti
  3. Per ogni cliente puoi scegliere se dargli accesso autonomo o meno
`);
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
