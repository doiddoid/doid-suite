import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Building2, AlertCircle } from 'lucide-react';
import { useActivities } from '../hooks/useActivities';

export default function NewActivity() {
  const navigate = useNavigate();
  const { createActivity, switchActivity } = useActivities();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    vatNumber: '',
    address: '',
    city: '',
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

    const result = await createActivity(formData);

    if (result.success) {
      // Set as current activity and redirect
      switchActivity(result.data);
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
          to="/activities"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alle Attività
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Nuova Attività</h1>
          <p className="text-gray-500 mt-2">
            Crea una nuova attività per gestire i tuoi servizi DOID
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
                Nome attività *
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
              <p className="text-xs text-gray-400 mt-1">
                Il nome della tua attività commerciale o azienda
              </p>
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

            <div>
              <label htmlFor="address" className="label">
                Indirizzo
              </label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                className="input"
                placeholder="Via Roma 1"
              />
            </div>

            <div>
              <label htmlFor="city" className="label">
                Città
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                className="input"
                placeholder="Milano"
              />
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
                  'Crea Attività'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <p className="text-sm text-blue-700">
            <strong>Suggerimento:</strong> Puoi gestire più attività dal tuo account.
            Se sei un'agenzia o gestisci più locali, puoi creare un'attività per ognuno di essi.
          </p>
        </div>
      </div>
    </div>
  );
}
