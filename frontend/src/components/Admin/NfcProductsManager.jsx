import { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Save, X, Loader2,
  Package, ShoppingBag, Eye, EyeOff, AlertCircle, Check
} from 'lucide-react';
import api from '../../services/api';

export default function NfcProductsManager() {
  const [products, setProducts] = useState([]);
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Edit states
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingKit, setEditingKit] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showKitForm, setShowKitForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const emptyProduct = {
    code: '', name: '', description: '', emoji: '',
    price_public: 0, price_partner: 0, price_range: '',
    has_variants: false, badge: '', link: '', sort_order: 0
  };

  const emptyKit = {
    qty: 1, price: 0, price_per_unit: 0, saving_percent: '', sort_order: 0
  };

  const [productForm, setProductForm] = useState(emptyProduct);
  const [kitForm, setKitForm] = useState(emptyKit);

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [prodRes, kitsRes] = await Promise.all([
        api.request('/admin/nfc-products?includeInactive=true'),
        api.request('/admin/nfc-kits?includeInactive=true')
      ]);
      if (prodRes.success) setProducts(prodRes.data.products || []);
      if (kitsRes.success) setKits(kitsRes.data.kits || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // ==================== PRODUCTS ====================

  const saveProduct = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = { ...productForm };
      // Pulisci campi vuoti opzionali
      if (!payload.price_range) payload.price_range = null;
      if (!payload.badge) payload.badge = null;
      if (!payload.link) payload.link = null;

      let response;
      if (editingProduct) {
        response = await api.request(`/admin/nfc-products/${editingProduct}`, {
          method: 'PUT', body: JSON.stringify(payload)
        });
      } else {
        response = await api.request('/admin/nfc-products', {
          method: 'POST', body: JSON.stringify(payload)
        });
      }

      if (response.success) {
        setSuccess(editingProduct ? 'Prodotto aggiornato' : 'Prodotto creato');
        setShowProductForm(false);
        setEditingProduct(null);
        setProductForm(emptyProduct);
        fetchAll();
      } else {
        setError(response.error || 'Errore nel salvataggio');
      }
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const deleteProduct = async (id) => {
    try {
      const response = await api.request(`/admin/nfc-products/${id}`, { method: 'DELETE' });
      if (response.success) {
        setSuccess('Prodotto disattivato');
        setDeleteConfirm(null);
        fetchAll();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleProduct = async (product) => {
    try {
      await api.request(`/admin/nfc-products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !product.is_active })
      });
      fetchAll();
    } catch (err) {
      setError(err.message);
    }
  };

  // ==================== KITS ====================

  const saveKit = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = { ...kitForm };
      if (!payload.saving_percent) payload.saving_percent = null;

      let response;
      if (editingKit) {
        response = await api.request(`/admin/nfc-kits/${editingKit}`, {
          method: 'PUT', body: JSON.stringify(payload)
        });
      } else {
        response = await api.request('/admin/nfc-kits', {
          method: 'POST', body: JSON.stringify(payload)
        });
      }

      if (response.success) {
        setSuccess(editingKit ? 'Kit aggiornato' : 'Kit creato');
        setShowKitForm(false);
        setEditingKit(null);
        setKitForm(emptyKit);
        fetchAll();
      } else {
        setError(response.error || 'Errore nel salvataggio');
      }
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const deleteKit = async (id) => {
    try {
      const response = await api.request(`/admin/nfc-kits/${id}`, { method: 'DELETE' });
      if (response.success) {
        setSuccess('Kit disattivato');
        setDeleteConfirm(null);
        fetchAll();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleKit = async (kit) => {
    try {
      await api.request(`/admin/nfc-kits/${kit.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !kit.is_active })
      });
      fetchAll();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center justify-between">
          <div className="flex items-center gap-2"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded"><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 flex items-center gap-2">
          <Check className="w-5 h-5" /><span>{success}</span>
        </div>
      )}

      {/* ==================== PRODOTTI NFC ==================== */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Prodotti & Servizi</h3>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-xs">{products.length}</span>
          </div>
          {!showProductForm && (
            <button
              onClick={() => { setShowProductForm(true); setEditingProduct(null); setProductForm(emptyProduct); }}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" /> Nuovo Prodotto
            </button>
          )}
        </div>

        {/* Product Form */}
        {showProductForm && (
          <div className="p-6 bg-indigo-50 border-b-2 border-indigo-200">
            <h4 className="font-semibold text-indigo-900 mb-4">
              {editingProduct ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Codice *</label>
                <input type="text" value={productForm.code} onChange={(e) => setProductForm({ ...productForm, code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} className="w-full px-3 py-2 border rounded-lg text-sm font-mono" placeholder="stand-legno" disabled={!!editingProduct} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                <input type="text" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Stand Legno" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Emoji</label>
                <input type="text" value={productForm.emoji} onChange={(e) => setProductForm({ ...productForm, emoji: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="📦" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Descrizione</label>
              <input type="text" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Descrizione prodotto" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Prezzo Pubblico *</label>
                <input type="number" step="0.01" value={productForm.price_public} onChange={(e) => setProductForm({ ...productForm, price_public: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Prezzo Partner *</label>
                <input type="number" step="0.01" value={productForm.price_partner} onChange={(e) => setProductForm({ ...productForm, price_partner: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Range Prezzo</label>
                <input type="text" value={productForm.price_range || ''} onChange={(e) => setProductForm({ ...productForm, price_range: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="49-57" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ordine</label>
                <input type="number" value={productForm.sort_order} onChange={(e) => setProductForm({ ...productForm, sort_order: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Badge</label>
                <input type="text" value={productForm.badge || ''} onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="BEST" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Link</label>
                <input type="url" value={productForm.link || ''} onChange={(e) => setProductForm({ ...productForm, link: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="https://..." />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={productForm.has_variants} onChange={(e) => setProductForm({ ...productForm, has_variants: e.target.checked })} className="w-4 h-4 rounded" />
                  <span className="text-sm">Ha varianti</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowProductForm(false); setEditingProduct(null); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annulla</button>
              <button onClick={saveProduct} disabled={saving || !productForm.code || !productForm.name} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                {editingProduct ? 'Aggiorna' : 'Crea'}
              </button>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">Prodotto</th>
                <th className="text-right p-3">Pubblico</th>
                <th className="text-right p-3">Partner</th>
                <th className="text-center p-3">Badge</th>
                <th className="text-center p-3">Stato</th>
                <th className="text-right p-3">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p.id} className={!p.is_active ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}>
                  <td className="p-3 text-gray-400">{p.sort_order}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{p.emoji}</span>
                      <div>
                        <div className="font-medium text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{p.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right font-medium">{Number(p.price_public).toFixed(2)}</td>
                  <td className="p-3 text-right font-medium text-purple-600">{Number(p.price_partner).toFixed(2)}</td>
                  <td className="p-3 text-center">
                    {p.badge && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">{p.badge}</span>}
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => toggleProduct(p)} className="p-1 rounded hover:bg-gray-100" title={p.is_active ? 'Disattiva' : 'Attiva'}>
                      {p.is_active ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditingProduct(p.id);
                          setProductForm({
                            code: p.code, name: p.name, description: p.description || '',
                            emoji: p.emoji || '', price_public: Number(p.price_public),
                            price_partner: Number(p.price_partner), price_range: p.price_range || '',
                            has_variants: p.has_variants, badge: p.badge || '',
                            link: p.link || '', sort_order: p.sort_order || 0
                          });
                          setShowProductForm(true);
                        }}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {deleteConfirm === p.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => deleteProduct(p.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Conferma</button>
                          <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs bg-gray-200 rounded">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== KIT BULK ==================== */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Kit Bulk (Agency)</h3>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full text-xs">{kits.length}</span>
          </div>
          {!showKitForm && (
            <button
              onClick={() => { setShowKitForm(true); setEditingKit(null); setKitForm(emptyKit); }}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
            >
              <Plus className="w-4 h-4" /> Nuovo Kit
            </button>
          )}
        </div>

        {/* Kit Form */}
        {showKitForm && (
          <div className="p-6 bg-purple-50 border-b-2 border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-4">
              {editingKit ? 'Modifica Kit' : 'Nuovo Kit'}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Quantita *</label>
                <input type="number" min="1" value={kitForm.qty} onChange={(e) => setKitForm({ ...kitForm, qty: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Prezzo Totale *</label>
                <input type="number" step="0.01" value={kitForm.price} onChange={(e) => setKitForm({ ...kitForm, price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Prezzo/unita *</label>
                <input type="number" step="0.01" value={kitForm.price_per_unit} onChange={(e) => setKitForm({ ...kitForm, price_per_unit: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sconto %</label>
                <input type="text" value={kitForm.saving_percent || ''} onChange={(e) => setKitForm({ ...kitForm, saving_percent: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="15%" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ordine</label>
                <input type="number" value={kitForm.sort_order} onChange={(e) => setKitForm({ ...kitForm, sort_order: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowKitForm(false); setEditingKit(null); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annulla</button>
              <button onClick={saveKit} disabled={saving || !kitForm.qty || !kitForm.price} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                {editingKit ? 'Aggiorna' : 'Crea'}
              </button>
            </div>
          </div>
        )}

        {/* Kits Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left p-3">#</th>
                <th className="text-right p-3">Quantita</th>
                <th className="text-right p-3">Prezzo</th>
                <th className="text-right p-3">Prezzo/unita</th>
                <th className="text-center p-3">Sconto</th>
                <th className="text-center p-3">Stato</th>
                <th className="text-right p-3">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {kits.map((k) => (
                <tr key={k.id} className={!k.is_active ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}>
                  <td className="p-3 text-gray-400">{k.sort_order}</td>
                  <td className="p-3 text-right font-medium">{k.qty} pz</td>
                  <td className="p-3 text-right font-medium">{Number(k.price).toFixed(2)}</td>
                  <td className="p-3 text-right text-purple-600">{Number(k.price_per_unit).toFixed(2)}</td>
                  <td className="p-3 text-center">
                    {k.saving_percent && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">{k.saving_percent}</span>}
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => toggleKit(k)} className="p-1 rounded hover:bg-gray-100">
                      {k.is_active ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditingKit(k.id);
                          setKitForm({
                            qty: k.qty, price: Number(k.price),
                            price_per_unit: Number(k.price_per_unit),
                            saving_percent: k.saving_percent || '',
                            sort_order: k.sort_order || 0
                          });
                          setShowKitForm(true);
                        }}
                        className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {deleteConfirm === k.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => deleteKit(k.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Conferma</button>
                          <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs bg-gray-200 rounded">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(k.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
