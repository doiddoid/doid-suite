import { useState } from 'react';
import { Star, FileText, UtensilsCrossed, Monitor, Key, Check, X, Clock, Ban, Zap, AlertCircle } from 'lucide-react';

const SERVICE_ICONS = {
  star: Star,
  'file-text': FileText,
  utensils: UtensilsCrossed,
  monitor: Monitor,
  key: Key
};

const STATUS_CONFIG = {
  inactive: { label: 'Non Attivo', bgColor: 'bg-gray-100', textColor: 'text-gray-600', icon: Ban },
  free: { label: 'FREE', bgColor: 'bg-green-100', textColor: 'text-green-700', icon: Check },
  trial: { label: 'TRIAL', bgColor: 'bg-blue-100', textColor: 'text-blue-700', icon: Clock },
  pro: { label: 'PRO', bgColor: 'bg-purple-100', textColor: 'text-purple-700', icon: Zap },
  active: { label: 'PRO', bgColor: 'bg-purple-100', textColor: 'text-purple-700', icon: Zap },
  expired: { label: 'SCADUTO', bgColor: 'bg-orange-100', textColor: 'text-orange-700', icon: AlertCircle },
  cancelled: { label: 'CANCELLATO', bgColor: 'bg-red-100', textColor: 'text-red-700', icon: X }
};

export default function ServiceStatusManager({
  activityId,
  activityName,
  service,
  subscription,
  effectiveStatus,
  isActive,
  daysRemaining,
  onUpdate,
  onClose
}) {
  const [newStatus, setNewStatus] = useState(effectiveStatus || 'inactive');
  const [billingCycle, setBillingCycle] = useState(subscription?.billingCycle || 'yearly');
  const [trialDays, setTrialDays] = useState(service.trialDays || 30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ServiceIcon = SERVICE_ICONS[service.icon] || Star;
  const statusConfig = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.inactive;
  const StatusIcon = statusConfig.icon;

  const handleUpdate = async () => {
    setLoading(true);
    setError(null);

    try {
      await onUpdate(activityId, service.code, {
        status: newStatus,
        billingCycle,
        trialDays
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Errore nell\'aggiornamento');
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${service.color}20` }}
            >
              <ServiceIcon className="w-6 h-6" style={{ color: service.color }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
              <p className="text-sm text-gray-500">{activityName}</p>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="p-6 border-b bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Stato Attuale</h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                <StatusIcon className="w-4 h-4" />
                {statusConfig.label}
              </span>
              {isActive && daysRemaining !== null && (
                <span className="text-sm text-gray-500">
                  ({daysRemaining} giorni rimanenti)
                </span>
              )}
            </div>
          </div>

          {subscription && (
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              {subscription.trialEndsAt && effectiveStatus === 'trial' && (
                <div>
                  <span className="text-gray-500">Scade Trial:</span>
                  <span className="ml-2 font-medium">{formatDate(subscription.trialEndsAt)}</span>
                </div>
              )}
              {subscription.currentPeriodEnd && effectiveStatus === 'pro' && (
                <div>
                  <span className="text-gray-500">Rinnovo:</span>
                  <span className="ml-2 font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
                </div>
              )}
              {subscription.billingCycle && (
                <div>
                  <span className="text-gray-500">Ciclo:</span>
                  <span className="ml-2 font-medium">
                    {subscription.billingCycle === 'yearly' ? 'Annuale' : 'Mensile'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Update Form */}
        <div className="p-6 space-y-5">
          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nuovo Stato
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewStatus('inactive')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  newStatus === 'inactive'
                    ? 'border-gray-500 bg-gray-100 text-gray-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Ban className="w-4 h-4 mx-auto mb-1" />
                Non Attivo
              </button>

              {service.hasFree && (
                <button
                  type="button"
                  onClick={() => setNewStatus('free')}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    newStatus === 'free'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Check className="w-4 h-4 mx-auto mb-1" />
                  FREE
                </button>
              )}

              <button
                type="button"
                onClick={() => setNewStatus('trial')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  newStatus === 'trial'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Clock className="w-4 h-4 mx-auto mb-1" />
                TRIAL
              </button>

              <button
                type="button"
                onClick={() => setNewStatus('pro')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  newStatus === 'pro'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Zap className="w-4 h-4 mx-auto mb-1" />
                PRO
              </button>

              <button
                type="button"
                onClick={() => setNewStatus('cancelled')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  newStatus === 'cancelled'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <X className="w-4 h-4 mx-auto mb-1" />
                Cancella
              </button>
            </div>
          </div>

          {/* Trial Days */}
          {newStatus === 'trial' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durata Trial (giorni)
              </label>
              <input
                type="number"
                value={trialDays}
                onChange={(e) => setTrialDays(parseInt(e.target.value) || 30)}
                min={1}
                max={90}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Billing Cycle */}
          {newStatus === 'pro' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ciclo Fatturazione
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`p-4 rounded-lg border text-center transition-colors ${
                    billingCycle === 'monthly'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">
                    €{service.priceMonthly}/mese
                  </div>
                  <div className="text-sm text-gray-500">Mensile</div>
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`p-4 rounded-lg border text-center transition-colors ${
                    billingCycle === 'yearly'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">
                    €{service.priceYearly}/anno
                  </div>
                  <div className="text-sm text-gray-500">
                    Annuale <span className="text-green-600">(-17%)</span>
                  </div>
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
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>
        </div>
      </div>
    </div>
  );
}
