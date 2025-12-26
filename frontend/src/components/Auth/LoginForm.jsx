import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

export default function LoginForm({ onSubmit, loading, error }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData.email, formData.password);
  };

  return (
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
              placeholder="********"
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
  );
}
