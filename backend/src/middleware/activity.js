import activityService from '../services/activityService.js';
import { Errors } from './errorHandler.js';

/**
 * Middleware: Carica attività da req.params.activityId
 * Attacca a req.activity
 * 404 se non trovata
 */
export const loadActivity = async (req, res, next) => {
  try {
    const { activityId } = req.params;

    if (!activityId) {
      throw Errors.BadRequest('Activity ID mancante');
    }

    const activity = await activityService.getActivityById(activityId);

    if (!activity) {
      throw Errors.NotFound('Attività non trovata');
    }

    if (activity.status === 'cancelled') {
      throw Errors.NotFound('Attività non più attiva');
    }

    req.activity = activity;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Verifica che req.user abbia accesso a req.activity
 * Considera sia accesso diretto che ereditato dall'organizzazione
 * 403 se non autorizzato
 * Deve essere usato dopo loadActivity e authenticate
 *
 * Attacca a req:
 * - activityRole: ruolo utente ('owner', 'admin', 'manager', 'user', 'super_admin')
 * - activityRoleInfo: { role, inherited, source, organizationId? }
 */
export const requireActivityAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      throw Errors.Unauthorized('Autenticazione richiesta');
    }

    if (!req.activity) {
      throw Errors.Internal('Activity non caricata - usare loadActivity prima');
    }

    // Super admin ha sempre accesso
    if (req.user.isSuperAdmin) {
      req.activityRole = 'super_admin';
      req.activityRoleInfo = { role: 'super_admin', inherited: false, source: 'super_admin' };
      next();
      return;
    }

    // Ottieni info complete sul ruolo (include ereditarietà da org)
    const roleInfo = await activityService.getUserActivityRoleInfo(
      req.activity.id,
      req.user.id
    );

    if (!roleInfo) {
      throw Errors.Forbidden('Non hai accesso a questa attività');
    }

    req.activityRole = roleInfo.role;
    req.activityRoleInfo = roleInfo;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware factory: Verifica ruolo utente nell'attività
 * Considera sia ruoli diretti che ereditati dall'organizzazione
 * @param {string[]} roles - Array di ruoli permessi (es: ['owner', 'admin'])
 * @returns {Function} Middleware
 */
export const requireActivityRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw Errors.Unauthorized('Autenticazione richiesta');
      }

      if (!req.activity) {
        throw Errors.Internal('Activity non caricata - usare loadActivity prima');
      }

      // Super admin ha sempre accesso
      if (req.user.isSuperAdmin) {
        req.activityRole = 'super_admin';
        req.activityRoleInfo = { role: 'super_admin', inherited: false, source: 'super_admin' };
        next();
        return;
      }

      // Ottieni info complete sul ruolo
      const roleInfo = await activityService.getUserActivityRoleInfo(
        req.activity.id,
        req.user.id
      );

      if (!roleInfo) {
        throw Errors.Forbidden('Non hai accesso a questa attività');
      }

      if (!roles.includes(roleInfo.role)) {
        const sourceInfo = roleInfo.inherited ? ' (ereditato da organizzazione)' : '';
        throw Errors.Forbidden(
          `Ruolo ${roleInfo.role}${sourceInfo} non autorizzato. Richiesto: ${roles.join(' o ')}`
        );
      }

      req.activityRole = roleInfo.role;
      req.activityRoleInfo = roleInfo;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default {
  loadActivity,
  requireActivityAccess,
  requireActivityRole
};
