import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Building2, Plus, AlertTriangle, RefreshCw } from 'lucide-react';
import { useActivities } from '../hooks/useActivities';
import { DashboardStats, ServicesGrid, WelcomeBanner, ContactModal } from '../components/Dashboard';
import { PlanModal } from '../components/Services';
import { CONTACT_REQUIRED_SERVICES } from '../config/services';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    currentActivity,
    activities,
    loading: activitiesLoading,
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

  // Carica servizi e statistiche
  const loadDashboardData = useCallback(async () => {
    if (!currentActivity?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Carica servizi e stats in parallelo
      const [servicesResult, statsResult] = await Promise.all([
        getServicesDashboard(),
        getSubscriptionStats()
      ]);

      if (servicesResult.success) {
        setServices(servicesResult.data || []);
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
  }, [currentActivity?.id, getServicesDashboard, getSubscriptionStats]);

  // Ricarica dati quando cambia l'attività
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handlers
  const handleAccessService = async (serviceCode) => {
    const result = await accessService(serviceCode);
    if (!result.success) {
      alert(result.error || 'Errore nell\'accesso al servizio');
    }
    // Se success, il redirect è già stato fatto in accessService
  };

  const handleActivateTrial = async (serviceCode) => {
    const result = await activateTrial(serviceCode);
    if (result.success) {
      // Ricarica dashboard
      loadDashboardData();
    } else {
      alert(result.error || 'Errore nell\'attivazione del trial');
    }
  };

  const handleChoosePlan = (serviceCode) => {
    const service = services.find(s => s.service.code === serviceCode);
    if (service) {
      setSelectedService(service);
    }
  };

  const handleConfigureService = async (serviceCode) => {
    // Per configurare/riconfigurare un servizio, usa lo stesso flusso di accesso
    // che genererà il token SSO e permetterà di creare/collegare l'account
    const result = await accessService(serviceCode);
    if (!result.success) {
      alert(result.error || 'Errore nell\'accesso al servizio per la configurazione');
    }
  };

  const handleRequestInfo = (serviceCode) => {
    // Cerca prima nei servizi API, poi nei contact_required statici
    const apiService = services.find(s => s.service.code === serviceCode);
    if (apiService) {
      setContactService(apiService.service);
    } else if (CONTACT_REQUIRED_SERVICES[serviceCode]) {
      setContactService(CONTACT_REQUIRED_SERVICES[serviceCode]);
    }
  };

  const handleSubscribe = async (planCode, billingCycle) => {
    if (!selectedService) return;

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
  };

  // Separa servizi "tuoi" (con subscription) da quelli disponibili (mai attivati)
  const { myServices, availableServices } = useMemo(() => {
    const filtered = services.filter(s => s.service.isActive !== false);

    // "I tuoi servizi": tutti quelli con una subscription (attiva, free, trial, scaduta, sospesa, etc.)
    // Include: active, trial, free, expired, canceled, past_due, suspended
    const mine = filtered
      .filter(s => s.subscription !== null && s.subscription !== undefined)
      .sort((a, b) => {
        // Prima i servizi attivi, poi gli altri per sortOrder
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return (a.service.sortOrder || 0) - (b.service.sortOrder || 0);
      });

    // "Scopri altri servizi": quelli senza subscription (mai attivati)
    const available = filtered
      .filter(s => s.subscription === null || s.subscription === undefined)
      .sort((a, b) => (a.service.sortOrder || 0) - (b.service.sortOrder || 0));

    return { myServices: mine, availableServices: available };
  }, [services]);

  // Calcola se mostrare welcome banner (solo se non ha MAI attivato servizi)
  const hasMyServices = myServices.length > 0;
  const showWelcomeBanner = !loading && !hasMyServices && services.length > 0;

  // Nessuna attività selezionata
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

  // Loading state
  if (loading || activitiesLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Caricamento servizi...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Errore nel caricamento
          </h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={loadDashboardData}
            className="btn-primary inline-flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Welcome Banner */}
      <WelcomeBanner
        activityName={currentActivity?.name}
        show={showWelcomeBanner}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {currentActivity?.name || 'Dashboard'}
        </h1>
        <p className="text-gray-500 mt-1">
          Gestisci i tuoi servizi doID da un'unica dashboard
        </p>
      </div>

      {/* Stats */}
      <DashboardStats stats={stats} />

      {/* I tuoi servizi (attivati, free, trial, scaduti, sospesi) */}
      {myServices.length > 0 && (
        <div id="my-services-section" className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">I tuoi servizi</h2>
          <ServicesGrid
            services={myServices}
            onAccessService={handleAccessService}
            onActivateTrialService={handleActivateTrial}
            onChoosePlanService={handleChoosePlan}
            onConfigureService={handleConfigureService}
            onRequestInfoService={handleRequestInfo}
            loading={loading}
          />
        </div>
      )}

      {/* Servizi Disponibili */}
      {availableServices.length > 0 && (
        <div id="available-services-section" className="mb-6">
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
            onConfigureService={handleConfigureService}
            onRequestInfoService={handleRequestInfo}
            loading={loading}
          />
        </div>
      )}

      {/* Plan Modal */}
      {selectedService && (
        <PlanModal
          service={selectedService.service}
          onClose={() => setSelectedService(null)}
          onActivate={handleSubscribe}
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
