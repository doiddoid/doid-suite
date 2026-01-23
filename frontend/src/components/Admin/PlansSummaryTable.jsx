import { useState, useEffect } from 'react';
import {
  Search, RefreshCw, Filter, ChevronDown, ChevronUp,
  Calendar, Clock, AlertCircle, Check, Zap, Ban,
  Star, FileText, UtensilsCrossed, Monitor, Key,
  Building2, Store, Mail, Euro, Download
} from 'lucide-react';
import api from '../../services/api';

// Mappa icone servizi
const SERVICE_ICONS = {
  Star: Star,
  star: Star,
  FileText: FileText,
  'file-text': FileText,
  UtensilsCrossed: UtensilsCrossed,
  utensils: UtensilsCrossed,
  Monitor: Monitor,
  monitor: Monitor,
  Key: Key,
  key: Key
};

export default function PlansSummaryTable({ onSelectActivity }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ subscriptions: [], stats: {}, pagination: {} });
  const [filters, setFilters] = useState({
    status: 'active_or_trial',
    serviceCode: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'daysRemaining', direction: 'asc' });
  const [services, setServices] = useState([]);

  // Fetch services for filter dropdown
  useEffect(() => {
    fetchServices();
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    fetchPlansSummary();
  }, [filters]);

  const fetchServices = async () => {
    try {
      const response = await api.request('/admin/services');
      if (response.success) {
        setServices(response.data.services || []);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const fetchPlansSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('limit', '200');
      if (filters.status) params.append('status', filters.status);
      if (filters.serviceCode) params.append('serviceCode', filters.serviceCode);
      if (filters.search) params.append('search', filters.search);

      const response = await api.request(`/admin/plans-summary?${params.toString()}`);
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.error || 'Errore nel caricamento');
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Sorting
  const sortedSubscriptions = [...(data.subscriptions || [])].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Handle nested properties
    if (sortConfig.key === 'organizationName') {
      aValue = a.organization?.name || '';
      bValue = b.organization?.name || '';
    } else if (sortConfig.key === 'activityName') {
      aValue = a.activity?.name || '';
      bValue = b.activity?.name || '';
    } else if (sortConfig.key === 'serviceName') {
      aValue = a.service?.name || '';
      bValue = b.service?.name || '';
    }

    // Handle null values for daysRemaining
    if (sortConfig.key === 'daysRemaining') {
      if (aValue === null) aValue = 9999;
      if (bValue === null) bValue = 9999;
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ChevronDown className="w-4 h-4 opacity-30" />;
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />;
  };

  const getStatusBadge = (status, daysRemaining) => {
    const styles = {
      active: 'bg-green-100 text-green-700 border-green-200',
      trial: 'bg-blue-100 text-blue-700 border-blue-200',
      expired: 'bg-orange-100 text-orange-700 border-orange-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
      free: 'bg-gray-100 text-gray-600 border-gray-200'
    };
    const icons = {
      active: Check,
      trial: Clock,
      expired: AlertCircle,
      cancelled: Ban,
      free: Check
    };
    const labels = {
      active: 'PRO',
      trial: daysRemaining !== null ? `Trial (${daysRemaining}g)` : 'Trial',
      expired: 'Scaduto',
      cancelled: 'Cancellato',
      free: 'FREE'
    };

    const IconComponent = icons[status] || AlertCircle;
    const isExpiring = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
        isExpiring ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse' : styles[status] || 'bg-gray-100 text-gray-700'
      }`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {labels[status] || status}
        {isExpiring && status === 'active' && <AlertCircle className="w-3 h-3 ml-1" />}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatPrice = (price, cycle) => {
    if (!price) return '-';
    const suffix = cycle === 'yearly' ? '/anno' : '/mese';
    return `€${price.toFixed(2)}${suffix}`;
  };

  const getServiceIcon = (service) => {
    if (!service?.icon) return Star;
    return SERVICE_ICONS[service.icon] || Star;
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Organizzazione', 'Attività', 'Email', 'Servizio', 'Piano', 'Status', 'Ciclo', 'Prezzo', 'Scadenza', 'Giorni Rimanenti'];
    const rows = sortedSubscriptions.map(sub => [
      sub.organization?.name || '-',
      sub.activity?.name || '-',
      sub.activity?.email || '-',
      sub.service?.name || '-',
      sub.plan?.name || '-',
      sub.status,
      sub.billingCycle || '-',
      sub.price ? `€${sub.price}` : '-',
      sub.endDate ? formatDate(sub.endDate) : '-',
      sub.daysRemaining !== null ? sub.daysRemaining : '-'
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `riepilogo-piani-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.stats?.active || 0}</p>
              <p className="text-sm text-gray-500">Piani Attivi (PRO)</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.stats?.trial || 0}</p>
              <p className="text-sm text-gray-500">In Trial</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.stats?.expiringSoon || 0}</p>
              <p className="text-sm text-gray-500">In Scadenza (7g)</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Euro className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">€{(data.stats?.monthlyRevenue || 0).toFixed(0)}</p>
              <p className="text-sm text-gray-500">MRR Stimato</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca organizzazione o attività..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Filter toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtri
              </button>
              <button
                onClick={fetchPlansSummary}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active_or_trial">Attivi + Trial</option>
                  <option value="active">Solo PRO Attivi</option>
                  <option value="trial">Solo Trial</option>
                  <option value="expired">Scaduti</option>
                  <option value="cancelled">Cancellati</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Servizio</label>
                <select
                  value={filters.serviceCode}
                  onChange={(e) => setFilters(prev => ({ ...prev, serviceCode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Tutti i servizi</option>
                  {services.map(service => (
                    <option key={service.id} value={service.code}>{service.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
              <p className="mt-2 text-gray-500">Caricamento...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
              <p className="mt-2 text-red-600">{error}</p>
              <button onClick={fetchPlansSummary} className="mt-2 text-indigo-600 hover:underline">Riprova</button>
            </div>
          ) : sortedSubscriptions.length === 0 ? (
            <div className="p-8 text-center">
              <Store className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="mt-2 text-gray-500">Nessun piano trovato con i filtri selezionati</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    onClick={() => handleSort('organizationName')}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      Organizzazione
                      <SortIcon columnKey="organizationName" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('activityName')}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      Attività
                      <SortIcon columnKey="activityName" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('serviceName')}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      Servizio
                      <SortIcon columnKey="serviceName" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <SortIcon columnKey="status" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('price')}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      Prezzo
                      <SortIcon columnKey="price" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('daysRemaining')}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      Scadenza
                      <SortIcon columnKey="daysRemaining" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedSubscriptions.map((sub) => {
                  const ServiceIcon = getServiceIcon(sub.service);
                  const isExpiring = sub.daysRemaining !== null && sub.daysRemaining <= 7 && sub.daysRemaining > 0;

                  return (
                    <tr
                      key={sub.id}
                      className={`hover:bg-gray-50 transition-colors ${isExpiring ? 'bg-amber-50/50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{sub.organization?.name || '-'}</p>
                            {sub.organization?.accountType === 'agency' && (
                              <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">Agency</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onSelectActivity && onSelectActivity(sub.activity)}
                          className="flex items-center gap-2 hover:text-indigo-600 transition-colors text-left"
                        >
                          <Store className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-sm">{sub.activity?.name || '-'}</p>
                            {sub.activity?.email && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {sub.activity.email}
                              </p>
                            )}
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="p-1.5 rounded-lg"
                            style={{ backgroundColor: sub.service?.color ? `${sub.service.color}20` : '#f3f4f6' }}
                          >
                            <ServiceIcon
                              className="w-4 h-4"
                              style={{ color: sub.service?.color || '#6b7280' }}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{sub.service?.name || '-'}</p>
                            <p className="text-xs text-gray-500">{sub.plan?.name || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(sub.status, sub.daysRemaining)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">
                          {formatPrice(sub.price, sub.billingCycle)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{sub.billingCycle || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-900">{formatDate(sub.endDate)}</p>
                            {sub.daysRemaining !== null && (
                              <p className={`text-xs ${
                                isExpiring ? 'text-amber-600 font-medium' : 'text-gray-500'
                              }`}>
                                {sub.daysRemaining <= 0 ? 'Scaduto' : `${sub.daysRemaining} giorni`}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && sortedSubscriptions.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-sm text-gray-500">
            Totale: {sortedSubscriptions.length} piani
          </div>
        )}
      </div>
    </div>
  );
}
