import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Building2, Plus, AlertTriangle, RefreshCw } from 'lucide-react';
import { useActivities } from '../hooks/useActivities';
import { useMyServices } from '../hooks/useMyServices';
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

  // CHECKPOINT: useMyServices hook test
  const {
    services: myServices,
    totals: myTotals,
    loading: myServicesLoading,
    error: myServicesError
  } = useMyServices();

  // CHECKPOINT: Log useMyServices data
  useEffect(() => {
    if (!myServicesLoading) {
      console.log('[useMyServices] services:', myServices);
      console.log('[useMyServices] totals:', myTotals);
      if (myServicesError) {
        console.error('[useMyServices] error:', myServicesError);
      }
    }
  }, [myServices, myTotals, myServicesLoading, myServicesError]);

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

  // Combina servizi API con servizi contact_required
  const allServices = useMemo(() => {
    // Ordine desiderato: attivabili prima, poi contact_required
    const SERVICE_ORDER = [
      'smart_review',
      'smart_page',
      'menu_digitale',
      'display_suite',
      'smart_agent_ai',
      'smart_connect'
    ];

    // Servizi dall'API
    const apiServiceCodes = services.map(s => s.service.code);

    // Aggiungi servizi contact_required che non sono già presenti
    const contactRequiredItems = Object.values(CONTACT_REQUIRED_SERVICES)
      .filter(s => !apiServiceCodes.includes(s.code))
      .map(service => ({
        service,
        subscription: null,
        isActive: false,
        canAccess: false,
        hasLinkedAccount: false
      }));

    const combined = [...services, ...contactRequiredItems];

    // Ordina secondo l'ordine definito
    return combined.sort((a, b) => {
      const indexA = SERVICE_ORDER.indexOf(a.service.code);
      const indexB = SERVICE_ORDER.indexOf(b.service.code);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }, [services]);

  // Calcola se mostrare welcome banner
  const hasActiveServices = services.some(s => s.isActive);
  const showWelcomeBanner = !loading && !hasActiveServices && services.length > 0;

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
        onExplore={() => {
          document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
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

      {/* Services Grid */}
      <div id="services-section" className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">I tuoi servizi</h2>
        <ServicesGrid
          services={allServices}
          onAccessService={handleAccessService}
          onActivateTrialService={handleActivateTrial}
          onChoosePlanService={handleChoosePlan}
          onConfigureService={handleConfigureService}
          onRequestInfoService={handleRequestInfo}
          loading={loading}
        />
      </div>

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
