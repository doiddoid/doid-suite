import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

export default function RegisterForm({ onSubmit, loading, error }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setValidationError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Le password non coincidono');
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setValidationError('La password deve essere di almeno 8 caratteri');
      return;
    }

    onSubmit(formData.email, formData.password, formData.fullName);
  };

  const displayError = validationError || error;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      {displayError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{displayError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="fullName" className="label">
            Nome completo
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            value={formData.fullName}
            onChange={handleChange}
            className="input"
            placeholder="Mario Rossi"
          />
        </div>

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
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="input pr-10"
              placeholder="Minimo 8 caratteri"
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
            Conferma Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className="input"
            placeholder="Ripeti la password"
          />
        </div>

        <div className="flex items-start">
          <input
            id="terms"
            type="checkbox"
            required
            className="w-4 h-4 mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
            Accetto i{' '}
            <a href="#" className="text-primary-600 hover:underline">
              Termini di Servizio
            </a>{' '}
            e la{' '}
            <a href="#" className="text-primary-600 hover:underline">
              Privacy Policy
            </a>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Registrati'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Hai già un account?{' '}
          <Link
            to="/login"
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}
