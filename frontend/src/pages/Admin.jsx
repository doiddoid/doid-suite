import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Building2, Store, Package, Activity,
  RefreshCw, Plus, AlertCircle, X, Trash2, Edit2,
  Mail, Calendar, Hash, CreditCard, Star, FileText,
  Check, Clock, Ban, Search, UtensilsCrossed, Monitor,
  User, Shield, Briefcase, MapPin, Phone, Layers,
  ExternalLink, Loader2, LogIn, ChevronDown, ChevronRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

// Mappa icone servizi
const SERVICE_ICONS = {
  Star: Star,
  FileText: FileText,
  UtensilsCrossed: UtensilsCrossed,
  Monitor: Monitor
};

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [packages, setPackages] = useState([]);
  const [services, setServices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [itemDetails, setItemDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [accessingService, setAccessingService] = useState(null);
  const [impersonating, setImpersonating] = useState(false);
  const [expandedOrgs, setExpandedOrgs] = useState({});
  const [expandedOrgDetails, setExpandedOrgDetails] = useState({}); // Dettagli per orgs espanse
  const [clientTypeFilter, setClientTypeFilter] = useState('all'); // 'all', 'agency', 'single'

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch data based on active tab
  useEffect(() => {
    setSearchQuery('');
    setSelectedItem(null);
    if (activeTab === 'clienti') {
      fetchOrganizations();
    } else if (activeTab === 'packages') fetchPackages();
    else if (activeTab === 'plans') {
      fetchServices();
      fetchPlans();
    }
  }, [activeTab]);

  // Clear messages after timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.request('/admin/stats');
      if (response.success) {
        setStats(response.data);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.request('/admin/users?limit=100');
      if (response.success) {
        setUsers(response.data.users || []);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const response = await api.request('/admin/organizations?limit=100');
      if (response.success) {
        setOrganizations(response.data.organizations || []);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await api.request('/admin/activities?limit=100');
      if (response.success) {
        setActivities(response.data.activities || []);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const response = await api.request('/admin/packages?includeInactive=true');
      if (response.success) {
        setPackages(response.data.packages || []);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const fetchServices = async () => {
    try {
      const response = await api.request('/admin/services');
      if (response.success) {
        setServices(response.data.services || []);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await api.request('/admin/plans?includeInactive=true');
      if (response.success) {
        setPlans(response.data.plans || []);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Fetch dettagli completi quando si seleziona un item
  const fetchItemDetails = async (type, id) => {
    setLoadingDetails(true);
    setItemDetails(null);
    try {
      let endpoint = '';
      if (type === 'user') endpoint = `/admin/users/${id}`;
      else if (type === 'organization') endpoint = `/admin/organizations/${id}`;
      else if (type === 'activity') endpoint = `/admin/activities/${id}`;

      if (endpoint) {
        const response = await api.request(endpoint);
        if (response.success) {
          setItemDetails(response.data);
        }
      }
    } catch (err) {
      console.error('Error fetching details:', err);
    }
    setLoadingDetails(false);
  };

  // Handler per selezione item
  const handleSelectItem = (item, type) => {
    setSelectedItem(item);
    setItemDetails(null);
    fetchItemDetails(type, item.id);
  };

  // Fetch dettagli per organizzazione espansa (senza selezionarla)
  const fetchExpandedOrgDetails = async (orgId) => {
    if (expandedOrgDetails[orgId]) return; // Già caricato
    try {
      const response = await api.request(`/admin/organizations/${orgId}`);
      if (response.success) {
        setExpandedOrgDetails(prev => ({ ...prev, [orgId]: response.data }));
      }
    } catch (err) {
      console.error('Error fetching org details:', err);
    }
  };

  // Toggle espansione organizzazione
  const toggleOrgExpansion = (org) => {
    const newExpanded = !expandedOrgs[org.id];
    setExpandedOrgs(prev => ({ ...prev, [org.id]: newExpanded }));
    if (newExpanded && org.accountType === 'agency') {
      fetchExpandedOrgDetails(org.id);
    }
  };

  // Accedi al servizio come admin
  const handleAdminAccessService = async (userId, activityId, serviceCode) => {
    setAccessingService(serviceCode);
    try {
      const response = await api.request('/admin/access-service', {
        method: 'POST',
        body: JSON.stringify({ userId, activityId, serviceCode })
      });

      if (response.success) {
        // Apri in nuova tab
        window.open(response.data.redirectUrl, '_blank');
      } else {
        setError(response.error || 'Errore nell\'accesso al servizio');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setAccessingService(null);
    }
  };

  // Impersona utente o organizzazione
  const handleImpersonate = async (type, id) => {
    setImpersonating(true);
    try {
      const endpoint = type === 'organization'
        ? '/admin/impersonate/organization'
        : '/admin/impersonate';

      const body = type === 'organization'
        ? { organizationId: id }
        : { userId: id };

      const response = await api.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      if (response.success) {
        // Salva i token dell'admin per poter tornare
        const adminTokens = {
          accessToken: localStorage.getItem('accessToken'),
          refreshToken: localStorage.getItem('refreshToken')
        };
        localStorage.setItem('adminTokensBackup', JSON.stringify(adminTokens));

        // Imposta i nuovi token
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);

        // Flag per indicare sessione impersonata
        localStorage.setItem('impersonationActive', JSON.stringify({
          active: true,
          targetUser: response.data.user.email,
          targetOrg: response.data.organization?.name || null,
          adminEmail: response.data.impersonation.adminEmail
        }));

        // Redirect alla dashboard
        window.location.href = '/';
      } else {
        setError(response.error || 'Errore durante l\'impersonation');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setImpersonating(false);
    }
  };

  // Filter items based on search
  const filterItems = (items, fields) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      fields.some(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], item);
        return value?.toString().toLowerCase().includes(query);
      })
    );
  };

  const filteredUsers = filterItems(users, ['email', 'fullName']);
  const filteredOrganizations = filterItems(organizations, ['name', 'email']).filter(org =>
    clientTypeFilter === 'all' || org.accountType === clientTypeFilter
  );
  const filteredActivities = filterItems(activities, ['name', 'email', 'organization.name']);
  const filteredPackages = filterItems(packages, ['name', 'code', 'description']);

  // Filtra piani per servizio selezionato
  const filteredPlans = plans.filter(p =>
    (!selectedService || p.serviceId === selectedService) &&
    (!searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Open modal for create/edit
  const openModal = (type, mode = 'create', item = null) => {
    setModalType(type);
    setModalMode(mode);
    setEditingItem(item);
    setError(null);

    if (mode === 'edit' || mode === 'view') {
      setFormData({ ...item });
    } else {
      if (type === 'user') {
        setFormData({ email: '', password: '', fullName: '', emailConfirm: true });
      } else if (type === 'organization') {
        setFormData({ name: '', email: '', accountType: 'single', maxActivities: 1, ownerEmail: '' });
      } else if (type === 'activity') {
        setFormData({ name: '', email: '', organizationId: '', ownerEmail: '' });
      } else if (type === 'package') {
        setFormData({ code: '', name: '', description: '', priceMonthly: 0, priceYearly: 0, maxActivities: -1, isActive: true });
      } else if (type === 'plan') {
        setFormData({ serviceId: selectedService || '', code: '', name: '', priceMonthly: 0, priceYearly: 0, features: [], isActive: true, sortOrder: 0 });
      }
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType(null);
    setModalMode('create');
    setEditingItem(null);
    setFormData({});
    setError(null);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      let response;

      if (modalType === 'user') {
        if (modalMode === 'create') {
          response = await api.request('/admin/users', {
            method: 'POST',
            body: JSON.stringify(formData)
          });
        } else if (modalMode === 'edit') {
          response = await api.request(`/admin/users/${editingItem.id}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
          });
        }
        if (response.success) {
          fetchUsers();
          setSuccessMessage(modalMode === 'create' ? 'Utente creato con successo' : 'Utente aggiornato');
          if (selectedItem?.id === editingItem?.id) {
            setSelectedItem({ ...selectedItem, ...formData });
          }
        }
      } else if (modalType === 'organization') {
        if (modalMode === 'create') {
          response = await api.request('/admin/organizations', {
            method: 'POST',
            body: JSON.stringify(formData)
          });
        } else if (modalMode === 'edit') {
          response = await api.request(`/admin/organizations/${editingItem.id}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
          });
        }
        if (response.success) {
          fetchOrganizations();
          setSuccessMessage(modalMode === 'create' ? 'Organizzazione creata' : 'Organizzazione aggiornata');
          if (selectedItem?.id === editingItem?.id) {
            setSelectedItem({ ...selectedItem, ...formData });
          }
        }
      } else if (modalType === 'activity') {
        if (modalMode === 'create') {
          response = await api.request(`/admin/organizations/${formData.organizationId}/activities`, {
            method: 'POST',
            body: JSON.stringify(formData)
          });
        }
        if (response.success) {
          fetchActivities();
          setSuccessMessage('Attività creata con successo');
        }
      } else if (modalType === 'package') {
        if (modalMode === 'create') {
          response = await api.request('/admin/packages', {
            method: 'POST',
            body: JSON.stringify(formData)
          });
        } else if (modalMode === 'edit') {
          response = await api.request(`/admin/packages/${editingItem.id}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
          });
        }
        if (response.success) {
          fetchPackages();
          setSuccessMessage(modalMode === 'create' ? 'Pacchetto creato' : 'Pacchetto aggiornato');
        }
      } else if (modalType === 'plan') {
        if (modalMode === 'create') {
          response = await api.request('/admin/plans', {
            method: 'POST',
            body: JSON.stringify(formData)
          });
        } else if (modalMode === 'edit') {
          response = await api.request(`/admin/plans/${editingItem.id}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
          });
        }
        if (response.success) {
          fetchPlans();
          setSuccessMessage(modalMode === 'create' ? 'Piano creato' : 'Piano aggiornato');
        }
      }

      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle delete
  const handleDelete = async (type, id) => {
    setError(null);
    try {
      let response;
      if (type === 'user') {
        response = await api.request(`/admin/users/${id}`, { method: 'DELETE' });
        if (response.success) {
          fetchUsers();
          if (selectedItem?.id === id) setSelectedItem(null);
        }
      } else if (type === 'organization') {
        response = await api.request(`/admin/organizations/${id}`, { method: 'DELETE' });
        if (response.success) {
          fetchOrganizations();
          if (selectedItem?.id === id) setSelectedItem(null);
        }
      } else if (type === 'package') {
        response = await api.request(`/admin/packages/${id}`, { method: 'DELETE' });
        if (response.success) fetchPackages();
      } else if (type === 'plan') {
        response = await api.request(`/admin/plans/${id}`, { method: 'DELETE' });
        if (response.success) fetchPlans();
      }
      setSuccessMessage('Eliminato con successo');
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Check if user is super admin
  if (!user?.isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accesso Negato</h1>
          <p className="text-gray-500 mb-6">
            Questa sezione è riservata agli amministratori del sistema.
          </p>
          <Link to="/dashboard" className="btn-primary">
            Torna alla Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'stats', name: 'Statistiche', icon: Activity },
    { id: 'clienti', name: 'Clienti', icon: Users },
    { id: 'plans', name: 'Piani Servizi', icon: Layers },
    { id: 'packages', name: 'Pacchetti Agency', icon: Package },
  ];

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-700 border-green-200',
      suspended: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
      trial: 'bg-blue-100 text-blue-700 border-blue-200',
    };
    const labels = {
      active: 'Attivo',
      suspended: 'Sospeso',
      cancelled: 'Cancellato',
      trial: 'Prova',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status === 'active' && <Check className="w-3 h-3 mr-1" />}
        {status === 'suspended' && <Clock className="w-3 h-3 mr-1" />}
        {status === 'cancelled' && <Ban className="w-3 h-3 mr-1" />}
        {labels[status] || status}
      </span>
    );
  };

  // Group plans by service
  const plansByService = services.map(service => ({
    ...service,
    plans: plans.filter(p => p.serviceId === service.id)
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Pannello Amministrazione</h1>
                  <p className="text-indigo-100 mt-1">Gestione completa del sistema DOID Suite</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                fetchStats();
                if (activeTab === 'clienti') fetchOrganizations();
                else if (activeTab === 'packages') fetchPackages();
                else if (activeTab === 'plans') { fetchServices(); fetchPlans(); }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Aggiorna
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.name}
                  {tab.count !== undefined && (
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 flex items-center gap-2 animate-fade-in">
            <Check className="w-5 h-5" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
            <p className="text-gray-500">Caricamento in corso...</p>
          </div>
        ) : (
          <>
            {/* Stats Tab */}
            {activeTab === 'stats' && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="Utenti Totali"
                    value={stats.users?.total || 0}
                    subtitle={`+${stats.users?.newLast30Days || 0} ultimi 30 giorni`}
                    icon={Users}
                    color="blue"
                    trend={stats.users?.newLast30Days > 0 ? 'up' : 'neutral'}
                  />
                  <StatCard
                    title="Organizzazioni"
                    value={stats.organizations?.total || 0}
                    subtitle={`${stats.organizations?.active || 0} attive`}
                    icon={Building2}
                    color="green"
                  />
                  <StatCard
                    title="Attività"
                    value={stats.activities?.total || 0}
                    subtitle={`${stats.activities?.active || 0} attive`}
                    icon={Store}
                    color="purple"
                  />
                  <StatCard
                    title="Abbonamenti Attivi"
                    value={stats.subscriptions?.active || 0}
                    subtitle={`${stats.subscriptions?.trial || 0} in prova`}
                    icon={CreditCard}
                    color="orange"
                  />
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Azioni Rapide</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <button
                      onClick={() => { setActiveTab('users'); setTimeout(() => openModal('user', 'create'), 100); }}
                      className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                    >
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Nuovo Utente</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('organizations'); setTimeout(() => openModal('organization', 'create'), 100); }}
                      className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                    >
                      <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                        <Building2 className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Nuova Org.</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('activities'); setTimeout(() => openModal('activity', 'create'), 100); }}
                      className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                    >
                      <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                        <Store className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Nuova Attività</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('plans'); setTimeout(() => openModal('plan', 'create'), 100); }}
                      className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                    >
                      <div className="p-2 bg-cyan-100 rounded-lg group-hover:bg-cyan-200 transition-colors">
                        <Layers className="w-5 h-5 text-cyan-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Nuovo Piano</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('packages'); setTimeout(() => openModal('package', 'create'), 100); }}
                      className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                    >
                      <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                        <Package className="w-5 h-5 text-orange-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Nuovo Pacchetto</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Clienti Tab - Vista Gerarchica */}
            {activeTab === 'clienti' && (
              <div className="flex gap-6">
                {/* Lista Clienti */}
                <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Cerca clienti..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <button onClick={() => openModal('organization', 'create')} className="btn-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Nuovo Cliente
                      </button>
                    </div>
                    {/* Filtro tipo cliente */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Filtra:</span>
                      <button
                        onClick={() => setClientTypeFilter('all')}
                        className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                          clientTypeFilter === 'all'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Tutti ({organizations.length})
                      </button>
                      <button
                        onClick={() => setClientTypeFilter('agency')}
                        className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                          clientTypeFilter === 'agency'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        Agenzie ({organizations.filter(o => o.accountType === 'agency').length})
                      </button>
                      <button
                        onClick={() => setClientTypeFilter('single')}
                        className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                          clientTypeFilter === 'single'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        Singoli ({organizations.filter(o => o.accountType === 'single').length})
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-[calc(100vh-320px)] overflow-y-auto">
                    {filteredOrganizations.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Nessun cliente trovato</p>
                      </div>
                    ) : (
                      filteredOrganizations.map((org) => (
                        <div key={org.id} className="border-b last:border-b-0">
                          {/* Riga Organizzazione */}
                          <div
                            className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                              selectedItem?.id === org.id && selectedItem?.type === 'organization' ? 'bg-indigo-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Chevron per espandere (solo se agenzia con attività) */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleOrgExpansion(org);
                                }}
                                className={`p-1 rounded hover:bg-gray-200 transition-colors ${org.accountType !== 'agency' || !org.activitiesCount ? 'invisible' : ''}`}
                              >
                                {expandedOrgs[org.id] ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                              </button>

                              {/* Icona */}
                              <div
                                onClick={() => {
                                  setSelectedItem({ ...org, type: 'organization' });
                                  fetchItemDetails('organization', org.id);
                                }}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  org.accountType === 'agency'
                                    ? 'bg-gradient-to-br from-purple-400 to-pink-500'
                                    : 'bg-gradient-to-br from-green-400 to-teal-500'
                                } text-white`}
                              >
                                {org.accountType === 'agency' ? <Briefcase className="w-5 h-5" /> : <User className="w-5 h-5" />}
                              </div>

                              {/* Info */}
                              <div
                                className="flex-1 min-w-0"
                                onClick={() => {
                                  setSelectedItem({ ...org, type: 'organization' });
                                  fetchItemDetails('organization', org.id);
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900 truncate">{org.name}</p>
                                  {org.accountType === 'agency' && (
                                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded font-medium">Agenzia</span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 truncate">{org.email || 'Nessuna email'}</p>
                              </div>

                              {/* Icone servizi attivi */}
                              {(() => {
                                const orgData = expandedOrgDetails[org.id] || (selectedItem?.id === org.id ? itemDetails : null);
                                const subscriptions = (orgData?.subscriptions || []).filter(s => ['active', 'trial'].includes(s.status));
                                if (subscriptions.length === 0) return null;

                                // Raggruppa per servizio (evita duplicati)
                                const serviceMap = new Map();
                                subscriptions.forEach(sub => {
                                  if (sub.plan?.service) {
                                    serviceMap.set(sub.plan.service.code, sub.plan.service);
                                  }
                                });

                                return (
                                  <div className="flex items-center gap-1">
                                    {Array.from(serviceMap.values()).slice(0, 4).map((service) => {
                                      const ServiceIcon = SERVICE_ICONS[service.icon] || Star;
                                      return (
                                        <div
                                          key={service.code}
                                          className="w-6 h-6 rounded flex items-center justify-center"
                                          style={{ backgroundColor: `${service.color}20` }}
                                          title={service.name}
                                        >
                                          <ServiceIcon className="w-3.5 h-3.5" style={{ color: service.color }} />
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}

                              {/* Status e contatori */}
                              <div className="text-right">
                                {getStatusBadge(org.status)}
                                <p className="text-xs text-gray-400 mt-1">
                                  {org.activitiesCount || 0} attività
                                </p>
                              </div>

                              {/* Azioni rapide */}
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleImpersonate('organization', org.id);
                                  }}
                                  disabled={impersonating}
                                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Accedi come owner"
                                >
                                  {impersonating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Attività espanse (per agenzie) */}
                          {expandedOrgs[org.id] && org.accountType === 'agency' && (() => {
                            // Usa i dettagli espansi o quelli dell'item selezionato
                            const orgData = expandedOrgDetails[org.id] || (selectedItem?.id === org.id ? itemDetails : null);
                            const activities = orgData?.activities || [];

                            if (!orgData) {
                              return (
                                <div className="bg-gray-50 border-t pl-14 pr-4 py-3">
                                  <div className="flex items-center gap-2 text-gray-500">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Caricamento...</span>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div className="bg-gray-50 border-t">
                                {activities.map((act) => (
                                  <div
                                    key={act.id}
                                    onClick={() => {
                                      setSelectedItem({ ...act, type: 'activity', organizationName: org.name });
                                      fetchItemDetails('activity', act.id);
                                    }}
                                    className={`pl-14 pr-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors border-b last:border-b-0 ${
                                      selectedItem?.id === act.id && selectedItem?.type === 'activity' ? 'bg-indigo-50' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-white">
                                        <Store className="w-4 h-4" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-800 text-sm">{act.name}</p>
                                        <p className="text-xs text-gray-500">
                                          {act.owner?.email || 'Nessun owner'}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        {getStatusBadge(act.status)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {activities.length === 0 && (
                                  <div className="pl-14 pr-4 py-3 text-sm text-gray-500 italic">
                                    Nessuna attività
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Pannello Dettagli */}
                {selectedItem && activeTab === 'clienti' && selectedItem.type === 'organization' && (
                  <div className="w-[420px] bg-white rounded-xl shadow-sm overflow-hidden max-h-[calc(100vh-200px)] overflow-y-auto">
                    <div className={`p-6 text-white sticky top-0 ${selectedItem.accountType === 'agency' ? 'bg-gradient-to-r from-purple-500 to-pink-600' : 'bg-gradient-to-r from-green-500 to-teal-600'}`}>
                      <div className="flex items-start justify-between">
                        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                          {selectedItem.accountType === 'agency' ? <Briefcase className="w-8 h-8" /> : <Building2 className="w-8 h-8" />}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleImpersonate('organization', selectedItem.id)}
                            disabled={impersonating}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            title="Accedi come owner"
                          >
                            {impersonating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                          </button>
                          <button onClick={() => openModal('organization', 'edit', selectedItem)} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteConfirm({ type: 'organization', id: selectedItem.id, name: selectedItem.name })} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mt-4">{selectedItem.name}</h3>
                      <p className="opacity-80">{selectedItem.accountType === 'agency' ? 'Agenzia' : 'Account Singolo'}</p>
                    </div>

                    {loadingDetails ? (
                      <div className="p-8 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                      </div>
                    ) : (
                      <>
                        <div className="p-4 border-b">
                          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Informazioni</h4>
                          <div className="space-y-2">
                            <DetailRow icon={Mail} label="Email" value={selectedItem.email || '-'} />
                            <DetailRow icon={Phone} label="Telefono" value={selectedItem.phone || '-'} />
                            <DetailRow icon={Hash} label="P.IVA" value={selectedItem.vatNumber || '-'} />
                            <DetailRow icon={Store} label="Attività" value={`${selectedItem.activitiesCount || 0} / ${selectedItem.maxActivities === -1 ? '∞' : selectedItem.maxActivities}`} />
                            <div className="flex items-center justify-between py-2">
                              <span className="text-sm text-gray-500">Stato</span>
                              {getStatusBadge(selectedItem.status)}
                            </div>
                          </div>
                        </div>

                        {/* Membri */}
                        <div className="p-4 border-b">
                          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                            Membri ({itemDetails?.members?.length || selectedItem.membersCount || 0})
                          </h4>
                          {(itemDetails?.members || []).length === 0 ? (
                            <p className="text-sm text-gray-400 italic">Nessun membro</p>
                          ) : (
                            <div className="space-y-2">
                              {(itemDetails?.members || []).map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-medium">
                                      {(member.fullName || member.email || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">{member.fullName || 'Nome non impostato'}</p>
                                      <p className="text-xs text-gray-500">{member.email}</p>
                                    </div>
                                  </div>
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                                    member.role === 'owner' ? 'bg-purple-100 text-purple-700' :
                                    member.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {member.role}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Attività */}
                        <div className="p-4 border-b">
                          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                            Attività ({itemDetails?.activities?.length || 0})
                          </h4>
                          {(itemDetails?.activities || []).length === 0 ? (
                            <p className="text-sm text-gray-400 italic">Nessuna attività</p>
                          ) : (
                            <div className="space-y-2">
                              {(itemDetails?.activities || []).map((activity) => (
                                <div key={activity.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <Store className="w-4 h-4 text-amber-500" />
                                    <span className="text-sm font-medium">{activity.name}</span>
                                  </div>
                                  {getStatusBadge(activity.status)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Pacchetti Attivi (per agenzie) */}
                        {selectedItem.accountType === 'agency' && (
                          <div className="p-4 border-b">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                              Pacchetti Agency ({(itemDetails?.packages || []).filter(p => ['active', 'trial'].includes(p.status)).length})
                            </h4>
                            {(itemDetails?.packages || []).filter(p => ['active', 'trial'].includes(p.status)).length === 0 ? (
                              <p className="text-sm text-gray-400 italic">Nessun pacchetto attivo</p>
                            ) : (
                              <div className="space-y-2">
                                {(itemDetails?.packages || []).filter(p => ['active', 'trial'].includes(p.status)).map((pkg) => (
                                  <div key={pkg.id} className="p-3 border rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Package className="w-4 h-4 text-indigo-600" />
                                        <span className="font-medium text-sm">{pkg.package?.name}</span>
                                      </div>
                                      {getStatusBadge(pkg.status)}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                      €{pkg.billing_cycle === 'yearly' ? pkg.package?.price_yearly : pkg.package?.price_monthly}/{pkg.billing_cycle === 'yearly' ? 'anno' : 'mese'}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Abbonamenti Singoli */}
                        <div className="p-4">
                          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                            Abbonamenti Servizi ({(itemDetails?.subscriptions || []).filter(s => ['active', 'trial'].includes(s.status)).length})
                          </h4>
                          {(itemDetails?.subscriptions || []).filter(s => ['active', 'trial'].includes(s.status)).length === 0 ? (
                            <p className="text-sm text-gray-400 italic">Nessun abbonamento attivo</p>
                          ) : (
                            <div className="space-y-2">
                              {(itemDetails?.subscriptions || []).filter(s => ['active', 'trial'].includes(s.status)).map((sub) => {
                                const ServiceIcon = SERVICE_ICONS[sub.plan?.service?.icon] || Star;
                                return (
                                  <div key={sub.id} className="p-3 border rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 rounded" style={{ backgroundColor: `${sub.plan?.service?.color}20` }}>
                                        <ServiceIcon className="w-4 h-4" style={{ color: sub.plan?.service?.color }} />
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">{sub.plan?.service?.name}</p>
                                        <p className="text-xs text-gray-500">Piano: {sub.plan?.name}</p>
                                      </div>
                                      {getStatusBadge(sub.status)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Pannello Dettagli Attività */}
                {selectedItem && activeTab === 'clienti' && selectedItem.type === 'activity' && (
                  <div className="w-[420px] bg-white rounded-xl shadow-sm overflow-hidden max-h-[calc(100vh-200px)] overflow-y-auto">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white sticky top-0">
                      <div className="flex items-start justify-between">
                        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                          <Store className="w-8 h-8" />
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => openModal('activity', 'edit', selectedItem)} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mt-4">{selectedItem.name}</h3>
                      <p className="opacity-80">{selectedItem.organizationName || itemDetails?.organization?.name || 'Nessuna organizzazione'}</p>
                    </div>

                    {loadingDetails ? (
                      <div className="p-8 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                      </div>
                    ) : (
                      <>
                        <div className="p-4 border-b">
                          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Informazioni</h4>
                          <div className="space-y-2">
                            <DetailRow icon={Mail} label="Email" value={itemDetails?.email || selectedItem.email || '-'} />
                            <DetailRow icon={Phone} label="Telefono" value={itemDetails?.phone || selectedItem.phone || '-'} />
                            <DetailRow icon={MapPin} label="Indirizzo" value={itemDetails?.address || selectedItem.address || '-'} />
                            <DetailRow icon={Hash} label="P.IVA" value={itemDetails?.vatNumber || '-'} />
                            <div className="flex items-center justify-between py-2">
                              <span className="text-sm text-gray-500">Stato</span>
                              {getStatusBadge(itemDetails?.status || selectedItem.status)}
                            </div>
                          </div>
                        </div>

                        {/* Organizzazione */}
                        {(itemDetails?.organization || selectedItem.organization) && (
                          <div className="p-4 border-b">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Organizzazione</h4>
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium">{itemDetails?.organization?.name || selectedItem.organization?.name}</span>
                              </div>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                (itemDetails?.organization?.accountType || selectedItem.organization?.accountType) === 'agency'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {(itemDetails?.organization?.accountType || selectedItem.organization?.accountType) === 'agency' ? 'Agenzia' : 'Singolo'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Membri */}
                        <div className="p-4 border-b">
                          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                            Membri ({itemDetails?.members?.length || selectedItem.membersCount || 0})
                          </h4>
                          {(itemDetails?.members || []).length === 0 ? (
                            <p className="text-sm text-gray-400 italic">Nessun membro</p>
                          ) : (
                            <div className="space-y-2">
                              {(itemDetails?.members || []).map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-xs font-medium">
                                      {(member.fullName || member.email || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">{member.fullName || 'Nome non impostato'}</p>
                                      <p className="text-xs text-gray-500">{member.email}</p>
                                    </div>
                                  </div>
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                                    member.role === 'owner' ? 'bg-purple-100 text-purple-700' :
                                    member.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {member.role}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Abbonamenti / Servizi Attivi */}
                        <div className="p-4">
                          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                            Servizi Attivi ({(itemDetails?.subscriptions || []).filter(s => ['active', 'trial'].includes(s.status)).length})
                          </h4>
                          {(itemDetails?.subscriptions || []).filter(s => ['active', 'trial'].includes(s.status)).length === 0 ? (
                            <p className="text-sm text-gray-400 italic">Nessun servizio attivo</p>
                          ) : (
                            <div className="space-y-3">
                              {(itemDetails?.subscriptions || []).filter(s => ['active', 'trial'].includes(s.status)).map((sub) => {
                                const ServiceIcon = SERVICE_ICONS[sub.plan?.service?.icon] || Star;
                                const serviceColor = sub.plan?.service?.color || '#6366f1';
                                return (
                                  <div key={sub.id} className="p-3 border rounded-lg hover:shadow-sm transition-shadow">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="p-2 rounded-lg" style={{ backgroundColor: `${serviceColor}15` }}>
                                        <ServiceIcon className="w-5 h-5" style={{ color: serviceColor }} />
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-medium">{sub.plan?.service?.name}</p>
                                        <p className="text-xs text-gray-500">Piano: {sub.plan?.name}</p>
                                      </div>
                                      {getStatusBadge(sub.status)}
                                    </div>

                                    {/* Dettagli piano */}
                                    <div className="bg-gray-50 rounded-lg p-2 mb-2">
                                      <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">Prezzo</span>
                                        <span className="font-medium">
                                          €{sub.billingCycle === 'yearly' ? sub.plan?.priceYearly : sub.plan?.priceMonthly}/{sub.billingCycle === 'yearly' ? 'anno' : 'mese'}
                                        </span>
                                      </div>
                                      {sub.status === 'trial' && sub.trialEndsAt && (
                                        <div className="flex justify-between text-xs mt-1">
                                          <span className="text-gray-500">Fine prova</span>
                                          <span className="font-medium text-blue-600">
                                            {new Date(sub.trialEndsAt).toLocaleDateString('it-IT')}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Features */}
                                    {sub.plan?.features && sub.plan.features.length > 0 && (
                                      <div className="text-xs text-gray-600 space-y-1 mb-2">
                                        {sub.plan.features.slice(0, 3).map((f, i) => (
                                          <div key={i} className="flex items-center gap-1">
                                            <Check className="w-3 h-3 text-green-500" />
                                            <span>{f}</span>
                                          </div>
                                        ))}
                                        {sub.plan.features.length > 3 && (
                                          <span className="text-gray-400">+{sub.plan.features.length - 3} altre...</span>
                                        )}
                                      </div>
                                    )}

                                    {/* Accedi al servizio */}
                                    {sub.plan?.service?.code && selectedItem?.id && (
                                      <button
                                        onClick={() => {
                                          const owner = (itemDetails?.members || []).find(m => m.role === 'owner');
                                          if (owner?.userId) {
                                            handleAdminAccessService(owner.userId, selectedItem.id, sub.plan.service.code);
                                          } else {
                                            setError('Impossibile trovare il proprietario dell\'attività');
                                          }
                                        }}
                                        disabled={accessingService === sub.plan.service.code}
                                        className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                        style={{
                                          backgroundColor: `${serviceColor}15`,
                                          color: serviceColor
                                        }}
                                      >
                                        {accessingService === sub.plan.service.code ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <ExternalLink className="w-4 h-4" />
                                        )}
                                        Accedi a {sub.plan.service.name}
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Plans Tab - Piani per Servizio Singolo */}
            {activeTab === 'plans' && (
              <div className="space-y-6">
                {/* Service selector */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setSelectedService(null)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${!selectedService ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                    >
                      Tutti
                    </button>
                    {services.map(service => {
                      const IconComponent = SERVICE_ICONS[service.icon] || Star;
                      return (
                        <button
                          key={service.id}
                          onClick={() => setSelectedService(service.id)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedService === service.id ? 'text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                          style={selectedService === service.id ? { backgroundColor: service.color } : {}}
                        >
                          <IconComponent className="w-4 h-4" />
                          {service.name}
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={() => openModal('plan', 'create')} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Nuovo Piano
                  </button>
                </div>

                {/* Plans grouped by service */}
                {selectedService ? (
                  // Single service view
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlans.map(plan => {
                      const service = services.find(s => s.id === plan.serviceId);
                      return (
                        <PlanCard
                          key={plan.id}
                          plan={plan}
                          service={service}
                          onEdit={() => openModal('plan', 'edit', plan)}
                          onDelete={() => setDeleteConfirm({ type: 'plan', id: plan.id, name: plan.name })}
                        />
                      );
                    })}
                  </div>
                ) : (
                  // All services view
                  plansByService.map(service => {
                    const IconComponent = SERVICE_ICONS[service.icon] || Star;
                    if (service.plans.length === 0) return null;
                    return (
                      <div key={service.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-4 border-b flex items-center gap-3" style={{ borderLeftWidth: 4, borderLeftColor: service.color }}>
                          <div className="p-2 rounded-lg" style={{ backgroundColor: `${service.color}20` }}>
                            <IconComponent className="w-5 h-5" style={{ color: service.color }} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{service.name}</h3>
                            <p className="text-sm text-gray-500">{service.plans.length} piani disponibili</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                          {service.plans.map(plan => (
                            <PlanCard
                              key={plan.id}
                              plan={plan}
                              service={service}
                              compact
                              onEdit={() => openModal('plan', 'edit', plan)}
                              onDelete={() => setDeleteConfirm({ type: 'plan', id: plan.id, name: plan.name })}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Packages Tab */}
            {activeTab === 'packages' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Cerca pacchetti..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white" />
                  </div>
                  <button onClick={() => openModal('package', 'create')} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Nuovo Pacchetto
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPackages.map((pkg) => (
                    <div key={pkg.id} className={`bg-white rounded-xl shadow-sm overflow-hidden border-2 transition-all hover:shadow-md ${pkg.isActive ? 'border-transparent' : 'border-red-200 opacity-60'}`}>
                      <div className={`p-4 ${pkg.isActive ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-gray-400'} text-white`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-mono opacity-75">{pkg.code}</p>
                            <h3 className="text-lg font-bold mt-1">{pkg.name}</h3>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => openModal('package', 'edit', pkg)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => setDeleteConfirm({ type: 'package', id: pkg.id, name: pkg.name })} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{pkg.description || 'Nessuna descrizione'}</p>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Mensile</span>
                            <span className="text-lg font-bold text-gray-900">€{pkg.priceMonthly}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Annuale</span>
                            <span className="text-lg font-bold text-gray-900">€{pkg.priceYearly}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-sm text-gray-500">Max Attività</span>
                            <span className="font-medium">{pkg.maxActivities === -1 ? 'Illimitate' : pkg.maxActivities}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-slide-up">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">
                  {modalMode === 'create' && modalType === 'user' && 'Nuovo Utente'}
                  {modalMode === 'edit' && modalType === 'user' && 'Modifica Utente'}
                  {modalMode === 'create' && modalType === 'organization' && 'Nuova Organizzazione'}
                  {modalMode === 'edit' && modalType === 'organization' && 'Modifica Organizzazione'}
                  {modalMode === 'create' && modalType === 'activity' && 'Nuova Attività'}
                  {modalMode === 'create' && modalType === 'package' && 'Nuovo Pacchetto'}
                  {modalMode === 'edit' && modalType === 'package' && 'Modifica Pacchetto'}
                  {modalMode === 'create' && modalType === 'plan' && 'Nuovo Piano Servizio'}
                  {modalMode === 'edit' && modalType === 'plan' && 'Modifica Piano'}
                </h3>
                <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(90vh-180px)] overflow-y-auto">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* User Form */}
              {modalType === 'user' && (
                <>
                  <FormField label="Email" required>
                    <input type="email" required value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" placeholder="utente@esempio.it" />
                  </FormField>
                  {modalMode === 'create' && (
                    <FormField label="Password" required>
                      <input type="password" required minLength={8} value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="input-field" placeholder="Minimo 8 caratteri" />
                    </FormField>
                  )}
                  <FormField label="Nome Completo" required>
                    <input type="text" required value={formData.fullName || ''} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="input-field" placeholder="Mario Rossi" />
                  </FormField>
                  {modalMode === 'create' && (
                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <input type="checkbox" checked={formData.emailConfirm !== false} onChange={(e) => setFormData({ ...formData, emailConfirm: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <div>
                        <p className="font-medium text-gray-700">Conferma email automaticamente</p>
                        <p className="text-xs text-gray-500">L'utente non dovrà verificare la propria email</p>
                      </div>
                    </label>
                  )}
                </>
              )}

              {/* Organization Form */}
              {modalType === 'organization' && (
                <>
                  <FormField label="Nome Organizzazione" required>
                    <input type="text" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Nome azienda o attività" />
                  </FormField>
                  <FormField label="Email">
                    <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" placeholder="info@azienda.it" />
                  </FormField>
                  <FormField label="Tipo Account">
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.accountType === 'single' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'} ${modalMode === 'edit' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <input type="radio" name="accountType" value="single" checked={formData.accountType === 'single'} onChange={(e) => setFormData({ ...formData, accountType: e.target.value })} disabled={modalMode === 'edit'} className="sr-only" />
                        <Building2 className={`w-6 h-6 ${formData.accountType === 'single' ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <div><p className="font-medium">Singolo</p><p className="text-xs text-gray-500">1 attività</p></div>
                      </label>
                      <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.accountType === 'agency' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'} ${modalMode === 'edit' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <input type="radio" name="accountType" value="agency" checked={formData.accountType === 'agency'} onChange={(e) => setFormData({ ...formData, accountType: e.target.value })} disabled={modalMode === 'edit'} className="sr-only" />
                        <Briefcase className={`w-6 h-6 ${formData.accountType === 'agency' ? 'text-purple-600' : 'text-gray-400'}`} />
                        <div><p className="font-medium">Agenzia</p><p className="text-xs text-gray-500">Multi attività</p></div>
                      </label>
                    </div>
                  </FormField>
                  <FormField label="Max Attività" hint="-1 per illimitate">
                    <input type="number" min={-1} value={formData.maxActivities ?? 1} onChange={(e) => setFormData({ ...formData, maxActivities: parseInt(e.target.value) })} className="input-field" />
                  </FormField>
                  {modalMode === 'create' && (
                    <FormField label="Email Owner" hint="Opzionale - Assegna a un utente esistente">
                      <input type="email" value={formData.ownerEmail || ''} onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })} className="input-field" placeholder="owner@esempio.it" />
                    </FormField>
                  )}
                  {modalMode === 'edit' && (
                    <FormField label="Stato">
                      <select value={formData.status || 'active'} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="input-field">
                        <option value="active">Attivo</option>
                        <option value="suspended">Sospeso</option>
                        <option value="cancelled">Cancellato</option>
                      </select>
                    </FormField>
                  )}
                </>
              )}

              {/* Activity Form */}
              {modalType === 'activity' && modalMode === 'create' && (
                <>
                  <FormField label="Organizzazione" required>
                    <select required value={formData.organizationId || ''} onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })} className="input-field">
                      <option value="">Seleziona organizzazione...</option>
                      {organizations.map((org) => (<option key={org.id} value={org.id}>{org.name} {org.accountType === 'agency' ? '(Agenzia)' : ''}</option>))}
                    </select>
                  </FormField>
                  <FormField label="Nome Attività" required>
                    <input type="text" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Ristorante Da Mario" />
                  </FormField>
                  <FormField label="Email">
                    <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" placeholder="info@attivita.it" />
                  </FormField>
                </>
              )}

              {/* Package Form */}
              {modalType === 'package' && (
                <>
                  <FormField label="Codice" required hint="Identificativo univoco (es. agency_pro)">
                    <input type="text" required value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="input-field font-mono" disabled={modalMode === 'edit'} placeholder="agency_pro" />
                  </FormField>
                  <FormField label="Nome" required>
                    <input type="text" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Agency Pro" />
                  </FormField>
                  <FormField label="Descrizione">
                    <textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field resize-none" rows={2} placeholder="Descrizione del pacchetto..." />
                  </FormField>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Prezzo Mensile" required>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                        <input type="number" required min={0} step={0.01} value={formData.priceMonthly ?? 0} onChange={(e) => setFormData({ ...formData, priceMonthly: parseFloat(e.target.value) })} className="input-field pl-8" />
                      </div>
                    </FormField>
                    <FormField label="Prezzo Annuale" required>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                        <input type="number" required min={0} step={0.01} value={formData.priceYearly ?? 0} onChange={(e) => setFormData({ ...formData, priceYearly: parseFloat(e.target.value) })} className="input-field pl-8" />
                      </div>
                    </FormField>
                  </div>
                  <FormField label="Max Attività" hint="-1 per illimitate">
                    <input type="number" min={-1} value={formData.maxActivities ?? -1} onChange={(e) => setFormData({ ...formData, maxActivities: parseInt(e.target.value) })} className="input-field" />
                  </FormField>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input type="checkbox" checked={formData.isActive !== false} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <div><p className="font-medium text-gray-700">Pacchetto attivo</p><p className="text-xs text-gray-500">I pacchetti disattivati non sono disponibili per l'acquisto</p></div>
                  </label>
                </>
              )}

              {/* Plan Form */}
              {modalType === 'plan' && (
                <>
                  <FormField label="Servizio" required>
                    <select required value={formData.serviceId || ''} onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })} className="input-field" disabled={modalMode === 'edit'}>
                      <option value="">Seleziona servizio...</option>
                      {services.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                    </select>
                  </FormField>
                  <FormField label="Codice" required hint="Es: free, pro, business">
                    <input type="text" required value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="input-field font-mono" disabled={modalMode === 'edit'} placeholder="pro" />
                  </FormField>
                  <FormField label="Nome" required>
                    <input type="text" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Pro" />
                  </FormField>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Prezzo Mensile" required>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                        <input type="number" required min={0} step={0.01} value={formData.priceMonthly ?? 0} onChange={(e) => setFormData({ ...formData, priceMonthly: parseFloat(e.target.value) })} className="input-field pl-8" />
                      </div>
                    </FormField>
                    <FormField label="Prezzo Annuale" required>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                        <input type="number" required min={0} step={0.01} value={formData.priceYearly ?? 0} onChange={(e) => setFormData({ ...formData, priceYearly: parseFloat(e.target.value) })} className="input-field pl-8" />
                      </div>
                    </FormField>
                  </div>
                  <FormField label="Features" hint="Una per riga">
                    <textarea
                      value={(formData.features || []).join('\n')}
                      onChange={(e) => setFormData({ ...formData, features: e.target.value.split('\n').filter(f => f.trim()) })}
                      className="input-field resize-none"
                      rows={4}
                      placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                    />
                  </FormField>
                  <FormField label="Ordine">
                    <input type="number" min={0} value={formData.sortOrder ?? 0} onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })} className="input-field" />
                  </FormField>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input type="checkbox" checked={formData.isActive !== false} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <div><p className="font-medium text-gray-700">Piano attivo</p><p className="text-xs text-gray-500">I piani disattivati non sono disponibili</p></div>
                  </label>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={closeModal} className="btn-outline">Annulla</button>
                <button type="submit" className="btn-primary">{modalMode === 'create' ? 'Crea' : 'Salva modifiche'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Conferma eliminazione</h3>
              <p className="text-gray-500 mb-6">
                Sei sicuro di voler eliminare <strong className="text-gray-900">{deleteConfirm.name}</strong>?
                <br /><span className="text-sm text-red-500">Questa azione non può essere annullata.</span>
              </p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="btn-outline px-6">Annulla</button>
                <button onClick={() => handleDelete(deleteConfirm.type, deleteConfirm.id)} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">Elimina</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Components
function StatCard({ title, value, subtitle, icon: Icon, color, trend }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            {trend === 'up' && <span className="text-green-500">↑</span>}
            {subtitle}
          </p>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colors[color]} text-white shadow-lg`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 ml-auto truncate">{value}</span>
    </div>
  );
}

function FormField({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

function PlanCard({ plan, service, compact, onEdit, onDelete }) {
  const isFree = plan.priceMonthly === 0 && plan.priceYearly === 0;
  const IconComponent = SERVICE_ICONS[service?.icon] || Star;

  return (
    <div className={`bg-white rounded-xl border-2 transition-all hover:shadow-md overflow-hidden ${!plan.isActive ? 'border-red-200 opacity-60' : isFree ? 'border-green-200' : 'border-gray-200'}`}>
      <div className={`p-3 flex items-center justify-between ${isFree ? 'bg-green-50' : ''}`} style={!isFree && service?.color ? { borderBottom: `3px solid ${service.color}` } : {}}>
        <div className="flex items-center gap-2">
          {!compact && <IconComponent className="w-4 h-4" style={{ color: service?.color }} />}
          <span className="font-semibold">{plan.name}</span>
          {isFree && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">FREE</span>}
          {!plan.isActive && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">OFF</span>}
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-1 text-gray-400 hover:text-indigo-600 rounded"><Edit2 className="w-4 h-4" /></button>
          <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="p-3">
        <div className="flex justify-between items-baseline mb-2">
          <div>
            <span className="text-2xl font-bold">€{plan.priceMonthly}</span>
            <span className="text-gray-500 text-sm">/mese</span>
          </div>
          <div className="text-right text-sm text-gray-500">
            €{plan.priceYearly}/anno
          </div>
        </div>
        {plan.features && plan.features.length > 0 && (
          <ul className="text-sm text-gray-600 space-y-1 mt-3 pt-3 border-t">
            {plan.features.slice(0, compact ? 3 : 6).map((f, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
            {plan.features.length > (compact ? 3 : 6) && (
              <li className="text-gray-400 text-xs">+{plan.features.length - (compact ? 3 : 6)} altre...</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
