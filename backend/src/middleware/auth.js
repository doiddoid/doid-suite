import jwt from 'jsonwebtoken';
import { createUserClient, supabaseAdmin } from '../config/supabase.js';
import { hasMinRole } from '../config/services.js';
import { isSuperAdmin } from './adminAuth.js';

// Middleware per verificare l'autenticazione
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token di autenticazione mancante'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verifica il token con Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Token non valido o scaduto'
      });
    }

    // Crea un client Supabase con il token dell'utente
    req.supabase = createUserClient(token);
    req.user = user;
    req.token = token;

    // Aggiungi flag super admin
    req.user.isSuperAdmin = isSuperAdmin(user.email);

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: 'Errore di autenticazione'
    });
  }
};

// Middleware per verificare l'accesso a un'organizzazione
export const requireOrganization = (minRole = 'user') => {
  return async (req, res, next) => {
    try {
      const organizationId = req.params.organizationId || req.body.organizationId || req.query.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: 'ID organizzazione richiesto'
        });
      }

      // Verifica l'accesso dell'utente all'organizzazione
      const { data: orgUser, error } = await supabaseAdmin
        .from('organization_users')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', req.user.id)
        .single();

      if (error || !orgUser) {
        return res.status(403).json({
          success: false,
          error: 'Accesso all\'organizzazione negato'
        });
      }

      // Verifica il ruolo minimo richiesto
      if (!hasMinRole(orgUser.role, minRole)) {
        return res.status(403).json({
          success: false,
          error: 'Permessi insufficienti per questa operazione'
        });
      }

      req.organizationId = organizationId;
      req.userRole = orgUser.role;

      next();
    } catch (error) {
      console.error('Organization middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Errore nella verifica dell\'organizzazione'
      });
    }
  };
};

// Middleware per verificare token esterni (usato dalle altre app)
export const verifyExternalToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token mancante'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verifica il JWT interno
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.organizationId || !decoded.userId || !decoded.service) {
      return res.status(401).json({
        success: false,
        error: 'Token non valido'
      });
    }

    req.externalAuth = {
      organizationId: decoded.organizationId,
      userId: decoded.userId,
      service: decoded.service,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token scaduto'
      });
    }

    console.error('External token verification error:', error);
    return res.status(401).json({
      success: false,
      error: 'Token non valido'
    });
  }
};

export default authenticate;
