import { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronUp,
  Eye, EyeOff, Star, FileText, UtensilsCrossed, Sparkles,
  MessageSquare, HelpCircle, Loader2, GripVertical, Upload, Image
} from 'lucide-react';
import api from '../../services/api';

const SERVICE_OPTIONS = [
  { value: 'suite', label: 'Suite', icon: Sparkles, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
  { value: 'review', label: 'Review', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { value: 'page', label: 'Page', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { value: 'menu', label: 'Menu', icon: UtensilsCrossed, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  { value: 'chat_ai', label: 'Chat AI', icon: MessageSquare, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
];

const emptySection = { title: '', content: '', tip: '', warning: '' };
const emptyFaqItem = { q: '', a: '' };

function ScreenshotUpload({ url, desc, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Max 5MB'); return; }

    setUploading(true);
    setError(null);
    try {
      const res = await fetch('/api/guides/admin/upload-screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          'Authorization': `Bearer ${api.getToken()}`
        },
        body: file
      });
      const data = await res.json();
      if (data.success) {
        onUpdate({ url: data.data.url, desc: desc || '' });
      } else {
        setError(data.error);
      }
    } catch (err) { setError(err.message); }
    setUploading(false);
    e.target.value = '';
  }

  return (
    <div className="flex items-start gap-3 p-2 bg-white rounded-lg border border-gray-100">
      {url ? (
        <img src={url} alt="Screenshot" className="w-24 h-16 object-cover rounded border" />
      ) : (
        <div className="w-24 h-16 bg-gray-100 rounded border border-dashed border-gray-300 flex items-center justify-center">
          <Image className="w-5 h-5 text-gray-400" />
        </div>
      )}
      <div className="flex-1 space-y-1">
        <div className="flex gap-2">
          <label className={`flex items-center gap-1 text-xs px-2 py-1 rounded cursor-pointer ${uploading ? 'bg-gray-100 text-gray-400' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'}`}>
            <Upload className="w-3 h-3" />
            {uploading ? 'Caricamento...' : url ? 'Sostituisci' : 'Carica screenshot'}
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
          </label>
          {url && (
            <button onClick={() => onUpdate(null)} className="text-xs text-red-500 hover:text-red-700">Rimuovi</button>
          )}
        </div>
        <input type="text" value={desc} onChange={e => onUpdate({ url: url || '', desc: e.target.value })} className="w-full px-2 py-1 border rounded text-xs" placeholder="Descrizione screenshot (opzionale)" />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}

export default function GuideManager() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filterService, setFilterService] = useState('all');
  const [editingGuide, setEditingGuide] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [expandedGuide, setExpandedGuide] = useState(null);
  const [formData, setFormData] = useState({
    service_code: 'suite',
    title: '',
    subtitle: '',
    sections: [{ ...emptySection }],
    faq: [],
    sort_order: 0,
    is_published: true
  });

  useEffect(() => { fetchGuides(); }, []);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); } }, [success]);

  const fetchGuides = async () => {
    setLoading(true);
    try {
      const response = await api.request('/guides/admin');
      if (response.success) setGuides(response.data);
      else setError(response.error);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) { setError('Titolo obbligatorio'); return; }
    if (!formData.sections.some(s => s.title.trim() && s.content.trim())) { setError('Almeno una sezione con titolo e contenuto'); return; }

    // Pulisci sezioni e FAQ vuote
    const cleanSections = formData.sections.filter(s => s.title.trim() || s.content.trim());
    const cleanFaq = formData.faq.filter(f => f.q.trim() && f.a.trim());

    setSaving(true);
    setError(null);
    try {
      const payload = { ...formData, sections: cleanSections, faq: cleanFaq };
      let response;
      if (editingGuide) {
        response = await api.request(`/guides/admin/${editingGuide.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        response = await api.request('/guides/admin', { method: 'POST', body: JSON.stringify(payload) });
      }
      if (response.success) {
        setSuccess(editingGuide ? 'Guida aggiornata' : 'Guida creata');
        resetForm();
        fetchGuides();
      } else {
        setError(response.error || 'Errore nel salvataggio');
      }
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      const response = await api.request(`/guides/admin/${id}`, { method: 'DELETE' });
      if (response.success) { setSuccess('Guida eliminata'); setDeleteConfirm(null); fetchGuides(); }
      else setError(response.error);
    } catch (err) { setError(err.message); }
  };

  const handleTogglePublished = async (guide) => {
    try {
      const response = await api.request(`/guides/admin/${guide.id}`, {
        method: 'PUT', body: JSON.stringify({ is_published: !guide.is_published })
      });
      if (response.success) fetchGuides();
    } catch (err) { setError(err.message); }
  };

  const handleEdit = (guide) => {
    setEditingGuide(guide);
    setFormData({
      service_code: guide.service_code,
      title: guide.title,
      subtitle: guide.subtitle || '',
      sections: guide.sections?.length > 0 ? guide.sections : [{ ...emptySection }],
      faq: guide.faq?.length > 0 ? guide.faq : [],
      sort_order: guide.sort_order,
      is_published: guide.is_published
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingGuide(null);
    setShowForm(false);
    setFormData({ service_code: filterService !== 'all' ? filterService : 'suite', title: '', subtitle: '', sections: [{ ...emptySection }], faq: [], sort_order: 0, is_published: true });
  };

  // Sezioni helpers
  const updateSection = (idx, field, value) => {
    const updated = [...formData.sections];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData({ ...formData, sections: updated });
  };
  const addSection = () => setFormData({ ...formData, sections: [...formData.sections, { ...emptySection }] });
  const removeSection = (idx) => setFormData({ ...formData, sections: formData.sections.filter((_, i) => i !== idx) });
  const moveSection = (idx, dir) => {
    const arr = [...formData.sections];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setFormData({ ...formData, sections: arr });
  };

  // FAQ helpers
  const updateFaq = (idx, field, value) => {
    const updated = [...formData.faq];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData({ ...formData, faq: updated });
  };
  const addFaq = () => setFormData({ ...formData, faq: [...formData.faq, { ...emptyFaqItem }] });
  const removeFaq = (idx) => setFormData({ ...formData, faq: formData.faq.filter((_, i) => i !== idx) });

  const filteredGuides = filterService === 'all' ? guides : guides.filter(g => g.service_code === filterService);

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Guide</h2>
          <p className="text-sm text-gray-500">{guides.length} guide totali</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-teal-600">
          <Plus className="w-4 h-4" /> Nuova Guida
        </button>
      </div>

      {/* Feedback */}
      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">{error}<button onClick={() => setError(null)}><X className="w-4 h-4" /></button></div>}
      {success && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm">{success}</div>}

      {/* Filtri servizio */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterService('all')} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filterService === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
          Tutte ({guides.length})
        </button>
        {SERVICE_OPTIONS.map(svc => {
          const count = guides.filter(g => g.service_code === svc.value).length;
          return (
            <button key={svc.value} onClick={() => setFilterService(svc.value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filterService === svc.value ? svc.bg + ' ' + svc.color + ' ' + svc.border : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              {svc.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">{editingGuide ? 'Modifica Guida' : 'Nuova Guida'}</h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Servizio</label>
              <select value={formData.service_code} onChange={e => setFormData({ ...formData, service_code: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                {SERVICE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ordine</label>
              <input type="number" value={formData.sort_order} onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={formData.is_published} onChange={e => setFormData({ ...formData, is_published: e.target.checked })} className="rounded" />
                Pubblicata
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Titolo *</label>
            <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Cos'è Chat AI e Come Funziona" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sottotitolo</label>
            <input type="text" value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Panoramica, funzionalità principali..." />
          </div>

          {/* Sezioni */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700">Sezioni</label>
              <button onClick={addSection} className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Aggiungi sezione</button>
            </div>
            <div className="space-y-3">
              {formData.sections.map((section, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-400">#{idx + 1}</span>
                    <input type="text" value={section.title} onChange={e => updateSection(idx, 'title', e.target.value)} className="flex-1 px-2 py-1.5 border rounded-lg text-sm font-medium" placeholder="Titolo sezione" />
                    <button onClick={() => moveSection(idx, -1)} disabled={idx === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => moveSection(idx, 1)} disabled={idx === formData.sections.length - 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                    <button onClick={() => removeSection(idx)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <textarea value={section.content} onChange={e => updateSection(idx, 'content', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm mb-2" rows={4} placeholder="Contenuto (supporta **bold** e liste con •)" />
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input type="text" value={section.tip || ''} onChange={e => updateSection(idx, 'tip', e.target.value)} className="px-2 py-1.5 border rounded-lg text-xs" placeholder="💡 Suggerimento (opzionale)" />
                    <input type="text" value={section.warning || ''} onChange={e => updateSection(idx, 'warning', e.target.value)} className="px-2 py-1.5 border rounded-lg text-xs" placeholder="⚠️ Avvertenza (opzionale)" />
                  </div>
                  {/* Screenshot */}
                  <ScreenshotUpload
                    url={section.screenshot?.url}
                    desc={section.screenshot?.desc || ''}
                    onUpdate={(screenshot) => updateSection(idx, 'screenshot', screenshot)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* FAQ inline */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700">FAQ (opzionale)</label>
              <button onClick={addFaq} className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Aggiungi FAQ</button>
            </div>
            {formData.faq.map((item, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input type="text" value={item.q} onChange={e => updateFaq(idx, 'q', e.target.value)} className="flex-1 px-2 py-1.5 border rounded-lg text-xs" placeholder="Domanda" />
                <input type="text" value={item.a} onChange={e => updateFaq(idx, 'a', e.target.value)} className="flex-1 px-2 py-1.5 border rounded-lg text-xs" placeholder="Risposta" />
                <button onClick={() => removeFaq(idx)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button onClick={resetForm} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Annulla</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-teal-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-teal-600 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Salvataggio...' : editingGuide ? 'Aggiorna' : 'Crea'}
            </button>
          </div>
        </div>
      )}

      {/* Lista guide */}
      {filteredGuides.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">Nessuna guida{filterService !== 'all' ? ' per questo servizio' : ''}.</div>
      ) : (
        <div className="space-y-2">
          {filteredGuides.map(guide => {
            const svc = SERVICE_OPTIONS.find(s => s.value === guide.service_code) || SERVICE_OPTIONS[0];
            const isExpanded = expandedGuide === guide.id;
            return (
              <div key={guide.id} className={`border rounded-xl overflow-hidden transition-colors ${guide.is_published ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => setExpandedGuide(isExpanded ? null : guide.id)} className="text-gray-400 hover:text-gray-600">
                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${svc.bg} ${svc.color}`}>{svc.label}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900">{guide.title}</span>
                    {guide.subtitle && <span className="text-xs text-gray-500 ml-2">— {guide.subtitle}</span>}
                  </div>
                  <span className="text-xs text-gray-400">{guide.sections?.length || 0} sez. · {guide.faq?.length || 0} FAQ</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleTogglePublished(guide)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" title={guide.is_published ? 'Nascondi' : 'Pubblica'}>
                      {guide.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleEdit(guide)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><Edit2 className="w-4 h-4" /></button>
                    {deleteConfirm === guide.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(guide.id)} className="text-xs text-red-600 font-medium px-2 py-1 bg-red-50 rounded">Conferma</button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-xs text-gray-500 px-2 py-1">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(guide.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-2">
                    {guide.sections?.map((s, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-medium text-gray-700">{i + 1}. {s.title}</span>
                        <p className="text-gray-500 line-clamp-2 ml-4">{s.content?.substring(0, 150)}...</p>
                        {s.tip && <p className="text-teal-600 ml-4">💡 {s.tip}</p>}
                        {s.warning && <p className="text-amber-600 ml-4">⚠️ {s.warning}</p>}
                      </div>
                    ))}
                    {guide.faq?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <span className="text-xs font-medium text-gray-500">FAQ:</span>
                        {guide.faq.map((f, i) => (
                          <p key={i} className="text-xs text-gray-500 ml-2">• {f.q}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
