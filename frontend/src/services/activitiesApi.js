/**
 * Activities API Service
 * Client per le API delle attività (modello activity-based)
 */

import api from './api.js';

class ActivitiesApiService {
  // ==================== ACTIVITIES CRUD ====================

  /**
   * Lista attività dell'utente corrente
   */
  async getActivities() {
    return api.request('/activities');
  }

  /**
   * Dettaglio attività
   */
  async getActivity(activityId) {
    return api.request(`/activities/${activityId}`);
  }

  /**
   * Crea nuova attività
   */
  async createActivity(data) {
    return api.request('/activities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Aggiorna attività
   */
  async updateActivity(activityId, data) {
    return api.request(`/activities/${activityId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Elimina (disattiva) attività
   */
  async deleteActivity(activityId) {
    return api.request(`/activities/${activityId}`, {
      method: 'DELETE',
    });
  }

  // ==================== MEMBERS ====================

  /**
   * Lista membri dell'attività
   */
  async getMembers(activityId) {
    return api.request(`/activities/${activityId}/members`);
  }

  /**
   * Aggiungi membro all'attività
   */
  async addMember(activityId, email, role) {
    return api.request(`/activities/${activityId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }

  /**
   * Rimuovi membro dall'attività
   */
  async removeMember(activityId, memberId) {
    return api.request(`/activities/${activityId}/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  // ==================== SUBSCRIPTIONS ====================

  /**
   * Lista abbonamenti dell'attività
   */
  async getSubscriptions(activityId) {
    return api.request(`/activities/${activityId}/subscriptions`);
  }

  /**
   * Dashboard servizi con stato abbonamento
   */
  async getServicesDashboard(activityId) {
    return api.request(`/activities/${activityId}/subscriptions/dashboard`);
  }

  /**
   * Statistiche abbonamenti attività
   */
  async getSubscriptionStats(activityId) {
    return api.request(`/activities/${activityId}/subscriptions/stats`);
  }

  /**
   * Attiva trial per un servizio
   */
  async activateTrial(activityId, serviceCode) {
    return api.request(`/activities/${activityId}/subscriptions/trial`, {
      method: 'POST',
      body: JSON.stringify({ serviceCode }),
    });
  }

  /**
   * Attiva abbonamento
   */
  async activateSubscription(activityId, serviceCode, planCode, billingCycle = 'monthly') {
    return api.request(`/activities/${activityId}/subscriptions/activate`, {
      method: 'POST',
      body: JSON.stringify({ serviceCode, planCode, billingCycle }),
    });
  }

  /**
   * Cancella abbonamento
   */
  async cancelSubscription(activityId, serviceCode) {
    return api.request(`/activities/${activityId}/subscriptions/cancel`, {
      method: 'POST',
      body: JSON.stringify({ serviceCode }),
    });
  }

  /**
   * Verifica stato abbonamento per servizio
   */
  async checkSubscriptionStatus(activityId, serviceCode) {
    return api.request(`/activities/${activityId}/subscriptions/check/${serviceCode}`);
  }

  // ==================== EXTERNAL ACCESS ====================

  /**
   * Genera token per accesso a servizio esterno (SSO)
   * Ritorna { token, redirectUrl, expiresIn, service }
   */
  async generateAccessToken(activityId, serviceCode) {
    return api.request(`/activities/${activityId}/generate-token`, {
      method: 'POST',
      body: JSON.stringify({ serviceCode }),
    });
  }

  // ==================== SERVICES (public) ====================

  /**
   * Lista tutti i servizi disponibili con piani
   */
  async getAllServices() {
    return api.request('/activities/services/all');
  }
}

export const activitiesApi = new ActivitiesApiService();
export default activitiesApi;
