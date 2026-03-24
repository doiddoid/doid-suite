import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Building2, Plus, AlertTriangle, RefreshCw } from 'lucide-react';
import { useActivities } from '../hooks/useActivities';
import { DashboardStats, ServicesGrid, ClientGrid, ContactModal, ExpiringServicesAlert } from '../components/Dashboard';
import { PlanModal } from '../components/Services';
import { CONTACT_REQUIRED_SERVICES } from '../config/services';

export default function Dashboard() {
  const {
    currentActivity,
    activities,
    loading: activitiesLoading,
    switchActivity,
    getServicesDashboard,
    getSubscriptionStats,
    activateTrial,
    activateSubscription,
    accessService
  } = useActivities();

  const [services, setServices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [contactService, setContactService] = useState(null);

  // Vista corrente: "client" (per cliente) o "service" (panoramica, solo agenzia)
  const [currentView, setCurrentView] = useState('client');

  // Cache servizi per tutti i clienti (per ClientGrid)
  const [allServicesMap, setAllServicesMap] = useState({});

  // Euristica tipo account: ≥2 attività = agenzia
  // TODO: sostituire con campo esplicito da Supabase (es. user.is_agency) quando disponibile
  const isAgency = activities.length >= 2;

  // Carica servizi per attività corrente
  const loadDashboardData = useCallback(async () => {
    if (!currentActivity?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [servicesResult, statsResult] = await Promise.all([
        getServicesDashboard(),
        getSubscriptionStats()
      ]);

      if (servicesResult.success) {
        setServices(servicesResult.data || []);
        setAllServicesMap(prev => ({ ...prev, [currentActivity.id]: servicesResult.data }));
      } else {
        setError(servicesResult.error);
      }

      if (statsResult.success) {
        setStats(statsResult.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentActivity?.id, getServicesDashboard]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Quando cambia l'attività selezionata, mostra la vista "Per cliente"
  useEffect(() => {
    if (currentActivity?.id) {
      setCurrentView('client');
    }
  }, [currentActivity?.id]);

  // Carica servizi per tutte le attività (per vista "Per servizio")
  useEffect(() => {
    if (!isAgency) return;

    const loadAllServices = async () => {
      for (const activity of activities) {
        if (allServicesMap[activity.id]) continue;
        try {
          const result = await getServicesDashboard(activity.id);
          if (result.success) {
            setAllServicesMap(prev => ({ ...prev, [activity.id]: result.data }));
          }
        } catch {
          // silently skip
        }
      }
    };

    loadAllServices();
  }, [isAgency, activities, getServicesDashboard]);

  // Separa servizi "miei" da "disponibili" (come layout precedente)
  const { myServices, availableServices } = useMemo(() => {
    const filtered = services.filter(s => s.service.isActive !== false);

    const mine = filtered
      .filter(s => s.subscription)
      .sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return (a.service.sortOrder || 0) - (b.service.sortOrder || 0);
      });

    const available = filtered
      .filter(s => !s.subscription)
      .sort((a, b) => (a.service.sortOrder || 0) - (b.service.sortOrder || 0));

    return { myServices: mine, availableServices: available };
  }, [services]);

  // Handlers
  const handleAccessService = async (serviceCode) => {
    const result = await accessService(serviceCode);
    if (!result.success) {
      alert(result.error || 'Impossibile aprire il servizio. Riprova.');
    }
  };

  const handleActivateTrial = async (serviceCode) => {
    const result = await activateTrial(serviceCode);
    if (result.success) {
      loadDashboardData();
    } else {
      alert(result.error || 'Errore nell\'attivazione del trial');
    }
  };

  const handleChoosePlan = (serviceCode) => {
    const service = services.find(s => s.service.code === serviceCode);
    if (service) setSelectedService(service);
  };

  const handleRenew = (serviceCode) => {
    const serviceItem = services.find(s => s.service.code === serviceCode);
    const serviceName = serviceItem?.service?.name || serviceCode;
    const paymentUrl = serviceItem?.service?.paymentUrl;
    const activityName = currentActivity?.name || '';
    const billingCycle = serviceItem?.subscription?.billingCycle || 'monthly';
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

  const handleConfigureService = async (serviceCode) => {
    const result = await accessService(serviceCode);
    if (!result.success) {
      alert(result.error || 'Errore nell\'accesso al servizio');
    }
  };

  const handleRequestInfo = (serviceCode) => {
    const apiService = services.find(s => s.service.code === serviceCode);
    if (apiService) {
      setContactService(apiService.service);
    } else if (CONTACT_REQUIRED_SERVICES[serviceCode]) {
      setContactService(CONTACT_REQUIRED_SERVICES[serviceCode]);
    }
  };

  const handleSelectActivityFromGrid = (activityId) => {
    const activity = activities.find(a => a.id === activityId);
    if (activity) {
      switchActivity(activity);
      setCurrentView('client');
    }
  };

  // Nessuna attività
  if (!activitiesLoading && !currentActivity) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Nessuna attività
          </h2>
          <p className="text-gray-500 mb-6">
            {activities.length === 0
              ? 'Crea la tua prima attività per iniziare ad utilizzare i servizi doID.'
              : 'Seleziona un\'attività dal menu per visualizzare i servizi.'}
          </p>
          {activities.length === 0 && (
            <Link to="/activities/new" className="btn-primary inline-flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Crea Attività
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Loading
  if (activitiesLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Errore nel caricamento</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={loadDashboardData} className="btn-primary inline-flex items-center">
            <RefreshCw className="w-4 h-4 mr-2" />
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Topbar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentView === 'client'
              ? (currentActivity?.name || 'Dashboard')
              : 'Panoramica clienti'
            }
          </h1>
          <p className="text-gray-500 mt-1">
            {currentView === 'client'
              ? 'Gestisci i servizi doID per questo cliente'
              : `${activities.length} clienti nella tua agenzia`
            }
          </p>
        </div>

        {/* Toggle vista (solo agenzia) */}
        {isAgency && (
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCurrentView('client')}
              className={`
                px-4 py-2 text-sm font-medium rounded-md transition-all
                ${currentView === 'client'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              Per cliente
            </button>
            <button
              onClick={() => setCurrentView('service')}
              className={`
                px-4 py-2 text-sm font-medium rounded-md transition-all
                ${currentView === 'service'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              Per servizio
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {currentView === 'service' && isAgency ? (
        <ClientGrid
          activities={activities}
          currentActivityId={currentActivity?.id}
          onSelectActivity={handleSelectActivityFromGrid}
          servicesMap={allServicesMap}
        />
      ) : (
        <>
          {/* Stats */}
          <DashboardStats stats={stats} />

          {/* Servizi scaduti / in scadenza */}
          <ExpiringServicesAlert
            services={services}
            activityName={currentActivity?.name || ''}
            allServicesMap={isAgency ? allServicesMap : null}
            activities={activities}
          />

          {/* I tuoi servizi attivi */}
          {myServices.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">I tuoi servizi</h2>
              <ServicesGrid
                services={myServices}
                onAccessService={handleAccessService}
                onActivateTrialService={handleActivateTrial}
                onChoosePlanService={handleChoosePlan}
                onRenewService={handleRenew}
                onConfigureService={handleConfigureService}
                onRequestInfoService={handleRequestInfo}
              />
            </div>
          )}

          {/* Scopri gli altri servizi */}
          {availableServices.length > 0 && (
            <div className="mb-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Scopri gli altri servizi</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Potenzia la tua attività con i servizi digitali doID
                </p>
              </div>
              <ServicesGrid
                services={availableServices}
                onAccessService={handleAccessService}
                onActivateTrialService={handleActivateTrial}
                onChoosePlanService={handleChoosePlan}
                onRenewService={handleRenew}
                onConfigureService={handleConfigureService}
                onRequestInfoService={handleRequestInfo}
              />
            </div>
          )}
        </>
      )}

      {/* Plan Modal */}
      {selectedService && (
        <PlanModal
          service={selectedService.service}
          hasPhysicalProduct={selectedService.hasPhysicalProduct || false}
          onClose={() => setSelectedService(null)}
          onActivate={async (planCode, billingCycle) => {
            const result = await activateSubscription(
              selectedService.service.code,
              planCode,
              billingCycle
            );
            if (result.success) {
              setSelectedService(null);
              loadDashboardData();
            } else {
              alert(result.error || 'Errore nell\'attivazione dell\'abbonamento');
            }
          }}
        />
      )}

      {/* Contact Modal */}
      {contactService && (
        <ContactModal
          service={contactService}
          onClose={() => setContactService(null)}
        />
      )}
    </div>
  );
}
