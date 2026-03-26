import { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronUp,
  Eye, EyeOff, GripVertical, HelpCircle, Star, FileText,
  UtensilsCrossed, Sparkles, Loader2, MessageSquare
} from 'lucide-react';
import api from '../../services/api';

const SERVICE_OPTIONS = [
  { value: 'suite', label: 'Suite', icon: Sparkles, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
  { value: 'review', label: 'Review', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { value: 'page', label: 'Page', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { value: 'menu', label: 'Menu Digitale', icon: UtensilsCrossed, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  { value: 'chat_ai', label: 'Chat AI', icon: MessageSquare, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
  { value: 'general', label: 'Generali', icon: HelpCircle, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
];

export default function FaqManager() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filterService, setFilterService] = useState('all');
  const [editingFaq, setEditingFaq] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    service_code: 'suite',
    question: '',
    answer: '',
    sort_order: 0,
    is_published: true
  });

  useEffect(() => {
    fetchFaqs();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const response = await api.request('/faq/admin');
      if (response.success) {
        setFaqs(response.data);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      setError('Domanda e risposta sono obbligatorie');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      let response;
      if (editingFaq) {
        response = await api.request(`/faq/admin/${editingFaq.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        response = await api.request('/faq/admin', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }

      if (response.success) {
        setSuccess(editingFaq ? 'FAQ aggiornata' : 'FAQ creata');
        resetForm();
        fetchFaqs();
      } else {
        setError(response.error || 'Errore nel salvataggio');
      }
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      const response = await api.request(`/faq/admin/${id}`, { method: 'DELETE' });
      if (response.success) {
        setSuccess('FAQ eliminata');
        setDeleteConfirm(null);
        fetchFaqs();
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTogglePublished = async (faq) => {
    try {
      const response = await api.request(`/faq/admin/${faq.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_published: !faq.is_published })
      });
      if (response.success) {
        fetchFaqs();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (faq) => {
    setEditingFaq(faq);
    setFormData({
      service_code: faq.service_code,
      question: faq.question,
      answer: faq.answer,
      sort_order: faq.sort_order,
      is_published: faq.is_published
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingFaq(null);
    setShowForm(false);
    setFormData({
      service_code: filterService !== 'all' ? filterService : 'suite',
      question: '',
      answer: '',
      sort_order: 0,
      is_published: true
    });
  };

  const handleNewFaq = () => {
    resetForm();
    setFormData(prev => ({
      ...prev,
      service_code: filterService !== 'all' ? filterService : 'suite',
      sort_order: filteredFaqs.length
    }));
    setShowForm(true);
  };

  const filteredFaqs = filterService === 'all'
    ? faqs
    : faqs.filter(f => f.service_code === filterService);

  const getServiceConfig = (code) =>
    SERVICE_OPTIONS.find(s => s.value === code) || SERVICE_OPTIONS[4];

  // Raggrupa per servizio quando filtro è 'all'
  const groupedFaqs = filterService === 'all'
    ? SERVICE_OPTIONS.reduce((acc, svc) => {
        const items = faqs.filter(f => f.service_code === svc.value);
        if (items.length > 0) acc.push({ service: svc, items });
        return acc;
      }, [])
    : [{ service: getServiceConfig(filterService), items: filteredFaqs }];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-semibold text-gray-900">Gestione FAQ</h2>
          <span className="text-sm text-gray-500">({faqs.length} totali)</span>
        </div>
        <button
          onClick={handleNewFaq}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nuova FAQ
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Service filter tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterService('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filterService === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tutti ({faqs.length})
        </button>
        {SERVICE_OPTIONS.map(svc => {
          const count = faqs.filter(f => f.service_code === svc.value).length;
          const Icon = svc.icon;
          return (
            <button
              key={svc.value}
              onClick={() => setFilterService(svc.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterService === svc.value
                  ? `${svc.bg} ${svc.color}`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {svc.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Form modale inline */}
      {showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            {editingFaq ? 'Modifica FAQ' : 'Nuova FAQ'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Servizio</label>
              <select
                value={formData.service_code}
                onChange={(e) => setFormData(prev => ({ ...prev, service_code: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {SERVICE_OPTIONS.map(svc => (
                  <option key={svc.value} value={svc.value}>{svc.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Ordine</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <label className="flex items-center gap-2 pb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Pubblicata</span>
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Domanda</label>
            <input
              type="text"
              value={formData.question}
              onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
              placeholder="Es: Come posso attivare il servizio?"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Risposta</label>
            <textarea
              value={formData.answer}
              onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
              placeholder="Scrivi la risposta..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingFaq ? 'Aggiorna' : 'Crea'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* FAQ list grouped by service */}
      {groupedFaqs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <HelpCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Nessuna FAQ trovata</p>
          <p className="text-xs text-gray-400 mt-1">Clicca "Nuova FAQ" per aggiungerne una</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedFaqs.map(({ service, items }) => {
            const Icon = service.icon;
            return (
              <div key={service.value}>
                {filterService === 'all' && (
                  <div className={`flex items-center gap-2 mb-3 px-3 py-2 ${service.bg} ${service.border} border rounded-lg`}>
                    <Icon className={`w-4 h-4 ${service.color}`} />
                    <span className={`text-sm font-semibold ${service.color}`}>{service.label}</span>
                    <span className="text-xs text-gray-500">({items.length})</span>
                  </div>
                )}
                <div className="space-y-2">
                  {items.map((faq) => (
                    <div
                      key={faq.id}
                      className={`bg-white border rounded-xl p-4 transition-all ${
                        !faq.is_published ? 'opacity-60 border-dashed border-gray-300' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {filterService === 'all' || true ? null : (
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${service.bg} ${service.color}`}>
                                {service.label}
                              </span>
                            )}
                            {!faq.is_published && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                                BOZZA
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">{faq.question}</p>
                          <p className="text-sm text-gray-600 line-clamp-2">{faq.answer}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleTogglePublished(faq)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            title={faq.is_published ? 'Nascondi' : 'Pubblica'}
                          >
                            {faq.is_published
                              ? <Eye className="w-4 h-4 text-green-500" />
                              : <EyeOff className="w-4 h-4 text-gray-400" />
                            }
                          </button>
                          <button
                            onClick={() => handleEdit(faq)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Modifica"
                          >
                            <Edit2 className="w-4 h-4 text-gray-500" />
                          </button>
                          {deleteConfirm === faq.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(faq.id)}
                                className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 transition-colors"
                                title="Conferma eliminazione"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <X className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(faq.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                              title="Elimina"
                            >
                              <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
