import { supabaseAdmin } from '../config/supabase.js';
import { Errors } from '../middleware/errorHandler.js';

class OrganizationService {
  // Genera slug unico dal nome
  async generateUniqueSlug(name) {
    let baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const { data } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!data) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  // Crea nuova organizzazione
  async create({ name, email, phone, vatNumber, userId }) {
    const slug = await this.generateUniqueSlug(name);

    // Inserisci l'organizzazione
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name,
        slug,
        email,
        phone,
        vat_number: vatNumber,
        status: 'active'
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      throw Errors.Internal('Errore nella creazione dell\'organizzazione');
    }

    // Aggiungi l'utente come owner
    const { error: userError } = await supabaseAdmin
      .from('organization_users')
      .insert({
        organization_id: organization.id,
        user_id: userId,
        role: 'owner'
      });

    if (userError) {
      // Rollback: elimina l'organizzazione se non è possibile aggiungere l'utente
      await supabaseAdmin
        .from('organizations')
        .delete()
        .eq('id', organization.id);

      console.error('Error adding user to organization:', userError);
      throw Errors.Internal('Errore nell\'aggiunta dell\'utente all\'organizzazione');
    }

    return this.formatOrganization(organization);
  }

  // Ottieni organizzazione per ID
  async getById(organizationId, userId) {
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .select(`
        *,
        organization_users!inner (
          role,
          user_id
        )
      `)
      .eq('id', organizationId)
      .eq('organization_users.user_id', userId)
      .single();

    if (error || !data) {
      throw Errors.NotFound('Organizzazione non trovata');
    }

    return {
      ...this.formatOrganization(data),
      userRole: data.organization_users[0].role
    };
  }

  // Lista organizzazioni dell'utente
  async listByUser(userId) {
    const { data, error } = await supabaseAdmin
      .from('organization_users')
      .select(`
        role,
        organization:organizations (*)
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching organizations:', error);
      throw Errors.Internal('Errore nel recupero delle organizzazioni');
    }

    return data
      .filter(item => item.organization)
      .map(item => ({
        ...this.formatOrganization(item.organization),
        userRole: item.role
      }));
  }

  // Aggiorna organizzazione
  async update(organizationId, updates) {
    const allowedUpdates = ['name', 'email', 'phone', 'vat_number', 'logo_url'];
    const sanitizedUpdates = {};

    for (const key of allowedUpdates) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      if (updates[camelKey] !== undefined) {
        sanitizedUpdates[key] = updates[camelKey];
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      throw Errors.BadRequest('Nessun campo da aggiornare');
    }

    const { data, error } = await supabaseAdmin
      .from('organizations')
      .update(sanitizedUpdates)
      .eq('id', organizationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating organization:', error);
      throw Errors.Internal('Errore nell\'aggiornamento dell\'organizzazione');
    }

    return this.formatOrganization(data);
  }

  // Elimina organizzazione (soft delete - cambia status)
  async delete(organizationId) {
    const { error } = await supabaseAdmin
      .from('organizations')
      .update({ status: 'cancelled' })
      .eq('id', organizationId);

    if (error) {
      console.error('Error deleting organization:', error);
      throw Errors.Internal('Errore nell\'eliminazione dell\'organizzazione');
    }

    return { success: true };
  }

  // Ottieni membri dell'organizzazione
  async getMembers(organizationId) {
    const { data, error } = await supabaseAdmin
      .from('organization_users')
      .select(`
        id,
        role,
        created_at,
        user_id
      `)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error fetching members:', error);
      throw Errors.Internal('Errore nel recupero dei membri');
    }

    // Ottieni i dettagli degli utenti
    const userIds = data.map(m => m.user_id);
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      console.error('Error fetching user details:', usersError);
    }

    const usersMap = new Map(users?.map(u => [u.id, u]) || []);

    return data.map(member => {
      const user = usersMap.get(member.user_id);
      return {
        id: member.id,
        userId: member.user_id,
        role: member.role,
        email: user?.email,
        fullName: user?.user_metadata?.full_name,
        createdAt: member.created_at
      };
    });
  }

  // Aggiungi membro all'organizzazione
  async addMember(organizationId, { email, role }) {
    // Trova l'utente per email
    const { data: { users }, error: searchError } = await supabaseAdmin.auth.admin.listUsers();

    if (searchError) {
      throw Errors.Internal('Errore nella ricerca dell\'utente');
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      throw Errors.NotFound('Utente non trovato');
    }

    // Verifica se è già membro
    const { data: existing } = await supabaseAdmin
      .from('organization_users')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      throw Errors.Conflict('L\'utente è già membro dell\'organizzazione');
    }

    // Aggiungi il membro
    const { data, error } = await supabaseAdmin
      .from('organization_users')
      .insert({
        organization_id: organizationId,
        user_id: user.id,
        role: role || 'user'
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding member:', error);
      throw Errors.Internal('Errore nell\'aggiunta del membro');
    }

    return {
      id: data.id,
      userId: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name,
      role: data.role
    };
  }

  // Rimuovi membro dall'organizzazione
  async removeMember(organizationId, memberId) {
    // Non permettere la rimozione dell'ultimo owner
    const { data: owners } = await supabaseAdmin
      .from('organization_users')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('role', 'owner');

    const { data: memberToRemove } = await supabaseAdmin
      .from('organization_users')
      .select('role')
      .eq('id', memberId)
      .single();

    if (memberToRemove?.role === 'owner' && owners?.length === 1) {
      throw Errors.BadRequest('Impossibile rimuovere l\'ultimo proprietario');
    }

    const { error } = await supabaseAdmin
      .from('organization_users')
      .delete()
      .eq('id', memberId)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error removing member:', error);
      throw Errors.Internal('Errore nella rimozione del membro');
    }

    return { success: true };
  }

  // Formatta l'organizzazione per la risposta
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
      createdAt: org.created_at,
      updatedAt: org.updated_at
    };
  }
}

export default new OrganizationService();
