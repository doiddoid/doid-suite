import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle, Sparkles, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function ChangePassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const migratedFrom = location.state?.migratedFrom;
  const isRequired = location.state?.required === true;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const getServiceName = (code) => {
    const names = {
      smart_review: 'Smart Review',
      smart_page: 'Smart Page',
      menu_digitale: 'Menu Digitale',
      display_suite: 'Display Suite'
    };
    return names[code] || code;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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
      await api.updatePassword(password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Errore durante l\'aggiornamento della password');
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-gray-500 mt-3">Aggiorna la tua password</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Success */}
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Password aggiornata!
              </h3>
              <p className="text-gray-600 mb-6">
                La tua password è stata aggiornata con successo.
                Ora puoi accedere alla dashboard.
              </p>
              <button
                onClick={() => navigate('/dashboard', { replace: true })}
                className="btn-primary w-full py-3"
              >
                Vai alla Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* Migration Notice */}
              {isRequired && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Cambio password obbligatorio
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      Il tuo account è stato migrato{migratedFrom ? ` da ${getServiceName(migratedFrom)}` : ''}.
                      Per sicurezza, devi impostare una nuova password.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {user?.email && (
                <p className="text-gray-600 mb-6">
                  Inserisci una nuova password per <strong>{user.email}</strong>
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
                    'Aggiorna password'
                  )}
                </button>
              </form>

              {!isRequired && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Salta per ora
                  </button>
                </div>
              )}
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
