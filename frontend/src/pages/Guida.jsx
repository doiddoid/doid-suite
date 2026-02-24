import { useState, useMemo, useRef, useCallback } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  Star,
  FileText,
  UtensilsCrossed,
  ArrowRight,
  X
} from 'lucide-react';
import { guidaContent } from '../data/guidaContent';
import GuideAccordion from '../components/Guida/GuideAccordion';
import GuideCTA from '../components/Guida/GuideCTA';
import GuideFAQ from '../components/Guida/GuideFAQ';

const tabConfig = [
  { id: 'suite', icon: Sparkles, label: 'Suite', color: 'teal', activeClass: 'bg-teal-50 text-teal-700 border-teal-500' },
  { id: 'review', icon: Star, label: 'Smart Review', color: 'yellow', activeClass: 'bg-yellow-50 text-yellow-700 border-yellow-500' },
  { id: 'page', icon: FileText, label: 'Smart Page', color: 'blue', activeClass: 'bg-blue-50 text-blue-700 border-blue-500' },
  { id: 'menu', icon: UtensilsCrossed, label: 'Smart Menu', color: 'green', activeClass: 'bg-green-50 text-green-700 border-green-500' },
];

export default function Guida() {
  const [activeTab, setActiveTab] = useState('suite');
  const [searchQuery, setSearchQuery] = useState('');
  const [openGuideId, setOpenGuideId] = useState(null);
  const contentRef = useRef(null);

  const serviceData = guidaContent[activeTab];

  // Filtra le guide in base alla ricerca
  const filteredGuides = useMemo(() => {
    if (!serviceData?.guides) return [];
    if (!searchQuery.trim()) return serviceData.guides;

    const query = searchQuery.toLowerCase();
    return serviceData.guides.filter(guide => {
      // Cerca nel titolo, subtitle
      if (guide.title.toLowerCase().includes(query)) return true;
      if (guide.subtitle?.toLowerCase().includes(query)) return true;

      // Cerca nelle sezioni
      if (guide.sections?.some(s =>
        s.title?.toLowerCase().includes(query) ||
        s.content?.toLowerCase().includes(query)
      )) return true;

      // Cerca nelle FAQ
      if (guide.faq?.some(f =>
        f.q.toLowerCase().includes(query) ||
        f.a.toLowerCase().includes(query)
      )) return true;

      return false;
    });
  }, [serviceData, searchQuery]);

  // Navigazione verso una guida specifica
  const handleNavigateToGuide = useCallback((guideId) => {
    // Trova il servizio e la guida
    for (const [serviceKey, service] of Object.entries(guidaContent)) {
      const guide = service.guides?.find(g => g.id === guideId);
      if (guide) {
        setActiveTab(serviceKey);
        setOpenGuideId(guideId);
        // Scroll to top of content
        contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
  }, []);

  // Cross-sell: servizi correlati (esclude il tab attivo)
  const crossSellServices = useMemo(() => {
    return tabConfig
      .filter(t => t.id !== activeTab && t.id !== 'suite')
      .map(t => ({
        ...t,
        data: guidaContent[t.id],
      }));
  }, [activeTab]);

  return (
    <div className="animate-fade-in" ref={contentRef}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Come usare DOID Suite</h1>
            <p className="text-gray-500 text-sm">Tutto quello che ti serve per iniziare, passo dopo passo</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mt-4 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca nella guida..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
        {tabConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery('');
                setOpenGuideId(null);
              }}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap
                border-b-2 transition-all duration-200
                ${isActive
                  ? tab.activeClass
                  : 'bg-white text-gray-600 border-transparent hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <Icon className={`w-4 h-4 ${isActive ? '' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Service description */}
      {serviceData && (
        <div className={`${serviceData.bgColor} ${serviceData.borderColor} border rounded-xl p-4 mb-6`}>
          <p className={`text-sm ${serviceData.textColor} font-medium`}>
            {serviceData.description}
          </p>
        </div>
      )}

      {/* CTA for non-active services */}
      {serviceData?.cta && activeTab !== 'suite' && (
        <GuideCTA cta={serviceData.cta} serviceColor={serviceData.color} />
      )}

      {/* Search results count */}
      {searchQuery && (
        <p className="text-sm text-gray-500 mb-4">
          {filteredGuides.length === 0
            ? 'Nessun risultato trovato. Prova con un termine diverso.'
            : `${filteredGuides.length} guid${filteredGuides.length === 1 ? 'a trovata' : 'e trovate'} per "${searchQuery}"`
          }
        </p>
      )}

      {/* Guide accordions */}
      <div className="space-y-3 mb-8">
        {filteredGuides.map((guide, idx) => (
          <GuideAccordion
            key={guide.id}
            guide={guide}
            index={idx}
            onNavigateToGuide={handleNavigateToGuide}
            defaultOpen={guide.id === openGuideId || (searchQuery.length > 0 && filteredGuides.length === 1)}
          />
        ))}
      </div>

      {/* Cross-sell section */}
      {!searchQuery && crossSellServices.length > 0 && (
        <div className="mt-10 pt-8 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Scopri anche gli altri servizi</h2>
          <p className="text-sm text-gray-500 mb-4">
            Attivando 2 servizi risparmi il 20% sul secondo, il 30% sul terzo.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {crossSellServices.map((service) => {
              const Icon = service.icon;
              return (
                <button
                  key={service.id}
                  onClick={() => {
                    setActiveTab(service.id);
                    setOpenGuideId(null);
                    setSearchQuery('');
                    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`${service.data.bgColor} ${service.data.borderColor} border rounded-xl p-4 text-left hover:shadow-sm transition-all group`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={`w-5 h-5 ${service.data.textColor}`} />
                    <h3 className={`font-semibold ${service.data.textColor}`}>{service.data.label}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{service.data.description}</p>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${service.data.textColor} group-hover:gap-2 transition-all`}>
                    Leggi le guide <ArrowRight className="w-3 h-3" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Support footer */}
      <div className="mt-10 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500 mb-2">Non trovi quello che cerchi?</p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a
            href="mailto:info@doid.biz"
            className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
          >
            info@doid.biz
          </a>
          <span className="text-gray-300">|</span>
          <a
            href="tel:+393480890477"
            className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
          >
            +39 348 089 0477
          </a>
          <span className="text-gray-300">|</span>
          <a
            href="https://wa.me/393480890477"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
