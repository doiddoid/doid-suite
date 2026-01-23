import { useState, useMemo } from 'react';
import { Star, FileText, UtensilsCrossed, Monitor, X, Search, Plus, Link, Building2, Clock, Zap, Check } from 'lucide-react';
import api from '../../services/api';

const SERVICE_ICONS = {
  smart_review: Star,
  smart_page: FileText,
  menu_digitale: UtensilsCrossed,
  display_suite: Monitor
};

const SERVICE_COLORS = {
  smart_review: '#FFB800',
  smart_page: '#4F46E5',
  menu_digitale: '#10B981',
  display_suite: '#EF4444'
};

export default function ServiceAssignmentModal({
  isOpen,
  onClose,
  onSuccess,
  activities = [],
  services = []
}) {
  const [mode, setMode] = useState('by-activity'); // 'by-activity' | 'by-external'
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [selectedServiceCode, setSelectedServiceCode] = useState('');
  const [externalAccountId, setExternalAccountId] = useState('');
  const [status, setStatus] = useState('active');
  const [billingCycle, setBillingCycle] = useState('yearly');
  const [createActivityIfNotFound, setCreateActivityIfNotFound] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Filtra attivitĂ  per ricerca
  const filteredActivities = useMemo(() => {
    if (!searchQuery) return activities;
    const query = searchQuery.toLowerCase();
    return activities.filter(a =>
      a.name?.toLowerCase().includes(query) ||
      a.email?.toLowerCase().includes(query) ||
      a.slug?.toLowerCase().includes(query)
    );
  }, [activities, searchQuery]);

  // Cerca attivitĂ  collegata a account esterno
  const handleLookupExternalAccount = async () => {
    if (!selectedServiceCode || !externalAccountId) return;

    setLookupLoading(true);
    setLookupResult(null);
    setError(null);

    try {
      const response = await api.request(
        `/admin/external-account/${selectedServiceCode}/${encodeURIComponent(externalAccountId)}`
      );

      if (response.success) {
        setLookupResult(response.data);
        if (response.found && response.data?.activity) {
          // AttivitĂ  giĂ  collegata
          setSelectedActivityId(response.data.activityId);
        }
      }
    } catch (err) {
      setError(err.message || 'Errore nella ricerca');
    }

    setLookupLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        mode,
        serviceCode: selectedServiceCode,
        status,
        billingCycle
      };

      if (mode === 'by-activity') {
        payload.activityId = selectedActivityId;
      } else {
        payload.externalAccountId = externalAccountId;
        payload.createActivityIfNotFound = createActivityIfNotFound;
        if (createActivityIfNotFound) {
          payload.newActivityName = newActivityName;
        }
      }

      const response = await api.request('/admin/service-assignment', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.success) {
        onSuccess?.(response.data, response.message);
        onClose();
      } else {
        setError(response.error || 'Errore nell\'assegnazione');
      }
    } catch (err) {
      setError(err.message || 'Errore nell\'assegnazione del servizio');
    }

    setLoading(false);
  };

  const isFormValid = () => {
    if (!selectedServiceCode) return false;

    if (mode === 'by-activity') {
      return !!selectedActivityId;
    } else {
      if (!externalAccountId) return false;
      if (createActivityIfNotFound && !newActivityName) return false;
      // Se non crea nuova attivitĂ  e non ha trovato nulla, non puĂ˛ procedere
      if (!createActivityIfNotFound && lookupResult && !lookupResult.activity) return false;
      return true;
    }
  };

  const selectedService = services.find(s => s.code === selectedServiceCode);
  const ServiceIcon = selectedServiceCode ? (SERVICE_ICONS[selectedServiceCode] || Star) : Star;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Link className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Assegna Servizio</h3>
                <p className="text-sm text-white/80">Collega un servizio a un'attivitĂ </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* ModalitĂ  Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ModalitĂ  di Assegnazione
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode('by-activity');
                  setLookupResult(null);
                }}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  mode === 'by-activity'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Per AttivitĂ
              </button>
              <button
                type="button"
                onClick={() => setMode('by-external')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  mode === 'by-external'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <Link className="w-4 h-4" />
                Per ID Esterno
              </button>
            </div>
          </div>

          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Servizio
            </label>
            <div className="grid grid-cols-2 gap-2">
              {services.map(service => {
                const Icon = SERVICE_ICONS[service.code] || Star;
                const color = SERVICE_COLORS[service.code] || '#6B7280';
                const isSelected = selectedServiceCode === service.code;

                return (
                  <button
                    key={service.code}
                    type="button"
                    onClick={() => {
                      setSelectedServiceCode(service.code);
                      setLookupResult(null);
                    }}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 ${
                      isSelected
                        ? 'border-2'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={isSelected ? { borderColor: color, backgroundColor: `${color}10` } : {}}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                    <span className={isSelected ? '' : 'text-gray-700'}>{service.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode: By Activity */}
          {mode === 'by-activity' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleziona AttivitĂ
              </label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca attivitĂ ..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredActivities.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Nessuna attivitĂ  trovata
                  </div>
                ) : (
                  filteredActivities.map(activity => (
                    <button
                      key={activity.id}
                      type="button"
                      onClick={() => setSelectedActivityId(activity.id)}
                      className={`w-full p-3 text-left border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                        selectedActivityId === activity.id ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900">{activity.name}</div>
                      <div className="text-sm text-gray-500">
                        {activity.email || activity.slug}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Mode: By External ID */}
          {mode === 'by-external' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account ID Esterno
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={externalAccountId}
                    onChange={(e) => {
                      setExternalAccountId(e.target.value);
                      setLookupResult(null);
                    }}
                    placeholder="es. 8461ce84-1865-4fb4-b46c-69506838d380"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleLookupExternalAccount}
                    disabled={!selectedServiceCode || !externalAccountId || lookupLoading}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {lookupLoading ? '...' : 'Cerca'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  ID dell'account nel servizio esterno (es. da review.doid.it)
                </p>
              </div>

              {/* Lookup Result */}
              {lookupResult && (
                <div className={`p-4 rounded-lg border ${
                  lookupResult.activity
                    ? 'bg-green-50 border-green-200'
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  {lookupResult.activity ? (
                    <div>
                      <div className="flex items-center gap-2 text-green-700 font-medium">
                        <Check className="w-4 h-4" />
                        AttivitĂ  trovata
                      </div>
                      <div className="mt-2 text-sm text-green-800">
                        <strong>{lookupResult.activity.name}</strong>
                        {lookupResult.activity.organization && (
                          <span className="text-green-600"> â€¢ {lookupResult.activity.organization.name}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 text-amber-700 font-medium">
                        <Search className="w-4 h-4" />
                        Nessuna attivitĂ  collegata
                      </div>
                      <p className="mt-1 text-sm text-amber-600">
                        Questo account esterno non Ă¨ ancora collegato a nessuna attivitĂ  Suite.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Create Activity Option */}
              {lookupResult && !lookupResult.activity && (
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createActivityIfNotFound}
                      onChange={(e) => setCreateActivityIfNotFound(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-medium text-gray-900">Crea nuova attivitĂ </span>
                      <p className="text-sm text-gray-500">Crea automaticamente organizzazione e attivitĂ </p>
                    </div>
                  </label>

                  {createActivityIfNotFound && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Nuova AttivitĂ
                      </label>
                      <input
                        type="text"
                        value={newActivityName}
                        onChange={(e) => setNewActivityName(e.target.value)}
                        placeholder="es. Ristorante Luna Piena"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stato Servizio
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('trial')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  status === 'trial'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <Clock className="w-4 h-4 mx-auto mb-1" />
                Trial
              </button>
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  status === 'active'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <Zap className="w-4 h-4 mx-auto mb-1" />
                Attivo (PRO)
              </button>
              <button
                type="button"
                onClick={() => setStatus('free')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  status === 'free'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <Check className="w-4 h-4 mx-auto mb-1" />
                Free
              </button>
            </div>
          </div>

          {/* Billing Cycle (only for active) */}
          {status === 'active' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ciclo Fatturazione
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    billingCycle === 'monthly'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">Mensile</div>
                  <div className="text-sm text-gray-500">Rinnovo ogni mese</div>
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    billingCycle === 'yearly'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">Annuale</div>
                  <div className="text-sm text-gray-500">Rinnovo ogni anno</div>
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Annulla
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || !isFormValid()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              'Assegnazione...'
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Assegna Servizio
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
