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

  // ==================== CHECKOUT / PAYMENT ====================

  /**
   * Avvia checkout per abbonamento PRO
   * Ritorna URL per redirect a pagina pagamento GHL
   */
  async initiateCheckout(activityId, serviceCode, billingCycle = 'monthly') {
    return api.request(`/activities/${activityId}/checkout`, {
      method: 'POST',
      body: JSON.stringify({ serviceCode, billingCycle }),
    });
  }

  /**
   * Verifica stato checkout dopo redirect da GHL
   */
  async getCheckoutStatus(activityId) {
    return api.request(`/activities/${activityId}/checkout/status`);
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

  // ==================== PAYMENTS / INVOICES ====================

  /**
   * Lista pagamenti/fatture per attività
   */
  async getPayments(activityId, limit = 20, offset = 0) {
    return api.request(`/activities/${activityId}/payments?limit=${limit}&offset=${offset}`);
  }

  // ==================== BILLING PROFILE ====================

  /**
   * Ottieni profilo fatturazione utente
   */
  async getBillingProfile() {
    return api.request('/activities/billing-profile/me');
  }

  /**
   * Aggiorna profilo fatturazione utente
   */
  async updateBillingProfile(data) {
    return api.request('/activities/billing-profile/me', {
      method: 'PUT',
      body: JSON.stringify(data),
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
