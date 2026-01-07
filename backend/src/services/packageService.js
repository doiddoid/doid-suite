import { supabaseAdmin } from '../config/supabase.js';
import { Errors } from '../middleware/errorHandler.js';

class PackageService {
  // ==================== PACKAGES CRUD ====================

  /**
   * Ottieni tutti i pacchetti disponibili
   */
  async getAllPackages(includeInactive = false) {
    let query = supabaseAdmin
      .from('service_packages')
      .select(`
        *,
        services:package_services (
          id,
          service:services (
            id,
            code,
            name,
            icon,
            color
          ),
          plan:plans (
            id,
            code,
            name,
            price_monthly,
            price_yearly
          )
        )
      `)
      .order('sort_order', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching packages:', error);
      throw Errors.Internal('Errore nel recupero dei pacchetti');
    }

    return data.map(pkg => this.formatPackage(pkg));
  }

  /**
   * Ottieni pacchetto per ID
   */
  async getPackageById(packageId) {
    const { data, error } = await supabaseAdmin
      .from('service_packages')
      .select(`
        *,
        services:package_services (
          id,
          service:services (
            id,
            code,
            name,
            description,
            icon,
            color
          ),
          plan:plans (
            id,
            code,
            name,
            price_monthly,
            price_yearly,
            features
          )
        )
      `)
      .eq('id', packageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching package:', error);
      throw Errors.Internal('Errore nel recupero del pacchetto');
    }

    return this.formatPackage(data);
  }

  /**
   * Ottieni pacchetto per codice
   */
  async getPackageByCode(code) {
    const { data, error } = await supabaseAdmin
      .from('service_packages')
      .select(`
        *,
        services:package_services (
          id,
          service:services (*),
          plan:plans (*)
        )
      `)
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw Errors.Internal('Errore nel recupero del pacchetto');
    }

    return this.formatPackage(data);
  }

  /**
   * Crea nuovo pacchetto (solo super admin)
   */
  async createPackage(data) {
    const { code, name, description, priceMonthly, priceYearly, maxActivities, services } = data;

    // Crea pacchetto
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from('service_packages')
      .insert({
        code,
        name,
        description,
        price_monthly: priceMonthly || 0,
        price_yearly: priceYearly || 0,
        max_activities: maxActivities || 5,
        is_active: true
      })
      .select()
      .single();

    if (pkgError) {
      console.error('Error creating package:', pkgError);
      if (pkgError.code === '23505') {
        throw Errors.Conflict('Esiste già un pacchetto con questo codice');
      }
      throw Errors.Internal('Errore nella creazione del pacchetto');
    }

    // Aggiungi servizi al pacchetto
    if (services && services.length > 0) {
      const packageServices = services.map(s => ({
        package_id: pkg.id,
        service_id: s.serviceId,
        plan_id: s.planId
      }));

      const { error: servicesError } = await supabaseAdmin
        .from('package_services')
        .insert(packageServices);

      if (servicesError) {
        console.error('Error adding services to package:', servicesError);
        // Rollback
        await supabaseAdmin.from('service_packages').delete().eq('id', pkg.id);
        throw Errors.Internal('Errore nell\'aggiunta dei servizi al pacchetto');
      }
    }

    return this.getPackageById(pkg.id);
  }

  /**
   * Aggiorna pacchetto
   */
  async updatePackage(packageId, data) {
    const updates = {};
    const allowedFields = ['name', 'description', 'priceMonthly', 'priceYearly', 'maxActivities', 'isActive', 'sortOrder'];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
        updates[dbField] = data[field];
      }
    }

    if (Object.keys(updates).length === 0 && !data.services) {
      throw Errors.BadRequest('Nessun campo da aggiornare');
    }

    // Aggiorna info pacchetto
    if (Object.keys(updates).length > 0) {
      const { error } = await supabaseAdmin
        .from('service_packages')
        .update(updates)
        .eq('id', packageId);

      if (error) {
        console.error('Error updating package:', error);
        throw Errors.Internal('Errore nell\'aggiornamento del pacchetto');
      }
    }

    // Aggiorna servizi se forniti
    if (data.services) {
      // Rimuovi servizi esistenti
      await supabaseAdmin
        .from('package_services')
        .delete()
        .eq('package_id', packageId);

      // Aggiungi nuovi servizi
      if (data.services.length > 0) {
        const packageServices = data.services.map(s => ({
          package_id: packageId,
          service_id: s.serviceId,
          plan_id: s.planId
        }));

        const { error: servicesError } = await supabaseAdmin
          .from('package_services')
          .insert(packageServices);

        if (servicesError) {
          console.error('Error updating package services:', servicesError);
          throw Errors.Internal('Errore nell\'aggiornamento dei servizi');
        }
      }
    }

    return this.getPackageById(packageId);
  }

  /**
   * Elimina pacchetto (soft delete)
   */
  async deletePackage(packageId) {
    const { error } = await supabaseAdmin
      .from('service_packages')
      .update({ is_active: false })
      .eq('id', packageId);

    if (error) {
      console.error('Error deleting package:', error);
      throw Errors.Internal('Errore nell\'eliminazione del pacchetto');
    }

    return { success: true };
  }

  // ==================== ORGANIZATION PACKAGES ====================

  /**
   * Ottieni pacchetti attivi di un'organizzazione
   */
  async getOrganizationPackages(organizationId) {
    const { data, error } = await supabaseAdmin
      .from('organization_packages')
      .select(`
        *,
        package:service_packages (
          *,
          services:package_services (
            service:services (id, code, name, icon, color),
            plan:plans (id, code, name)
          )
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching org packages:', error);
      throw Errors.Internal('Errore nel recupero dei pacchetti dell\'organizzazione');
    }

    return data.map(op => this.formatOrganizationPackage(op));
  }

  /**
   * Attiva pacchetto per organizzazione
   */
  async activatePackageForOrganization(organizationId, packageCode, billingCycle = 'monthly') {
    const pkg = await this.getPackageByCode(packageCode);
    if (!pkg) {
      throw Errors.NotFound('Pacchetto non trovato');
    }

    // Verifica se già attivo
    const { data: existing } = await supabaseAdmin
      .from('organization_packages')
      .select('id, status')
      .eq('organization_id', organizationId)
      .eq('package_id', pkg.id)
      .single();

    if (existing && ['active', 'trial'].includes(existing.status)) {
      throw Errors.Conflict('Pacchetto già attivo per questa organizzazione');
    }

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 giorni trial
    const periodEnd = billingCycle === 'yearly'
      ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    const insertData = {
      organization_id: organizationId,
      package_id: pkg.id,
      status: 'trial',
      billing_cycle: billingCycle,
      trial_ends_at: trialEndsAt.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString()
    };

    let result;
    if (existing) {
      // Riattiva esistente
      const { data, error } = await supabaseAdmin
        .from('organization_packages')
        .update(insertData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw Errors.Internal('Errore nell\'attivazione del pacchetto');
      result = data;
    } else {
      // Crea nuovo
      const { data, error } = await supabaseAdmin
        .from('organization_packages')
        .insert(insertData)
        .select()
        .single();

      if (error) throw Errors.Internal('Errore nell\'attivazione del pacchetto');
      result = data;
    }

    // Aggiorna max_activities dell'organizzazione
    await supabaseAdmin
      .from('organizations')
      .update({
        account_type: 'agency',
        max_activities: pkg.maxActivities
      })
      .eq('id', organizationId);

    return this.getOrganizationPackageById(result.id);
  }

  /**
   * Ottieni abbonamento pacchetto per ID
   */
  async getOrganizationPackageById(orgPackageId) {
    const { data, error } = await supabaseAdmin
      .from('organization_packages')
      .select(`
        *,
        package:service_packages (
          *,
          services:package_services (
            service:services (*),
            plan:plans (*)
          )
        )
      `)
      .eq('id', orgPackageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw Errors.Internal('Errore nel recupero dell\'abbonamento');
    }

    return this.formatOrganizationPackage(data);
  }

  /**
   * Cancella pacchetto per organizzazione
   */
  async cancelOrganizationPackage(organizationId, packageId) {
    const { error } = await supabaseAdmin
      .from('organization_packages')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('organization_id', organizationId)
      .eq('package_id', packageId);

    if (error) {
      console.error('Error cancelling package:', error);
      throw Errors.Internal('Errore nella cancellazione del pacchetto');
    }

    return { success: true };
  }

  /**
   * Verifica se organizzazione ha un pacchetto attivo che include un servizio
   */
  async organizationHasServiceViaPackage(organizationId, serviceCode) {
    const { data } = await supabaseAdmin
      .from('organization_packages')
      .select(`
        id,
        status,
        package:service_packages (
          services:package_services (
            service:services (code)
          )
        )
      `)
      .eq('organization_id', organizationId)
      .in('status', ['active', 'trial']);

    if (!data || data.length === 0) return false;

    for (const op of data) {
      const services = op.package?.services || [];
      if (services.some(s => s.service?.code === serviceCode)) {
        return true;
      }
    }

    return false;
  }

  // ==================== FORMATTERS ====================

  formatPackage(pkg) {
    return {
      id: pkg.id,
      code: pkg.code,
      name: pkg.name,
      description: pkg.description,
      priceMonthly: parseFloat(pkg.price_monthly || 0),
      priceYearly: parseFloat(pkg.price_yearly || 0),
      maxActivities: pkg.max_activities,
      isActive: pkg.is_active,
      sortOrder: pkg.sort_order,
      createdAt: pkg.created_at,
      updatedAt: pkg.updated_at,
      services: (pkg.services || []).map(ps => ({
        id: ps.id,
        service: ps.service ? {
          id: ps.service.id,
          code: ps.service.code,
          name: ps.service.name,
          description: ps.service.description,
          icon: ps.service.icon,
          color: ps.service.color
        } : null,
        plan: ps.plan ? {
          id: ps.plan.id,
          code: ps.plan.code,
          name: ps.plan.name,
          priceMonthly: parseFloat(ps.plan.price_monthly || 0),
          priceYearly: parseFloat(ps.plan.price_yearly || 0),
          features: ps.plan.features
        } : null
      }))
    };
  }

  formatOrganizationPackage(op) {
    return {
      id: op.id,
      organizationId: op.organization_id,
      status: op.status,
      billingCycle: op.billing_cycle,
      trialEndsAt: op.trial_ends_at,
      currentPeriodStart: op.current_period_start,
      currentPeriodEnd: op.current_period_end,
      cancelledAt: op.cancelled_at,
      createdAt: op.created_at,
      package: op.package ? this.formatPackage(op.package) : null
    };
  }
}

export default new PackageService();
