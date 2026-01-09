import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function addUserToAgency(email, orgId) {
  console.log('\nAggiunta utente:', email);

  // 1. Trova utente
  const { data: authData } = await supabase.auth.admin.listUsers();
  const user = authData.users.find(u => u.email === email);

  if (!user) {
    console.log('❌ Utente non trovato');
    return;
  }
  console.log('✅ Utente trovato:', user.id);

  // 2. Verifica se già nell'organizzazione
  const { data: existing } = await supabase
    .from('organization_users')
    .select('id, role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id);

  if (existing?.length > 0) {
    console.log('ℹ️  Già nell\'organizzazione come:', existing[0].role);
  } else {
    // Aggiungi all'organizzazione come admin
    const { error: orgError } = await supabase
      .from('organization_users')
      .insert({
        organization_id: orgId,
        user_id: user.id,
        role: 'admin'
      });

    if (orgError) {
      console.log('❌ Errore aggiunta a org:', orgError.message);
    } else {
      console.log('✅ Aggiunto all\'organizzazione come admin');
    }
  }

  // 3. Verifica se ha già un'attività nell'org
  const { data: activities } = await supabase
    .from('activities')
    .select('id, name')
    .eq('organization_id', orgId);

  // Verifica se l'utente ha accesso a un'attività
  const { data: activityUsers } = await supabase
    .from('activity_users')
    .select('activity_id, role')
    .eq('user_id', user.id);

  const orgActivityIds = (activities || []).map(a => a.id);
  const userHasOrgActivity = (activityUsers || []).some(au => orgActivityIds.includes(au.activity_id));

  if (userHasOrgActivity) {
    console.log('ℹ️  Ha già accesso a un\'attività dell\'organizzazione');
  } else {
    // Crea attività personale
    const fullName = user.user_metadata?.full_name || email.split('@')[0];
    const { data: activity, error: actError } = await supabase
      .from('activities')
      .insert({
        name: fullName,
        organization_id: orgId,
        status: 'active'
      })
      .select()
      .single();

    if (actError) {
      console.log('❌ Errore creazione attività:', actError.message);
    } else {
      console.log('✅ Attività creata:', activity.name);

      // Aggiungi utente all'attività come owner
      const { error: auError } = await supabase
        .from('activity_users')
        .insert({
          activity_id: activity.id,
          user_id: user.id,
          role: 'owner'
        });

      if (auError) {
        console.log('❌ Errore aggiunta ad attività:', auError.message);
      } else {
        console.log('✅ Aggiunto all\'attività come owner');
      }
    }
  }
}

async function main() {
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
  console.log('Organizzazione:', orgs[0].name, '(' + orgId + ')');

  // Aggiungi Peter
  await addUserToAgency('peter.bdv@uppercervicaltreviso.it', orgId);

  // Aggiungi Zachary
  await addUserToAgency('zachary.bdv@uppercervicaltreviso.it', orgId);

  // Verifica finale
  console.log('\n=== VERIFICA FINALE ===');
  const { data: members } = await supabase
    .from('organization_users')
    .select('role, user_id')
    .eq('organization_id', orgId);

  console.log('Membri organizzazione:', members?.length || 0);

  const { data: activities } = await supabase
    .from('activities')
    .select('name')
    .eq('organization_id', orgId);

  console.log('Attività:', activities?.map(a => a.name).join(', '));
}

main().catch(console.error);
