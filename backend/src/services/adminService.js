import { supabaseAdmin } from '../config/supabase.js';
import { Errors } from '../middleware/errorHandler.js';
import { generateSlug, ensureUniqueSlug } from '../utils/slug.js';
import webhookService from './webhookService.js';

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

  /**
   * Genera password temporanea sicura
   */
  generateTempPassword(length = 16) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Crea nuovo utente (admin)
   * - Genera password temporanea se non fornita
   * - Genera link reset password
   * - Invia webhook a GHL
   * - Logga azione admin
   */
  async createUser({
    email,
    password,
    fullName,
    firstName,
    lastName,
    phone,
    emailConfirm = true,
    sendResetEmail = true,
    adminNotes,
    createdBy
  }) {
    // 1. Genera password temporanea se non fornita
    const tempPassword = password || this.generateTempPassword(16);
    const isAutoPassword = !password;

    // 2. Crea utente con Supabase Admin API
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: emailConfirm,
      user_metadata: {
        full_name: fullName,
        first_name: firstName || fullName?.split(' ')[0] || '',
        last_name: lastName || fullName?.split(' ').slice(1).join(' ') || '',
        phone: phone || null,
        must_reset_password: isAutoPassword,
        created_by_admin: true
      }
    });

    if (error) {
      if (error.message.includes('already')) {
        throw Errors.Conflict('Email già registrata');
      }
      throw Errors.BadRequest(error.message);
    }

    const userId = data.user.id;
    let resetPasswordUrl = null;

    // 3. Genera link reset password se richiesto
    if (sendResetEmail && isAutoPassword) {
      try {
        const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: email,
          options: {
            redirectTo: `${process.env.FRONTEND_URL || 'https://suite.doid.it'}/reset-password`
          }
        });

        if (!resetError && resetData?.properties?.action_link) {
          resetPasswordUrl = resetData.properties.action_link;
        }
      } catch (resetErr) {
        console.error('Error generating reset password link:', resetErr);
      }
    }

    // 4. Log azione admin (se esiste la tabella)
    if (createdBy) {
      try {
        await supabaseAdmin.from('admin_logs').insert({
          admin_user_id: createdBy,
          action: 'create_user',
          entity_type: 'user',
          entity_id: userId,
          details: {
            email,
            fullName,
            firstName,
            lastName,
            adminNotes: adminNotes || null,
            autoPasswordGenerated: isAutoPassword
          }
        });
      } catch (logErr) {
        // Non bloccare se il log fallisce (tabella potrebbe non esistere)
        console.error('Error logging admin action:', logErr.message);
      }
    }

    // 5. Invia webhook a GHL per email benvenuto/reset password
    try {
      await webhookService.send('admin.user_created', {
        userId,
        email,
        firstName: firstName || fullName?.split(' ')[0] || '',
        lastName: lastName || fullName?.split(' ').slice(1).join(' ') || '',
        fullName,
        phone: phone || null,
        resetPasswordUrl,
        createdByAdmin: true,
        mustResetPassword: isAutoPassword
      });
      console.log(`[ADMIN] Webhook sent for new user ${email}`);
    } catch (webhookErr) {
      // Non bloccare se il webhook fallisce
      console.error('[ADMIN] Webhook failed for new user:', webhookErr.message);
    }

    return {
      id: userId,
      email: data.user.email,
      fullName: data.user.user_metadata?.full_name,
      firstName: data.user.user_metadata?.first_name,
      lastName: data.user.user_metadata?.last_name,
      phone: data.user.user_metadata?.phone,
      createdAt: data.user.created_at,
      mustResetPassword: isAutoPassword,
      resetPasswordUrl // Incluso nella risposta per debug/admin
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
  async createOrganization({ name, email, phone, vatNumber, accountType = 'single', maxActivities = 1, ownerId, ownerEmail, createNewOwner, newOwnerEmail, newOwnerPassword, newOwnerName, createActivity = true }) {
    // Genera slug unico per organizzazione
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

    let resolvedOwnerId = ownerId || null;

    // Se richiesto, crea nuovo utente owner
    if (createNewOwner && newOwnerEmail && newOwnerPassword) {
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: newOwnerEmail,
        password: newOwnerPassword,
        email_confirm: true,
        user_metadata: {
          full_name: newOwnerName || newOwnerEmail.split('@')[0]
        }
      });

      if (createUserError) {
        console.error('Error creating new owner:', createUserError);
        throw Errors.BadRequest(createUserError.message || 'Errore nella creazione dell\'utente owner');
      }

      if (newUser?.user) {
        resolvedOwnerId = newUser.user.id;
        await supabaseAdmin
          .from('organization_users')
          .insert({
            organization_id: org.id,
            user_id: newUser.user.id,
            role: 'owner'
          });
      }
    }
    // Se fornito ownerId direttamente, usalo
    else if (ownerId) {
      await supabaseAdmin
        .from('organization_users')
        .insert({
          organization_id: org.id,
          user_id: ownerId,
          role: 'owner'
        });
    }
    // Fallback: se fornito ownerEmail (legacy), cerca l'utente
    else if (ownerEmail) {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const owner = users?.find(u => u.email === ownerEmail);

      if (owner) {
        resolvedOwnerId = owner.id;
        await supabaseAdmin
          .from('organization_users')
          .insert({
            organization_id: org.id,
            user_id: owner.id,
            role: 'owner'
          });
      }
    }

    // Crea automaticamente la prima attività
    if (createActivity) {
      // Genera slug unico per attività
      const activitySlug = await ensureUniqueSlug(baseSlug, async (s) => {
        const { data } = await supabaseAdmin
          .from('activities')
          .select('id')
          .eq('slug', s)
          .single();
        return !!data;
      });

      const { data: activity, error: activityError } = await supabaseAdmin
        .from('activities')
        .insert({
          organization_id: org.id,
          name,
          slug: activitySlug,
          email: email || null,
          phone: phone || null,
          status: 'active'
        })
        .select()
        .single();

      if (activityError) {
        console.error('Error creating activity:', activityError);
        // Non blocchiamo la creazione dell'organizzazione
      } else if (activity && resolvedOwnerId) {
        // Aggiungi l'owner anche all'attività
        await supabaseAdmin
          .from('activity_users')
          .insert({
            activity_id: activity.id,
            user_id: resolvedOwnerId,
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

    // Ottieni servizi con stato per ogni attività
    const activitiesWithServices = await Promise.all(
      (activities || []).map(async (a) => {
        const services = await this.getActivityServicesWithStatus(a.id);
        return {
          id: a.id,
          name: a.name,
          slug: a.slug,
          status: a.status,
          email: a.email,
          phone: a.phone,
          createdAt: a.created_at,
          services
        };
      })
    );

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
      activities: activitiesWithServices,
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

  // Crea nuovo abbonamento (admin)
  async createSubscription({ activityId, serviceCode, planCode, billingCycle = 'yearly', status = 'active' }) {
    // Trova il servizio
    const { data: service } = await supabaseAdmin
      .from('services')
      .select('id, code, name')
      .eq('code', serviceCode)
      .single();

    if (!service) {
      throw Errors.NotFound(`Servizio ${serviceCode} non trovato`);
    }

    // Trova il piano
    const { data: plan } = await supabaseAdmin
      .from('plans')
      .select('id, code, name')
      .eq('service_id', service.id)
      .eq('code', planCode)
      .single();

    if (!plan) {
      throw Errors.NotFound(`Piano ${planCode} non trovato per il servizio ${serviceCode}`);
    }

    // Ottieni organization_id dall'attività
    const { data: activity } = await supabaseAdmin
      .from('activities')
      .select('organization_id')
      .eq('id', activityId)
      .single();

    if (!activity) {
      throw Errors.NotFound('Attività non trovata');
    }

    // Verifica se esiste già una subscription per questo servizio
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('activity_id', activityId)
      .eq('service_id', service.id)
      .single();

    const now = new Date();
    const periodEnd = billingCycle === 'yearly'
      ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    if (existingSub) {
      // Aggiorna la subscription esistente
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          plan_id: plan.id,
          status: status,
          billing_cycle: billingCycle,
          trial_ends_at: null,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancelled_at: null,
          updated_at: now.toISOString()
        })
        .eq('id', existingSub.id)
        .select(`
          *,
          service:services (id, code, name),
          plan:plans (id, code, name)
        `)
        .single();

      if (error) {
        throw Errors.Internal('Errore nell\'aggiornamento della subscription: ' + error.message);
      }

      return data;
    }

    // Crea nuova subscription
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        activity_id: activityId,
        organization_id: activity.organization_id,
        service_id: service.id,
        plan_id: plan.id,
        status: status,
        billing_cycle: billingCycle,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString()
      })
      .select(`
        *,
        service:services (id, code, name),
        plan:plans (id, code, name)
      `)
      .single();

    if (error) {
      throw Errors.Internal('Errore nella creazione della subscription: ' + error.message);
    }

    return data;
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

  // ==================== CRON: TRIAL E SUBSCRIPTIONS ====================

  // Controlla trial in scadenza e notifica
  async checkExpiringTrials(daysBeforeExpiry = 3) {
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysBeforeExpiry);

    // Trova trial che scadono nei prossimi N giorni
    const { data: expiringTrials, error } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        id,
        trial_ends_at,
        activity:activities (id, name, email),
        service:services (id, code, name)
      `)
      .eq('status', 'trial')
      .lte('trial_ends_at', expiryDate.toISOString())
      .gte('trial_ends_at', now.toISOString());

    if (error) {
      console.error('Error checking expiring trials:', error);
      throw Errors.Internal('Errore nel controllo dei trial in scadenza');
    }

    const notifications = [];

    // Crea log comunicazioni e webhook per ogni trial in scadenza
    for (const trial of expiringTrials || []) {
      const daysLeft = Math.ceil((new Date(trial.trial_ends_at) - now) / (1000 * 60 * 60 * 24));

      // Log comunicazione
      await this.logCommunication({
        activityId: trial.activity?.id,
        type: 'system',
        event: `trial_expiring_${daysLeft}d`,
        recipient: trial.activity?.email,
        subject: `Il tuo trial di ${trial.service?.name} scade tra ${daysLeft} giorni`,
        metadata: {
          trialEndsAt: trial.trial_ends_at,
          serviceCode: trial.service?.code,
          daysLeft
        }
      });

      // Aggiungi a webhook queue
      await this.queueWebhook({
        eventType: 'trial_expiring',
        activityId: trial.activity?.id,
        serviceCode: trial.service?.code,
        payload: {
          subscriptionId: trial.id,
          activityName: trial.activity?.name,
          serviceName: trial.service?.name,
          trialEndsAt: trial.trial_ends_at,
          daysLeft
        }
      });

      notifications.push({
        activityId: trial.activity?.id,
        activityName: trial.activity?.name,
        serviceCode: trial.service?.code,
        serviceName: trial.service?.name,
        daysLeft,
        trialEndsAt: trial.trial_ends_at
      });
    }

    return {
      expiringCount: expiringTrials?.length || 0,
      notifications
    };
  }

  // Controlla e aggiorna trial/abbonamenti scaduti
  async checkExpiringSubscriptions() {
    const now = new Date();

    // Trova trial scaduti
    const { data: expiredTrials } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        id,
        activity_id,
        service_id,
        service:services (code, name, has_free_tier)
      `)
      .eq('status', 'trial')
      .lt('trial_ends_at', now.toISOString());

    let trialExpiredCount = 0;
    let trialToFreeCount = 0;

    // Aggiorna status dei trial scaduti
    for (const trial of expiredTrials || []) {
      // Se il servizio ha free tier, passa a free; altrimenti expired
      const newStatus = trial.service?.has_free_tier ? 'free' : 'expired';

      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: newStatus,
          trial_ends_at: null,
          updated_at: now.toISOString()
        })
        .eq('id', trial.id);

      // Log e webhook
      await this.logCommunication({
        activityId: trial.activity_id,
        type: 'system',
        event: 'trial_expired',
        metadata: {
          serviceCode: trial.service?.code,
          newStatus
        }
      });

      await this.queueWebhook({
        eventType: 'trial_expired',
        activityId: trial.activity_id,
        serviceCode: trial.service?.code,
        payload: {
          subscriptionId: trial.id,
          newStatus,
          hasFreeAccess: newStatus === 'free'
        }
      });

      if (newStatus === 'free') {
        trialToFreeCount++;
      } else {
        trialExpiredCount++;
      }
    }

    // Trova abbonamenti PRO scaduti
    const { data: expiredSubs } = await supabaseAdmin
      .from('subscriptions')
      .select('id, activity_id, service:services (code, name, has_free_tier)')
      .eq('status', 'active')
      .lt('current_period_end', now.toISOString());

    let subscriptionExpiredCount = 0;

    for (const sub of expiredSubs || []) {
      // Se ha cancel_at_period_end, passa a expired/free
      const newStatus = sub.service?.has_free_tier ? 'free' : 'expired';

      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: newStatus,
          updated_at: now.toISOString()
        })
        .eq('id', sub.id);

      await this.logCommunication({
        activityId: sub.activity_id,
        type: 'system',
        event: 'subscription_expired',
        metadata: {
          serviceCode: sub.service?.code,
          newStatus
        }
      });

      await this.queueWebhook({
        eventType: 'subscription_expired',
        activityId: sub.activity_id,
        serviceCode: sub.service?.code,
        payload: {
          subscriptionId: sub.id,
          newStatus
        }
      });

      subscriptionExpiredCount++;
    }

    return {
      expiredTrials: (expiredTrials?.length || 0),
      trialToFree: trialToFreeCount,
      trialExpired: trialExpiredCount,
      expiredSubscriptions: subscriptionExpiredCount
    };
  }

  // ==================== SERVICE STATUS MANAGEMENT ====================

  // Ottieni tutti i servizi con stato per una specifica attività
  async getActivityServicesWithStatus(activityId) {
    // Ottieni tutti i servizi attivi
    const { data: services, error: servicesError } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (servicesError) {
      throw Errors.Internal('Errore nel recupero dei servizi');
    }

    // Ottieni le subscription per questa attività
    const { data: subscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        plan:plans (id, code, name)
      `)
      .eq('activity_id', activityId);

    // Mappa subscription per service_id
    const subMap = new Map();
    subscriptions?.forEach(sub => subMap.set(sub.service_id, sub));

    const now = new Date();

    return services.map(service => {
      const sub = subMap.get(service.id);

      let effectiveStatus = 'inactive';
      let isActive = false;

      if (sub) {
        if (sub.status === 'trial') {
          isActive = sub.trial_ends_at && new Date(sub.trial_ends_at) > now;
          effectiveStatus = isActive ? 'trial' : 'expired';
        } else if (sub.status === 'active') {
          isActive = sub.current_period_end && new Date(sub.current_period_end) > now;
          effectiveStatus = isActive ? 'pro' : 'expired';
        } else if (sub.status === 'free') {
          isActive = true;
          effectiveStatus = 'free';
        } else {
          effectiveStatus = sub.status; // expired, cancelled, inactive
        }
      }

      // Calcola giorni rimanenti
      let daysRemaining = null;
      if (sub && effectiveStatus === 'trial' && sub.trial_ends_at) {
        daysRemaining = Math.ceil((new Date(sub.trial_ends_at) - now) / (1000 * 60 * 60 * 24));
      } else if (sub && effectiveStatus === 'pro' && sub.current_period_end) {
        daysRemaining = Math.ceil((new Date(sub.current_period_end) - now) / (1000 * 60 * 60 * 24));
      }

      return {
        service: {
          id: service.id,
          code: service.code,
          name: service.name,
          description: service.description,
          icon: service.icon,
          color: service.color,
          hasFree: service.has_free_tier,
          priceMonthly: parseFloat(service.price_pro_monthly || 0),
          priceYearly: parseFloat(service.price_pro_yearly || 0),
          trialDays: service.trial_days || 30
        },
        subscription: sub ? {
          id: sub.id,
          status: sub.status,
          planCode: sub.plan?.code,
          planName: sub.plan?.name,
          billingCycle: sub.billing_cycle,
          trialEndsAt: sub.trial_ends_at,
          currentPeriodStart: sub.current_period_start,
          currentPeriodEnd: sub.current_period_end,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          createdAt: sub.created_at
        } : null,
        effectiveStatus,
        isActive,
        daysRemaining
      };
    });
  }

  // Aggiorna stato servizio per un'attività (admin)
  async updateActivityServiceStatus(activityId, serviceCode, updates) {
    const { status, billingCycle, trialDays, periodEndDate, cancelAtPeriodEnd } = updates;

    // Trova servizio
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('services')
      .select('id, code, name, trial_days, has_free_tier')
      .eq('code', serviceCode)
      .single();

    if (serviceError || !service) {
      throw Errors.NotFound(`Servizio '${serviceCode}' non trovato`);
    }

    // Cerca subscription esistente
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id, status')
      .eq('activity_id', activityId)
      .eq('service_id', service.id)
      .single();

    const now = new Date();
    let updateData = {
      status: status === 'pro' ? 'active' : status, // 'pro' -> 'active' per compatibilità enum
      updated_at: now.toISOString()
    };

    // Calcola date in base allo status
    if (status === 'trial') {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + (trialDays || service.trial_days || 30));
      updateData.trial_ends_at = trialEndDate.toISOString();
      updateData.current_period_start = now.toISOString();
      updateData.current_period_end = trialEndDate.toISOString();
    } else if (status === 'pro' || status === 'active') {
      updateData.status = 'active';
      updateData.billing_cycle = billingCycle || 'yearly';
      updateData.current_period_start = now.toISOString();
      updateData.upgraded_at = now.toISOString();

      if (periodEndDate) {
        updateData.current_period_end = new Date(periodEndDate).toISOString();
      } else {
        const endDate = new Date();
        if (billingCycle === 'yearly') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }
        updateData.current_period_end = endDate.toISOString();
      }
      updateData.trial_ends_at = null;
    } else if (status === 'free') {
      if (!service.has_free_tier) {
        throw Errors.BadRequest(`Il servizio '${serviceCode}' non ha un piano gratuito`);
      }
      updateData.trial_ends_at = null;
      updateData.current_period_end = null;
    } else if (status === 'cancelled') {
      updateData.cancelled_at = now.toISOString();
      if (cancelAtPeriodEnd !== undefined) {
        updateData.cancel_at_period_end = cancelAtPeriodEnd;
      }
    } else if (status === 'inactive' || status === 'expired') {
      updateData.trial_ends_at = null;
    }

    let result;
    const previousStatus = existingSub?.status;

    if (existingSub) {
      // Aggiorna esistente
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .update(updateData)
        .eq('id', existingSub.id)
        .select(`
          *,
          service:services (id, code, name)
        `)
        .single();

      if (error) throw Errors.Internal('Errore nell\'aggiornamento: ' + error.message);
      result = data;
    } else {
      // Crea nuovo
      const { data: activity } = await supabaseAdmin
        .from('activities')
        .select('organization_id')
        .eq('id', activityId)
        .single();

      // Trova piano appropriato
      const planCode = status === 'free' ? 'free' : 'pro';
      const { data: plan } = await supabaseAdmin
        .from('plans')
        .select('id')
        .eq('service_id', service.id)
        .eq('code', planCode)
        .single();

      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          activity_id: activityId,
          service_id: service.id,
          plan_id: plan?.id,
          organization_id: activity?.organization_id,
          ...updateData
        })
        .select(`
          *,
          service:services (id, code, name)
        `)
        .single();

      if (error) throw Errors.Internal('Errore nella creazione: ' + error.message);
      result = data;
    }

    // Log azione admin
    await this.logCommunication({
      activityId,
      type: 'admin_action',
      event: `service_status_changed`,
      metadata: {
        serviceCode,
        serviceName: service.name,
        previousStatus,
        newStatus: status
      }
    });

    return {
      ...result,
      effectiveStatus: status
    };
  }

  // ==================== BILLING & DISCOUNTS ====================

  // Ottieni riepilogo fatturazione utente con sconti
  async getUserBillingSummary(userId) {
    // Ottieni tutte le attività dell'utente
    const { data: activityUsers } = await supabaseAdmin
      .from('activity_users')
      .select('activity_id')
      .eq('user_id', userId);

    const activityCount = activityUsers?.length || 0;
    const activityIds = activityUsers?.map(au => au.activity_id) || [];

    // Calcola sconto via funzione DB
    const { data: discountResult } = await supabaseAdmin
      .rpc('get_user_discount', { p_user_id: userId });

    const discountPercentage = discountResult || 0;

    // Ottieni abbonamenti attivi (PRO) per queste attività
    const { data: subscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        service:services (id, code, name, price_pro_monthly, price_pro_yearly),
        activity:activities (id, name)
      `)
      .in('activity_id', activityIds)
      .eq('status', 'active');

    // Calcola totali
    let monthlyTotal = 0;
    let yearlyTotal = 0;

    const formattedSubscriptions = (subscriptions || []).map(sub => {
      const price = sub.billing_cycle === 'yearly'
        ? parseFloat(sub.service?.price_pro_yearly || 0)
        : parseFloat(sub.service?.price_pro_monthly || 0);

      if (sub.billing_cycle === 'yearly') {
        yearlyTotal += price;
      } else {
        monthlyTotal += price;
      }

      return {
        id: sub.id,
        activityId: sub.activity?.id,
        activityName: sub.activity?.name,
        serviceCode: sub.service?.code,
        serviceName: sub.service?.name,
        billingCycle: sub.billing_cycle,
        price,
        currentPeriodEnd: sub.current_period_end
      };
    });

    // Converti yearly a monthly equivalent
    const totalMonthlyEquivalent = monthlyTotal + (yearlyTotal / 12);
    const discountAmount = totalMonthlyEquivalent * (discountPercentage / 100);
    const finalMonthly = totalMonthlyEquivalent - discountAmount;

    return {
      userId,
      activityCount,
      isAgency: activityCount >= 5,
      discountPercentage,
      subscriptions: formattedSubscriptions,
      totals: {
        monthlySubtotal: Math.round(monthlyTotal * 100) / 100,
        yearlySubtotal: Math.round(yearlyTotal * 100) / 100,
        monthlyEquivalent: Math.round(totalMonthlyEquivalent * 100) / 100,
        discountAmount: Math.round(discountAmount * 100) / 100,
        finalMonthly: Math.round(finalMonthly * 100) / 100,
        estimatedYearly: Math.round(finalMonthly * 12 * 100) / 100
      }
    };
  }

  // Ottieni lista sconti volume
  async getVolumeDiscounts() {
    const { data, error } = await supabaseAdmin
      .from('volume_discounts')
      .select('*')
      .order('min_activities');

    if (error) {
      throw Errors.Internal('Errore nel recupero degli sconti');
    }

    return data.map(d => ({
      id: d.id,
      minActivities: d.min_activities,
      maxActivities: d.max_activities,
      discountPercentage: parseFloat(d.discount_percentage),
      isActive: d.is_active,
      createdAt: d.created_at
    }));
  }

  // Aggiorna sconto volume
  async updateVolumeDiscount(discountId, updates) {
    const updateData = {};
    if (updates.minActivities !== undefined) updateData.min_activities = updates.minActivities;
    if (updates.maxActivities !== undefined) updateData.max_activities = updates.maxActivities;
    if (updates.discountPercentage !== undefined) updateData.discount_percentage = updates.discountPercentage;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabaseAdmin
      .from('volume_discounts')
      .update(updateData)
      .eq('id', discountId)
      .select()
      .single();

    if (error) {
      throw Errors.BadRequest('Errore nell\'aggiornamento dello sconto: ' + error.message);
    }

    return {
      id: data.id,
      minActivities: data.min_activities,
      maxActivities: data.max_activities,
      discountPercentage: parseFloat(data.discount_percentage),
      isActive: data.is_active
    };
  }

  // ==================== COMMUNICATION LOGS ====================

  // Log una comunicazione
  async logCommunication({ activityId, userId, type, event, recipient, subject, content, metadata, status = 'completed' }) {
    const { data, error } = await supabaseAdmin
      .from('communication_logs')
      .insert({
        activity_id: activityId || null,
        user_id: userId || null,
        type,
        event,
        recipient: recipient || null,
        subject: subject || null,
        content: content || null,
        metadata: metadata || {},
        status,
        sent_at: status === 'sent' || status === 'completed' ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging communication:', error);
    }
    return data;
  }

  // Ottieni log comunicazioni con filtri
  async getCommunicationLogs({ activityId, userId, type, event, limit = 50, offset = 0 }) {
    let query = supabaseAdmin
      .from('communication_logs')
      .select(`
        *,
        activity:activities (id, name),
        user:auth.users (id, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (activityId) query = query.eq('activity_id', activityId);
    if (userId) query = query.eq('user_id', userId);
    if (type) query = query.eq('type', type);
    if (event) query = query.eq('event', event);

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw Errors.Internal('Errore nel recupero dei log');
    }

    return {
      logs: data.map(log => ({
        id: log.id,
        activityId: log.activity_id,
        activityName: log.activity?.name,
        userId: log.user_id,
        type: log.type,
        event: log.event,
        recipient: log.recipient,
        subject: log.subject,
        status: log.status,
        metadata: log.metadata,
        createdAt: log.created_at,
        sentAt: log.sent_at
      })),
      pagination: {
        total: count,
        limit,
        offset
      }
    };
  }

  // ==================== WEBHOOKS QUEUE ====================

  // Aggiungi webhook alla coda
  async queueWebhook({ eventType, activityId, userId, serviceCode, payload, targetUrl }) {
    const { data, error } = await supabaseAdmin
      .from('webhooks_queue')
      .insert({
        event_type: eventType,
        activity_id: activityId || null,
        user_id: userId || null,
        service_code: serviceCode || null,
        payload,
        target_url: targetUrl || null,
        status: 'pending',
        scheduled_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error queuing webhook:', error);
    }
    return data;
  }

  // Ottieni webhook in coda (pending)
  async getPendingWebhooks(limit = 50) {
    const { data, error } = await supabaseAdmin
      .from('webhooks_queue')
      .select('*')
      .eq('status', 'pending')
      .order('scheduled_at')
      .limit(limit);

    if (error) {
      throw Errors.Internal('Errore nel recupero dei webhook');
    }

    return data.map(w => ({
      id: w.id,
      eventType: w.event_type,
      activityId: w.activity_id,
      userId: w.user_id,
      serviceCode: w.service_code,
      payload: w.payload,
      targetUrl: w.target_url,
      retryCount: w.retry_count,
      status: w.status,
      scheduledAt: w.scheduled_at,
      createdAt: w.created_at
    }));
  }

  // Marca webhook come completato
  async markWebhookComplete(webhookId) {
    const { error } = await supabaseAdmin
      .from('webhooks_queue')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', webhookId);

    if (error) {
      throw Errors.BadRequest('Errore nel completamento del webhook');
    }

    return { success: true };
  }

  // Marca webhook come fallito
  async markWebhookFailed(webhookId, errorMessage) {
    const { data: webhook } = await supabaseAdmin
      .from('webhooks_queue')
      .select('retry_count, max_retries')
      .eq('id', webhookId)
      .single();

    const newRetryCount = (webhook?.retry_count || 0) + 1;
    const isFinalFailure = newRetryCount >= (webhook?.max_retries || 3);

    const { error } = await supabaseAdmin
      .from('webhooks_queue')
      .update({
        status: isFinalFailure ? 'failed' : 'pending',
        retry_count: newRetryCount,
        error_message: errorMessage,
        processed_at: isFinalFailure ? new Date().toISOString() : null
      })
      .eq('id', webhookId);

    if (error) {
      throw Errors.BadRequest('Errore nell\'aggiornamento del webhook');
    }

    return { success: true, isFinalFailure };
  }

  // Retry webhook
  async retryWebhook(webhookId) {
    const { error } = await supabaseAdmin
      .from('webhooks_queue')
      .update({
        status: 'pending',
        scheduled_at: new Date().toISOString(),
        error_message: null
      })
      .eq('id', webhookId);

    if (error) {
      throw Errors.BadRequest('Errore nel retry del webhook');
    }

    return { success: true };
  }

  // ==================== USER DETAILS WITH ACTIVITIES ====================

  // Ottieni dettagli completi utente con tutte le attività e servizi
  async getUserWithActivitiesAndServices(userId) {
    // Ottieni user base
    const user = await this.getUserById(userId);

    // Ottieni attività dell'utente
    const { data: activityUsers } = await supabaseAdmin
      .from('activity_users')
      .select(`
        role,
        activity:activities (*)
      `)
      .eq('user_id', userId);

    // Per ogni attività, ottieni i servizi con stato
    const activitiesWithServices = await Promise.all(
      (activityUsers || []).map(async (au) => {
        const services = await this.getActivityServicesWithStatus(au.activity.id);
        return {
          id: au.activity.id,
          name: au.activity.name,
          slug: au.activity.slug,
          email: au.activity.email,
          phone: au.activity.phone,
          status: au.activity.status,
          role: au.role,
          createdAt: au.activity.created_at,
          services
        };
      })
    );

    // Ottieni billing summary
    const billing = await this.getUserBillingSummary(userId);

    return {
      ...user,
      activities: activitiesWithServices,
      billing
    };
  }
}

export default new AdminService();
