import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import activitiesApi from '../services/activitiesApi.js';
import { useAuth } from './useAuth.jsx';

const ActivityContext = createContext(null);

export function ActivityProvider({ children }) {
  const { isAuthenticated, user } = useAuth();

  const [activities, setActivities] = useState([]);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load activities when authenticated
  useEffect(() => {
    const loadActivities = async () => {
      if (!isAuthenticated) {
        setActivities([]);
        setCurrentActivity(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await activitiesApi.getActivities();

        if (response.success) {
          const activityList = response.data.activities || [];
          setActivities(activityList);

          // Restore current activity from localStorage or use first one
          const savedActivityId = localStorage.getItem('currentActivityId');
          const savedActivity = activityList.find(a => a.id === savedActivityId);
          setCurrentActivity(savedActivity || activityList[0] || null);
        }
      } catch (err) {
        console.error('Load activities error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [isAuthenticated]);

  // Switch current activity
  const switchActivity = useCallback((activity) => {
    setCurrentActivity(activity);
    if (activity) {
      localStorage.setItem('currentActivityId', activity.id);
    } else {
      localStorage.removeItem('currentActivityId');
    }
  }, []);

  // Refresh activities list
  const refreshActivities = useCallback(async () => {
    try {
      const response = await activitiesApi.getActivities();
      if (response.success) {
        setActivities(response.data.activities || []);
      }
    } catch (err) {
      console.error('Refresh activities error:', err);
    }
  }, []);

  // Create new activity
  const createActivity = useCallback(async (data) => {
    try {
      const response = await activitiesApi.createActivity(data);
      if (response.success) {
        const newActivity = response.data.activity;
        setActivities(prev => [...prev, newActivity]);

        // Set as current if it's the only one or user wants
        if (activities.length === 0) {
          switchActivity(newActivity);
        }

        return { success: true, data: newActivity };
      }
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [activities.length, switchActivity]);

  // Update activity
  const updateActivity = useCallback(async (activityId, data) => {
    try {
      const response = await activitiesApi.updateActivity(activityId, data);
      if (response.success) {
        const updatedActivity = response.data.activity;
        setActivities(prev =>
          prev.map(a => a.id === activityId ? updatedActivity : a)
        );

        // Update current if it's the one being updated
        if (currentActivity?.id === activityId) {
          setCurrentActivity(updatedActivity);
        }

        return { success: true, data: updatedActivity };
      }
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [currentActivity]);

  // Delete activity
  const deleteActivity = useCallback(async (activityId) => {
    try {
      const response = await activitiesApi.deleteActivity(activityId);
      if (response.success) {
        setActivities(prev => prev.filter(a => a.id !== activityId));

        // If deleted current, switch to first available
        if (currentActivity?.id === activityId) {
          const remaining = activities.filter(a => a.id !== activityId);
          switchActivity(remaining[0] || null);
        }

        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [activities, currentActivity, switchActivity]);

  // Get activity by ID
  const getActivity = useCallback(async (activityId) => {
    try {
      const response = await activitiesApi.getActivity(activityId);
      if (response.success) {
        return { success: true, data: response.data.activity };
      }
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // ==================== MEMBERS ====================

  const getMembers = useCallback(async (activityId = currentActivity?.id) => {
    if (!activityId) return { success: false, error: 'Nessuna attività selezionata' };

    try {
      const response = await activitiesApi.getMembers(activityId);
      if (response.success) {
        return { success: true, data: response.data.members };
      }
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [currentActivity]);

  const addMember = useCallback(async (email, role, activityId = currentActivity?.id) => {
    if (!activityId) return { success: false, error: 'Nessuna attività selezionata' };

    try {
      const response = await activitiesApi.addMember(activityId, email, role);
      if (response.success) {
        return { success: true, data: response.data.member };
      }
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [currentActivity]);

  const removeMember = useCallback(async (memberId, activityId = currentActivity?.id) => {
    if (!activityId) return { success: false, error: 'Nessuna attività selezionata' };

    try {
      const response = await activitiesApi.removeMember(activityId, memberId);
      if (response.success) {
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [currentActivity]);

  // ==================== SUBSCRIPTIONS ====================

  const getSubscriptions = useCallback(async (activityId = currentActivity?.id) => {
    if (!activityId) return { success: false, error: 'Nessuna attività selezionata' };

    try {
      const response = await activitiesApi.getSubscriptions(activityId);
      if (response.success) {
        return { success: true, data: response.data.subscriptions };
      }
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [currentActivity]);

  const getServicesDashboard = useCallback(async (activityId = currentActivity?.id) => {
    if (!activityId) return { success: false, error: 'Nessuna attività selezionata' };

    try {
      const response = await activitiesApi.getServicesDashboard(activityId);
      if (response.success) {
        return { success: true, data: response.data.services };
      }
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [currentActivity]);

  const getSubscriptionStats = useCallback(async (activityId = currentActivity?.id) => {
    if (!activityId) return { success: false, error: 'Nessuna attività selezionata' };

    try {
      const response = await activitiesApi.getSubscriptionStats(activityId);
      if (response.success) {
        return { success: true, data: response.data.stats };
      }
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [currentActivity]);

  const activateTrial = useCallback(async (serviceCode, activityId = currentActivity?.id) => {
    if (!activityId) return { success: false, error: 'Nessuna attività selezionata' };

    try {
      const response = await activitiesApi.activateTrial(activityId, serviceCode);
      if (response.success) {
        return { success: true, data: response.data.subscription };
      }
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [currentActivity]);

  const activateSubscription = useCallback(async (serviceCode, planCode, billingCycle = 'monthly', activityId = currentActivity?.id) => {
    if (!activityId) return { success: false, error: 'Nessuna attività selezionata' };

    try {
      const response = await activitiesApi.activateSubscription(activityId, serviceCode, planCode, billingCycle);
      if (response.success) {
        return { success: true, data: response.data.subscription };
      }
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [currentActivity]);

  const cancelSubscription = useCallback(async (serviceCode, activityId = currentActivity?.id) => {
    if (!activityId) return { success: false, error: 'Nessuna attività selezionata' };

    try {
      const response = await activitiesApi.cancelSubscription(activityId, serviceCode);
      if (response.success) {
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [currentActivity]);

  const checkSubscriptionStatus = useCallback(async (serviceCode, activityId = currentActivity?.id) => {
    if (!activityId) return { success: false, error: 'Nessuna attività selezionata' };

    try {
      const response = await activitiesApi.checkSubscriptionStatus(activityId, serviceCode);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [currentActivity]);

  // ==================== SERVICES ====================

  const getAllServices = useCallback(async () => {
    try {
      const response = await activitiesApi.getAllServices();
      if (response.success) {
        return { success: true, data: response.data.services };
      }
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const value = {
    // State
    activities,
    currentActivity,
    loading,
    error,
    hasActivities: activities.length > 0,

    // Activity CRUD
    switchActivity,
    refreshActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    getActivity,

    // Members
    getMembers,
    addMember,
    removeMember,

    // Subscriptions
    getSubscriptions,
    getServicesDashboard,
    getSubscriptionStats,
    activateTrial,
    activateSubscription,
    cancelSubscription,
    checkSubscriptionStatus,

    // Services
    getAllServices,
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivities() {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivities must be used within an ActivityProvider');
  }
  return context;
}

export { ActivityContext };
export default useActivities;
