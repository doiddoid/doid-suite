import { supabaseAdmin } from '../config/supabase.js';

// Lista email super admin (configurabile via env)
const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || 'admin@doid.it').split(',').map(e => e.trim());

// Middleware per verificare se l'utente è super admin
export const requireSuperAdmin = async (req, res, next) => {
  try {
    // L'utente deve essere già autenticato (middleware authenticate deve essere eseguito prima)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autenticazione richiesta'
      });
    }

    const userEmail = req.user.email;

    // Verifica se l'email è nella lista super admin
    if (!SUPER_ADMIN_EMAILS.includes(userEmail)) {
      // Log tentativo di accesso non autorizzato
      console.warn(`[ADMIN] Accesso negato per: ${userEmail}`);

      return res.status(403).json({
        success: false,
        error: 'Accesso riservato agli amministratori'
      });
    }

    // Aggiungi flag super admin alla request
    req.isSuperAdmin = true;

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore nella verifica dei permessi admin'
    });
  }
};

// Middleware per loggare le azioni admin
export const logAdminAction = (action) => {
  return async (req, res, next) => {
    const startTime = Date.now();

    // Salva la funzione originale di res.json
    const originalJson = res.json.bind(res);

    // Override res.json per intercettare la risposta
    res.json = (data) => {
      const duration = Date.now() - startTime;
      const logEntry = {
        timestamp: new Date().toISOString(),
        action,
        adminEmail: req.user?.email,
        adminId: req.user?.id,
        method: req.method,
        path: req.originalUrl,
        body: sanitizeLogData(req.body),
        params: req.params,
        query: req.query,
        responseStatus: res.statusCode,
        success: data?.success || false,
        duration: `${duration}ms`
      };

      // Log su console (in produzione salvare su DB o servizio di logging)
      console.log('[ADMIN ACTION]', JSON.stringify(logEntry, null, 2));

      // Salva log su database se necessario
      saveAdminLog(logEntry).catch(err => {
        console.error('Error saving admin log:', err);
      });

      return originalJson(data);
    };

    next();
  };
};

// Rimuovi dati sensibili dal log
function sanitizeLogData(data) {
  if (!data) return data;

  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'refreshToken', 'accessToken', 'secret'];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

// Salva log admin su database
async function saveAdminLog(logEntry) {
  try {
    await supabaseAdmin.from('admin_logs').insert({
      admin_user_id: logEntry.adminId,
      action: logEntry.action,
      target_type: logEntry.params?.activityId ? 'activity' : logEntry.params?.id ? 'user' : null,
      target_id: logEntry.params?.activityId || logEntry.params?.id || null,
      details: {
        method: logEntry.method,
        path: logEntry.path,
        body: logEntry.body,
        responseStatus: logEntry.responseStatus,
        duration: logEntry.duration
      },
      ip_address: logEntry.ip || null
    });
  } catch (err) {
    // Non blocca se la tabella non esiste ancora
    console.error('Error saving admin log to DB:', err.message);
  }
}

// Helper per verificare se un utente è super admin (usabile in altri contesti)
export const isSuperAdmin = (email) => {
  return SUPER_ADMIN_EMAILS.includes(email);
};

// Esporta la lista degli admin (per uso interno)
export const getSuperAdminEmails = () => [...SUPER_ADMIN_EMAILS];

export default requireSuperAdmin;
