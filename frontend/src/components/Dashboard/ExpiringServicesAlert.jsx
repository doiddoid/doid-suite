import { AlertTriangle, Clock, RefreshCw, MessageCircle } from 'lucide-react';

/**
 * ExpiringServicesAlert - Sezione che mostra servizi scaduti o in scadenza
 *
 * Props:
 * - services: array dal dashboard (service, subscription, isActive)
 * - activityName: nome attività corrente
 * - allServicesMap: { activityId: servicesArray } per tutte le attività (agenzia)
 * - activities: array attività (per risolvere nomi)
 * - daysThreshold: giorni prima della scadenza per mostrare (default: 30)
 */
export default function ExpiringServicesAlert({
  services = [],
  activityName = '',
  allServicesMap = null,
  activities = [],
  daysThreshold = 30
}) {
  // Raccoglie servizi scaduti/in scadenza da tutte le attività se agenzia, altrimenti solo corrente
  const alerts = getAlerts(services, activityName, allServicesMap, activities, daysThreshold);

  if (alerts.length === 0) return null;

  // Ordina: scaduti prima, poi per data più vicina
  alerts.sort((a, b) => {
    if (a.isExpired && !b.isExpired) return -1;
    if (!a.isExpired && b.isExpired) return 1;
    return (a.date?.getTime() || 0) - (b.date?.getTime() || 0);
  });

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 bg-amber-100/60 border-b border-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <h3 className="text-sm font-semibold text-amber-800">
          Servizi in scadenza / scaduti
        </h3>
        <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-200 px-2 py-0.5 rounded-full">
          {alerts.length}
        </span>
      </div>

      {/* Lista */}
      <div className="divide-y divide-amber-200/60">
        {alerts.map((alert, i) => (
          <AlertRow key={i} alert={alert} />
        ))}
      </div>
    </div>
  );
}

function getAlerts(services, activityName, allServicesMap, activities, daysThreshold) {
  const alerts = [];
  const now = new Date();

  const processServiceList = (serviceList, actName) => {
    for (const item of serviceList) {
      const sub = item.subscription;
      if (!sub) continue;

      // Solo piani a pagamento (escludi free)
      if (sub.plan?.code === 'free') continue;

      const status = sub.status;
      let date = null;
      let isExpired = false;
      let isExpiring = false;

      if (status === 'expired' || status === 'canceled' || status === 'suspended') {
        isExpired = true;
        date = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
      } else if (status === 'trial') {
        date = sub.trialEndsAt ? new Date(sub.trialEndsAt) : null;
        if (date && date <= now) {
          isExpired = true;
        } else if (date) {
          const daysLeft = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
          if (daysLeft <= daysThreshold) {
            isExpiring = true;
          }
        }
      } else if (status === 'active') {
        date = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
        if (date) {
          const daysLeft = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
          if (daysLeft <= daysThreshold) {
            isExpiring = true;
          }
        }
      }

      if (isExpired || isExpiring) {
        alerts.push({
          serviceName: item.service.name,
          serviceCode: item.service.code,
          paymentUrl: item.service.paymentUrl || null,
          activityName: actName,
          date,
          isExpired,
          status,
          billingCycle: sub.billingCycle || 'monthly'
        });
      }
    }
  };

  // Se agenzia con allServicesMap, mostra per tutte le attività
  if (allServicesMap && Object.keys(allServicesMap).length > 0) {
    for (const [actId, svcList] of Object.entries(allServicesMap)) {
      const act = activities.find(a => a.id === actId);
      const name = act?.name || 'Attività';
      processServiceList(svcList, name);
    }
  } else {
    // Utente singolo: solo attività corrente
    processServiceList(services, activityName);
  }

  return alerts;
}

function AlertRow({ alert }) {
  const { serviceName, paymentUrl, activityName, date, isExpired, billingCycle } = alert;

  const formattedDate = date
    ? date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';

  const handleRenew = () => {
    const ciclo = billingCycle === 'yearly' ? 'annuale' : 'mensile';

    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
    } else {
      const msg = encodeURIComponent(
        `Ciao, vorrei rinnovare/attivare il servizio *${serviceName}* per l'attività *${activityName}* (ciclo: ${ciclo}). Grazie!`
      );
      window.open(`https://wa.me/393480890477?text=${msg}`, '_blank');
    }
  };

  return (
    <div className="flex items-center justify-between px-5 py-3 gap-4">
      {/* Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {isExpired ? (
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
        ) : (
          <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {serviceName}
            <span className="font-normal text-gray-500"> — {activityName}</span>
          </p>
          <p className={`text-xs ${isExpired ? 'text-red-600 font-medium' : 'text-amber-600'}`}>
            {isExpired ? `Scaduto il ${formattedDate}` : `Scade il ${formattedDate}`}
          </p>
        </div>
      </div>

      {/* Bottone Rinnova */}
      <button
        onClick={handleRenew}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex-shrink-0 ${
          isExpired
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-amber-500 text-white hover:bg-amber-600'
        }`}
      >
        {paymentUrl ? (
          <>
            <RefreshCw className="w-3.5 h-3.5" />
            Rinnova
          </>
        ) : (
          <>
            <MessageCircle className="w-3.5 h-3.5" />
            Richiedi rinnovo
          </>
        )}
      </button>
    </div>
  );
}
