import { useState, useEffect, useCallback, useMemo } from 'react';
import activitiesApi from '../services/activitiesApi.js';
import { useAuth } from './useAuth.jsx';

/**
 * Custom hook per recuperare tutti i dati per la pagina "I Miei Servizi"
 *
 * Usa le API backend esistenti per recuperare:
 * - services (tutti i servizi attivi)
 * - activities (attivita' dell'utente)
 * - subscriptions (sottoscrizioni per ogni attivita')
 *
 * @returns {Object} { services, totals, loading, error, refetch }
 */
export function useMyServices() {
  const { user, isAuthenticated } = useAuth();
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from backend APIs
  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      setError('Utente non autenticato');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Ottieni tutti i servizi disponibili
      const servicesResult = await activitiesApi.getAllServices();
      if (!servicesResult.success) {
        throw new Error(servicesResult.error || 'Errore caricamento servizi');
      }
      const allServices = servicesResult.data.services || [];

      // 2. Ottieni tutte le attivita' dell'utente
      const activitiesResult = await activitiesApi.getActivities();
      if (!activitiesResult.success) {
        throw new Error(activitiesResult.error || 'Errore caricamento attivita');
      }
      const userActivities = activitiesResult.data.activities || [];

      // 3. Per ogni attivita', ottieni le subscriptions
      const allSubscriptions = [];
      for (const activity of userActivities) {
        try {
          const subsResult = await activitiesApi.getSubscriptions(activity.id);
          if (subsResult.success && subsResult.data.subscriptions) {
            // Aggiungi activity info a ogni subscription
            subsResult.data.subscriptions.forEach(sub => {
              allSubscriptions.push({
                ...sub,
                activity_id: activity.id,
                activity_name: activity.name
              });
            });
          }
        } catch (err) {
          console.warn(`Errore caricamento subscriptions per ${activity.name}:`, err);
        }
      }

      // 4. Combina i dati: per ogni servizio, crea un array di elementi (subscriptions)
      const combinedData = allServices
        .filter(service => service.is_active !== false)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        .map(service => {
          // Trova tutte le subscriptions per questo servizio
          const serviceSubscriptions = allSubscriptions
            .filter(sub => sub.service_id === service.id || sub.serviceCode === service.code)
            .map(sub => ({
              subscription_id: sub.id,
              activity_id: sub.activity_id,
              activity_name: sub.activity_name,
              status: sub.status,
              billing_cycle: sub.billing_cycle || sub.billingCycle || 'monthly',
              is_addon: sub.is_addon || sub.isAddon || false,
              trial_ends_at: sub.trial_ends_at || sub.trialEndsAt,
              current_period_end: sub.current_period_end || sub.currentPeriodEnd,
              cancel_at_period_end: sub.cancel_at_period_end || sub.cancelAtPeriodEnd || false,
              // Calcola price
              price: calculatePrice(sub, service)
            }))
            // Ordina per is_addon e poi activity_name
            .sort((a, b) => {
              if (a.is_addon !== b.is_addon) {
                return a.is_addon ? 1 : -1;
              }
              return (a.activity_name || '').localeCompare(b.activity_name || '');
            });

          return {
            info: {
              code: service.code,
              name: service.name,
              icon: service.icon,
              color_primary: service.color_primary || service.color,
              color_dark: service.color_dark,
              color_light: service.color_light || service.bgLight,
              price_pro_monthly: parseFloat(service.price_pro_monthly || service.priceProMonthly) || 0,
              price_pro_yearly: parseFloat(service.price_pro_yearly || service.priceProYearly) || 0,
              price_addon_monthly: parseFloat(service.price_addon_monthly || service.priceAddonMonthly) || null,
              has_free_tier: service.has_free_tier || service.hasFreeTier || false
            },
            elements: serviceSubscriptions
          };
        });

      setRawData(combinedData);
      setError(null);
    } catch (err) {
      console.error('useMyServices fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Fetch on mount and when auth changes
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user, fetchData]);

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
        if (element.status === 'pro' || element.status === 'active') {
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
  const priceOverride = subscription.price_override || subscription.priceOverride;
  const isAddon = subscription.is_addon || subscription.isAddon;
  const billingCycle = subscription.billing_cycle || subscription.billingCycle || 'monthly';
  const priceProMonthly = parseFloat(service.price_pro_monthly || service.priceProMonthly) || 0;
  const priceProYearly = parseFloat(service.price_pro_yearly || service.priceProYearly) || 0;
  const priceAddonMonthly = parseFloat(service.price_addon_monthly || service.priceAddonMonthly) || 0;

  // price_override ha priorita'
  if (priceOverride !== null && priceOverride !== undefined) {
    return parseFloat(priceOverride);
  }

  // is_addon -> price_addon_monthly
  if (isAddon && priceAddonMonthly) {
    return priceAddonMonthly;
  }

  // billing_cycle yearly -> price_pro_yearly / 12
  if (billingCycle === 'yearly' && priceProYearly) {
    return Math.round((priceProYearly / 12) * 100) / 100;
  }

  // Default -> price_pro_monthly
  return priceProMonthly;
}

export default useMyServices;
