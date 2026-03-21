import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Building2, Plus, AlertTriangle, RefreshCw } from 'lucide-react';
import { useActivities } from '../hooks/useActivities';
import { ServiceList, ClientGrid, ContactModal } from '../components/Dashboard';
import { PlanModal } from '../components/Services';
import { CONTACT_REQUIRED_SERVICES } from '../config/services';

export default function Dashboard() {
  const {
    currentActivity,
    activities,
    loading: activitiesLoading,
    switchActivity,
    getServicesDashboard,
    activateTrial,
    activateSubscription,
    accessService
  } = useActivities();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [contactService, setContactService] = useState(null);

  // Vista corrente: "client" (per cliente) o "service" (per servizio, solo agenzia)
  const [currentView, setCurrentView] = useState('client');

  // Cache servizi per tutte le attività (per ClientGrid)
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
      const result = await getServicesDashboard();
      if (result.success) {
        setServices(result.data || []);
        setAllServicesMap(prev => ({ ...prev, [currentActivity.id]: result.data }));
      } else {
        setError(result.error);
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

  // Handlers
  const handleOpenService = async (activityId, serviceCode) => {
    const result = await accessService(serviceCode, activityId);
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
              ? 'Gestisci i servizi doID per questa attività'
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
      {currentView === 'client' ? (
        <ServiceList
          services={services}
          onOpenService={handleOpenService}
          onActivateTrial={handleActivateTrial}
          activityId={currentActivity?.id}
          loading={loading}
        />
      ) : (
        <ClientGrid
          activities={activities}
          currentActivityId={currentActivity?.id}
          onSelectActivity={handleSelectActivityFromGrid}
          servicesMap={allServicesMap}
        />
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
