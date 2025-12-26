import api from '../api.js';

// ==================== SERVICES API ====================

/**
 * Ottieni lista servizi disponibili
 * @returns {Promise<{success: boolean, data: {services: Array}}>}
 */
export const getServices = async () => {
  return api.request('/services', { auth: false });
};

/**
 * Ottieni dettaglio servizio con piani
 * @param {string} code - Codice del servizio (es. 'smart_review')
 * @returns {Promise<{success: boolean, data: {service: Object, plans: Array}}>}
 */
export const getService = async (code) => {
  return api.request(`/services/${code}`, { auth: false });
};

// ==================== SUBSCRIPTIONS API ====================

/**
 * Ottieni dashboard con tutti i servizi e stato abbonamenti
 * @returns {Promise<{success: boolean, data: {services: Array}}>}
 */
export const getDashboard = async () => {
  return api.request('/subscriptions/dashboard');
};

/**
 * Ottieni abbonamenti utente corrente
 * @returns {Promise<{success: boolean, data: {subscriptions: Array}}>}
 */
export const getSubscriptions = async () => {
  return api.request('/subscriptions');
};

/**
 * Attiva trial per un servizio
 * @param {string} serviceCode - Codice del servizio
 * @returns {Promise<{success: boolean, data: {subscription: Object}, message: string}>}
 */
export const activateTrial = async (serviceCode) => {
  return api.request('/subscriptions/trial', {
    method: 'POST',
    body: JSON.stringify({ serviceCode }),
  });
};

/**
 * Attiva abbonamento
 * @param {string} serviceCode - Codice del servizio
 * @param {string} planCode - Codice del piano (es. 'pro', 'free')
 * @param {string} billingCycle - 'monthly' o 'yearly'
 * @returns {Promise<{success: boolean, data: {subscription: Object}, message: string}>}
 */
export const activateSubscription = async (serviceCode, planCode, billingCycle = 'monthly') => {
  return api.request('/subscriptions/activate', {
    method: 'POST',
    body: JSON.stringify({ serviceCode, planCode, billingCycle }),
  });
};

/**
 * Cancella abbonamento
 * @param {string} serviceCode - Codice del servizio
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const cancelSubscription = async (serviceCode) => {
  return api.request('/subscriptions/cancel', {
    method: 'POST',
    body: JSON.stringify({ serviceCode }),
  });
};

/**
 * Verifica stato abbonamento per servizio
 * @param {string} serviceCode - Codice del servizio
 * @returns {Promise<{success: boolean, data: {isActive: boolean, status: string, expiresAt: string, plan: Object}}>}
 */
export const checkSubscription = async (serviceCode) => {
  return api.request(`/subscriptions/check/${serviceCode}`);
};

export default {
  getServices,
  getService,
  getDashboard,
  getSubscriptions,
  activateTrial,
  activateSubscription,
  cancelSubscription,
  checkSubscription,
};
