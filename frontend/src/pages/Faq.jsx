import { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle, Search, X, ChevronDown, Sparkles,
  Star, FileText, UtensilsCrossed, MessageSquare
} from 'lucide-react';
import api from '../services/api';

const SERVICE_TABS = [
  { id: 'all', label: 'Tutte', icon: HelpCircle, activeClass: 'bg-teal-50 text-teal-700 border-teal-500' },
  { id: 'general', label: 'Generali', icon: HelpCircle, activeClass: 'bg-gray-100 text-gray-700 border-gray-500' },
  { id: 'suite', label: 'Suite', icon: Sparkles, activeClass: 'bg-teal-50 text-teal-700 border-teal-500' },
  { id: 'review', label: 'Review', icon: Star, activeClass: 'bg-yellow-50 text-yellow-700 border-yellow-500' },
  { id: 'page', label: 'Page', icon: FileText, activeClass: 'bg-blue-50 text-blue-700 border-blue-500' },
  { id: 'menu', label: 'Menu Digitale', icon: UtensilsCrossed, activeClass: 'bg-green-50 text-green-700 border-green-500' },
  { id: 'chat_ai', label: 'Chat AI', icon: MessageSquare, activeClass: 'bg-teal-50 text-teal-700 border-teal-500' },
];

const SERVICE_STYLES = {
  general: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: HelpCircle },
  suite: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', icon: Sparkles },
  review: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: Star },
  page: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: FileText },
  menu: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: UtensilsCrossed },
  chat_ai: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', icon: MessageSquare },
};

const SERVICE_LABELS = {
  general: 'Generali',
  suite: 'Suite',
  review: 'Review',
  page: 'Page',
  menu: 'Menu Digitale',
  chat_ai: 'Chat AI',
};

function FaqItem({ faq, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl overflow-hidden bg-white border border-gray-100">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
      >
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
        <span className="text-sm font-medium text-gray-800">{faq.question}</span>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 ml-7">
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}

export default function Faq() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await api.request('/faq');
        if (response.success) {
          setFaqs(response.data);
        }
      } catch (err) {
        console.error('Error loading FAQs:', err);
      }
      setLoading(false);
    };
    fetchFaqs();
  }, []);

  const filteredFaqs = useMemo(() => {
    let result = faqs;

    if (activeTab !== 'all') {
      result = result.filter(f => f.service_code === activeTab);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(f =>
        f.question.toLowerCase().includes(query) ||
        f.answer.toLowerCase().includes(query)
      );
    }

    return result;
  }, [faqs, activeTab, searchQuery]);

  // Raggruppa per servizio quando tab è 'all'
  const groupedFaqs = useMemo(() => {
    if (activeTab !== 'all') {
      return [{ serviceCode: activeTab, items: filteredFaqs }];
    }

    const order = ['general', 'suite', 'review', 'page', 'menu'];
    const groups = [];
    for (const code of order) {
      const items = filteredFaqs.filter(f => f.service_code === code);
      if (items.length > 0) {
        groups.push({ serviceCode: code, items });
      }
    }
    return groups;
  }, [filteredFaqs, activeTab]);

  // Conta per tab
  const counts = useMemo(() => {
    const c = { all: faqs.length };
    for (const f of faqs) {
      c[f.service_code] = (c[f.service_code] || 0) + 1;
    }
    return c;
  }, [faqs]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
            <HelpCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Domande frequenti</h1>
            <p className="text-gray-500 text-sm">Trova risposte alle domande più comuni</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca nelle FAQ..."
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

      {/* Service tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
        {SERVICE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = counts[tab.id] || 0;
          if (tab.id !== 'all' && count === 0) return null;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery('');
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
              {count > 0 && (
                <span className={`text-xs ${isActive ? 'opacity-70' : 'text-gray-400'}`}>
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Search results count */}
      {searchQuery && !loading && (
        <p className="text-sm text-gray-500 mb-4">
          {filteredFaqs.length === 0
            ? 'Nessun risultato trovato. Prova con un termine diverso.'
            : `${filteredFaqs.length} risultat${filteredFaqs.length === 1 ? 'o' : 'i'} per "${searchQuery}"`
          }
        </p>
      )}

      {/* FAQ sections */}
      {!loading && groupedFaqs.length === 0 && !searchQuery && (
        <div className="text-center py-16">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Nessuna FAQ disponibile al momento</p>
        </div>
      )}

      {!loading && (
        <div className="space-y-8 mb-8">
          {groupedFaqs.map(({ serviceCode, items }) => {
            const style = SERVICE_STYLES[serviceCode] || SERVICE_STYLES.general;
            const Icon = style.icon;
            const label = SERVICE_LABELS[serviceCode] || serviceCode;

            return (
              <div key={serviceCode}>
                {/* Service header (only when showing all) */}
                {activeTab === 'all' && (
                  <div className={`flex items-center gap-2 mb-4 px-4 py-2.5 ${style.bg} ${style.border} border rounded-xl`}>
                    <Icon className={`w-4 h-4 ${style.text}`} />
                    <h2 className={`text-sm font-semibold ${style.text}`}>{label}</h2>
                    <span className="text-xs text-gray-500">({items.length})</span>
                  </div>
                )}

                {/* FAQ items */}
                <div className="space-y-2">
                  {items.map((faq) => (
                    <FaqItem
                      key={faq.id}
                      faq={faq}
                      defaultOpen={searchQuery.length > 0 && filteredFaqs.length === 1}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Support footer */}
      <div className="mt-10 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500 mb-2">Non trovi quello che cerchi?</p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a
            href="mailto:support@doid.biz"
            className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
          >
            support@doid.biz
          </a>
          <span className="text-gray-300">|</span>
          <a
            href="https://wa.me/393516781324"
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
