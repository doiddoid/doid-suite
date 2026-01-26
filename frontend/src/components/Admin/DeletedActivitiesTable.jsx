import { useState, useEffect } from 'react';
import {
  Search, RefreshCw, Trash2, RotateCcw, AlertTriangle,
  Building2, Store, Mail, Phone, Calendar, ChevronLeft, ChevronRight,
  Users, Briefcase
} from 'lucide-react';
import api from '../../services/api';

export default function DeletedActivitiesTable() {
  const [activeSection, setActiveSection] = useState('organizations'); // 'organizations' or 'activities'

  // Organizations state
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [orgsError, setOrgsError] = useState(null);
  const [orgsData, setOrgsData] = useState({ organizations: [], pagination: {} });
  const [orgsSearch, setOrgsSearch] = useState('');
  const [orgsPage, setOrgsPage] = useState(1);

  // Activities state
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState(null);
  const [activitiesData, setActivitiesData] = useState({ activities: [], pagination: {} });
  const [activitiesSearch, setActivitiesSearch] = useState('');
  const [activitiesPage, setActivitiesPage] = useState(1);

  // Shared state
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null, type: null, itemType: null });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDeletedOrganizations();
    fetchDeletedActivities();
  }, []);

  useEffect(() => {
    fetchDeletedOrganizations();
  }, [orgsPage, orgsSearch]);

  useEffect(() => {
    fetchDeletedActivities();
  }, [activitiesPage, activitiesSearch]);

  const fetchDeletedOrganizations = async () => {
    setOrgsLoading(true);
    setOrgsError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', orgsPage.toString());
      params.append('limit', '20');
      if (orgsSearch) params.append('search', orgsSearch);

      const response = await api.request(`/admin/organizations-deleted?${params.toString()}`);
      if (response.success) {
        setOrgsData(response.data);
      } else {
        setOrgsError(response.error || 'Errore nel caricamento');
      }
    } catch (err) {
      setOrgsError(err.message);
    }
    setOrgsLoading(false);
  };

  const fetchDeletedActivities = async () => {
    setActivitiesLoading(true);
    setActivitiesError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', activitiesPage.toString());
      params.append('limit', '20');
      if (activitiesSearch) params.append('search', activitiesSearch);

      const response = await api.request(`/admin/activities-deleted?${params.toString()}`);
      if (response.success) {
        setActivitiesData(response.data);
      } else {
        setActivitiesError(response.error || 'Errore nel caricamento');
      }
    } catch (err) {
      setActivitiesError(err.message);
    }
    setActivitiesLoading(false);
  };

  const handleRestore = async (item, itemType) => {
    setActionLoading(true);
    try {
      const endpoint = itemType === 'organization'
        ? `/admin/organizations/${item.id}/restore`
        : `/admin/activities/${item.id}/restore`;

      const response = await api.request(endpoint, { method: 'POST' });
      if (response.success) {
        if (itemType === 'organization') {
          fetchDeletedOrganizations();
          fetchDeletedActivities(); // Refresh activities too since they might be restored
        } else {
          fetchDeletedActivities();
        }
      } else {
        if (itemType === 'organization') {
          setOrgsError(response.error || 'Errore nel ripristino');
        } else {
          setActivitiesError(response.error || 'Errore nel ripristino');
        }
      }
    } catch (err) {
      if (itemType === 'organization') {
        setOrgsError(err.message);
      } else {
        setActivitiesError(err.message);
      }
    }
    setActionLoading(false);
  };

  const handlePermanentDelete = async () => {
    setActionLoading(true);
    try {
      const endpoint = deleteModal.itemType === 'organization'
        ? `/admin/organizations/${deleteModal.item.id}/permanent`
        : `/admin/activities/${deleteModal.item.id}/permanent`;

      const response = await api.request(endpoint, { method: 'DELETE' });
      if (response.success) {
        setDeleteModal({ open: false, item: null, type: null, itemType: null });
        if (deleteModal.itemType === 'organization') {
          fetchDeletedOrganizations();
          fetchDeletedActivities();
        } else {
          fetchDeletedActivities();
        }
      } else {
        if (deleteModal.itemType === 'organization') {
          setOrgsError(response.error || 'Errore nell\'eliminazione');
        } else {
          setActivitiesError(response.error || 'Errore nell\'eliminazione');
        }
      }
    } catch (err) {
      if (deleteModal.itemType === 'organization') {
        setOrgsError(err.message);
      } else {
        setActivitiesError(err.message);
      }
    }
    setActionLoading(false);
  };

  const handleDeleteAll = async (itemType) => {
    setActionLoading(true);
    try {
      const endpoint = itemType === 'organization'
        ? '/admin/organizations-deleted/all'
        : '/admin/activities-deleted/all';

      const response = await api.request(endpoint, { method: 'DELETE' });
      if (response.success) {
        setDeleteModal({ open: false, item: null, type: null, itemType: null });
        if (itemType === 'organization') {
          fetchDeletedOrganizations();
          fetchDeletedActivities();
        } else {
          fetchDeletedActivities();
        }
      } else {
        if (itemType === 'organization') {
          setOrgsError(response.error || 'Errore nell\'eliminazione');
        } else {
          setActivitiesError(response.error || 'Errore nell\'eliminazione');
        }
      }
    } catch (err) {
      if (itemType === 'organization') {
        setOrgsError(err.message);
      } else {
        setActivitiesError(err.message);
      }
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

  const { organizations = [], pagination: orgsPagination = {} } = orgsData;
  const { activities = [], pagination: activitiesPagination = {} } = activitiesData;

  const totalDeleted = (orgsPagination.total || 0) + (activitiesPagination.total || 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Elementi Eliminati</h2>
          <p className="text-sm text-gray-500">
            {totalDeleted} elementi nel cestino ({orgsPagination.total || 0} clienti, {activitiesPagination.total || 0} attività)
          </p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveSection('organizations')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeSection === 'organizations'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Clienti ({orgsPagination.total || 0})
          </div>
        </button>
        <button
          onClick={() => setActiveSection('activities')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeSection === 'activities'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            Attività ({activitiesPagination.total || 0})
          </div>
        </button>
      </div>

      {/* Organizations Section */}
      {activeSection === 'organizations' && (
        <div className="space-y-4">
          {/* Header & Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca clienti eliminati..."
                value={orgsSearch}
                onChange={(e) => {
                  setOrgsSearch(e.target.value);
                  setOrgsPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              {organizations.length > 0 && (
                <button
                  onClick={() => setDeleteModal({ open: true, item: null, type: 'all', itemType: 'organization' })}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Svuota clienti
                </button>
              )}
              <button
                onClick={fetchDeletedOrganizations}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Aggiorna"
              >
                <RefreshCw className={`w-5 h-5 ${orgsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Error */}
          {orgsError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {orgsError}
              <button onClick={fetchDeletedOrganizations} className="ml-auto text-red-600 hover:underline text-sm">
                Riprova
              </button>
            </div>
          )}

          {/* Table */}
          {orgsLoading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Nessun cliente eliminato</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contatti</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attività</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Eliminato il</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Azioni</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{org.name}</p>
                            <p className="text-sm text-gray-500">/{org.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          org.accountType === 'agency'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {org.accountType === 'agency' ? 'Agenzia' : 'Singolo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {org.email && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Mail className="w-3 h-3" />
                              {org.email}
                            </div>
                          )}
                          {!org.email && <span className="text-sm text-gray-400">-</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{org.activitiesCount}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {formatDate(org.deletedAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRestore(org, 'organization')}
                            disabled={actionLoading}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Ripristina"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ open: true, item: org, type: 'single', itemType: 'organization' })}
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
          {orgsPagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-500">Pagina {orgsPagination.page} di {orgsPagination.totalPages}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOrgsPage(p => Math.max(1, p - 1))}
                  disabled={orgsPage === 1}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setOrgsPage(p => Math.min(orgsPagination.totalPages, p + 1))}
                  disabled={orgsPage === orgsPagination.totalPages}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activities Section */}
      {activeSection === 'activities' && (
        <div className="space-y-4">
          {/* Header & Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca attività eliminate..."
                value={activitiesSearch}
                onChange={(e) => {
                  setActivitiesSearch(e.target.value);
                  setActivitiesPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              {activities.length > 0 && (
                <button
                  onClick={() => setDeleteModal({ open: true, item: null, type: 'all', itemType: 'activity' })}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Svuota attività
                </button>
              )}
              <button
                onClick={fetchDeletedActivities}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Aggiorna"
              >
                <RefreshCw className={`w-5 h-5 ${activitiesLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Error */}
          {activitiesError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {activitiesError}
              <button onClick={fetchDeletedActivities} className="ml-auto text-red-600 hover:underline text-sm">
                Riprova
              </button>
            </div>
          )}

          {/* Table */}
          {activitiesLoading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <Store className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Nessuna attività eliminata</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attività</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contatti</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscriptions</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Eliminata il</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Azioni</th>
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
                            onClick={() => handleRestore(activity, 'activity')}
                            disabled={actionLoading}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Ripristina"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ open: true, item: activity, type: 'single', itemType: 'activity' })}
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
          {activitiesPagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-500">Pagina {activitiesPagination.page} di {activitiesPagination.totalPages}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivitiesPage(p => Math.max(1, p - 1))}
                  disabled={activitiesPage === 1}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActivitiesPage(p => Math.min(activitiesPagination.totalPages, p + 1))}
                  disabled={activitiesPage === activitiesPagination.totalPages}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
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
                  {deleteModal.type === 'all'
                    ? `Svuota ${deleteModal.itemType === 'organization' ? 'clienti' : 'attività'}`
                    : 'Elimina definitivamente'}
                </h3>
                <p className="text-sm text-gray-500">Questa azione non può essere annullata</p>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              {deleteModal.type === 'all' ? (
                <>
                  Stai per eliminare definitivamente{' '}
                  <strong>
                    {deleteModal.itemType === 'organization'
                      ? `${orgsPagination.total} clienti`
                      : `${activitiesPagination.total} attività`}
                  </strong>{' '}
                  e tutti i dati correlati.
                </>
              ) : (
                <>
                  Stai per eliminare definitivamente{' '}
                  <strong>{deleteModal.item?.name}</strong>{' '}
                  e tutti i dati correlati (subscriptions, membri, account esterni).
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, item: null, type: null, itemType: null })}
                disabled={actionLoading}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  if (deleteModal.type === 'all') {
                    handleDeleteAll(deleteModal.itemType);
                  } else {
                    handlePermanentDelete();
                  }
                }}
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
