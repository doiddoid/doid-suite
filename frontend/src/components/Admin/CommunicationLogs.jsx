import { useState } from 'react';
import { Mail, Webhook, Shield, Settings, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown, Filter } from 'lucide-react';

const TYPE_CONFIG = {
  email: { label: 'Email', icon: Mail, bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
  webhook: { label: 'Webhook', icon: Webhook, bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
  admin_action: { label: 'Admin', icon: Shield, bgColor: 'bg-orange-100', textColor: 'text-orange-600' },
  system: { label: 'Sistema', icon: Settings, bgColor: 'bg-gray-100', textColor: 'text-gray-600' }
};

const STATUS_CONFIG = {
  pending: { label: 'In attesa', icon: Clock, bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  sent: { label: 'Inviato', icon: CheckCircle, bgColor: 'bg-green-100', textColor: 'text-green-700' },
  completed: { label: 'Completato', icon: CheckCircle, bgColor: 'bg-green-100', textColor: 'text-green-700' },
  failed: { label: 'Fallito', icon: XCircle, bgColor: 'bg-red-100', textColor: 'text-red-700' },
  delivered: { label: 'Consegnato', icon: CheckCircle, bgColor: 'bg-teal-100', textColor: 'text-teal-700' }
};

const EVENT_LABELS = {
  trial_started: 'Trial Avviato',
  trial_expiring_1d: 'Trial in scadenza (1g)',
  trial_expiring_3d: 'Trial in scadenza (3g)',
  trial_expiring_7d: 'Trial in scadenza (7g)',
  trial_expired: 'Trial Scaduto',
  subscription_activated: 'Abbonamento Attivato',
  subscription_cancelled: 'Abbonamento Cancellato',
  subscription_expired: 'Abbonamento Scaduto',
  payment_failed: 'Pagamento Fallito',
  payment_success: 'Pagamento Riuscito',
  service_status_changed: 'Stato Servizio Modificato',
  activity_created: 'Attivita Creata',
  activity_deleted: 'Attivita Eliminata'
};

export default function CommunicationLogs({
  logs = [],
  pagination,
  filters,
  onFilterChange,
  onLoadMore,
  loading
}) {
  const [expandedLog, setExpandedLog] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventLabel = (event) => {
    return EVENT_LABELS[event] || event;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Log Comunicazioni</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
              showFilters ? 'bg-purple-50 border-purple-200 text-purple-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtri
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
              <select
                value={filters?.type || ''}
                onChange={(e) => onFilterChange({ ...filters, type: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">Tutti</option>
                <option value="email">Email</option>
                <option value="webhook">Webhook</option>
                <option value="admin_action">Admin</option>
                <option value="system">Sistema</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Evento</label>
              <select
                value={filters?.event || ''}
                onChange={(e) => onFilterChange({ ...filters, event: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">Tutti</option>
                {Object.entries(EVENT_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Logs List */}
      <div className="divide-y divide-gray-100">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nessun log trovato</p>
          </div>
        ) : (
          logs.map((log) => {
            const typeConfig = TYPE_CONFIG[log.type] || TYPE_CONFIG.system;
            const statusConfig = STATUS_CONFIG[log.status] || STATUS_CONFIG.pending;
            const TypeIcon = typeConfig.icon;
            const StatusIcon = statusConfig.icon;
            const isExpanded = expandedLog === log.id;

            return (
              <div key={log.id} className="hover:bg-gray-50 transition-colors">
                <button
                  onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start gap-3">
                    {/* Type Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeConfig.bgColor}`}>
                      <TypeIcon className={`w-5 h-5 ${typeConfig.textColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {getEventLabel(log.event)}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                        {log.activityName && (
                          <span>Attivita: {log.activityName}</span>
                        )}
                        {log.recipient && (
                          <span>A: {log.recipient}</span>
                        )}
                      </div>

                      {log.subject && (
                        <p className="mt-1 text-sm text-gray-600 truncate">{log.subject}</p>
                      )}
                    </div>

                    {/* Expand Arrow */}
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 pl-16">
                    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                      {log.subject && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase">Oggetto</span>
                          <p className="text-sm text-gray-900">{log.subject}</p>
                        </div>
                      )}

                      {log.recipient && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase">Destinatario</span>
                          <p className="text-sm text-gray-900">{log.recipient}</p>
                        </div>
                      )}

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase">Dettagli</span>
                          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs text-gray-700 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}

                      <div className="flex gap-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
                        <span>ID: {log.id.substring(0, 8)}...</span>
                        {log.sentAt && <span>Inviato: {formatDate(log.sentAt)}</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Load More */}
      {pagination && logs.length < pagination.total && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 disabled:opacity-50"
          >
            {loading ? 'Caricamento...' : `Carica altri (${pagination.total - logs.length} rimanenti)`}
          </button>
        </div>
      )}
    </div>
  );
}
