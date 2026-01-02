import { supabaseAdmin } from '../config/supabase.js';
import { Errors } from '../middleware/errorHandler.js';
import { generateSlug, ensureUniqueSlug } from '../utils/slug.js';

class AdminService {
  // ==================== USERS ====================

  // Ottieni tutti gli utenti con paginazione
  async getAllUsers({ page = 1, limit = 20, search = '', sortBy = 'created_at', sortOrder = 'desc' }) {
    const offset = (page - 1) * limit;

    // Ottieni utenti da Supabase Auth
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: limit
    });

    if (error) {
      console.error('Error fetching users:', error);
      throw Errors.Internal('Errore nel recupero degli utenti');
    }

    // Filtra per ricerca se presente
    let filteredUsers = users;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchLower) ||
        u.user_metadata?.full_name?.toLowerCase().includes(searchLower)
      );
    }

    // Per ogni utente, ottieni le organizzazioni
    const usersWithOrgs = await Promise.all(
      filteredUsers.map(async (user) => {
        const { data: orgUsers } = await supabaseAdmin
          .from('organization_users')
          .select(`
            role,
            organization:organizations (id, name, slug)
          `)
          .eq('user_id', user.id);

        return {
          id: user.id,
          email: user.email,
          fullName: user.user_metadata?.full_name,
          phone: user.phone,
          emailConfirmed: user.email_confirmed_at !== null,
          createdAt: user.created_at,
          lastSignIn: user.last_sign_in_at,
          organizations: orgUsers?.map(ou => ({
            id: ou.organization?.id,
            name: ou.organization?.name,
            slug: ou.organization?.slug,
            role: ou.role
          })) || []
        };
      })
    );

    return {
      users: usersWithOrgs,
      pagination: {
        page,
        limit,
        total: users.length,
        totalPages: Math.ceil(users.length / limit)
      }
    };
  }

  // Ottieni singolo utente
  async getUserById(userId) {
    const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (error || !user) {
      throw Errors.NotFound('Utente non trovato');
    }

    // Ottieni organizzazioni
    const { data: orgUsers } = await supabaseAdmin
      .from('organization_users')
      .select(`
        role,
        created_at,
        organization:organizations (*)
      `)
      .eq('user_id', userId);

    // Ottieni abbonamenti tramite organizzazioni
    const orgIds = orgUsers?.map(ou => ou.organization?.id).filter(Boolean) || [];
    let subscriptions = [];

    if (orgIds.length > 0) {
      const { data: subs } = await supabaseAdmin
        .from('subscriptions')
        .select(`
          *,
          plan:plans (
            name,
            code,
            service:services (name, code)
          )
        `)
        .in('organization_id', orgIds);

      subscriptions = subs || [];
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name,
      phone: user.phone,
      emailConfirmed: user.email_confirmed_at !== null,
      createdAt: user.created_at,
      lastSignIn: user.last_sign_in_at,
      appMetadata: user.app_metadata,
      organizations: orgUsers?.map(ou => ({
        ...ou.organization,
        role: ou.role,
        joinedAt: ou.created_at
      })) || [],
      subscriptions
    };
  }

  // Crea nuovo utente
  async createUser({ email, password, fullName, emailConfirm = true }) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: emailConfirm,
      user_metadata: {
        full_name: fullName
      }
    });

    if (error) {
      if (error.message.includes('already')) {
        throw Errors.Conflict('Email già registrata');
      }
      throw Errors.BadRequest(error.message);
    }

    return {
      id: data.user.id,
      email: data.user.email,
      fullName: data.user.user_metadata?.full_name,
      createdAt: data.user.created_at
    };
  }

  // Aggiorna utente
  async updateUser(userId, updates) {
    const updateData = {};

    if (updates.email) {
      updateData.email = updates.email;
    }

    if (updates.password) {
      updateData.password = updates.password;
    }

    if (updates.fullName !== undefined) {
      updateData.user_metadata = {
        full_name: updates.fullName
      };
    }

    if (updates.emailConfirm !== undefined) {
      updateData.email_confirm = updates.emailConfirm;
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData);

    if (error) {
      throw Errors.BadRequest(error.message);
    }

    return {
      id: data.user.id,
      email: data.user.email,
      fullName: data.user.user_metadata?.full_name,
      emailConfirmed: data.user.email_confirmed_at !== null
    };
  }

  // Elimina utente
  async deleteUser(userId) {
    // Prima rimuovi da tutte le organizzazioni
    await supabaseAdmin
      .from('organization_users')
      .delete()
      .eq('user_id', userId);

    // Poi elimina l'utente
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      throw Errors.BadRequest(error.message);
    }

    return { success: true };
  }

  // ==================== ORGANIZATIONS/AGENCIES ====================

  // Crea nuova organizzazione/agenzia (super admin)
  async createOrganization({ name, email, phone, vatNumber, accountType = 'single', maxActivities = 1, ownerEmail }) {
    // Genera slug unico
    const baseSlug = generateSlug(name);
    const slug = await ensureUniqueSlug(baseSlug, async (s) => {
      const { data } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('slug', s)
        .single();
      return !!data;
    });

    // Crea organizzazione
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name,
        slug,
        email: email || null,
        phone: phone || null,
        vat_number: vatNumber || null,
        account_type: accountType,
        max_activities: accountType === 'agency' ? (maxActivities || 5) : 1,
        created_by_admin: true,
        status: 'active'
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      throw Errors.Internal('Errore nella creazione dell\'organizzazione');
    }

    // Se fornito ownerEmail, aggiungi come owner
    if (ownerEmail) {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const owner = users?.find(u => u.email === ownerEmail);

      if (owner) {
        await supabaseAdmin
          .from('organization_users')
          .insert({
            organization_id: org.id,
            user_id: owner.id,
            role: 'owner'
          });
      }
    }

    return this.formatOrganization(org);
  }

  // Ottieni tutte le organizzazioni
  async getAllOrganizations({ page = 1, limit = 20, search = '', status = null, accountType = null }) {
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('organizations')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (accountType) {
      query = query.eq('account_type', accountType);
    }

    const { data: organizations, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw Errors.Internal('Errore nel recupero delle organizzazioni');
    }

    // Per ogni organizzazione, conta membri, attività e abbonamenti
    const orgsWithStats = await Promise.all(
      organizations.map(async (org) => {
        const { count: membersCount } = await supabaseAdmin
          .from('organization_users')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id);

        const { count: activitiesCount } = await supabaseAdmin
          .from('activities')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .eq('status', 'active');

        const { count: subsCount } = await supabaseAdmin
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .in('status', ['active', 'trial']);

        // Conta pacchetti attivi
        const { count: packagesCount } = await supabaseAdmin
          .from('organization_packages')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .in('status', ['active', 'trial']);

        return {
          ...this.formatOrganization(org),
          membersCount: membersCount || 0,
          activitiesCount: activitiesCount || 0,
          activeSubscriptions: subsCount || 0,
          activePackages: packagesCount || 0
        };
      })
    );

    return {
      organizations: orgsWithStats,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  // Formatta organizzazione
  formatOrganization(org) {
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      email: org.email,
      phone: org.phone,
      vatNumber: org.vat_number,
      logoUrl: org.logo_url,
      status: org.status,
      accountType: org.account_type || 'single',
      maxActivities: org.max_activities || 1,
      createdByAdmin: org.created_by_admin || false,
      createdAt: org.created_at,
      updatedAt: org.updated_at
    };
  }

  // Ottieni singola organizzazione con dettagli
  async getOrganizationById(organizationId) {
    const { data: org, error } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (error || !org) {
      throw Errors.NotFound('Organizzazione non trovata');
    }

    // Ottieni membri
    const { data: members } = await supabaseAdmin
      .from('organization_users')
      .select('*')
      .eq('organization_id', organizationId);

    // Ottieni dettagli utenti membri
    const memberDetails = await Promise.all(
      (members || []).map(async (m) => {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(m.user_id);
        return {
          id: m.id,
          userId: m.user_id,
          email: user?.email,
          fullName: user?.user_metadata?.full_name,
          role: m.role,
          joinedAt: m.created_at
        };
      })
    );

    // Ottieni attività dell'organizzazione
    const { data: activities } = await supabaseAdmin
      .from('activities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    // Ottieni abbonamenti
    const { data: subscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        plan:plans (
          id, code, name, price_monthly, price_yearly,
          service:services (id, code, name)
        )
      `)
      .eq('organization_id', organizationId);

    // Ottieni pacchetti
    const { data: packages } = await supabaseAdmin
      .from('organization_packages')
      .select(`
        *,
        package:service_packages (
          id, code, name, price_monthly, price_yearly,
          services:package_services (
            service:services (id, code, name)
          )
        )
      `)
      .eq('organization_id', organizationId);

    return {
      ...this.formatOrganization(org),
      members: memberDetails,
      activities: activities?.map(a => ({
        id: a.id,
        name: a.name,
        slug: a.slug,
        status: a.status,
        createdAt: a.created_at
      })) || [],
      subscriptions: subscriptions || [],
      packages: packages || []
    };
  }

  // ==================== ACTIVITIES (Admin) ====================

  // Ottieni tutte le attività
  async getAllActivities({ page = 1, limit = 20, search = '', status = null, organizationId = null }) {
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('activities')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data: activities, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw Errors.Internal('Errore nel recupero delle attività');
    }

    // Aggiungi info organizzazione e conteggi
    const activitiesWithInfo = await Promise.all(
      activities.map(async (activity) => {
        let organization = null;
        if (activity.organization_id) {
          const { data: org } = await supabaseAdmin
            .from('organizations')
            .select('id, name, slug')
            .eq('id', activity.organization_id)
            .single();
          organization = org;
        }

        const { count: membersCount } = await supabaseAdmin
          .from('activity_users')
          .select('*', { count: 'exact', head: true })
          .eq('activity_id', activity.id);

        const { count: subsCount } = await supabaseAdmin
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('activity_id', activity.id)
          .in('status', ['active', 'trial']);

        return {
          id: activity.id,
          name: activity.name,
          slug: activity.slug,
          email: activity.email,
          phone: activity.phone,
          status: activity.status,
          organization,
          membersCount: membersCount || 0,
          activeSubscriptions: subsCount || 0,
          createdAt: activity.created_at
        };
      })
    );

    return {
      activities: activitiesWithInfo,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  // Ottieni singola attività con dettagli completi
  async getActivityById(activityId) {
    const { data: activity, error } = await supabaseAdmin
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .single();

    if (error || !activity) {
      throw Errors.NotFound('Attività non trovata');
    }

    // Ottieni organizzazione
    let organization = null;
    if (activity.organization_id) {
      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('*')
        .eq('id', activity.organization_id)
        .single();
      organization = org ? this.formatOrganization(org) : null;
    }

    // Ottieni membri dell'attività
    const { data: members } = await supabaseAdmin
      .from('activity_users')
      .select('*')
      .eq('activity_id', activityId);

    // Ottieni dettagli utenti membri
    const memberDetails = await Promise.all(
      (members || []).map(async (m) => {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(m.user_id);
        return {
          id: m.id,
          userId: m.user_id,
          email: user?.email,
          fullName: user?.user_metadata?.full_name,
          role: m.role,
          joinedAt: m.created_at
        };
      })
    );

    // Ottieni abbonamenti (piani singoli)
    const { data: subscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        plan:plans (
          id, code, name, price_monthly, price_yearly, features,
          service:services (id, code, name, icon, color, app_url)
        )
      `)
      .eq('activity_id', activityId);

    // Formatta abbonamenti
    const formattedSubscriptions = (subscriptions || []).map(sub => ({
      id: sub.id,
      status: sub.status,
      billingCycle: sub.billing_cycle,
      trialEndsAt: sub.trial_ends_at,
      currentPeriodStart: sub.current_period_start,
      currentPeriodEnd: sub.current_period_end,
      createdAt: sub.created_at,
      plan: sub.plan ? {
        id: sub.plan.id,
        code: sub.plan.code,
        name: sub.plan.name,
        priceMonthly: parseFloat(sub.plan.price_monthly || 0),
        priceYearly: parseFloat(sub.plan.price_yearly || 0),
        features: sub.plan.features || [],
        service: sub.plan.service ? {
          id: sub.plan.service.id,
          code: sub.plan.service.code,
          name: sub.plan.service.name,
          icon: sub.plan.service.icon,
          color: sub.plan.service.color,
          appUrl: sub.plan.service.app_url
        } : null
      } : null
    }));

    return {
      id: activity.id,
      name: activity.name,
      slug: activity.slug,
      email: activity.email,
      phone: activity.phone,
      vatNumber: activity.vat_number,
      address: activity.address,
      city: activity.city,
      status: activity.status,
      createdAt: activity.created_at,
      updatedAt: activity.updated_at,
      organization,
      members: memberDetails,
      subscriptions: formattedSubscriptions
    };
  }

  // Crea attività per organizzazione (admin)
  async createActivityForOrganization(organizationId, data, ownerEmail = null) {
    const { name, email, phone, vatNumber, address, city } = data;

    // Verifica organizzazione
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('id, account_type, max_activities')
      .eq('id', organizationId)
      .single();

    if (!org) {
      throw Errors.NotFound('Organizzazione non trovata');
    }

    // Verifica limite attività (solo per agency)
    if (org.account_type === 'agency' && org.max_activities !== -1) {
      const { count } = await supabaseAdmin
        .from('activities')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      if (count >= org.max_activities) {
        throw Errors.BadRequest(`Raggiunto il limite di ${org.max_activities} attività`);
      }
    }

    // Genera slug unico
    const baseSlug = generateSlug(name);
    const slug = await ensureUniqueSlug(baseSlug, async (s) => {
      const { data } = await supabaseAdmin
        .from('activities')
        .select('id')
        .eq('slug', s)
        .single();
      return !!data;
    });

    // Crea attività
    const { data: activity, error } = await supabaseAdmin
      .from('activities')
      .insert({
        name,
        slug,
        email: email || null,
        phone: phone || null,
        vat_number: vatNumber || null,
        address: address || null,
        city: city || null,
        organization_id: organizationId,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      throw Errors.Internal('Errore nella creazione dell\'attività');
    }

    // Se fornito ownerEmail, aggiungi come owner
    if (ownerEmail) {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const owner = users?.find(u => u.email === ownerEmail);

      if (owner) {
        await supabaseAdmin
          .from('activity_users')
          .insert({
            activity_id: activity.id,
            user_id: owner.id,
            role: 'owner'
          });
      }
    }

    return activity;
  }

  // Aggiorna organizzazione
  async updateOrganization(organizationId, updates) {
    const allowedFields = ['name', 'email', 'phone', 'vat_number', 'logo_url', 'status'];
    const updateData = {};

    for (const field of allowedFields) {
      const camelField = field.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
      if (updates[camelField] !== undefined) {
        updateData[field] = updates[camelField];
      }
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    const { data, error } = await supabaseAdmin
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId)
      .select()
      .single();

    if (error) {
      throw Errors.BadRequest(error.message);
    }

    return data;
  }

  // Elimina organizzazione (hard delete)
  async deleteOrganization(organizationId) {
    // Elimina abbonamenti
    await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('organization_id', organizationId);

    // Elimina membri
    await supabaseAdmin
      .from('organization_users')
      .delete()
      .eq('organization_id', organizationId);

    // Elimina organizzazione
    const { error } = await supabaseAdmin
      .from('organizations')
      .delete()
      .eq('id', organizationId);

    if (error) {
      throw Errors.BadRequest(error.message);
    }

    return { success: true };
  }

  // ==================== SUBSCRIPTIONS ====================

  // Ottieni tutti gli abbonamenti
  async getAllSubscriptions({ page = 1, limit = 20, status = null, serviceCode = null }) {
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        organization:organizations (id, name, slug),
        plan:plans (
          id, code, name, price_monthly, price_yearly,
          service:services (id, code, name)
        )
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: subscriptions, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw Errors.Internal('Errore nel recupero degli abbonamenti');
    }

    // Filtra per service se richiesto
    let filtered = subscriptions;
    if (serviceCode) {
      filtered = subscriptions.filter(s => s.plan?.service?.code === serviceCode);
    }

    return {
      subscriptions: filtered,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  // Aggiorna abbonamento
  async updateSubscription(subscriptionId, updates) {
    const allowedFields = ['status', 'billing_cycle', 'trial_ends_at', 'current_period_end', 'plan_id'];
    const updateData = {};

    for (const field of allowedFields) {
      const camelField = field.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
      if (updates[camelField] !== undefined) {
        updateData[field] = updates[camelField];
      }
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionId)
      .select(`
        *,
        plan:plans (name, code, service:services (name, code))
      `)
      .single();

    if (error) {
      throw Errors.BadRequest(error.message);
    }

    return data;
  }

  // ==================== STATS ====================

  // Ottieni statistiche globali
  async getGlobalStats() {
    // Conta utenti totali (con paginazione per gestire più di 1000 utenti)
    let totalUsers = 0;
    let allUsers = [];
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (!users || users.length === 0) break;
      allUsers = allUsers.concat(users);
      totalUsers += users.length;
      if (users.length < perPage) break;
      page++;
    }

    // Conta organizzazioni
    const { count: totalOrgs } = await supabaseAdmin
      .from('organizations')
      .select('*', { count: 'exact', head: true });

    const { count: activeOrgs } = await supabaseAdmin
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Conta attività
    const { count: totalActivities } = await supabaseAdmin
      .from('activities')
      .select('*', { count: 'exact', head: true });

    const { count: activeActivities } = await supabaseAdmin
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Conta abbonamenti per stato
    const { data: subsByStatus } = await supabaseAdmin
      .from('subscriptions')
      .select('status');

    const subscriptionStats = {
      total: subsByStatus?.length || 0,
      active: subsByStatus?.filter(s => s.status === 'active').length || 0,
      trial: subsByStatus?.filter(s => s.status === 'trial').length || 0,
      cancelled: subsByStatus?.filter(s => s.status === 'cancelled').length || 0,
      expired: subsByStatus?.filter(s => s.status === 'expired').length || 0
    };

    // Conta abbonamenti per servizio
    const { data: subsByService } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        status,
        plan:plans (
          service:services (code, name)
        )
      `)
      .in('status', ['active', 'trial']);

    const serviceStats = {};
    subsByService?.forEach(sub => {
      const serviceCode = sub.plan?.service?.code;
      if (serviceCode) {
        if (!serviceStats[serviceCode]) {
          serviceStats[serviceCode] = {
            code: serviceCode,
            name: sub.plan.service.name,
            active: 0,
            trial: 0
          };
        }
        if (sub.status === 'active') {
          serviceStats[serviceCode].active++;
        } else if (sub.status === 'trial') {
          serviceStats[serviceCode].trial++;
        }
      }
    });

    // Calcola revenue mensile stimata
    const { data: activeSubsWithPlans } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        billing_cycle,
        plan:plans (price_monthly, price_yearly)
      `)
      .eq('status', 'active');

    let monthlyRevenue = 0;
    activeSubsWithPlans?.forEach(sub => {
      if (sub.billing_cycle === 'yearly') {
        monthlyRevenue += parseFloat(sub.plan?.price_yearly || 0) / 12;
      } else {
        monthlyRevenue += parseFloat(sub.plan?.price_monthly || 0);
      }
    });

    // Utenti registrati negli ultimi 30 giorni
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersLast30Days = allUsers?.filter(u =>
      new Date(u.created_at) > thirtyDaysAgo
    ).length || 0;

    return {
      users: {
        total: totalUsers,
        newLast30Days: newUsersLast30Days
      },
      organizations: {
        total: totalOrgs || 0,
        active: activeOrgs || 0
      },
      activities: {
        total: totalActivities || 0,
        active: activeActivities || 0
      },
      subscriptions: subscriptionStats,
      serviceBreakdown: Object.values(serviceStats),
      revenue: {
        monthlyEstimate: Math.round(monthlyRevenue * 100) / 100,
        currency: 'EUR'
      }
    };
  }

  // Ottieni attività recente
  async getRecentActivity(limit = 20) {
    // Ottieni ultimi utenti registrati
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const recentUsers = users
      ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(u => ({
        type: 'user_registered',
        email: u.email,
        fullName: u.user_metadata?.full_name,
        timestamp: u.created_at
      })) || [];

    // Ottieni ultimi abbonamenti
    const { data: recentSubs } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        status,
        created_at,
        organization:organizations (name),
        plan:plans (name, service:services (name))
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    const subActivities = recentSubs?.map(s => ({
      type: 'subscription_created',
      organizationName: s.organization?.name,
      serviceName: s.plan?.service?.name,
      planName: s.plan?.name,
      status: s.status,
      timestamp: s.created_at
    })) || [];

    // Ottieni ultime organizzazioni create
    const { data: recentOrgs } = await supabaseAdmin
      .from('organizations')
      .select('name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    const orgActivities = recentOrgs?.map(o => ({
      type: 'organization_created',
      name: o.name,
      timestamp: o.created_at
    })) || [];

    // Combina e ordina per timestamp
    const allActivities = [...recentUsers, ...subActivities, ...orgActivities]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    return allActivities;
  }
}

export default new AdminService();
