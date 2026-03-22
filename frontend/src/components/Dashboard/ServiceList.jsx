import { useState } from 'react';
import { Star, FileText, UtensilsCrossed, ChevronRight, Zap, CreditCard, Crown, Plus, Loader2 } from 'lucide-react';

/**
 * ServiceList — Vista "Per cliente"
 *
 * Mostra stats row + lista servizi per l'attività selezionata.
 * Click su servizio attivo → deep-link JWT (onOpenService).
 *
 * Props:
 * - services: array da API dashboard (ogni item ha: service, subscription, isActive, canAccess)
 * - onOpenService: (activityId, serviceCode) => void — deep-link JWT già implementato
 * - onActivateTrial: (serviceCode) => void
 * - activityId: string
 * - loading: boolean
 */

// Ordine fisso servizi + config colori brand DOID
const SERVICE_CONFIG = [
  {
    code: 'review',
    name: 'Smart Review',
    description: 'Gestisci le recensioni',
    icon: Star,
    color: '#EF9F27',
    bgColor: 'bg-amber-50',
  },
  {
    code: 'page',
    name: 'Smart Page',
    description: 'Biglietto da visita digitale',
    icon: FileText,
    color: '#85B7EB',
    bgColor: 'bg-blue-50',
  },
  {
    code: 'menu',
    name: 'Menu Digitale',
    description: 'Menu digitale per ristoranti',
    icon: UtensilsCrossed,
    color: '#97C459',
    bgColor: 'bg-green-50',
  },
];

export default function ServiceList({
  services = [],
  onOpenService,
  onActivateTrial,
  activityId,
  loading = false,
}) {
  const [loadingService, setLoadingService] = useState(null);

  // Mappa servizi per code
  const servicesMap = {};
  services.forEach((s) => {
    servicesMap[s.service.code] = s;
  });

  // Calcola stats
  const activeCount = services.filter(
    (s) => s.isActive && ['review', 'page', 'menu'].includes(s.service.code)
  ).length;

  const proCount = services.filter(
    (s) =>
      s.subscription?.status === 'active' &&
      s.subscription?.plan?.code !== 'free' &&
      ['review', 'page', 'menu'].includes(s.service.code)
  ).length;

  const highestPlan = proCount > 0 ? 'PRO' : activeCount > 0 ? 'Free' : '—';
  const monthlySpend = Math.round(proCount * 14.9);

  // Servizi attivi (hanno subscription attiva/trial/free) — mostrati nella lista principale
  const activeServiceConfigs = SERVICE_CONFIG.filter((cfg) => {
    const s = servicesMap[cfg.code];
    return s && (s.isActive || s.canAccess);
  });

  // Servizi non attivi (nessuna subscription o scaduta) — mostrati in "Aggiungi servizio"
  const inactiveServices = SERVICE_CONFIG.filter((cfg) => {
    const s = servicesMap[cfg.code];
    return !s || (!s.isActive && !s.canAccess);
  });

  const handleOpenService = async (serviceCode) => {
    if (loadingService) return;
    setLoadingService(serviceCode);
    try {
      await onOpenService?.(activityId, serviceCode);
    } finally {
      setLoadingService(null);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-7 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-1" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Servizi attivi</p>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6" style={{ color: '#22c55e' }} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Piano</p>
              <p className="text-2xl font-bold text-gray-900">{highestPlan}</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6" style={{ color: '#f59e0b' }} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Spesa mensile</p>
              <p className="text-2xl font-bold text-gray-900">€{monthlySpend}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6" style={{ color: '#3b82f6' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Service Rows — solo servizi con subscription attiva/trial/free */}
      {activeServiceConfigs.length > 0 && (
        <div className="space-y-2">
          {activeServiceConfigs.map((cfg) => {
            const serviceData = servicesMap[cfg.code];
            const isClickable = serviceData?.canAccess || serviceData?.isActive || false;
            const planName = serviceData?.subscription?.plan?.name || null;
            const status = serviceData?.subscription?.status || null;
            const isLoading = loadingService === cfg.code;
            const Icon = cfg.icon;

            const planBadge = status === 'trial' ? 'TRIAL' : status === 'active' ? (planName || 'PRO') : 'FREE';
            const badgeStyle = status === 'trial'
              ? 'bg-blue-100 text-blue-700'
              : status === 'active' && serviceData?.subscription?.plan?.code !== 'free'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-green-100 text-green-700';

            return (
              <button
                key={cfg.code}
                onClick={() => isClickable && handleOpenService(cfg.code)}
                disabled={!isClickable || isLoading}
                className={`
                  w-full flex items-center gap-4 bg-white rounded-xl border border-gray-100 px-5 py-4
                  transition-all duration-200 text-left group
                  hover:shadow-md hover:border-gray-200 cursor-pointer
                `}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cfg.bgColor}`}>
                  <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                </div>

                {/* Name + Description */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{cfg.name}</p>
                  <p className="text-xs text-gray-500 truncate">{cfg.description}</p>
                </div>

                {/* Badge */}
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeStyle}`}>
                  {planBadge}
                </span>

                {/* Arrow / Loading */}
                {isLoading ? (
                  <Loader2 className="w-4 h-4 text-teal-500 animate-spin flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-teal-500 transition-colors flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Aggiungi Servizio */}
      {inactiveServices.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Aggiungi servizio
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {inactiveServices.map((cfg) => {
              const Icon = cfg.icon;
              return (
                <button
                  key={cfg.code}
                  onClick={() => onActivateTrial?.(cfg.code)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-all group"
                >
                  <div className={`w-8 h-8 rounded-lg ${cfg.bgColor} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-teal-700">{cfg.name}</p>
                    <p className="text-[11px] text-teal-600 font-medium">Attiva gratis</p>
                  </div>
                  <Plus className="w-4 h-4 text-gray-400 group-hover:text-teal-500" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
