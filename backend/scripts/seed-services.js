/**
 * Script per popolare servizi e piani nel database
 *
 * Esegui con: node scripts/seed-services.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Definizione servizi
const SERVICES = [
  {
    code: 'smart_review',
    name: 'Smart Review',
    description: 'Gestione recensioni intelligente per la tua attività',
    app_url: process.env.SMART_REVIEW_URL || 'https://review.doid.it',
    icon: 'Star',
    color: '#FFB800',
    is_active: true,
    sort_order: 1
  },
  {
    code: 'smart_page',
    name: 'Smart Page',
    description: 'Crea pagine web professionali in pochi click',
    app_url: process.env.SMART_PAGE_URL || 'https://page.doid.it',
    icon: 'FileText',
    color: '#3B82F6',
    is_active: true,
    sort_order: 2
  },
  {
    code: 'menu_digitale',
    name: 'Menu Digitale',
    description: 'Il tuo menu sempre aggiornato e accessibile',
    app_url: process.env.MENU_DIGITALE_URL || 'https://menu.doid.it',
    icon: 'UtensilsCrossed',
    color: '#10B981',
    is_active: true,
    sort_order: 3
  },
  {
    code: 'display_suite',
    name: 'Display Suite',
    description: 'Digital signage per la tua attività',
    app_url: process.env.DISPLAY_SUITE_URL || 'https://display.doid.it',
    icon: 'Monitor',
    color: '#8B5CF6',
    is_active: true,
    sort_order: 4
  }
];

// Piani per ogni servizio
const PLANS = {
  smart_review: [
    {
      code: 'free',
      name: 'Free',
      description: 'Piano gratuito con funzionalità base',
      price_monthly: 0,
      price_yearly: 0,
      trial_days: 0,
      features: {
        max_reviews_month: 10,
        ai_responses: false,
        analytics: 'basic',
        platforms: ['google']
      },
      is_active: true,
      sort_order: 1
    },
    {
      code: 'pro',
      name: 'Pro',
      description: 'Per attività in crescita',
      price_monthly: 29,
      price_yearly: 290,
      trial_days: 30,
      features: {
        max_reviews_month: 100,
        ai_responses: true,
        analytics: 'advanced',
        platforms: ['google', 'tripadvisor', 'facebook'],
        custom_templates: true
      },
      is_active: true,
      sort_order: 2
    },
    {
      code: 'business',
      name: 'Business',
      description: 'Per attività con volumi elevati',
      price_monthly: 79,
      price_yearly: 790,
      trial_days: 30,
      features: {
        max_reviews_month: -1, // unlimited
        ai_responses: true,
        analytics: 'premium',
        platforms: ['google', 'tripadvisor', 'facebook', 'yelp', 'trustpilot'],
        custom_templates: true,
        api_access: true,
        priority_support: true
      },
      is_active: true,
      sort_order: 3
    }
  ],
  smart_page: [
    {
      code: 'free',
      name: 'Free',
      description: 'Una pagina gratuita',
      price_monthly: 0,
      price_yearly: 0,
      trial_days: 0,
      features: { max_pages: 1, custom_domain: false, analytics: 'basic' },
      is_active: true,
      sort_order: 1
    },
    {
      code: 'pro',
      name: 'Pro',
      description: 'Pagine illimitate',
      price_monthly: 19,
      price_yearly: 190,
      trial_days: 30,
      features: { max_pages: -1, custom_domain: true, analytics: 'advanced', forms: true },
      is_active: true,
      sort_order: 2
    }
  ],
  menu_digitale: [
    {
      code: 'free',
      name: 'Free',
      description: 'Menu base gratuito',
      price_monthly: 0,
      price_yearly: 0,
      trial_days: 0,
      features: { max_items: 50, qr_codes: 1, images: false },
      is_active: true,
      sort_order: 1
    },
    {
      code: 'pro',
      name: 'Pro',
      description: 'Menu completo',
      price_monthly: 15,
      price_yearly: 150,
      trial_days: 30,
      features: { max_items: -1, qr_codes: -1, images: true, translations: true },
      is_active: true,
      sort_order: 2
    }
  ],
  display_suite: [
    {
      code: 'starter',
      name: 'Starter',
      description: 'Per iniziare',
      price_monthly: 25,
      price_yearly: 250,
      trial_days: 30,
      features: { max_screens: 1, max_playlists: 5, cloud_storage_gb: 5 },
      is_active: true,
      sort_order: 1
    },
    {
      code: 'pro',
      name: 'Pro',
      description: 'Per più schermi',
      price_monthly: 49,
      price_yearly: 490,
      trial_days: 30,
      features: { max_screens: 5, max_playlists: -1, cloud_storage_gb: 50, scheduling: true },
      is_active: true,
      sort_order: 2
    }
  ]
};

async function seedServices() {
  console.log('\n========================================');
  console.log('  SEED SERVIZI E PIANI');
  console.log('========================================\n');

  for (const service of SERVICES) {
    console.log(`📦 ${service.name}...`);

    // Upsert servizio
    const { data: existingService, error: selectError } = await supabase
      .from('services')
      .select('id')
      .eq('code', service.code)
      .single();

    let serviceId;

    if (existingService) {
      // Update
      const { error } = await supabase
        .from('services')
        .update(service)
        .eq('code', service.code);

      if (error) {
        console.error(`   ❌ Errore update: ${error.message}`);
        continue;
      }
      serviceId = existingService.id;
      console.log(`   ✅ Aggiornato (${serviceId})`);
    } else {
      // Insert
      const { data, error } = await supabase
        .from('services')
        .insert(service)
        .select('id')
        .single();

      if (error) {
        console.error(`   ❌ Errore insert: ${error.message}`);
        continue;
      }
      serviceId = data.id;
      console.log(`   ✅ Creato (${serviceId})`);
    }

    // Inserisci piani per questo servizio
    const plans = PLANS[service.code] || [];
    for (const plan of plans) {
      const planData = { ...plan, service_id: serviceId };

      const { data: existingPlan } = await supabase
        .from('plans')
        .select('id')
        .eq('service_id', serviceId)
        .eq('code', plan.code)
        .single();

      if (existingPlan) {
        const { error } = await supabase
          .from('plans')
          .update(planData)
          .eq('id', existingPlan.id);

        if (error) {
          console.error(`      ❌ Piano ${plan.code}: ${error.message}`);
        } else {
          console.log(`      📋 Piano ${plan.code}: aggiornato`);
        }
      } else {
        const { error } = await supabase
          .from('plans')
          .insert(planData);

        if (error) {
          console.error(`      ❌ Piano ${plan.code}: ${error.message}`);
        } else {
          console.log(`      📋 Piano ${plan.code}: creato`);
        }
      }
    }
  }

  console.log('\n========================================');
  console.log('  SEED COMPLETATO! ✅');
  console.log('========================================\n');
}

seedServices().catch(console.error);
