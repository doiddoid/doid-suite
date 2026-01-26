import { useState, useEffect } from 'react';
import {
  Search, RefreshCw, Trash2, RotateCcw, AlertTriangle,
  Building2, Store, Mail, Phone, Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../../services/api';

export default function DeletedActivitiesTable() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ activities: [], pagination: {} });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ open: false, activity: null, type: null });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDeletedActivities();
  }, [page, search]);

  const fetchDeletedActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (search) params.append('search', search);

      const response = await api.request(`/admin/activities-deleted?${params.toString()}`);
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.error || 'Errore nel caricamento');
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleRestore = async (activity) => {
    setActionLoading(true);
    try {
      const response = await api.request(`/admin/activities/${activity.id}/restore`, {
        method: 'POST'
      });
      if (response.success) {
        fetchDeletedActivities();
      } else {
        setError(response.error || 'Errore nel ripristino');
      }
    } catch (err) {
      setError(err.message);
    }
    setActionLoading(false);
  };

  const handlePermanentDelete = async () => {
    setActionLoading(true);
    try {
      const response = await api.request(`/admin/activities/${deleteModal.activity.id}/permanent`, {
        method: 'DELETE'
      });
      if (response.success) {
        setDeleteModal({ open: false, activity: null, type: null });
        fetchDeletedActivities();
      } else {
        setError(response.error || 'Errore nell\'eliminazione');
      }
    } catch (err) {
      setError(err.message);
    }
    setActionLoading(false);
  };

  const handleDeleteAll = async () => {
    setActionLoading(true);
    try {
      const response = await api.request('/admin/activities-deleted/all', {
        method: 'DELETE'
      });
      if (response.success) {
        setDeleteModal({ open: false, activity: null, type: null });
        fetchDeletedActivities();
      } else {
        setError(response.error || 'Errore nell\'eliminazione');
      }
    } catch (err) {
      setError(err.message);
    }
    setActionLoading(false);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const { activities = [], pagination = {} } = data;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Attività Eliminate</h2>
          <p className="text-sm text-gray-500">
            {pagination.total || 0} attività nel cestino
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activities.length > 0 && (
            <button
              onClick={() => setDeleteModal({ open: true, activity: null, type: 'all' })}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Svuota cestino
            </button>
          )}
          <button
            onClick={fetchDeletedActivities}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Aggiorna"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Cerca per nome, slug o email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
          <button onClick={fetchDeletedActivities} className="ml-auto text-red-600 hover:underline text-sm">
            Riprova
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <Trash2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Nessuna attività eliminata</p>
          <p className="text-sm text-gray-400 mt-1">Il cestino è vuoto</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attività
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organizzazione
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contatti
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscriptions
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Eliminata il
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <Store className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{activity.name}</p>
                        <p className="text-sm text-gray-500">/{activity.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {activity.organization ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{activity.organization.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {activity.email && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="w-3 h-3" />
                          {activity.email}
                        </div>
                      )}
                      {activity.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="w-3 h-3" />
                          {activity.phone}
                        </div>
                      )}
                      {!activity.email && !activity.phone && (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{activity.subscriptionsCount}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="w-3 h-3" />
                      {formatDate(activity.deletedAt)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleRestore(activity)}
                        disabled={actionLoading}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Ripristina"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ open: true, activity, type: 'single' })}
                        disabled={actionLoading}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Elimina definitivamente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-500">
            Pagina {pagination.page} di {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {deleteModal.type === 'all' ? 'Svuota cestino' : 'Elimina definitivamente'}
                </h3>
                <p className="text-sm text-gray-500">Questa azione non può essere annullata</p>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              {deleteModal.type === 'all' ? (
                <>
                  Stai per eliminare definitivamente <strong>{pagination.total} attività</strong> e tutti i dati correlati (subscriptions, membri, account esterni).
                </>
              ) : (
                <>
                  Stai per eliminare definitivamente <strong>{deleteModal.activity?.name}</strong> e tutti i dati correlati (subscriptions, membri, account esterni).
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, activity: null, type: null })}
                disabled={actionLoading}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={deleteModal.type === 'all' ? handleDeleteAll : handlePermanentDelete}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                {actionLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {deleteModal.type === 'all' ? 'Elimina tutto' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
