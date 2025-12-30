import { supabase, supabaseAdmin } from '../config/supabase.js';
import jwt from 'jsonwebtoken';
import { Errors } from '../middleware/errorHandler.js';
import { isSuperAdmin } from '../middleware/adminAuth.js';

class AuthService {
  // Registrazione nuovo utente
  async register({ email, password, fullName }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        throw Errors.Conflict('Email già registrata');
      }
      throw Errors.BadRequest(error.message);
    }

    return {
      user: data.user,
      session: data.session
    };
  }

  // Login utente
  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw Errors.Unauthorized('Credenziali non valide');
      }
      throw Errors.BadRequest(error.message);
    }

    // Ottieni le organizzazioni dell'utente
    const organizations = await this.getUserOrganizations(data.user.id);

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name,
        createdAt: data.user.created_at,
        isSuperAdmin: isSuperAdmin(data.user.email)
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at
      },
      organizations
    };
  }

  // Logout utente
  async logout(token) {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
    }

    return { success: true };
  }

  // Ottieni utente corrente
  async getCurrentUser(userId) {
    const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (error || !user) {
      throw Errors.NotFound('Utente non trovato');
    }

    const organizations = await this.getUserOrganizations(userId);

    return {
      id: user.user.id,
      email: user.user.email,
      fullName: user.user.user_metadata?.full_name,
      createdAt: user.user.created_at,
      isSuperAdmin: isSuperAdmin(user.user.email),
      organizations
    };
  }

  // Refresh token
  async refreshToken(refreshToken) {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      throw Errors.Unauthorized('Impossibile aggiornare la sessione');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at
    };
  }

  // Recupero password
  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });

    if (error) {
      throw Errors.BadRequest(error.message);
    }

    return { success: true };
  }

  // Aggiorna password
  async updatePassword(token, newPassword) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw Errors.BadRequest(error.message);
    }

    return { success: true };
  }

  // Ottieni organizzazioni dell'utente
  async getUserOrganizations(userId) {
    const { data, error } = await supabaseAdmin
      .from('organization_users')
      .select(`
        role,
        organization:organizations (
          id,
          name,
          slug,
          logo_url,
          status
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user organizations:', error);
      return [];
    }

    return data
      .filter(item => item.organization && item.organization.status === 'active')
      .map(item => ({
        id: item.organization.id,
        name: item.organization.name,
        slug: item.organization.slug,
        logoUrl: item.organization.logo_url,
        role: item.role
      }));
  }

  // Genera token per app esterne
  generateExternalToken({ userId, organizationId, activityId, service, role }) {
    const payload = {
      userId,
      organizationId,
      service,
      role,
      type: 'external_access'
    };

    // Aggiungi activityId se presente (nuovo modello basato su attività)
    if (activityId) {
      payload.activityId = activityId;
    }

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXTERNAL_EXPIRES_IN || '5m'
    });
  }

  // Verifica token per app esterne
  verifyExternalToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.type !== 'external_access' && decoded.type !== 'sidebar_access') {
        throw Errors.Unauthorized('Tipo di token non valido');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw Errors.Unauthorized('Token scaduto');
      }
      throw Errors.Unauthorized('Token non valido');
    }
  }

  // Genera token per la sidebar DOID Suite (lunga durata, solo lettura)
  generateSidebarToken({ userId, organizationId, activityId, service, role }) {
    const payload = {
      userId,
      organizationId,
      service,
      role,
      type: 'sidebar_access'
    };

    if (activityId) {
      payload.activityId = activityId;
    }

    // Token della sidebar valido per 24 ore
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_SIDEBAR_EXPIRES_IN || '24h'
    });
  }

  // Verifica token della sidebar
  verifySidebarToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.type !== 'sidebar_access') {
        throw Errors.Unauthorized('Tipo di token non valido per sidebar');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw Errors.Unauthorized('Token sidebar scaduto');
      }
      throw Errors.Unauthorized('Token sidebar non valido');
    }
  }

  // Conferma email utente (solo per sviluppo/admin)
  async confirmUserEmail(userId) {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true
    });

    if (error) {
      throw Errors.BadRequest(error.message);
    }

    return { success: true, user: data.user };
  }

  // Ottieni utente per email
  async getUserByEmail(email) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      throw Errors.Internal('Errore nel recupero utenti');
    }

    const user = data.users.find(u => u.email === email);
    if (!user) {
      throw Errors.NotFound('Utente non trovato');
    }

    return user;
  }
}

export default new AuthService();
