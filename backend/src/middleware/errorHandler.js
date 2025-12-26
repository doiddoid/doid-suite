// Classe per errori personalizzati
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Errori comuni predefiniti
export const Errors = {
  BadRequest: (message = 'Richiesta non valida') => new AppError(message, 400, 'BAD_REQUEST'),
  Unauthorized: (message = 'Non autorizzato') => new AppError(message, 401, 'UNAUTHORIZED'),
  Forbidden: (message = 'Accesso negato') => new AppError(message, 403, 'FORBIDDEN'),
  NotFound: (message = 'Risorsa non trovata') => new AppError(message, 404, 'NOT_FOUND'),
  Conflict: (message = 'Conflitto') => new AppError(message, 409, 'CONFLICT'),
  ValidationError: (message = 'Errore di validazione') => new AppError(message, 422, 'VALIDATION_ERROR'),
  Internal: (message = 'Errore interno del server') => new AppError(message, 500, 'INTERNAL_ERROR')
};

// Middleware per gestione errori 404
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} non trovata`, 404, 'NOT_FOUND');
  next(error);
};

// Middleware globale per gestione errori
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Errore interno del server';
  let code = err.code || 'INTERNAL_ERROR';

  // Log dell'errore
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      statusCode,
      code
    });
  } else {
    // In produzione, log solo errori critici
    if (statusCode >= 500) {
      console.error('Critical Error:', err.message);
    }
  }

  // Gestione errori specifici di Supabase
  if (err.code === 'PGRST116') {
    statusCode = 404;
    message = 'Risorsa non trovata';
    code = 'NOT_FOUND';
  } else if (err.code === '23505') {
    statusCode = 409;
    message = 'Risorsa già esistente';
    code = 'DUPLICATE';
  } else if (err.code === '23503') {
    statusCode = 400;
    message = 'Riferimento non valido';
    code = 'INVALID_REFERENCE';
  }

  // Gestione errori JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token non valido';
    code = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token scaduto';
    code = 'TOKEN_EXPIRED';
  }

  // Risposta errore
  const response = {
    success: false,
    error: message,
    code
  };

  // In sviluppo, aggiungi lo stack trace
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

// Wrapper per gestire async errors
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorHandler;
