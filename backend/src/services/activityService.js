import { supabaseAdmin } from '../config/supabase.js';
import { Errors } from '../middleware/errorHandler.js';
import { generateSlug, ensureUniqueSlug } from '../utils/slug.js';

class ActivityService {
  /**
   * Crea una nuova attività
   * @param {string} userId - ID utente che crea l'attività
   * @param {object} data - Dati attività
   * @param {string} data.organizationId - (opzionale) ID organizzazione/agenzia
   */
  async createActivity(userId, data) {
    const { name, email, phone, vatNumber, address, city, organizationId } = data;

    if (!name || !name.trim()) {
      throw Errors.BadRequest('Il nome dell\'attività è obbligatorio');
    }

    // Verifica limiti utente
    const userLimits = await this.getUserActivityLimits(userId);

    // Se organizationId fornito, verifica che l'utente abbia accesso e che l'org possa aggiungere attività
    if (organizationId) {
      const orgAccess = await this.checkOrganizationAccess(organizationId, userId);
      if (!orgAccess.hasAccess) {
        throw Errors.Forbidden('Non hai accesso a questa organizzazione');
      }
      if (!['owner', 'admin'].includes(orgAccess.role)) {
        throw Errors.Forbidden('Solo owner e admin possono creare attività per l\'agenzia');
      }

      // Verifica limite attività dell'organizzazione
      const canAdd = await this.organizationCanAddActivity(organizationId);
      if (!canAdd) {
        throw Errors.BadRequest('Raggiunto il limite massimo di attività per questa agenzia');
      }
    } else {
      // Creazione attività standalone - verifica limiti utente
      if (!userLimits.canCreate) {
        throw Errors.BadRequest(userLimits.limitMessage || 'Non puoi creare altre attività');
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

    // Crea l'attività
    const { data: activity, error: activityError } = await supabaseAdmin
      .from('activities')
      .insert({
        name: name.trim(),
        slug,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        vat_number: vatNumber?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        organization_id: organizationId || null,
        status: 'active'
      })
      .select()
      .single();

    if (activityError) {
      console.error('Error creating activity:', activityError);
      if (activityError.code === '42P01') {
        throw Errors.Internal('Tabella activities non trovata. Eseguire la migration del database.');
      }
      throw Errors.Internal(`Errore nella creazione dell'attività: ${activityError.message}`);
    }

    // Aggiungi l'utente come owner (solo se non è un'attività di agenzia dove eredita i permessi)
    const { error: memberError } = await supabaseAdmin
      .from('activity_users')
      .insert({
        activity_id: activity.id,
        user_id: userId,
        role: 'owner'
      });

    if (memberError) {
      console.error('Error adding owner:', memberError);
      // Rollback: elimina l'attività creata
      await supabaseAdmin.from('activities').delete().eq('id', activity.id);
      throw Errors.Internal('Errore nell\'assegnazione del proprietario');
    }

    return this.formatActivity(activity, 'owner');
  }

  /**
   * Ottieni limiti creazione attività per un utente
   * Considera: organizzazioni dell'utente, tipo account, attività esistenti
   */
  async getUserActivityLimits(userId) {
    // Ottieni organizzazioni dell'utente
    const { data: orgUsers } = await supabaseAdmin
      .from('organization_users')
      .select(`
        role,
        organization:organizations (
          id,
          name,
          account_type,
          max_activities,
          status
        )
      `)
      .eq('user_id', userId);

    // Conta attività dirette dell'utente (non via org)
    const { count: directActivitiesCount } = await supabaseAdmin
      .from('activity_users')
      .select('activity_id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('role', 'owner');

    // Se l'utente ha un'organizzazione agency attiva
    const agencies = (orgUsers || [])
      .filter(ou => ou.organization?.account_type === 'agency' && ou.organization?.status === 'active')
      .map(ou => ({
        id: ou.organization.id,
        name: ou.organization.name,
        maxActivities: ou.organization.max_activities,
        role: ou.role,
        canManage: ['owner', 'admin'].includes(ou.role)
      }));

    if (agencies.length > 0) {
      // L'utente appartiene a un'agenzia - può creare solo tramite l'agenzia
      const manageableAgencies = agencies.filter(a => a.canManage);

      if (manageableAgencies.length > 0) {
        // Conta attività per ogni agenzia
        for (const agency of manageableAgencies) {
          const { count } = await supabaseAdmin
            .from('activities')
            .select('id', { count: 'exact' })
            .eq('organization_id', agency.id)
            .eq('status', 'active');

          agency.currentActivities = count || 0;
          agency.canAddMore = agency.maxActivities === -1 || agency.currentActivities < agency.maxActivities;
        }

        return {
          accountType: 'agency',
          agencies: manageableAgencies,
          canCreate: false, // Non può creare standalone, deve passare per l'agenzia
          canCreateViaAgency: manageableAgencies.some(a => a.canAddMore),
          limitMessage: 'Come membro di un\'agenzia, crea le attività dalla gestione agenzia'
        };
      } else {
        // Membro semplice di agenzia
        return {
          accountType: 'agency_member',
          agencies,
          canCreate: false,
          canCreateViaAgency: false,
          limitMessage: 'Non hai i permessi per creare nuove attività'
        };
      }
    }

    // Utente singolo (non in agenzia)
    // Verifica se ha organizzazione single
    const singleOrgs = (orgUsers || [])
      .filter(ou => ou.organization?.account_type === 'single' && ou.organization?.status === 'active');

    if (singleOrgs.length > 0) {
      // Utente con account single - limite 1 attività
      const maxActivities = 1;
      const currentActivities = directActivitiesCount || 0;

      return {
        accountType: 'single',
        maxActivities,
        currentActivities,
        canCreate: currentActivities < maxActivities,
        limitMessage: currentActivities >= maxActivities
          ? 'Hai raggiunto il limite di 1 attività per account singolo. Passa a un piano Agency per gestire più attività.'
          : null
      };
    }

    // Utente senza organizzazione - può creare la prima attività
    const currentActivities = directActivitiesCount || 0;
    const maxActivities = 1; // Default: 1 attività per utente senza org

    return {
      accountType: 'none',
      maxActivities,
      currentActivities,
      canCreate: currentActivities < maxActivities,
      limitMessage: currentActivities >= maxActivities
        ? 'Hai raggiunto il limite di attività. Contatta il supporto per aggiungerne altre.'
        : null
    };
  }

  /**
   * Verifica accesso utente a un'organizzazione
   */
  async checkOrganizationAccess(organizationId, userId) {
    const { data, error } = await supabaseAdmin
      .from('organization_users')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return { hasAccess: false, role: null };
    }

    return { hasAccess: true, role: data.role };
  }

  /**
   * Verifica se un'organizzazione può aggiungere altre attività
   */
  async organizationCanAddActivity(organizationId) {
    // Ottieni info organizzazione
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('max_activities, account_type')
      .eq('id', organizationId)
      .single();

    if (!org) return false;

    // Single account: max 1 attività (ma non tramite org)
    if (org.account_type === 'single') {
      return false; // Le attività singole non passano per org
    }

    // -1 = illimitato
    if (org.max_activities === -1) return true;

    // Conta attività esistenti
    const { count } = await supabaseAdmin
      .from('activities')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    return (count || 0) < org.max_activities;
  }

  /**
   * Ottieni attività di un'organizzazione (agenzia)
   */
  async getOrganizationActivities(organizationId) {
    const { data, error } = await supabaseAdmin
      .from('activities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching org activities:', error);
      throw Errors.Internal('Errore nel recupero delle attività dell\'agenzia');
    }

    return data.map(activity => this.formatActivity(activity));
  }

  /**
   * Ottieni le attività di un utente
   */
  async getUserActivities(userId) {
    const { data, error } = await supabaseAdmin
      .from('activity_users')
      .select(`
        role,
        activity:activities (
          id,
          name,
          slug,
          email,
          phone,
          vat_number,
          address,
          city,
          logo_url,
          status,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user activities:', error);
      throw Errors.Internal('Errore nel recupero delle attività');
    }

    return data
      .filter(item => item.activity && item.activity.status === 'active')
      .map(item => this.formatActivity(item.activity, item.role));
  }

  /**
   * Ottieni attività per ID
   */
  async getActivityById(activityId) {
    const { data: activity, error } = await supabaseAdmin
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching activity:', error);
      throw Errors.Internal('Errore nel recupero dell\'attività');
    }

    return activity;
  }

  /**
   * Ottieni attività per slug
   */
  async getActivityBySlug(slug) {
    const { data: activity, error } = await supabaseAdmin
      .from('activities')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching activity by slug:', error);
      throw Errors.Internal('Errore nel recupero dell\'attività');
    }

    return activity;
  }

  /**
   * Aggiorna un'attività
   */
  async updateActivity(activityId, userId, data) {
    // Verifica permessi
    const role = await this.getUserRoleInActivity(activityId, userId);
    if (!role || !['owner', 'admin'].includes(role)) {
      throw Errors.Forbidden('Non hai i permessi per modificare questa attività');
    }

    const updates = {};
    const allowedFields = ['name', 'email', 'phone', 'vatNumber', 'address', 'city', 'logoUrl'];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        // Converti camelCase a snake_case per il DB
        const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
        updates[dbField] = data[field]?.trim() || null;
      }
    }

    // Se cambia il nome, aggiorna anche lo slug
    if (data.name) {
      const baseSlug = generateSlug(data.name);
      updates.slug = await ensureUniqueSlug(baseSlug, async (s) => {
        const { data: existing } = await supabaseAdmin
          .from('activities')
          .select('id')
          .eq('slug', s)
          .neq('id', activityId)
          .single();
        return !!existing;
      });
    }

    if (Object.keys(updates).length === 0) {
      throw Errors.BadRequest('Nessun campo da aggiornare');
    }

    const { data: activity, error } = await supabaseAdmin
      .from('activities')
      .update(updates)
      .eq('id', activityId)
      .select()
      .single();

    if (error) {
      console.error('Error updating activity:', error);
      throw Errors.Internal('Errore nell\'aggiornamento dell\'attività');
    }

    return this.formatActivity(activity, role);
  }

  /**
   * Elimina (disattiva) un'attività
   */
  async deleteActivity(activityId, userId) {
    // Solo owner può eliminare
    const role = await this.getUserRoleInActivity(activityId, userId);
    if (role !== 'owner') {
      throw Errors.Forbidden('Solo il proprietario può eliminare l\'attività');
    }

    const { error } = await supabaseAdmin
      .from('activities')
      .update({ status: 'cancelled' })
      .eq('id', activityId);

    if (error) {
      console.error('Error deleting activity:', error);
      throw Errors.Internal('Errore nell\'eliminazione dell\'attività');
    }

    return { success: true };
  }

  /**
   * Ottieni ruolo utente in un'attività (considera anche ereditarietà da org)
   * @param {string} activityId
   * @param {string} userId
   * @param {boolean} includeOrgRole - Se true, considera anche ruolo nell'organizzazione
   * @returns {object} { role, inherited, organizationId }
   */
  async getUserRoleInActivity(activityId, userId, includeOrgRole = true) {
    // 1. Verifica ruolo diretto in activity_users
    const { data: directRole, error } = await supabaseAdmin
      .from('activity_users')
      .select('role')
      .eq('activity_id', activityId)
      .eq('user_id', userId)
      .single();

    if (!error && directRole) {
      return directRole.role;
    }

    // 2. Se includeOrgRole, verifica ruolo tramite organizzazione
    if (includeOrgRole) {
      const orgRole = await this.getUserRoleViaOrganization(activityId, userId);
      if (orgRole) {
        return orgRole;
      }
    }

    return null;
  }

  /**
   * Ottieni ruolo utente tramite organizzazione (ereditarietà)
   */
  async getUserRoleViaOrganization(activityId, userId) {
    // Ottieni organization_id dell'attività
    const { data: activity } = await supabaseAdmin
      .from('activities')
      .select('organization_id')
      .eq('id', activityId)
      .single();

    if (!activity?.organization_id) {
      return null;
    }

    // Verifica ruolo nell'organizzazione
    const { data: orgUser } = await supabaseAdmin
      .from('organization_users')
      .select('role')
      .eq('organization_id', activity.organization_id)
      .eq('user_id', userId)
      .single();

    if (!orgUser) {
      return null;
    }

    // Mappa ruolo org a ruolo attività (stessi livelli)
    return orgUser.role;
  }

  /**
   * Ottieni info complete sul ruolo utente in attività
   */
  async getUserActivityRoleInfo(activityId, userId) {
    // Ruolo diretto
    const { data: directRole } = await supabaseAdmin
      .from('activity_users')
      .select('role')
      .eq('activity_id', activityId)
      .eq('user_id', userId)
      .single();

    if (directRole) {
      return {
        role: directRole.role,
        inherited: false,
        source: 'direct'
      };
    }

    // Ruolo via organizzazione
    const { data: activity } = await supabaseAdmin
      .from('activities')
      .select('organization_id')
      .eq('id', activityId)
      .single();

    if (activity?.organization_id) {
      const { data: orgUser } = await supabaseAdmin
        .from('organization_users')
        .select('role')
        .eq('organization_id', activity.organization_id)
        .eq('user_id', userId)
        .single();

      if (orgUser) {
        return {
          role: orgUser.role,
          inherited: true,
          source: 'organization',
          organizationId: activity.organization_id
        };
      }
    }

    return null;
  }

  /**
   * Verifica se utente ha accesso all'attività (diretto o via org)
   */
  async checkActivityAccess(activityId, userId) {
    const role = await this.getUserRoleInActivity(activityId, userId, true);
    return role !== null;
  }

  /**
   * Ottieni membri di un'attività
   */
  async getActivityMembers(activityId) {
    const { data, error } = await supabaseAdmin
      .from('activity_users')
      .select(`
        id,
        role,
        created_at,
        user_id
      `)
      .eq('activity_id', activityId);

    if (error) {
      console.error('Error fetching members:', error);
      throw Errors.Internal('Errore nel recupero dei membri');
    }

    // Ottieni info utenti
    const userIds = data.map(m => m.user_id);
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();

    const userMap = new Map();
    users?.users?.forEach(u => {
      userMap.set(u.id, {
        id: u.id,
        email: u.email,
        fullName: u.user_metadata?.full_name
      });
    });

    return data.map(member => ({
      id: member.id,
      role: member.role,
      createdAt: member.created_at,
      user: userMap.get(member.user_id) || { id: member.user_id, email: 'Unknown' }
    }));
  }

  /**
   * Aggiungi membro all'attività
   */
  async addMember(activityId, userEmail, role, requestingUserId) {
    // Verifica permessi
    const requestingRole = await this.getUserRoleInActivity(activityId, requestingUserId);
    if (!requestingRole || !['owner', 'admin'].includes(requestingRole)) {
      throw Errors.Forbidden('Non hai i permessi per aggiungere membri');
    }

    // Non si può aggiungere un owner se non sei owner
    if (role === 'owner' && requestingRole !== 'owner') {
      throw Errors.Forbidden('Solo il proprietario può aggiungere altri proprietari');
    }

    // Trova l'utente per email
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.users?.find(u => u.email === userEmail);

    if (!user) {
      throw Errors.NotFound('Utente non trovato');
    }

    // Verifica se già membro
    const existingRole = await this.getUserRoleInActivity(activityId, user.id);
    if (existingRole) {
      throw Errors.Conflict('L\'utente è già membro di questa attività');
    }

    // Aggiungi membro
    const { error } = await supabaseAdmin
      .from('activity_users')
      .insert({
        activity_id: activityId,
        user_id: user.id,
        role
      });

    if (error) {
      console.error('Error adding member:', error);
      throw Errors.Internal('Errore nell\'aggiunta del membro');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name,
      role
    };
  }

  /**
   * Rimuovi membro dall'attività
   */
  async removeMember(activityId, memberId, requestingUserId) {
    // Verifica permessi
    const requestingRole = await this.getUserRoleInActivity(activityId, requestingUserId);
    if (!requestingRole || !['owner', 'admin'].includes(requestingRole)) {
      throw Errors.Forbidden('Non hai i permessi per rimuovere membri');
    }

    // Trova il membro
    const { data: member } = await supabaseAdmin
      .from('activity_users')
      .select('user_id, role')
      .eq('id', memberId)
      .eq('activity_id', activityId)
      .single();

    if (!member) {
      throw Errors.NotFound('Membro non trovato');
    }

    // Non si può rimuovere un owner
    if (member.role === 'owner') {
      throw Errors.Forbidden('Non è possibile rimuovere il proprietario');
    }

    // Non si può rimuovere se stessi
    if (member.user_id === requestingUserId) {
      throw Errors.BadRequest('Non puoi rimuovere te stesso');
    }

    const { error } = await supabaseAdmin
      .from('activity_users')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('Error removing member:', error);
      throw Errors.Internal('Errore nella rimozione del membro');
    }

    return { success: true };
  }

  /**
   * Formatta attività per risposta API
   */
  formatActivity(activity, role = null) {
    return {
      id: activity.id,
      name: activity.name,
      slug: activity.slug,
      email: activity.email,
      phone: activity.phone,
      vatNumber: activity.vat_number,
      address: activity.address,
      city: activity.city,
      logoUrl: activity.logo_url,
      status: activity.status,
      organizationId: activity.organization_id || null,
      createdAt: activity.created_at,
      updatedAt: activity.updated_at,
      ...(role && { role })
    };
  }
}

export default new ActivityService();
