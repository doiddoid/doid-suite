import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, Users, Settings, Trash2, AlertCircle, Check, ChevronRight, Loader2 } from 'lucide-react';
import { useActivities } from '../hooks/useActivities';

export default function Activities() {
  const {
    activities,
    currentActivity,
    switchActivity,
    deleteActivity,
    loading
  } = useActivities();

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async (activityId) => {
    setDeleteLoading(true);
    setError('');

    const result = await deleteActivity(activityId);

    if (!result.success) {
      setError(result.error);
    }

    setDeleteLoading(false);
    setDeleteConfirm(null);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'owner':
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Proprietario</span>;
      case 'admin':
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Admin</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Utente</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Caricamento attività...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Le tue Attività</h1>
          <p className="text-gray-500 mt-1">
            Gestisci le attività per cui utilizzi i servizi DOID
          </p>
        </div>
        <Link
          to="/activities/new"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nuova Attività</span>
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Activities List */}
      {activities.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nessuna attività
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Crea la tua prima attività per iniziare ad utilizzare i servizi DOID
          </p>
          <Link to="/activities/new" className="btn-primary inline-flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Crea Attività
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={`bg-white rounded-xl shadow-sm border ${
                currentActivity?.id === activity.id
                  ? 'border-primary-200 ring-2 ring-primary-100'
                  : 'border-gray-100'
              } overflow-hidden`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {activity.name}
                      </h3>
                      {getRoleBadge(activity.role)}
                      {currentActivity?.id === activity.id && (
                        <span className="flex items-center text-xs text-primary-600">
                          <Check className="w-3 h-3 mr-1" />
                          Attiva
                        </span>
                      )}
                    </div>
                    {(activity.email || activity.city) && (
                      <p className="text-sm text-gray-500">
                        {[activity.email, activity.city].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {currentActivity?.id !== activity.id && (
                      <button
                        onClick={() => switchActivity(activity)}
                        className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        Seleziona
                      </button>
                    )}
                    <Link
                      to={`/activities/${activity.id}/settings`}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </Link>
                    {activity.role === 'owner' && (
                      <button
                        onClick={() => setDeleteConfirm(activity.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center space-x-4">
                  <Link
                    to={`/activities/${activity.id}/members`}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Users className="w-4 h-4 mr-1.5" />
                    Membri
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Link>
                  <button
                    onClick={() => {
                      switchActivity(activity);
                      window.location.href = '/dashboard';
                    }}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Building2 className="w-4 h-4 mr-1.5" />
                    Vai alla Dashboard
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </button>
                </div>
              </div>

              {/* Delete Confirmation */}
              {deleteConfirm === activity.id && (
                <div className="px-6 py-4 bg-red-50 border-t border-red-100">
                  <p className="text-sm text-red-600 mb-3">
                    Sei sicuro di voler eliminare questa attività? Tutti gli abbonamenti associati verranno cancellati.
                  </p>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleDelete(activity.id)}
                      disabled={deleteLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
                    >
                      {deleteLoading ? 'Eliminazione...' : 'Conferma eliminazione'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-red-100 rounded-lg"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
