import { useState, useEffect, useCallback, useMemo } from 'react';
import supabase from '../services/supabase.js';

/**
 * Custom hook per recuperare tutti i dati per la pagina "I Miei Servizi"
 *
 * Effettua una query diretta su Supabase joinando:
 * - services (tutti i servizi attivi)
 * - service_subscriptions (sottoscrizioni dell'utente)
 * - activities (attivita' dell'utente)
 *
 * @returns {Object} { services, totals, loading, error, refetch }
 */
export function useMyServices() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  // Ottieni user_id dall'utente loggato (Supabase Auth)
  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        setError('Errore di autenticazione');
        setLoading(false);
        return;
      }
      if (user) {
        setUserId(user.id);
      } else {
        setError('Utente non autenticato');
        setLoading(false);
      }
    };
    getUser();
  }, []);

  // Fetch data from Supabase
  const fetchData = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      // Query che prende TUTTI i servizi attivi
      // LEFT JOIN con service_subscriptions filtrate sulle activities dell'utente
      // LEFT JOIN con activities per avere il nome attivita'
      //
      // Nota: Supabase non supporta JOIN dirette cross-table come SQL puro,
      // quindi eseguiamo query separate e combiniamo i risultati

      // 1. Ottieni tutte le activities dell'utente
      const { data: userActivities, error: activitiesError } = await supabase
        .from('activities')
        .select('id, name')
        .eq('user_id', userId);

      if (activitiesError) {
        throw new Error(`Errore caricamento attivita: ${activitiesError.message}`);
      }

      const activityIds = userActivities?.map(a => a.id) || [];
      const activityMap = new Map(userActivities?.map(a => [a.id, a.name]) || []);

      // 2. Ottieni tutti i servizi attivi
      const { data: allServices, error: servicesError } = await supabase
        .from('services')
        .select(`
          id,
          code,
          name,
          icon,
          color_primary,
          color_dark,
          color_light,
          price_pro_monthly,
          price_pro_yearly,
          price_addon_monthly,
          has_free_tier,
          sort_order
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (servicesError) {
        throw new Error(`Errore caricamento servizi: ${servicesError.message}`);
      }

      // 3. Ottieni tutte le subscriptions per le activities dell'utente
      let subscriptions = [];
      if (activityIds.length > 0) {
        const { data: subsData, error: subsError } = await supabase
          .from('service_subscriptions')
          .select(`
            id,
            activity_id,
            service_id,
            status,
            billing_cycle,
            is_addon,
            trial_ends_at,
            current_period_end,
            cancel_at_period_end,
            price_override
          `)
          .in('activity_id', activityIds)
          .order('is_addon', { ascending: true });

        if (subsError) {
          throw new Error(`Errore caricamento sottoscrizioni: ${subsError.message}`);
        }
        subscriptions = subsData || [];
      }

      // Combina i dati: per ogni servizio, crea un array di elementi (subscriptions)
      const combinedData = allServices.map(service => {
        // Trova tutte le subscriptions per questo servizio
        const serviceSubscriptions = subscriptions
          .filter(sub => sub.service_id === service.id)
          .map(sub => ({
            subscription_id: sub.id,
            activity_id: sub.activity_id,
            activity_name: activityMap.get(sub.activity_id) || 'Attività sconosciuta',
            status: sub.status,
            billing_cycle: sub.billing_cycle,
            is_addon: sub.is_addon,
            trial_ends_at: sub.trial_ends_at,
            current_period_end: sub.current_period_end,
            cancel_at_period_end: sub.cancel_at_period_end,
            // Calcola price
            price: calculatePrice(sub, service)
          }))
          // Ordina per is_addon e poi activity_name
          .sort((a, b) => {
            if (a.is_addon !== b.is_addon) {
              return a.is_addon ? 1 : -1;
            }
            return a.activity_name.localeCompare(b.activity_name);
          });

        return {
          info: {
            code: service.code,
            name: service.name,
            icon: service.icon,
            color_primary: service.color_primary,
            color_dark: service.color_dark,
            color_light: service.color_light,
            price_pro_monthly: parseFloat(service.price_pro_monthly) || 0,
            price_pro_yearly: parseFloat(service.price_pro_yearly) || 0,
            price_addon_monthly: parseFloat(service.price_addon_monthly) || null,
            has_free_tier: service.has_free_tier
          },
          elements: serviceSubscriptions
        };
      });

      setRawData(combinedData);
    } catch (err) {
      console.error('useMyServices fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Refetch quando cambia userId
  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId, fetchData]);

  // Servizi raggruppati per code (memoized)
  const services = useMemo(() => {
    const grouped = {};
    for (const item of rawData) {
      grouped[item.info.code] = item;
    }
    return grouped;
  }, [rawData]);

  // Calcola i totali (memoized)
  const totals = useMemo(() => {
    let totalMonthly = 0;
    let totalProElements = 0;
    let totalFreeElements = 0;
    let totalTrialElements = 0;

    for (const item of rawData) {
      for (const element of item.elements) {
        if (element.status === 'pro') {
          totalMonthly += element.price || 0;
          totalProElements++;
        } else if (element.status === 'free') {
          totalFreeElements++;
        } else if (element.status === 'trial') {
          totalTrialElements++;
        }
      }
    }

    return {
      totalMonthly: Math.round(totalMonthly * 100) / 100,
      totalProElements,
      totalFreeElements,
      totalTrialElements
    };
  }, [rawData]);

  // Refetch function
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    services,
    totals,
    loading,
    error,
    refetch
  };
}

/**
 * Calcola il prezzo effettivo per una subscription
 *
 * Regole:
 * - Se price_override esiste, usalo
 * - Se is_addon = true -> price_addon_monthly
 * - Se billing_cycle = 'yearly' -> price_pro_yearly / 12 (prezzo mensile equivalente)
 * - Default -> price_pro_monthly
 */
function calculatePrice(subscription, service) {
  // price_override ha priorita'
  if (subscription.price_override !== null && subscription.price_override !== undefined) {
    return parseFloat(subscription.price_override);
  }

  // is_addon -> price_addon_monthly
  if (subscription.is_addon && service.price_addon_monthly) {
    return parseFloat(service.price_addon_monthly);
  }

  // billing_cycle yearly -> price_pro_yearly / 12
  if (subscription.billing_cycle === 'yearly' && service.price_pro_yearly) {
    return Math.round((parseFloat(service.price_pro_yearly) / 12) * 100) / 100;
  }

  // Default -> price_pro_monthly
  return parseFloat(service.price_pro_monthly) || 0;
}

export default useMyServices;
