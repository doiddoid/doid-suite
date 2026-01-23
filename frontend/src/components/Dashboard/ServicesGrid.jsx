import { Building2 } from 'lucide-react';
import ServiceCard from './ServiceCard';

/**
 * ServicesGrid - Griglia di ServiceCard
 *
 * Props:
 * - services: array da API dashboard (ogni item ha: service, subscription, isActive, canAccess, hasLinkedAccount)
 * - onAccessService: (serviceCode) => void
 * - onActivateTrialService: (serviceCode) => void
 * - onChoosePlanService: (serviceCode) => void
 * - onConfigureService: (serviceCode) => void
 * - loading: boolean
 */
export default function ServicesGrid({
  services = [],
  onAccessService,
  onActivateTrialService,
  onChoosePlanService,
  onConfigureService,
  loading = false
}) {
  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg" />
              <div className="w-16 h-6 bg-gray-200 rounded-full" />
            </div>
            <div className="h-5 bg-gray-200 rounded mb-2 w-3/4" />
            <div className="h-4 bg-gray-200 rounded mb-4 w-full" />
            <div className="h-4 bg-gray-200 rounded mb-4 w-2/3" />
            <div className="h-10 bg-gray-200 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (services.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nessun servizio disponibile
        </h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          Al momento non ci sono servizi DOID disponibili.
          Riprova più tardi o contatta il supporto.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {services.map((item) => (
        <ServiceCard
          key={item.service.id || item.service.code}
          service={item.service}
          subscription={item.subscription}
          isActive={item.isActive}
          canAccess={item.canAccess}
          hasLinkedAccount={item.hasLinkedAccount !== false}
          onAccess={() => onAccessService?.(item.service.code)}
          onActivateTrial={() => onActivateTrialService?.(item.service.code)}
          onChoosePlan={() => onChoosePlanService?.(item.service.code)}
          onConfigure={() => onConfigureService?.(item.service.code)}
        />
      ))}
    </div>
  );
}
