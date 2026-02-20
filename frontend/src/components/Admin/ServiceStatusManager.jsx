import { useState } from 'react';
import { Star, FileText, UtensilsCrossed, Monitor, Key, Check, X, Clock, Ban, Zap, AlertCircle, Pause, ExternalLink, Loader2, CreditCard, Landmark, Calendar } from 'lucide-react';
import api from '../../services/api';

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
  past_due: { label: 'IN ATTESA', bgColor: 'bg-orange-100', textColor: 'text-orange-700', icon: CreditCard },
  expired: { label: 'SCADUTO', bgColor: 'bg-orange-100', textColor: 'text-orange-700', icon: AlertCircle },
  cancelled: { label: 'CANCELLATO', bgColor: 'bg-red-100', textColor: 'text-red-700', icon: X },
  suspended: { label: 'SOSPESO', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', icon: Pause }
};

const PAYMENT_METHODS = {
  stripe: { label: 'Stripe (automatico)', icon: CreditCard, color: 'purple' },
  bonifico: { label: 'Bonifico (manuale)', icon: Landmark, color: 'amber' },
  manual: { label: 'Manuale', icon: CreditCard, color: 'gray' }
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
  onClose,
  ownerId
}) {
  const [newStatus, setNewStatus] = useState(effectiveStatus || 'inactive');
  const [billingCycle, setBillingCycle] = useState(subscription?.billingCycle || 'yearly');
  const [trialDays, setTrialDays] = useState(service.trialDays || 30);
  const [isFreePromo, setIsFreePromo] = useState(subscription?.isFreePromo || false);
  const [paymentMethod, setPaymentMethod] = useState(subscription?.paymentMethod || 'stripe');
  const [manualRenewDate, setManualRenewDate] = useState(
    subscription?.manualRenewDate ? new Date(subscription.manualRenewDate).toISOString().split('T')[0] : ''
  );
  const [paymentReference, setPaymentReference] = useState(subscription?.paymentReference || '');
  const [manualRenewNotes, setManualRenewNotes] = useState(subscription?.manualRenewNotes || '');
  const [loading, setLoading] = useState(false);
  const [accessingService, setAccessingService] = useState(false);
  const [error, setError] = useState(null);

  const handleAdminAccess = async () => {
    if (!ownerId) {
      setError('Impossibile trovare il proprietario dell\'attività');
      return;
    }

    setAccessingService(true);
    setError(null);

    try {
      const response = await api.request('/admin/access-service', {
        method: 'POST',
        body: JSON.stringify({
          userId: ownerId,
          activityId: activityId,
          serviceCode: service.code
        })
      });

      if (response.success) {
        window.open(response.data.redirectUrl, '_blank');
      } else {
        setError(response.error || 'Errore nell\'accesso al servizio');
      }
    } catch (err) {
      setError(err.message || 'Errore nell\'accesso al servizio');
    } finally {
      setAccessingService(false);
    }
  };

  const ServiceIcon = SERVICE_ICONS[service.icon] || Star;
  const statusConfig = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.inactive;
  const StatusIcon = statusConfig.icon;

  const handleUpdate = async () => {
    // Validazione frontend: bonifico richiede data rinnovo
    if (newStatus === 'pro' && paymentMethod === 'bonifico' && !manualRenewDate && !isFreePromo) {
      setError('Data di rinnovo obbligatoria per pagamenti via bonifico');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updateData = {
        status: newStatus,
        billingCycle,
        trialDays,
        isFreePromo: newStatus === 'pro' ? isFreePromo : false
      };

      // Aggiungi campi pagamento solo per PRO/TRIAL
      if (newStatus === 'pro' || newStatus === 'trial') {
        updateData.paymentMethod = paymentMethod;
        if (manualRenewDate) {
          updateData.manualRenewDate = new Date(manualRenewDate).toISOString();
        }
        if (paymentReference) {
          updateData.paymentReference = paymentReference;
        }
        if (manualRenewNotes) {
          updateData.manualRenewNotes = manualRenewNotes;
        }
      }

      await onUpdate(activityId, service.code, updateData);
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
              {subscription.paymentMethod && subscription.paymentMethod !== 'stripe' && (
                <div>
                  <span className="text-gray-500">Pagamento:</span>
                  <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                    subscription.paymentMethod === 'bonifico' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {subscription.paymentMethod === 'bonifico' ? 'Bonifico' : 'Manuale'}
                  </span>
                </div>
              )}
              {subscription.paymentReference && (
                <div>
                  <span className="text-gray-500">Rif:</span>
                  <span className="ml-2 font-medium text-xs">{subscription.paymentReference}</span>
                </div>
              )}
            </div>
          )}

          {/* Pulsante Accedi al Servizio (Admin) */}
          {ownerId && effectiveStatus !== 'inactive' && (
            <button
              onClick={handleAdminAccess}
              disabled={accessingService}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              style={{
                backgroundColor: `${service.color}15`,
                color: service.color
              }}
            >
              {accessingService ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              Accedi al Servizio
            </button>
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
                onClick={() => setNewStatus('past_due')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  newStatus === 'past_due'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-4 h-4 mx-auto mb-1" />
                In attesa
              </button>

              <button
                type="button"
                onClick={() => setNewStatus('suspended')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  newStatus === 'suspended'
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Pause className="w-4 h-4 mx-auto mb-1" />
                Sospendi
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

          {/* Past Due Info */}
          {newStatus === 'past_due' && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>In attesa di pagamento:</strong> Il cliente non ha ancora pagato ma intende continuare.
                L'accesso è bloccato fino al pagamento. Il superadmin può comunque accedere.
              </p>
            </div>
          )}

          {/* Suspended Info */}
          {newStatus === 'suspended' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Sospensione:</strong> Il servizio rimarrà bloccato ma i dati saranno mantenuti.
                Il cliente potrà riattivarlo pagando o contattando il supporto.
              </p>
            </div>
          )}

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

          {/* Billing Cycle & Payment - PRO */}
          {newStatus === 'pro' && (
            <div className="space-y-4">
              {/* Free Promo Toggle */}
              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-amber-800">
                    PRO Gratuito (Promo/Partner)
                  </label>
                  <p className="text-xs text-amber-600">Attiva PRO senza costi per questo cliente</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFreePromo(!isFreePromo)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isFreePromo ? 'bg-amber-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      isFreePromo ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {!isFreePromo && (
                <>
                  <label className="block text-sm font-medium text-gray-700">
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
                </>
              )}

              {isFreePromo && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                  <span className="text-green-700 font-medium">€0 - PRO Gratuito Illimitato</span>
                </div>
              )}
            </div>
          )}

          {/* Sezione Rinnovo e Pagamento - visibile per PRO e TRIAL (non per free promo) */}
          {(newStatus === 'pro' || newStatus === 'trial') && !isFreePromo && (
            <div className="space-y-4 pt-2 border-t">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Rinnovo e Pagamento
              </h4>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Metodo Pagamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('stripe')}
                    className={`p-3 rounded-lg border text-sm transition-colors flex items-center gap-2 ${
                      paymentMethod === 'stripe'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="font-medium">Stripe</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bonifico')}
                    className={`p-3 rounded-lg border text-sm transition-colors flex items-center gap-2 ${
                      paymentMethod === 'bonifico'
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Landmark className="w-4 h-4" />
                    <span className="font-medium">Bonifico</span>
                  </button>
                </div>
              </div>

              {/* Manual Renew Date */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Data Prossimo Rinnovo
                </label>
                <input
                  type="date"
                  value={manualRenewDate}
                  onChange={(e) => setManualRenewDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
                {paymentMethod === 'stripe' && (
                  <p className="text-xs text-gray-400 mt-1">Per Stripe la data viene gestita automaticamente. Compila solo se vuoi forzare una data specifica.</p>
                )}
              </div>

              {/* Warning: bonifico senza data */}
              {paymentMethod === 'bonifico' && !manualRenewDate && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-800">
                    <strong>Attenzione:</strong> Per i pagamenti via bonifico la data di rinnovo è obbligatoria.
                  </p>
                </div>
              )}

              {/* Payment Reference */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Riferimento Pagamento
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="es. BONIF-2026-0234 o N. fattura"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Notes */}
              {paymentMethod === 'bonifico' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Note Pagamento
                  </label>
                  <textarea
                    value={manualRenewNotes}
                    onChange={(e) => setManualRenewNotes(e.target.value)}
                    placeholder="es. Bonifico ricevuto il 20/02/2026"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm resize-none"
                  />
                </div>
              )}
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
