import { useState, useMemo } from 'react';
import { Loader2, MessageCircle, Mail, Phone, Layers, Plus } from 'lucide-react';
import { useMyServices } from '../hooks/useMyServices';
import { useAuth } from '../hooks/useAuth';
import { ServiceCard, DiscountBanner } from '../components/my-services';

// Configurazione GHL Domain (placeholder configurabile)
const GHL_DOMAIN = 'checkout.doid.it';

// Configurazione URL dashboard servizi
const SERVICE_DASHBOARD_URLS = {
  review: 'https://review.doid.it/dashboard',
  page: 'https://page.doid.it/dashboard',
  menu: 'https://menu.doid.it/dashboard',
  display: 'https://display.doid.it/dashboard'
};

// Ordine servizi
const SERVICE_ORDER = [
  'review',
  'page',
  'menu',
  'display',
  'agent_ai',
  'connect'
];

export default function MyServicesPage() {
  const { user } = useAuth();
  const { services, totals, loading, error, refetch } = useMyServices();

  // Stato accordion: solo uno expanded alla volta
  const [expandedService, setExpandedService] = useState(null);

  // Ordina servizi e trova il primo con elementi per default expanded
  const orderedServices = useMemo(() => {
    const servicesList = Object.values(services);

    // Ordina per SERVICE_ORDER
    const sorted = servicesList.sort((a, b) => {
      const indexA = SERVICE_ORDER.indexOf(a.info.code);
      const indexB = SERVICE_ORDER.indexOf(b.info.code);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    return sorted;
  }, [services]);

  // Imposta primo servizio con elementi come expanded di default
  useState(() => {
    if (orderedServices.length > 0 && expandedService === null) {
      const firstWithElements = orderedServices.find(s => s.elements.length > 0);
      if (firstWithElements) {
        setExpandedService(firstWithElements.info.code);
      }
    }
  });

  // Handlers
  const handleToggle = (serviceCode) => {
    setExpandedService(prev => prev === serviceCode ? null : serviceCode);
  };

  const handleAction = (element, actionType, serviceCode) => {
    const userEmail = encodeURIComponent(user?.email || '');
    const userFirstName = encodeURIComponent(user?.first_name || user?.firstName || '');

    switch (actionType) {
      case 'upgrade_annual': {
        const url = `https://${GHL_DOMAIN}/upgrade-${serviceCode}?email=${userEmail}&first_name=${userFirstName}`;
        window.open(url, '_blank');
        break;
      }
      case 'activate_pro': {
        const url = `https://${GHL_DOMAIN}/checkout-${serviceCode}?email=${userEmail}&first_name=${userFirstName}`;
        window.open(url, '_blank');
        break;
      }
      case 'manage': {
        const dashboardUrl = SERVICE_DASHBOARD_URLS[serviceCode];
        if (dashboardUrl) {
          window.open(dashboardUrl, '_blank');
        }
        break;
      }
      default:
        console.log('[MyServicesPage] Unknown action:', actionType, element);
    }
  };

  const handleAddElement = (serviceCode) => {
    const userEmail = encodeURIComponent(user?.email || '');
    const userFirstName = encodeURIComponent(user?.first_name || user?.firstName || '');
    const url = `https://${GHL_DOMAIN}/checkout-${serviceCode}?email=${userEmail}&first_name=${userFirstName}`;
    window.open(url, '_blank');
  };

  const handleDashboard = (serviceCode) => {
    const dashboardUrl = SERVICE_DASHBOARD_URLS[serviceCode];
    if (dashboardUrl) {
      window.open(dashboardUrl, '_blank');
    }
  };

  // Formatta prezzo
  const formatPrice = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Loading state
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(180deg, #F0FDFA 0%, #F8FAFC 50%, #FFFFFF 100%)'
        }}
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Caricamento servizi...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(180deg, #F0FDFA 0%, #F8FAFC 50%, #FFFFFF 100%)'
        }}
      >
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Layers className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Errore nel caricamento
          </h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  // Stato vuoto: nessun elemento per nessun servizio
  const hasAnyElements = orderedServices.some(s => s.elements.length > 0);

  if (!hasAnyElements) {
    return (
      <div
        className="min-h-screen"
        style={{
          background: 'linear-gradient(180deg, #F0FDFA 0%, #F8FAFC 50%, #FFFFFF 100%)'
        }}
      >
        {/* Top Bar */}
        <TopBar totals={totals} formatPrice={formatPrice} />

        {/* Empty State */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Layers className="w-10 h-10 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Nessun servizio attivo
            </h2>
            <p className="text-gray-500">
              Attiva il tuo primo servizio per iniziare!
            </p>
          </div>

          {/* Service Cards per attivazione */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {orderedServices.slice(0, 3).map(service => (
              <EmptyServiceCard
                key={service.info.code}
                service={service.info}
                onActivate={() => handleAddElement(service.info.code)}
              />
            ))}
          </div>
        </div>

        {/* Support Bar */}
        <SupportBar />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-8"
      style={{
        background: 'linear-gradient(180deg, #F0FDFA 0%, #F8FAFC 50%, #FFFFFF 100%)'
      }}
    >
      {/* Top Bar */}
      <TopBar totals={totals} formatPrice={formatPrice} />

      {/* Services List */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {orderedServices.map(service => (
          <ServiceCard
            key={service.info.code}
            service={service}
            expanded={expandedService === service.info.code}
            onToggle={() => handleToggle(service.info.code)}
            onAction={(element, actionType) => handleAction(element, actionType, service.info.code)}
            onAddElement={() => handleAddElement(service.info.code)}
            onDashboard={() => handleDashboard(service.info.code)}
          />
        ))}

        {/* Discount Banner */}
        <DiscountBanner totalProElements={totals.totalProElements} />
      </div>

      {/* Support Bar */}
      <SupportBar />
    </div>
  );
}

// TopBar Component
function TopBar({ totals, formatPrice }) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Title */}
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: '#14B8A6' }}
            >
              DOID Suite
            </p>
            <h1
              className="text-[21px] font-extrabold"
              style={{ color: '#0F172A' }}
            >
              I Miei Servizi
            </h1>
          </div>

          {/* Right: Summary Pills */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {totals.totalProElements > 0 && (
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                {totals.totalProElements} PRO
              </span>
            )}
            {totals.totalTrialElements > 0 && (
              <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                {totals.totalTrialElements} Trial
              </span>
            )}
            {totals.totalFreeElements > 0 && (
              <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
                {totals.totalFreeElements} Free
              </span>
            )}
            {totals.totalMonthly > 0 && (
              <span
                className="px-3 py-1.5 text-sm font-bold rounded-full"
                style={{ backgroundColor: '#CCFBF1', color: '#0D9488' }}
              >
                Totale: {formatPrice(totals.totalMonthly)} /mese
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Support Bar Component
function SupportBar() {
  const handleWhatsApp = () => {
    window.open('https://wa.me/393480890477', '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 mt-8">
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Left: Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                Hai bisogno di aiuto?
              </p>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  info@doid.biz
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  +39 348 089 0477
                </span>
              </div>
            </div>
          </div>

          {/* Right: WhatsApp Button */}
          <button
            onClick={handleWhatsApp}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

// Empty Service Card per stato vuoto
function EmptyServiceCard({ service, onActivate }) {
  const { name, color_primary, color_light } = service;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
        style={{
          background: `linear-gradient(135deg, ${color_light || '#F5F5F5'} 0%, ${color_primary}30 100%)`
        }}
      >
        <Layers className="w-7 h-7" style={{ color: color_primary }} />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{name}</h3>
      <p className="text-sm text-gray-500 mb-4">
        Attiva il servizio per la tua attività
      </p>
      <button
        onClick={onActivate}
        className="flex items-center gap-2 px-4 py-2 mx-auto text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90"
        style={{ backgroundColor: color_primary }}
      >
        <Plus className="w-4 h-4" />
        Attiva
      </button>
    </div>
  );
}
