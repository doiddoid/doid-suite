import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle, Sparkles, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  // Verifica token all'avvio
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenError('Token non presente. Richiedi un nuovo link di reset.');
        setVerifying(false);
        return;
      }

      try {
        const response = await api.verifyResetToken(token);
        setEmail(response.data.email);
        setVerifying(false);
      } catch (err) {
        setTokenError(err.message || 'Token non valido o scaduto');
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validazione
    if (password.length < 8) {
      setError('La password deve essere di almeno 8 caratteri');
      return;
    }

    if (password !== confirmPassword) {
      setError('Le password non corrispondono');
      return;
    }

    setLoading(true);

    try {
      await api.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Errore durante il reset della password');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifica del link in corso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl text-gray-400 font-normal">doID</span>
            <span className="text-2xl text-gray-900 font-bold">Suite</span>
          </div>
          <p className="text-gray-500 mt-3">Reimposta la tua password</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Token Error */}
          {tokenError && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Link non valido
              </h3>
              <p className="text-gray-600 mb-6">{tokenError}</p>
              <Link
                to="/forgot-password"
                className="btn-primary w-full py-3 inline-flex items-center justify-center"
              >
                Richiedi nuovo link
              </Link>
              <div className="mt-4">
                <Link
                  to="/login"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 inline-flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Torna al login
                </Link>
              </div>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Password aggiornata!
              </h3>
              <p className="text-gray-600 mb-6">
                La tua password è stata reimpostata con successo.
                Ora puoi accedere con la nuova password.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full py-3"
              >
                Vai al login
              </button>
            </div>
          )}

          {/* Form */}
          {!tokenError && !success && (
            <>
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {email && (
                <p className="text-gray-600 mb-6">
                  Inserisci una nuova password per <strong>{email}</strong>
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="label">
                    Nuova password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      className="input pr-10"
                      placeholder="Almeno 8 caratteri"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="label">
                    Conferma password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    className="input"
                    placeholder="Ripeti la password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Reimposta password'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 inline-flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Torna al login
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} doID. Tutti i diritti riservati.
        </p>
      </div>
    </div>
  );
}
