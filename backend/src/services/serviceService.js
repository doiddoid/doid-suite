import { supabaseAdmin } from '../config/supabase.js';
import { Errors } from '../middleware/errorHandler.js';
import { SERVICES } from '../config/services.js';

class ServiceService {
  // Ottieni tutti i servizi attivi
  async getAllServices() {
    const { data: services, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('Error fetching services:', error);
      throw Errors.Internal('Errore nel recupero dei servizi');
    }

    return services.map(service => this.formatService(service));
  }

  // Ottieni servizio per code
  async getServiceByCode(code) {
    const { data: service, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching service:', error);
      throw Errors.Internal('Errore nel recupero del servizio');
    }

    return this.formatService(service);
  }

  // Ottieni piani per un servizio
  async getServicePlans(serviceId) {
    const { data: plans, error } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('service_id', serviceId)
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('Error fetching plans:', error);
      throw Errors.Internal('Errore nel recupero dei piani');
    }

    return plans.map(plan => this.formatPlan(plan));
  }

  // Ottieni piani per codice servizio
  async getPlansByServiceCode(serviceCode) {
    const service = await this.getServiceByCode(serviceCode);
    if (!service) {
      throw Errors.NotFound('Servizio non trovato');
    }

    return this.getServicePlans(service.id);
  }

  // Ottieni servizio con piani
  async getServiceWithPlans(code) {
    const service = await this.getServiceByCode(code);
    if (!service) {
      throw Errors.NotFound('Servizio non trovato');
    }

    const plans = await this.getServicePlans(service.id);

    return {
      service,
      plans
    };
  }

  // Ottieni tutti i servizi con i loro piani
  async getAllServicesWithPlans() {
    const { data: services, error } = await supabaseAdmin
      .from('services')
      .select(`
        *,
        plans (*)
      `)
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('Error fetching services with plans:', error);
      throw Errors.Internal('Errore nel recupero dei servizi');
    }

    return services.map(service => ({
      ...this.formatService(service),
      plans: (service.plans || [])
        .filter(p => p.is_active)
        .map(plan => this.formatPlan(plan))
        .sort((a, b) => a.sortOrder - b.sortOrder)
    }));
  }

  // Formatta servizio per risposta
  formatService(service) {
    // Usa i valori dal database, con fallback alla config per compatibilità
    const configService = SERVICES[service.code] || {};

    return {
      id: service.id,
      code: service.code,
      name: service.name,
      description: service.description || configService.description,
      tagline: service.tagline || configService.tagline || null,
      headline: service.headline || null,
      benefits: service.benefits || configService.benefits || [],
      appUrl: service.app_url,
      icon: service.icon,
      color: service.color,
      bgLight: service.color_light || configService.bgLight || null,
      borderColor: service.border_color || configService.borderColor || null,
      type: service.contact_required ? 'contact_required' : (configService.type || 'activatable'),
      contactRequired: service.contact_required || false,
      sortOrder: service.sort_order
    };
  }

  // Formatta piano per risposta
  formatPlan(plan) {
    return {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      priceMonthly: parseFloat(plan.price_monthly || 0),
      priceYearly: parseFloat(plan.price_yearly || 0),
      trialDays: plan.trial_days || 0,
      features: plan.features || {},
      sortOrder: plan.sort_order
    };
  }
}

export default new ServiceService();
