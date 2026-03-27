import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Building2, AlertCircle, Info, ShieldCheck } from 'lucide-react';
import { useActivities } from '../hooks/useActivities';
import { activitiesApi } from '../services/activitiesApi';

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
    organizationId: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingLimits, setLoadingLimits] = useState(true);
  const [limits, setLimits] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLimits();
  }, []);

  const loadLimits = async () => {
    try {
      const result = await activitiesApi.getActivityLimits();
      if (result.success) {
        setLimits(result.data.limits);
        // Pre-seleziona la prima agenzia disponibile
        if (result.data.limits.accountType === 'agency' && result.data.limits.agencies?.length > 0) {
          const available = result.data.limits.agencies.find(a => a.canAddMore);
          if (available) {
            setFormData(prev => ({ ...prev, organizationId: available.id }));
          }
        }
      }
    } catch (err) {
      console.error('Error loading limits:', err);
    } finally {
      setLoadingLimits(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = { ...formData };
    if (!payload.organizationId) {
      delete payload.organizationId;
    }

    const result = await createActivity(payload);

    if (result.success) {
      switchActivity(result.data);
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  // Verifica se l'utente puo' creare
  const canCreate = !limits || limits.canCreate || limits.canCreateViaAgency || limits.accountType === 'super_admin';
  const isAgencyUser = limits?.accountType === 'agency';
  const isSuperAdmin = limits?.accountType === 'super_admin';
  const isBlocked = limits?.accountType === 'agency_member' || (limits && !canCreate);

  if (loadingLimits) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Utente senza permessi (membro semplice o limite raggiunto)
  if (isBlocked) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-lg mx-auto">
          <Link
            to="/activities"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alle Attivita'
          </Link>

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Non puoi creare attivita'</h2>
            <p className="text-gray-500">{limits?.limitMessage}</p>
            <Link to="/activities" className="btn-primary mt-6 inline-block">
              Torna alle Attivita'
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Back Link */}
        <Link
          to="/activities"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alle Attivita'
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Nuova Attivita'</h1>
          <p className="text-gray-500 mt-2">
            Crea una nuova attivita' per gestire i tuoi servizi doID
          </p>
        </div>

        {/* Super Admin Badge */}
        {isSuperAdmin && (
          <div className="mb-6 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center space-x-3">
            <ShieldCheck className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <p className="text-sm text-purple-700">Super Admin — nessun limite di creazione</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selezione Agenzia — solo per utenti agenzia */}
            {isAgencyUser && limits.agencies?.length > 0 && (
              <div>
                <label htmlFor="organizationId" className="label">
                  Agenzia *
                </label>
                <select
                  id="organizationId"
                  name="organizationId"
                  required
                  value={formData.organizationId}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Seleziona agenzia...</option>
                  {limits.agencies.map(agency => (
                    <option
                      key={agency.id}
                      value={agency.id}
                      disabled={!agency.canAddMore}
                    >
                      {agency.name}
                      {agency.maxActivities !== -1 && ` (${agency.currentActivities}/${agency.maxActivities})`}
                      {!agency.canAddMore && ' — limite raggiunto'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  L'attivita' verra' creata sotto questa agenzia
                </p>
              </div>
            )}

            <div>
              <label htmlFor="name" className="label">
                Nome attivita' *
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
                Il nome della tua attivita' commerciale o azienda
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
                Citta'
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
                disabled={loading || (isAgencyUser && !formData.organizationId)}
                className="btn-primary w-full py-3"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Crea Attivita\''
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        {isAgencyUser ? (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              Come membro di un'agenzia, le attivita' vengono create sotto la tua organizzazione.
              Seleziona l'agenzia dal menu sopra per procedere.
            </p>
          </div>
        ) : (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-700">
              <strong>Suggerimento:</strong> Puoi gestire piu' attivita' dal tuo account.
              Se sei un'agenzia o gestisci piu' locali, puoi creare un'attivita' per ognuno di essi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
