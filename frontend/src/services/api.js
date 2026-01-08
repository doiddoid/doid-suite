// API URL from environment or relative path
const API_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  constructor() {
    this.baseUrl = API_URL;
  }

  // Get stored auth token
  getToken() {
    return localStorage.getItem('accessToken');
  }

  // Set auth token
  setToken(token) {
    localStorage.setItem('accessToken', token);
  }

  // Remove auth token
  removeToken() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Build headers
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: this.getHeaders(options.auth !== false),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle token refresh if needed
        if (response.status === 401 && options.auth !== false) {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry the request with new token
            config.headers = this.getHeaders();
            const retryResponse = await fetch(url, config);
            return retryResponse.json();
          }
        }

        throw new Error(data.error || 'Errore nella richiesta');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Refresh access token
  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.removeToken();
        return false;
      }

      const data = await response.json();
      this.setToken(data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      return true;
    } catch (error) {
      this.removeToken();
      return false;
    }
  }

  // ==================== AUTH ====================

  async register({
    email,
    password,
    fullName,
    activityName,
    requestedService,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    referralCode
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        fullName,
        activityName,
        requestedService,
        utmSource,
        utmMedium,
        utmCampaign,
        utmContent,
        referralCode
      }),
      auth: false,
    });
  }

  async login({ email, password }) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      auth: false,
    });

    if (response.success && response.data.session) {
      this.setToken(response.data.session.accessToken);
      localStorage.setItem('refreshToken', response.data.session.refreshToken);
    }

    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.removeToken();
    }
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      auth: false,
    });
  }

  async verifyResetToken(token) {
    return this.request(`/auth/verify-reset-token/${token}`, {
      auth: false,
    });
  }

  async resetPassword(token, password) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
      auth: false,
    });
  }

  async updatePassword(password) {
    return this.request('/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  // ==================== ORGANIZATIONS ====================

  async getOrganizations() {
    return this.request('/organizations');
  }

  async getOrganization(id) {
    return this.request(`/organizations/${id}`);
  }

  async createOrganization(data) {
    return this.request('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrganization(id, data) {
    return this.request(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOrganization(id) {
    return this.request(`/organizations/${id}`, {
      method: 'DELETE',
    });
  }

  async getOrganizationMembers(id) {
    return this.request(`/organizations/${id}/members`);
  }

  async addOrganizationMember(organizationId, data) {
    return this.request(`/organizations/${organizationId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeOrganizationMember(organizationId, memberId) {
    return this.request(`/organizations/${organizationId}/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  // ==================== DASHBOARD ====================

  async getDashboardServices(organizationId) {
    return this.request(`/dashboard/services?organizationId=${organizationId}`);
  }

  async getDashboardStats(organizationId) {
    return this.request(`/dashboard/stats?organizationId=${organizationId}`);
  }

  async generateServiceToken(organizationId, serviceCode) {
    return this.request(`/dashboard/generate-token?organizationId=${organizationId}`, {
      method: 'POST',
      body: JSON.stringify({ serviceCode }),
    });
  }

  async getServicePlans(serviceCode) {
    return this.request(`/dashboard/service/${serviceCode}/plans`);
  }

  // ==================== SUBSCRIPTIONS ====================

  async getSubscriptions(organizationId) {
    return this.request(`/subscriptions?organizationId=${organizationId}`);
  }

  async createSubscription(data) {
    return this.request('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSubscription(id, organizationId, data) {
    return this.request(`/subscriptions/${id}?organizationId=${organizationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async cancelSubscription(id, organizationId) {
    return this.request(`/subscriptions/${id}?organizationId=${organizationId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
export default api;
