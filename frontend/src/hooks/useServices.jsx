import { useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';
import servicesApi from '../services/api/servicesApi.js';
import { useAuth } from './useAuth.jsx';

export function useServices() {
  const { currentOrganization, user } = useAuth();
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch services with subscription status (user-based)
  const fetchServices = useCallback(async () => {
    if (!user) {
      setServices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await servicesApi.getDashboard();
      if (response.success) {
        setServices(response.data.services || []);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    if (!user) {
      setStats(null);
      return;
    }

    try {
      // Calcola stats dai servizi
      const activeServices = services.filter(s => s.isActive).length;
      const trialServices = services.filter(s => s.subscription?.status === 'trial').length;

      setStats({
        activeServices,
        totalServices: services.length,
        trialServices,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [user, services]);

  // Generate token and redirect to service (legacy - organization-based)
  const openService = useCallback(async (serviceCode) => {
    if (!currentOrganization?.id) {
      return { success: false, error: 'Nessuna organizzazione selezionata' };
    }

    try {
      const response = await api.generateServiceToken(
        currentOrganization.id,
        serviceCode
      );

      if (response.success) {
        // Redirect to the service app
        window.location.href = response.data.redirectUrl;
        return { success: true };
      }

      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [currentOrganization?.id]);

  // Activate trial (user-based)
  const activateTrial = useCallback(async (serviceCode) => {
    try {
      const response = await servicesApi.activateTrial(serviceCode);

      if (response.success) {
        await fetchServices();
        return { success: true, data: response.data.subscription };
      }

      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchServices]);

  // Activate a subscription (user-based)
  const activateSubscription = useCallback(async (serviceCode, planCode, billingCycle = 'monthly') => {
    try {
      const response = await servicesApi.activateSubscription(serviceCode, planCode, billingCycle);

      if (response.success) {
        await fetchServices();
        return { success: true, data: response.data.subscription };
      }

      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchServices]);

  // Cancel a subscription (user-based)
  const cancelSubscription = useCallback(async (serviceCode) => {
    try {
      const response = await servicesApi.cancelSubscription(serviceCode);

      if (response.success) {
        await fetchServices();
        return { success: true };
      }

      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchServices]);

  // Check subscription status
  const checkSubscription = useCallback(async (serviceCode) => {
    try {
      const response = await servicesApi.checkSubscription(serviceCode);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // Get plans for a specific service
  const getServicePlans = useCallback(async (serviceCode) => {
    try {
      const response = await servicesApi.getService(serviceCode);
      if (response.success) {
        return { success: true, data: response.data.plans };
      }
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // Load data on user change
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Update stats when services change
  useEffect(() => {
    if (services.length > 0) {
      fetchStats();
    }
  }, [services, fetchStats]);

  return {
    services,
    stats,
    loading,
    error,
    fetchServices,
    fetchStats,
    openService,
    activateTrial,
    activateSubscription,
    cancelSubscription,
    checkSubscription,
    getServicePlans,
  };
}

export default useServices;
