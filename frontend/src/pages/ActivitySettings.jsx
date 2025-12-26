import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Building2, AlertCircle, Trash2, Users, Save } from 'lucide-react';
import { useActivities } from '../hooks/useActivities';

export default function ActivitySettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getActivity, updateActivity, deleteActivity, getMembers } = useActivities();

  const [activity, setActivity] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    vatNumber: '',
    address: '',
    city: '',
  });

  // Carica dati attività
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [activityResult, membersResult] = await Promise.all([
          getActivity(id),
          getMembers(id)
        ]);

        if (activityResult.success) {
          const act = activityResult.data;
          setActivity(act);
          setFormData({
            name: act.name || '',
            email: act.email || '',
            phone: act.phone || '',
            vatNumber: act.vatNumber || '',
            address: act.address || '',
            city: act.city || '',
          });
        } else {
          setError(activityResult.error || 'Attività non trovata');
        }

        if (membersResult.success) {
          setMembers(membersResult.data || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id, getActivity, getMembers]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const result = await updateActivity(id, formData);

    if (result.success) {
      setSuccess('Impostazioni salvate con successo');
      setActivity(result.data);
    } else {
      setError(result.error || 'Errore nel salvataggio');
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);

    const result = await deleteActivity(id);

    if (result.success) {
      navigate('/activities');
    } else {
      setError(result.error || 'Errore nell\'eliminazione');
      setShowDeleteConfirm(false);
    }

    setDeleteLoading(false);
  };

  const isOwner = activity?.role === 'owner';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Attività non trovata
          </h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link to="/activities" className="btn-primary">
            Torna alle attività
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Back Link */}
      <Link
        to="/activities"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Torna alle Attività
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-2">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Impostazioni</h1>
            <p className="text-gray-500">{activity.name}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Informazioni attività</h2>

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
              disabled={saving}
              className="btn-primary w-full py-3 flex items-center justify-center"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salva Modifiche
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Members Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Membri</h2>
          <Link
            to={`/activities/${id}/members`}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Gestisci
          </Link>
        </div>

        <div className="flex items-center space-x-3">
          <Users className="w-5 h-5 text-gray-400" />
          <span className="text-gray-600">
            {members.length} {members.length === 1 ? 'membro' : 'membri'}
          </span>
        </div>
      </div>

      {/* Danger Zone - Solo per owner */}
      {isOwner && (
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Zona pericolosa</h2>
          <p className="text-sm text-gray-500 mb-4">
            L'eliminazione dell'attività è permanente. Tutti gli abbonamenti e i dati associati verranno cancellati.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4 inline mr-2" />
              Elimina attività
            </button>
          ) : (
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600 mb-3">
                Sei sicuro? Questa azione non può essere annullata.
              </p>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteLoading ? 'Eliminazione...' : 'Conferma eliminazione'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Annulla
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
