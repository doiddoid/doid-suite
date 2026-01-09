import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function createUserAndAddToAgency(email, fullName, orgId) {
  console.log('\n=== Creazione utente:', email, '===');

  // 1. Cerca utente per email usando pagination
  let userId = null;
  let page = 1;
  const perPage = 100;

  while (!userId) {
    const { data: authData, error } = await supabase.auth.admin.listUsers({
      page,
      perPage
    });

    if (error || !authData.users?.length) break;

    const existingUser = authData.users.find(u => u.email === email);
    if (existingUser) {
      userId = existingUser.id;
      console.log('ℹ️  Utente già esistente:', userId, '(pagina', page + ')');
      break;
    }

    if (authData.users.length < perPage) break;
    page++;
  }

  if (!userId) {
    // Crea utente
    const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: 'UpperCervical2024!',
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (authError) {
      console.log('❌ Errore creazione utente:', authError.message);
      return null;
    }
    userId = newUser.user.id;
    console.log('✅ Utente creato:', userId);
  }

  // 2. Verifica se già nell'organizzazione
  const { data: existing } = await supabase
    .from('organization_users')
    .select('id, role')
    .eq('organization_id', orgId)
    .eq('user_id', userId);

  if (existing?.length > 0) {
    console.log('ℹ️  Già nell\'organizzazione come:', existing[0].role);
  } else {
    const { error: orgError } = await supabase
      .from('organization_users')
      .insert({
        organization_id: orgId,
        user_id: userId,
        role: 'admin'
      });

    if (orgError) {
      console.log('❌ Errore aggiunta a org:', orgError.message);
    } else {
      console.log('✅ Aggiunto all\'organizzazione come admin');
    }
  }

  // 3. Verifica se l'attività esiste già
  const slug = fullName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const { data: existingActivity } = await supabase
    .from('activities')
    .select('id, name')
    .eq('organization_id', orgId)
    .eq('name', fullName);

  let activity;
  if (existingActivity?.length > 0) {
    console.log('ℹ️  Attività già esistente:', existingActivity[0].name);
    activity = existingActivity[0];
  } else {
    // Crea attività personale
    const { data: newActivity, error: actError } = await supabase
      .from('activities')
      .insert({
        name: fullName,
        slug: slug + '-' + Date.now(),
        organization_id: orgId,
        status: 'active'
      })
      .select()
      .single();

    if (actError) {
      console.log('❌ Errore creazione attività:', actError.message);
      return userId;
    }
    activity = newActivity;
    console.log('✅ Attività creata:', activity.name);
  }

  // 4. Verifica se utente già associato all'attività
  const { data: existingActivityUser } = await supabase
    .from('activity_users')
    .select('id, role')
    .eq('activity_id', activity.id)
    .eq('user_id', userId);

  if (existingActivityUser?.length > 0) {
    console.log('ℹ️  Già nell\'attività come:', existingActivityUser[0].role);
  } else {
    // Aggiungi utente all'attività come owner
    const { error: auError } = await supabase
      .from('activity_users')
      .insert({
        activity_id: activity.id,
        user_id: userId,
        role: 'owner'
      });

    if (auError) {
      console.log('❌ Errore aggiunta ad attività:', auError.message);
    } else {
      console.log('✅ Aggiunto all\'attività come owner');
    }
  }

  return userId;
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  CREAZIONE UTENTI UPPER CERVICAL');
  console.log('='.repeat(60));

  // Trova l'ID dell'organizzazione Upper Cervical
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('name', 'Upper Cervical Treviso');

  if (!orgs?.length) {
    console.log('❌ Organizzazione Upper Cervical non trovata!');
    return;
  }

  const orgId = orgs[0].id;
  console.log('\nOrganizzazione:', orgs[0].name, '(' + orgId + ')');

  // Crea Peter
  await createUserAndAddToAgency(
    'peter.bdv@uppercervicaltreviso.it',
    'Peter Lawrence',
    orgId
  );

  // Crea Zachary
  await createUserAndAddToAgency(
    'zachary.bdv@uppercervicaltreviso.it',
    'Zachary Sedivy',
    orgId
  );

  // Verifica finale
  console.log('\n' + '='.repeat(60));
  console.log('  VERIFICA FINALE');
  console.log('='.repeat(60));

  const { data: members } = await supabase
    .from('organization_users')
    .select('role, user_id')
    .eq('organization_id', orgId);

  const { data: authDataFinal } = await supabase.auth.admin.listUsers();

  console.log('\nMembri Upper Cervical Treviso:');
  for (const m of members || []) {
    const user = authDataFinal.users.find(u => u.id === m.user_id);
    console.log('  -', user?.email || m.user_id, '(' + m.role + ')');
  }

  const { data: activities } = await supabase
    .from('activities')
    .select('name')
    .eq('organization_id', orgId);

  console.log('\nAttività:');
  for (const a of activities || []) {
    console.log('  -', a.name);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Password temporanea: UpperCervical2024!');
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
