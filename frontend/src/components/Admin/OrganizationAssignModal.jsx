import { useState, useEffect } from 'react';
import { Building2, Search, X, Loader2, Unlink, AlertCircle, Check } from 'lucide-react';
import api from '../../services/api';

export default function OrganizationAssignModal({
  activityId,
  activityName,
  currentOrganization, // { id, name, accountType } or null
  onUpdate,
  onClose
}) {
  const [organizations, setOrganizations] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState(currentOrganization?.id || null);
  const [loading, setLoading] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Carica organizzazioni di tipo agency
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await api.request('/admin/organizations?limit=100');
        if (response.success) {
          // Filtra solo agenzie
          const agencies = (response.data.organizations || response.data || [])
            .filter(org => org.accountType === 'agency' || org.account_type === 'agency');
          setOrganizations(agencies);
        }
      } catch (err) {
        console.error('Error fetching organizations:', err);
        setError('Errore nel caricamento delle organizzazioni');
      }
      setLoadingOrgs(false);
    };
    fetchOrganizations();
  }, []);

  const filteredOrgs = organizations.filter(org => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (org.name || '').toLowerCase().includes(s) ||
           (org.email || '').toLowerCase().includes(s);
  });

  const handleAssign = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.request(`/admin/activities/${activityId}/organization`, {
        method: 'PUT',
        body: JSON.stringify({ organization_id: selectedOrgId })
      });

      if (response.success) {
        setSuccess(selectedOrgId
          ? `Attività assegnata con successo`
          : 'Attività dissociata con successo'
        );
        if (onUpdate) onUpdate();
        setTimeout(() => onClose(), 1200);
      } else {
        setError(response.error || 'Errore nell\'operazione');
      }
    } catch (err) {
      setError(err.message || 'Errore nell\'operazione');
    }
    setLoading(false);
  };

  const handleUnassign = async () => {
    setSelectedOrgId(null);
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.request(`/admin/activities/${activityId}/organization`, {
        method: 'PUT',
        body: JSON.stringify({ organization_id: null })
      });

      if (response.success) {
        setSuccess('Attività dissociata con successo');
        if (onUpdate) onUpdate();
        setTimeout(() => onClose(), 1200);
      } else {
        setError(response.error || 'Errore nella dissociazione');
      }
    } catch (err) {
      setError(err.message || 'Errore nella dissociazione');
    }
    setLoading(false);
  };

  const hasChanged = selectedOrgId !== (currentOrganization?.id || null);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Assegna a Organizzazione</h3>
            <p className="text-sm text-gray-500">{activityName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Current org info */}
        {currentOrganization && (
          <div className="p-4 bg-purple-50 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">{currentOrganization.name}</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">Agenzia</span>
            </div>
            <button
              onClick={handleUnassign}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <Unlink className="w-3 h-3" />
              Dissocia
            </button>
          </div>
        )}

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca organizzazione..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Organization list */}
        <div className="flex-1 overflow-y-auto p-2 min-h-0">
          {loadingOrgs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
            </div>
          ) : filteredOrgs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              {search ? 'Nessuna agenzia trovata' : 'Nessuna agenzia disponibile'}
            </p>
          ) : (
            <div className="space-y-1">
              {/* Opzione "Nessuna organizzazione" */}
              <button
                onClick={() => setSelectedOrgId(null)}
                className={`w-full p-3 rounded-lg border text-left transition-colors flex items-center gap-3 ${
                  selectedOrgId === null
                    ? 'border-gray-500 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Unlink className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Nessuna organizzazione</p>
                  <p className="text-xs text-gray-400">Account indipendente</p>
                </div>
                {selectedOrgId === null && <Check className="w-4 h-4 text-gray-600 ml-auto" />}
              </button>

              {filteredOrgs.map((org) => (
                <button
                  key={org.id}
                  onClick={() => setSelectedOrgId(org.id)}
                  className={`w-full p-3 rounded-lg border text-left transition-colors flex items-center gap-3 ${
                    selectedOrgId === org.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{org.name}</p>
                    <p className="text-xs text-gray-400 truncate">{org.email || '-'} · {org.activitiesCount || 0} attività</p>
                  </div>
                  {selectedOrgId === org.id && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Feedback */}
        {error && (
          <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="mx-4 mb-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500 shrink-0" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
          >
            Annulla
          </button>
          <button
            onClick={handleAssign}
            disabled={loading || !hasChanged}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {loading ? 'Salvataggio...' : 'Conferma'}
          </button>
        </div>
      </div>
    </div>
  );
}
