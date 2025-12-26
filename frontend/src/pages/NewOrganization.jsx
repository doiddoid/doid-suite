import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Building2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function NewOrganization() {
  const navigate = useNavigate();
  const { createOrganization } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    vatNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await createOrganization(formData);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Back Link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla Dashboard
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Nuova Organizzazione</h1>
          <p className="text-gray-500 mt-2">
            Crea una nuova organizzazione per gestire i tuoi servizi DOID
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="label">
                Nome organizzazione *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="input"
                placeholder="es. Ristorante Da Mario"
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email aziendale
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="info@azienda.it"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="label">
                  Telefono
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input"
                  placeholder="+39 123 456 7890"
                />
              </div>
              <div>
                <label htmlFor="vatNumber" className="label">
                  Partita IVA
                </label>
                <input
                  id="vatNumber"
                  name="vatNumber"
                  type="text"
                  value={formData.vatNumber}
                  onChange={handleChange}
                  className="input"
                  placeholder="IT12345678901"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Crea Organizzazione'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
