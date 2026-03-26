import { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api.js';

// Service display names for contextual banner
const SERVICE_NAMES = {
  menu: 'Menu',
  review: 'Review',
  page: 'Page',
  smart_review: 'Review',
  smart_page: 'Page',
  menu_digitale: 'Menu',
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Read redirect params from URL (set by subdomain login redirect)
  const redirectService = searchParams.get('redirect');
  const returnUrl = searchParams.get('return_url');
  const serviceName = useMemo(() => {
    if (!redirectService) return null;
    return SERVICE_NAMES[redirectService] || redirectService;
  }, [redirectService]);

  // Store redirect params in sessionStorage for persistence across page interactions
  if (redirectService && returnUrl) {
    sessionStorage.setItem('sso_redirect_service', redirectService);
    sessionStorage.setItem('sso_return_url', returnUrl);
  }

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);

    if (result.success) {
      // Check for SSO redirect params (reverse SSO flow from subdomain)
      const storedService = sessionStorage.getItem('sso_redirect_service') || redirectService;
      const storedReturnUrl = sessionStorage.getItem('sso_return_url') || returnUrl;

      if (storedService && storedReturnUrl) {
        let ssoRedirectDone = false;
        try {
          const tokenResponse = await api.getSsoRedirectToken(storedService);

          if (tokenResponse.success && tokenResponse.data?.token) {
            sessionStorage.removeItem('sso_redirect_service');
            sessionStorage.removeItem('sso_return_url');

            const decodedReturnUrl = decodeURIComponent(storedReturnUrl);
            const separator = decodedReturnUrl.includes('?') ? '&' : '?';
            const redirectTo = `${decodedReturnUrl}${separator}token=${tokenResponse.data.token}`;
            window.location.href = redirectTo;
            ssoRedirectDone = true;
            return;
          } else {
            console.warn('SSO token response:', tokenResponse);
          }
        } catch (err) {
          console.error('SSO redirect token error:', err);
        }

        sessionStorage.removeItem('sso_redirect_service');
        sessionStorage.removeItem('sso_return_url');

        if (!ssoRedirectDone) {
          // Fallback: redirect diretto al callback senza token generato dal backend
          // Usa il token Supabase dell'utente per autenticarsi
          const accessToken = localStorage.getItem('token');
          if (accessToken) {
            const decodedReturnUrl = decodeURIComponent(storedReturnUrl);
            const separator = decodedReturnUrl.includes('?') ? '&' : '?';
            // Genera token via endpoint esistente delle attività
            try {
              const userResp = await api.getCurrentUser();
              if (userResp.success && userResp.data?.organizations?.[0]) {
                const org = userResp.data.organizations[0];
                if (org.activities?.[0]) {
                  const activityId = org.activities[0].id;
                  const serviceAccessResp = await api.request(`/activities/${activityId}/services/${storedService}/access`);
                  if (serviceAccessResp.success && serviceAccessResp.data?.token) {
                    window.location.href = `${decodedReturnUrl}${separator}token=${serviceAccessResp.data.token}`;
                    return;
                  }
                }
              }
            } catch (fallbackErr) {
              console.error('SSO fallback error:', fallbackErr);
            }
          }
        }
      }

      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }

    setLoading(false);
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
          <p className="text-gray-500 mt-3">Accedi al tuo account</p>
        </div>

        {/* Service redirect banner */}
        {serviceName && (
          <div className="mb-4 p-4 bg-primary-50 border border-primary-100 rounded-xl flex items-center gap-3">
            <ArrowRight className="w-5 h-5 text-primary-600 flex-shrink-0" />
            <p className="text-sm text-primary-700">
              Accedi al tuo account DOID Suite per continuare su <strong>{serviceName}</strong>
            </p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="nome@azienda.it"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input pr-10"
                  placeholder="••••••••"
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

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-600">Ricordami</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Password dimenticata?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Accedi'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Non hai un account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                Registrati
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} doID. Tutti i diritti riservati.
        </p>
      </div>
    </div>
  );
}
