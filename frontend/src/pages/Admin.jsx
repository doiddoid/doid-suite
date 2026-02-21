import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Building2, Store, Package, Activity,
  RefreshCw, Plus, AlertCircle, X, Trash2, Edit2,
  Mail, Calendar, Hash, CreditCard, Star, FileText,
  Check, Clock, Ban, Search, UtensilsCrossed, Monitor,
  User, Shield, Briefcase, MapPin, Phone, Layers,
  ExternalLink, Loader2, LogIn, ChevronDown, ChevronRight,
  MessageSquare, Zap, Key, Bot, CheckCircle, XCircle,
  ChevronUp, GripVertical
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import ServiceStatusManager from '../components/Admin/ServiceStatusManager';
import ServiceAssignmentModal from '../components/Admin/ServiceAssignmentModal';
import BillingSummary from '../components/Admin/BillingSummary';
import CommunicationLogs from '../components/Admin/CommunicationLogs';
import PlansSummaryTable from '../components/Admin/PlansSummaryTable';
import DeletedActivitiesTable from '../components/Admin/DeletedActivitiesTable';
import OrganizationAssignModal from '../components/Admin/OrganizationAssignModal';
import CredentialsModal from '../components/Admin/CredentialsModal';
import MembersManageModal from '../components/Admin/MembersManageModal';
import ClientDetailPanel from '../components/Admin/ClientDetailPanel';

// Mappa icone servizi - estesa
const SERVICE_ICONS = {
  Star: Star,
  star: Star,
  FileText: FileText,
  'file-text': FileText,
  UtensilsCrossed: UtensilsCrossed,
  utensils: UtensilsCrossed,
  'utensils-crossed': UtensilsCrossed,
  Monitor: Monitor,
  monitor: Monitor,
  Key: Key,
  key: Key,
  'key-round': Key,
  Users: Users,
  users: Users,
  Building2: Building2,
  building: Building2,
  Store: Store,
  store: Store,
  Package: Package,
  package: Package,
  Mail: Mail,
  mail: Mail,
  CreditCard: CreditCard,
  'credit-card': CreditCard,
  Shield: Shield,
  shield: Shield,
  Zap: Zap,
  zap: Zap,
  Activity: Activity,
  activity: Activity,
  Layers: Layers,
  layers: Layers,
  Bot: Bot,
  bot: Bot
};

// Lista icone disponibili per il selettore
const AVAILABLE_ICONS = [
  { value: 'star', label: 'Stella', icon: Star },
  { value: 'file-text', label: 'Documento', icon: FileText },
  { value: 'utensils-crossed', label: 'Posate', icon: UtensilsCrossed },
  { value: 'monitor', label: 'Monitor', icon: Monitor },
  { value: 'key', label: 'Chiave', icon: Key },
  { value: 'bot', label: 'Bot', icon: Bot },
  { value: 'users', label: 'Utenti', icon: Users },
  { value: 'building', label: 'Edificio', icon: Building2 },
  { value: 'store', label: 'Negozio', icon: Store },
  { value: 'package', label: 'Pacchetto', icon: Package },
  { value: 'mail', label: 'Email', icon: Mail },
  { value: 'credit-card', label: 'Carta', icon: CreditCard },
  { value: 'shield', label: 'Sicurezza', icon: Shield },
  { value: 'zap', label: 'Energia', icon: Zap },
  { value: 'activity', label: 'Attività', icon: Activity },
  { value: 'layers', label: 'Livelli', icon: Layers }
];

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

  // Stati per editing inline servizi
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editingServiceData, setEditingServiceData] = useState({});
  const [addingNewService, setAddingNewService] = useState(false);
  const [newServiceData, setNewServiceData] = useState({});
  const [savingService, setSavingService] = useState(false);

  // Stati per comunicazioni e gestione servizi
  const [communicationLogs, setCommunicationLogs] = useState([]);
  const [logsFilters, setLogsFilters] = useState({});
  const [logsPagination, setLogsPagination] = useState(null);
  const [serviceStatusModal, setServiceStatusModal] = useState(null); // { activityId, activityName, service, subscription, effectiveStatus, isActive, daysRemaining }
  const [activityServices, setActivityServices] = useState({}); // Cache dei servizi per attività
  const [showServiceAssignment, setShowServiceAssignment] = useState(false); // Modal assegnazione servizi
  const [orgAssignModal, setOrgAssignModal] = useState(null); // { activityId, activityName, currentOrganization }
  const [credentialsModal, setCredentialsModal] = useState(null); // { userId, userEmail, userName }
  const [membersModal, setMembersModal] = useState(null); // { entityType, entityId, entityName, members }

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
    } else if (activeTab === 'comunicazioni') {
      fetchCommunicationLogs();
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

  // Sposta servizio su/giù per cambiare ordine
  const moveService = async (serviceId, direction) => {
    const currentIndex = services.findIndex(s => s.id === serviceId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= services.length) return;

    const otherService = services[newIndex];
    const currentService = services[currentIndex];

    try {
      // Scambia sortOrder tra i due servizi
      await Promise.all([
        api.request(`/admin/services/${currentService.id}`, {
          method: 'PUT',
          body: JSON.stringify({ sortOrder: newIndex })
        }),
        api.request(`/admin/services/${otherService.id}`, {
          method: 'PUT',
          body: JSON.stringify({ sortOrder: currentIndex })
        })
      ]);
      fetchServices();
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

  // Fetch communication logs
  const fetchCommunicationLogs = async (filters = {}, loadMore = false) => {
    if (!loadMore) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.event) params.append('event', filters.event);
      if (loadMore && logsPagination) {
        params.append('offset', communicationLogs.length);
      }
      params.append('limit', '50');

      const response = await api.request(`/admin/communications?${params.toString()}`);
      if (response.success) {
        if (loadMore) {
          setCommunicationLogs(prev => [...prev, ...(response.data.logs || [])]);
        } else {
          setCommunicationLogs(response.data.logs || []);
        }
        setLogsPagination(response.data.pagination);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Fetch servizi per attività
  const fetchActivityServices = async (activityId) => {
    try {
      const response = await api.request(`/admin/activities/${activityId}/services`);
      if (response.success) {
        setActivityServices(prev => ({ ...prev, [activityId]: response.data.services }));
        return response.data.services;
      }
    } catch (err) {
      console.error('Error fetching activity services:', err);
    }
    return [];
  };

  // Update service status per attività
  const handleUpdateServiceStatus = async (activityId, serviceCode, updates) => {
    try {
      const response = await api.request(`/admin/activities/${activityId}/services/${serviceCode}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      if (response.success) {
        setSuccessMessage('Stato servizio aggiornato');
        // Refresh services for this activity
        await fetchActivityServices(activityId);
        // Refresh item details based on what we're viewing
        if (selectedItem?.type === 'activity' && selectedItem?.id === activityId) {
          fetchItemDetails('activity', activityId);
        } else if (selectedItem?.type === 'organization') {
          // Refresh organization to update activity services
          fetchItemDetails('organization', selectedItem.id);
        }
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      throw err;
    }
  };

  // Open service status modal
  const openServiceStatusModal = (activityId, activityName, service, subscription, effectiveStatus, isActive, daysRemaining) => {
    setServiceStatusModal({
      activityId,
      activityName,
      service,
      subscription,
      effectiveStatus,
      isActive,
      daysRemaining
    });
  };

  // Fetch dettagli completi quando si seleziona un item
  const fetchItemDetails = async (type, id) => {
    setLoadingDetails(true);
    setItemDetails(null);
    try {
      let endpoint = '';
      if (type === 'user') endpoint = `/admin/users/${id}/details`;
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

    // Carica utenti per dropdown owner se necessario
    if ((type === 'organization' || type === 'activity') && mode === 'create') {
      if (users.length === 0) {
        fetchUsers();
      }
    }

    if (mode === 'edit' || mode === 'view') {
      // Assicura che features sia gestito correttamente per i piani
      const itemData = { ...item };
      if (type === 'plan') {
        // Se features è un oggetto, convertilo in JSON string per editing
        // Se è un array di stringhe, uniscile con newline
        // Se è null/undefined, usa array vuoto
        if (itemData.features && typeof itemData.features === 'object' && !Array.isArray(itemData.features)) {
          // È un oggetto JSON - lo convertiamo in stringa JSON per editarlo
          itemData.featuresIsObject = true;
          itemData.featuresOriginal = itemData.features;
          itemData.features = [JSON.stringify(itemData.features, null, 2)];
        } else if (!Array.isArray(itemData.features)) {
          itemData.features = [];
        }
      }
      setFormData(itemData);
    } else {
      if (type === 'user') {
        setFormData({ email: '', password: '', fullName: '', emailConfirm: true });
      } else if (type === 'organization') {
        setFormData({ name: '', email: '', accountType: 'single', maxActivities: 1, ownerId: '' });
      } else if (type === 'activity') {
        setFormData({ name: '', email: '', organizationId: '', ownerId: '' });
      } else if (type === 'package') {
        setFormData({ code: '', name: '', description: '', priceMonthly: 0, priceYearly: 0, maxActivities: -1, isActive: true });
      } else if (type === 'plan') {
        setFormData({ serviceId: selectedService || '', code: '', name: '', priceMonthly: 0, priceYearly: 0, features: [], isActive: true, sortOrder: 0 });
      } else if (type === 'service') {
        setFormData({ code: '', name: '', description: '', appUrl: '', icon: '', colorPrimary: '#3B82F6', priceProMonthly: 0, priceProYearly: 0, priceAddonMonthly: null, hasFreeTier: false, trialDays: 30, isActive: true, sortOrder: 0 });
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
        // Prepara i dati del piano
        const planData = { ...formData };
        // Se features era un oggetto JSON, riconvertilo
        if (planData.featuresIsObject && planData.features?.length === 1) {
          try {
            planData.features = JSON.parse(planData.features[0]);
          } catch {
            // Lascia come array se il parse fallisce
          }
        }
        // Rimuovi campi temporanei
        delete planData.featuresIsObject;
        delete planData.featuresOriginal;

        if (modalMode === 'create') {
          response = await api.request('/admin/plans', {
            method: 'POST',
            body: JSON.stringify(planData)
          });
        } else if (modalMode === 'edit') {
          response = await api.request(`/admin/plans/${editingItem.id}`, {
            method: 'PUT',
            body: JSON.stringify(planData)
          });
        }
        if (response.success) {
          fetchPlans();
          setSuccessMessage(modalMode === 'create' ? 'Piano creato' : 'Piano aggiornato');
        }
      } else if (modalType === 'service') {
        if (modalMode === 'create') {
          response = await api.request('/admin/services', {
            method: 'POST',
            body: JSON.stringify(formData)
          });
        } else if (modalMode === 'edit') {
          response = await api.request(`/admin/services/${editingItem.id}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
          });
        }
        if (response.success) {
          fetchServices();
          setSuccessMessage(modalMode === 'create' ? 'Servizio creato' : 'Servizio aggiornato');
        }
      }

      // Chiudi modal solo se operazione riuscita
      if (response?.success) {
        closeModal();
      } else if (response?.error) {
        setError(response.error);
      }
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
        if (!id) {
          throw new Error('ID piano mancante');
        }
        response = await api.request(`/admin/plans/${id}`, { method: 'DELETE' });
        if (response.success) {
          fetchPlans();
          setSuccessMessage('Piano disattivato con successo');
        }
      } else if (type === 'service') {
        if (!id) {
          throw new Error('ID servizio mancante');
        }
        response = await api.request(`/admin/services/${id}`, { method: 'DELETE' });
        if (response.success) {
          fetchServices();
          setSuccessMessage('Servizio disattivato con successo');
        }
      }
      if (!response?.success) {
        const errorDetails = response?.details
          ? `: ${response.details.map(d => `${d.path || d.param}: ${d.msg}`).join(', ')}`
          : '';
        throw new Error((response?.error || 'Errore durante l\'eliminazione') + errorDetails);
      }
      if (type !== 'plan') {
        setSuccessMessage('Eliminato con successo');
      }
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
    { id: 'riepilogo-piani', name: 'Riepilogo Piani', icon: CreditCard },
    { id: 'eliminati', name: 'Eliminati', icon: Trash2 },
    { id: 'plans', name: 'Piani Servizi', icon: Layers },
    { id: 'packages', name: 'Pacchetti Agency', icon: Package },
    { id: 'comunicazioni', name: 'Comunicazioni', icon: MessageSquare },
  ];

  const getStatusBadge = (status, daysRemaining = null) => {
    const styles = {
      active: 'bg-green-100 text-green-700 border-green-200',
      suspended: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
      trial: 'bg-blue-100 text-blue-700 border-blue-200',
      inactive: 'bg-gray-100 text-gray-500 border-gray-200',
      free: 'bg-green-100 text-green-700 border-green-200',
      pro: 'bg-purple-100 text-purple-700 border-purple-200',
      expired: 'bg-orange-100 text-orange-700 border-orange-200',
      past_due: 'bg-orange-100 text-orange-700 border-orange-200',
    };
    const labels = {
      active: 'Attivo',
      suspended: 'Sospeso',
      cancelled: 'Cancellato',
      trial: daysRemaining !== null ? `Trial • ${daysRemaining}g` : 'Trial',
      inactive: 'Non attivo',
      free: 'FREE',
      pro: 'PRO',
      expired: 'Scaduto',
      past_due: 'In attesa',
    };
    const icons = {
      active: Check,
      suspended: Clock,
      cancelled: Ban,
      trial: Clock,
      inactive: Ban,
      free: Check,
      pro: Zap,
      expired: AlertCircle,
      past_due: CreditCard,
    };
    const IconComponent = icons[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {IconComponent && <IconComponent className="w-3 h-3 mr-1" />}
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
                  <p className="text-indigo-100 mt-1">Gestione completa del sistema doID Suite</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                fetchStats();
                if (activeTab === 'clienti') fetchOrganizations();
                else if (activeTab === 'packages') fetchPackages();
                else if (activeTab === 'plans') { fetchServices(); fetchPlans(); }
                else if (activeTab === 'comunicazioni') fetchCommunicationLogs(logsFilters);
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
              <div className="flex gap-4 h-[calc(100vh-280px)]">
                {/* Lista Clienti — si restringe quando dettaglio aperto */}
                <div className={`transition-all duration-300 ease-in-out bg-white rounded-xl shadow-sm overflow-hidden flex flex-col ${
                  selectedItem ? 'w-[45%] max-w-[520px] min-w-[320px] flex-shrink-0' : 'flex-1'
                }`}>
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
                      <button
                        onClick={() => setShowServiceAssignment(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        Assegna Servizio
                      </button>
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
                  <div className="divide-y divide-gray-100 flex-1 overflow-y-auto">
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
                                const subscriptions = (orgData?.subscriptions || []);
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

                {/* Pannello Dettaglio Cliente — Split View */}
                {selectedItem && (
                  <div className="flex-1 min-w-0">
                    <ClientDetailPanel
                      selectedItem={selectedItem}
                      itemDetails={itemDetails}
                      loadingDetails={loadingDetails}
                      activityServices={activityServices}
                      onClose={() => { setSelectedItem(null); setItemDetails(null); }}
                      onOpenServiceStatus={openServiceStatusModal}
                      onOpenOrgAssign={(data) => setOrgAssignModal(data)}
                      onOpenCredentials={(data) => setCredentialsModal(data)}
                      onOpenMembers={(data) => setMembersModal(data)}
                      onFetchActivityServices={fetchActivityServices}
                      SERVICE_ICONS={SERVICE_ICONS}
                      getStatusBadge={getStatusBadge}
                      onImpersonate={handleImpersonate}
                      impersonating={impersonating}
                      onOpenEdit={(type, item) => openModal(type, 'edit', item)}
                      onRefreshDetails={() => {
                        if (selectedItem?.type === 'organization') {
                          fetchItemDetails('organization', selectedItem.id);
                        } else if (selectedItem?.type === 'activity') {
                          fetchItemDetails('activity', selectedItem.id);
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Riepilogo Piani Tab - Tabella riassuntiva piani attivi per cliente */}
            {activeTab === 'riepilogo-piani' && (
              <PlansSummaryTable
                onSelectActivity={(activity) => {
                  if (activity?.id) {
                    setActiveTab('clienti');
                    setTimeout(() => {
                      handleSelectItem({ ...activity, type: 'activity' }, 'activity');
                    }, 100);
                  }
                }}
              />
            )}

            {/* Deleted Activities Tab */}
            {activeTab === 'eliminati' && (
              <DeletedActivitiesTable />
            )}

            {/* Plans Tab - Gestione Servizi Inline */}
            {activeTab === 'plans' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Gestione Servizi</h3>
                    {!addingNewService && (
                      <button
                        onClick={() => {
                          setAddingNewService(true);
                          setNewServiceData({
                            code: '',
                            name: '',
                            description: '',
                            appUrl: '',
                            icon: 'star',
                            colorPrimary: '#3B82F6',
                            priceProMonthly: 0,
                            priceProYearly: 0,
                            priceAddonMonthly: '',
                            hasFreeTier: false,
                            trialDays: 30,
                            isActive: true,
                            sortOrder: services.length
                          });
                        }}
                        className="btn-primary flex items-center gap-2 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Nuovo Servizio
                      </button>
                    )}
                  </div>

                  {/* New Service Form - Inline */}
                  {addingNewService && (
                    <div className="p-6 bg-green-50 border-b-2 border-green-200">
                      <div className="flex items-center gap-2 mb-6">
                        <Plus className="w-5 h-5 text-green-600" />
                        <h4 className="font-semibold text-green-900">Nuovo Servizio</h4>
                      </div>

                      {/* Info Base */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Codice *</label>
                          <input type="text" value={newServiceData.code || ''} onChange={(e) => setNewServiceData({ ...newServiceData, code: e.target.value.toLowerCase().replace(/[^a-z_]/g, '') })} className="w-full px-3 py-2 border rounded-lg text-sm font-mono" placeholder="review" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Nome Servizio *</label>
                          <input type="text" value={newServiceData.name || ''} onChange={(e) => setNewServiceData({ ...newServiceData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Smart Review" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Titolo (headline)</label>
                          <input type="text" value={newServiceData.headline || ''} onChange={(e) => setNewServiceData({ ...newServiceData, headline: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="I tuoi schermi che vendono per te" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Claim (tagline)</label>
                          <input type="text" value={newServiceData.tagline || ''} onChange={(e) => setNewServiceData({ ...newServiceData, tagline: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Digital signage che attira clienti" />
                        </div>
                      </div>

                      {/* Vantaggi */}
                      <div className="mb-6">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Vantaggi (uno per riga)</label>
                        <textarea value={(newServiceData.benefits || []).join('\n')} onChange={(e) => setNewServiceData({ ...newServiceData, benefits: e.target.value.split('\n').filter(b => b.trim()) })} className="w-full px-3 py-2 border rounded-lg text-sm" rows={3} placeholder="Palinsesti automatici e dinamici&#10;Gestione multi-schermo da remoto&#10;Contenuti che catturano l'attenzione" />
                      </div>

                      {/* Aspetto */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Icona</label>
                          <div className="flex gap-2 mb-3">
                            <div className="p-3 rounded-lg border" style={{ backgroundColor: newServiceData.colorLight || `${newServiceData.colorPrimary || '#3B82F6'}15`, borderColor: newServiceData.borderColor || `${newServiceData.colorPrimary || '#3B82F6'}40` }}>
                              {(() => { const IconComp = SERVICE_ICONS[newServiceData.icon] || Star; return <IconComp className="w-6 h-6" style={{ color: newServiceData.colorPrimary || '#3B82F6' }} />; })()}
                            </div>
                            <select value={newServiceData.icon || 'star'} onChange={(e) => setNewServiceData({ ...newServiceData, icon: e.target.value })} className="flex-1 px-3 py-2 border rounded-lg text-sm">
                              {AVAILABLE_ICONS.map(ic => <option key={ic.value} value={ic.value}>{ic.label}</option>)}
                            </select>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Colore</label>
                              <div className="flex gap-1">
                                <input type="color" value={newServiceData.colorPrimary || '#3B82F6'} onChange={(e) => setNewServiceData({ ...newServiceData, colorPrimary: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
                                <input type="text" value={newServiceData.colorPrimary || ''} onChange={(e) => setNewServiceData({ ...newServiceData, colorPrimary: e.target.value })} className="flex-1 px-2 py-1 border rounded text-xs font-mono" placeholder="#3B82F6" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Bg Light</label>
                              <div className="flex gap-1">
                                <input type="color" value={newServiceData.colorLight || '#EFF6FF'} onChange={(e) => setNewServiceData({ ...newServiceData, colorLight: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
                                <input type="text" value={newServiceData.colorLight || ''} onChange={(e) => setNewServiceData({ ...newServiceData, colorLight: e.target.value })} className="flex-1 px-2 py-1 border rounded text-xs font-mono" placeholder="#EFF6FF" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Bordo</label>
                              <div className="flex gap-1">
                                <input type="color" value={newServiceData.borderColor || '#BFDBFE'} onChange={(e) => setNewServiceData({ ...newServiceData, borderColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
                                <input type="text" value={newServiceData.borderColor || ''} onChange={(e) => setNewServiceData({ ...newServiceData, borderColor: e.target.value })} className="flex-1 px-2 py-1 border rounded text-xs font-mono" placeholder="#BFDBFE" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">URL App</label>
                          <input type="url" value={newServiceData.appUrl || ''} onChange={(e) => setNewServiceData({ ...newServiceData, appUrl: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="https://review.doid.it" />
                        </div>
                      </div>

                      {/* Prezzi */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Pro/mese *</label>
                          <input type="number" step="0.01" value={newServiceData.priceProMonthly ?? ''} onChange={(e) => setNewServiceData({ ...newServiceData, priceProMonthly: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="14.90" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Pro/anno *</label>
                          <input type="number" step="0.01" value={newServiceData.priceProYearly ?? ''} onChange={(e) => setNewServiceData({ ...newServiceData, priceProYearly: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="149.00" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Addon/mese</label>
                          <input type="number" step="0.01" value={newServiceData.priceAddonMonthly ?? ''} onChange={(e) => setNewServiceData({ ...newServiceData, priceAddonMonthly: e.target.value ? parseFloat(e.target.value) : null })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="12.90" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Trial (gg)</label>
                          <input type="number" value={newServiceData.trialDays ?? 30} onChange={(e) => setNewServiceData({ ...newServiceData, trialDays: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                        </div>
                      </div>

                      {/* Flags */}
                      <div className="flex flex-wrap gap-6 mb-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={newServiceData.contactRequired || false} onChange={(e) => setNewServiceData({ ...newServiceData, contactRequired: e.target.checked })} className="w-4 h-4 rounded" />
                          <span className="text-sm">Richiedi Info (no prezzi)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={newServiceData.hasFreeTier || false} onChange={(e) => setNewServiceData({ ...newServiceData, hasFreeTier: e.target.checked })} className="w-4 h-4 rounded" />
                          <span className="text-sm">Ha piano Free</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={newServiceData.isActive !== false} onChange={(e) => setNewServiceData({ ...newServiceData, isActive: e.target.checked })} className="w-4 h-4 rounded" />
                          <span className="text-sm">Attivo</span>
                        </label>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setAddingNewService(false); setNewServiceData({}); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annulla</button>
                        <button onClick={async () => {
                          if (!newServiceData.code || !newServiceData.name) { setError('Codice e nome sono obbligatori'); return; }
                          setSavingService(true);
                          try {
                            const response = await api.request('/admin/services', { method: 'POST', body: JSON.stringify(newServiceData) });
                            if (response.success) { fetchServices(); setAddingNewService(false); setNewServiceData({}); setSuccessMessage('Servizio creato con successo'); }
                            else { setError(response.error || 'Errore nella creazione'); }
                          } catch (err) { setError(err.message); }
                          setSavingService(false);
                        }} disabled={savingService} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                          {savingService && <Loader2 className="w-4 h-4 animate-spin" />}
                          Crea Servizio
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Services List */}
                  <div className="divide-y">
                    {services.map((service, index) => {
                      const IconComponent = SERVICE_ICONS[service.icon] || Star;
                      const isEditing = editingServiceId === service.id;

                      return (
                        <div key={service.id} className={`${!service.isActive ? 'bg-gray-50 opacity-60' : ''}`}>
                          {/* View Mode */}
                          {!isEditing ? (
                            <div className="p-4 flex items-center gap-4 hover:bg-gray-50">
                              {/* Sort Order Controls */}
                              <div className="flex flex-col gap-0.5">
                                <button
                                  onClick={() => moveService(service.id, 'up')}
                                  disabled={index === 0}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Sposta su"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => moveService(service.id, 'down')}
                                  disabled={index === services.length - 1}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Sposta giù"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="p-2 rounded-lg" style={{ backgroundColor: `${service.color || service.colorPrimary}20` }}>
                                <IconComponent className="w-5 h-5" style={{ color: service.color || service.colorPrimary }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900">{service.name}</span>
                                  <span className="text-xs font-mono text-gray-400">{service.code}</span>
                                  {!service.isActive && <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded">Off</span>}
                                  {service.contactRequired && <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-600 rounded">Info</span>}
                                </div>
                                {service.tagline && <p className="text-sm text-gray-500 truncate">{service.tagline}</p>}
                              </div>
                              <div className="flex items-center gap-6 text-sm">
                                <div className="text-center">
                                  <div className="text-gray-400 text-xs">Free</div>
                                  <div className="flex justify-center">
                                    {service.hasFreeTier ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-400" />}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-gray-400 text-xs">Pro/mese</div>
                                  <div className="font-semibold">€{service.priceProMonthly?.toFixed(2) || '0.00'}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-gray-400 text-xs">Pro/anno</div>
                                  <div className="font-semibold">€{service.priceProYearly?.toFixed(2) || '0.00'}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-gray-400 text-xs">Addon</div>
                                  <div className="font-semibold">{service.priceAddonMonthly ? `€${service.priceAddonMonthly.toFixed(2)}` : '-'}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-gray-400 text-xs">Trial</div>
                                  <div className="font-semibold">{service.trialDays || 0}gg</div>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditingServiceId(service.id);
                                    setEditingServiceData({ ...service });
                                  }}
                                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                  title="Modifica"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm({ type: 'service', id: service.id, name: service.name })}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Elimina"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Edit Mode */
                            <div className="p-6 bg-indigo-50 border-l-4 border-indigo-500">
                              <div className="flex items-center gap-2 mb-6">
                                <Edit2 className="w-5 h-5 text-indigo-600" />
                                <h4 className="font-semibold text-indigo-900">Modifica: {service.name}</h4>
                              </div>

                              {/* Info Base */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Codice</label>
                                  <input
                                    type="text"
                                    value={editingServiceData.code || ''}
                                    disabled
                                    className="w-full px-3 py-2 border rounded-lg text-sm font-mono bg-gray-100"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Nome Servizio *</label>
                                  <input
                                    type="text"
                                    value={editingServiceData.name || ''}
                                    onChange={(e) => setEditingServiceData({ ...editingServiceData, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Titolo (headline)</label>
                                  <input
                                    type="text"
                                    value={editingServiceData.headline || ''}
                                    onChange={(e) => setEditingServiceData({ ...editingServiceData, headline: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                    placeholder="I tuoi schermi che vendono per te"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Claim (tagline)</label>
                                  <input
                                    type="text"
                                    value={editingServiceData.tagline || ''}
                                    onChange={(e) => setEditingServiceData({ ...editingServiceData, tagline: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                    placeholder="Digital signage che attira clienti"
                                  />
                                </div>
                              </div>

                              {/* Vantaggi */}
                              <div className="mb-6">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Vantaggi (uno per riga)</label>
                                <textarea
                                  value={(editingServiceData.benefits || []).join('\n')}
                                  onChange={(e) => setEditingServiceData({ ...editingServiceData, benefits: e.target.value.split('\n').filter(b => b.trim()) })}
                                  className="w-full px-3 py-2 border rounded-lg text-sm"
                                  rows={3}
                                  placeholder="Palinsesti automatici e dinamici&#10;Gestione multi-schermo da remoto&#10;Contenuti che catturano l'attenzione"
                                />
                              </div>

                              {/* Aspetto */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Icona</label>
                                  <div className="flex gap-2 mb-3">
                                    <div className="p-3 rounded-lg border" style={{ backgroundColor: editingServiceData.colorLight || `${editingServiceData.colorPrimary || editingServiceData.color || '#3B82F6'}15`, borderColor: editingServiceData.borderColor || `${editingServiceData.colorPrimary || editingServiceData.color || '#3B82F6'}40` }}>
                                      {(() => { const IconComp = SERVICE_ICONS[editingServiceData.icon] || Star; return <IconComp className="w-6 h-6" style={{ color: editingServiceData.colorPrimary || editingServiceData.color || '#3B82F6' }} />; })()}
                                    </div>
                                    <select
                                      value={editingServiceData.icon || 'star'}
                                      onChange={(e) => setEditingServiceData({ ...editingServiceData, icon: e.target.value })}
                                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                    >
                                      {AVAILABLE_ICONS.map(ic => <option key={ic.value} value={ic.value}>{ic.label}</option>)}
                                    </select>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <label className="block text-xs text-gray-500 mb-1">Colore</label>
                                      <div className="flex gap-1">
                                        <input type="color" value={editingServiceData.colorPrimary || editingServiceData.color || '#3B82F6'} onChange={(e) => setEditingServiceData({ ...editingServiceData, colorPrimary: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
                                        <input type="text" value={editingServiceData.colorPrimary || editingServiceData.color || ''} onChange={(e) => setEditingServiceData({ ...editingServiceData, colorPrimary: e.target.value })} className="flex-1 px-2 py-1 border rounded text-xs font-mono" />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-500 mb-1">Bg Light</label>
                                      <div className="flex gap-1">
                                        <input type="color" value={editingServiceData.colorLight || '#EFF6FF'} onChange={(e) => setEditingServiceData({ ...editingServiceData, colorLight: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
                                        <input type="text" value={editingServiceData.colorLight || ''} onChange={(e) => setEditingServiceData({ ...editingServiceData, colorLight: e.target.value })} className="flex-1 px-2 py-1 border rounded text-xs font-mono" />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-500 mb-1">Bordo</label>
                                      <div className="flex gap-1">
                                        <input type="color" value={editingServiceData.borderColor || '#BFDBFE'} onChange={(e) => setEditingServiceData({ ...editingServiceData, borderColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
                                        <input type="text" value={editingServiceData.borderColor || ''} onChange={(e) => setEditingServiceData({ ...editingServiceData, borderColor: e.target.value })} className="flex-1 px-2 py-1 border rounded text-xs font-mono" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">URL App</label>
                                  <input
                                    type="url"
                                    value={editingServiceData.appUrl || ''}
                                    onChange={(e) => setEditingServiceData({ ...editingServiceData, appUrl: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                  />
                                </div>
                              </div>

                              {/* Prezzi */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Pro/mese *</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editingServiceData.priceProMonthly ?? ''}
                                    onChange={(e) => setEditingServiceData({ ...editingServiceData, priceProMonthly: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Pro/anno *</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editingServiceData.priceProYearly ?? ''}
                                    onChange={(e) => setEditingServiceData({ ...editingServiceData, priceProYearly: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Addon/mese</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editingServiceData.priceAddonMonthly ?? ''}
                                    onChange={(e) => setEditingServiceData({ ...editingServiceData, priceAddonMonthly: e.target.value ? parseFloat(e.target.value) : null })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Trial (gg)</label>
                                  <input
                                    type="number"
                                    value={editingServiceData.trialDays ?? 30}
                                    onChange={(e) => setEditingServiceData({ ...editingServiceData, trialDays: parseInt(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                  />
                                </div>
                              </div>

                              {/* Flags */}
                              <div className="flex flex-wrap gap-6 mb-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editingServiceData.contactRequired || false}
                                    onChange={(e) => setEditingServiceData({ ...editingServiceData, contactRequired: e.target.checked })}
                                    className="w-4 h-4 rounded"
                                  />
                                  <span className="text-sm">Richiedi Info (no prezzi)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editingServiceData.hasFreeTier || false}
                                    onChange={(e) => setEditingServiceData({ ...editingServiceData, hasFreeTier: e.target.checked })}
                                    className="w-4 h-4 rounded"
                                  />
                                  <span className="text-sm">Ha piano Free</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editingServiceData.isActive !== false}
                                    onChange={(e) => setEditingServiceData({ ...editingServiceData, isActive: e.target.checked })}
                                    className="w-4 h-4 rounded"
                                  />
                                  <span className="text-sm">Attivo</span>
                                </label>
                              </div>

                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => { setEditingServiceId(null); setEditingServiceData({}); }}
                                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                  Annulla
                                </button>
                                <button
                                  onClick={async () => {
                                    setSavingService(true);
                                    try {
                                      // Invia solo i campi modificabili con i tipi corretti
                                      const updatePayload = {
                                        name: editingServiceData.name,
                                        tagline: editingServiceData.tagline || '',
                                        headline: editingServiceData.headline || '',
                                        benefits: editingServiceData.benefits || [],
                                        contactRequired: Boolean(editingServiceData.contactRequired),
                                        appUrl: editingServiceData.appUrl || '',
                                        icon: editingServiceData.icon || 'star',
                                        colorPrimary: editingServiceData.colorPrimary || editingServiceData.color || '#3B82F6',
                                        colorLight: editingServiceData.colorLight || '',
                                        borderColor: editingServiceData.borderColor || '',
                                        priceProMonthly: parseFloat(editingServiceData.priceProMonthly) || 0,
                                        priceProYearly: parseFloat(editingServiceData.priceProYearly) || 0,
                                        priceAddonMonthly: editingServiceData.priceAddonMonthly ? parseFloat(editingServiceData.priceAddonMonthly) : null,
                                        hasFreeTier: Boolean(editingServiceData.hasFreeTier),
                                        trialDays: parseInt(editingServiceData.trialDays) || 30,
                                        isActive: editingServiceData.isActive !== false
                                      };
                                      const response = await api.request(`/admin/services/${service.id}`, {
                                        method: 'PUT',
                                        body: JSON.stringify(updatePayload)
                                      });
                                      if (response.success) {
                                        fetchServices();
                                        setEditingServiceId(null);
                                        setEditingServiceData({});
                                        setSuccessMessage('Servizio aggiornato');
                                      } else {
                                        setError(response.error || 'Errore nel salvataggio');
                                      }
                                    } catch (err) {
                                      setError(err.message);
                                    }
                                    setSavingService(false);
                                  }}
                                  disabled={savingService}
                                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                  {savingService && <Loader2 className="w-4 h-4 animate-spin" />}
                                  Salva Modifiche
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {services.length === 0 && !addingNewService && (
                      <div className="p-8 text-center text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Nessun servizio configurato</p>
                        <button
                          onClick={() => {
                            setAddingNewService(true);
                            setNewServiceData({
                              code: '',
                              name: '',
                              priceProMonthly: 0,
                              priceProYearly: 0,
                              trialDays: 30,
                              isActive: true
                            });
                          }}
                          className="mt-3 text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          + Aggiungi il primo servizio
                        </button>
                      </div>
                    )}
                  </div>
                </div>
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

            {/* Comunicazioni Tab */}
            {activeTab === 'comunicazioni' && (
              <CommunicationLogs
                logs={communicationLogs}
                pagination={logsPagination}
                filters={logsFilters}
                onFilterChange={(newFilters) => {
                  setLogsFilters(newFilters);
                  fetchCommunicationLogs(newFilters);
                }}
                onLoadMore={() => fetchCommunicationLogs(logsFilters, true)}
                loading={loading}
              />
            )}
          </>
        )}
      </div>

      {/* Service Status Modal */}
      {serviceStatusModal && (
        <ServiceStatusManager
          activityId={serviceStatusModal.activityId}
          activityName={serviceStatusModal.activityName}
          service={serviceStatusModal.service}
          subscription={serviceStatusModal.subscription}
          effectiveStatus={serviceStatusModal.effectiveStatus}
          isActive={serviceStatusModal.isActive}
          daysRemaining={serviceStatusModal.daysRemaining}
          onUpdate={handleUpdateServiceStatus}
          onClose={() => setServiceStatusModal(null)}
        />
      )}

      {/* Service Assignment Modal */}
      {showServiceAssignment && (
        <ServiceAssignmentModal
          isOpen={showServiceAssignment}
          onClose={() => setShowServiceAssignment(false)}
          onSuccess={(data, message) => {
            setShowServiceAssignment(false);
            fetchActivities();
            fetchOrganizations();
            setSuccessMessage(message || 'Servizio assegnato con successo');
          }}
          activities={activities}
          services={services}
        />
      )}

      {/* Organization Assignment Modal */}
      {orgAssignModal && (
        <OrganizationAssignModal
          activityId={orgAssignModal.activityId}
          activityName={orgAssignModal.activityName}
          currentOrganization={orgAssignModal.currentOrganization}
          onUpdate={() => {
            // Refresh dei dettagli dopo assegnazione
            if (selectedItem?.type === 'activity') {
              fetchItemDetails('activity', selectedItem.id);
            } else if (selectedItem?.type === 'organization') {
              fetchItemDetails('organization', selectedItem.id);
            }
          }}
          onClose={() => setOrgAssignModal(null)}
        />
      )}

      {/* Credentials Modal */}
      {credentialsModal && (
        <CredentialsModal
          userId={credentialsModal.userId}
          userEmail={credentialsModal.userEmail}
          userName={credentialsModal.userName}
          onClose={() => setCredentialsModal(null)}
        />
      )}

      {membersModal && (
        <MembersManageModal
          entityType={membersModal.entityType}
          entityId={membersModal.entityId}
          entityName={membersModal.entityName}
          members={membersModal.members}
          onUpdate={() => {
            // Ricarica i dettagli dell'entità
            if (selectedItem?.id) {
              if (membersModal.entityType === 'organization') {
                fetchItemDetails('organization', selectedItem.id);
              } else {
                fetchItemDetails('activity', selectedItem.id);
              }
            }
          }}
          onClose={() => setMembersModal(null)}
        />
      )}

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
                  {modalMode === 'create' && modalType === 'service' && 'Nuovo Servizio'}
                  {modalMode === 'edit' && modalType === 'service' && 'Modifica Servizio'}
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
                  <FormField label="Nome Cliente / Organizzazione" required>
                    <input type="text" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Nome azienda o attività" />
                  </FormField>
                  <FormField label="Email">
                    <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" placeholder="info@azienda.it" />
                  </FormField>
                  {modalMode === 'create' && (
                    <div className="space-y-3">
                      <FormField label="Owner" hint="Utente proprietario del cliente">
                        <div className="flex gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, createNewOwner: false, newOwnerEmail: '', newOwnerPassword: '', newOwnerName: '' })}
                            className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${!formData.createNewOwner ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                          >
                            Seleziona esistente
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, createNewOwner: true, ownerId: '' })}
                            className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${formData.createNewOwner ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                          >
                            + Crea nuovo
                          </button>
                        </div>
                        {!formData.createNewOwner ? (
                          <select
                            value={formData.ownerId || ''}
                            onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                            className="input-field"
                          >
                            <option value="">Nessun owner (opzionale)...</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.fullName || u.email} {u.fullName ? `(${u.email})` : ''}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="space-y-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <input
                              type="text"
                              value={formData.newOwnerName || ''}
                              onChange={(e) => setFormData({ ...formData, newOwnerName: e.target.value })}
                              className="input-field"
                              placeholder="Nome completo *"
                              required={formData.createNewOwner}
                            />
                            <input
                              type="email"
                              value={formData.newOwnerEmail || ''}
                              onChange={(e) => setFormData({ ...formData, newOwnerEmail: e.target.value })}
                              className="input-field"
                              placeholder="Email *"
                              required={formData.createNewOwner}
                            />
                            <input
                              type="password"
                              value={formData.newOwnerPassword || ''}
                              onChange={(e) => setFormData({ ...formData, newOwnerPassword: e.target.value })}
                              className="input-field"
                              placeholder="Password (min 8 caratteri) *"
                              minLength={8}
                              required={formData.createNewOwner}
                            />
                          </div>
                        )}
                      </FormField>
                    </div>
                  )}
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
                  <FormField label="Features" hint={formData.featuresIsObject ? "JSON object (modifica con attenzione)" : "Una per riga"}>
                    <textarea
                      value={Array.isArray(formData.features) ? formData.features.join('\n') : ''}
                      onChange={(e) => {
                        const newFeatures = e.target.value.split('\n').filter(f => f.trim());
                        // Se era un oggetto JSON, prova a parsarlo di nuovo
                        if (formData.featuresIsObject && newFeatures.length === 1) {
                          try {
                            const parsed = JSON.parse(newFeatures[0]);
                            setFormData({ ...formData, features: newFeatures, featuresOriginal: parsed });
                          } catch {
                            setFormData({ ...formData, features: newFeatures });
                          }
                        } else {
                          setFormData({ ...formData, features: newFeatures, featuresIsObject: false });
                        }
                      }}
                      className={`input-field resize-none ${formData.featuresIsObject ? 'font-mono text-xs' : ''}`}
                      rows={formData.featuresIsObject ? 8 : 4}
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

              {/* Service Form */}
              {modalType === 'service' && (
                <>
                  <FormField label="Codice" required hint="Identificativo univoco (es: review, page, menu)">
                    <input type="text" required value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/[^a-z_]/g, '') })} className="input-field font-mono" disabled={modalMode === 'edit'} placeholder="review" />
                  </FormField>
                  <FormField label="Nome" required>
                    <input type="text" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Smart Review" />
                  </FormField>
                  <FormField label="Descrizione">
                    <textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field resize-none" rows={2} placeholder="Descrizione del servizio..." />
                  </FormField>
                  <FormField label="URL App">
                    <input type="url" value={formData.appUrl || ''} onChange={(e) => setFormData({ ...formData, appUrl: e.target.value })} className="input-field" placeholder="https://review.doid.it" />
                  </FormField>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Icona" hint="Nome icona Lucide">
                      <input type="text" value={formData.icon || ''} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className="input-field" placeholder="star" />
                    </FormField>
                    <FormField label="Colore Primario">
                      <div className="flex gap-2">
                        <input type="color" value={formData.colorPrimary || '#3B82F6'} onChange={(e) => setFormData({ ...formData, colorPrimary: e.target.value })} className="w-12 h-10 rounded border cursor-pointer" />
                        <input type="text" value={formData.colorPrimary || ''} onChange={(e) => setFormData({ ...formData, colorPrimary: e.target.value })} className="input-field flex-1 font-mono" placeholder="#3B82F6" />
                      </div>
                    </FormField>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3">Prezzi</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField label="Pro Mensile" required>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                          <input type="number" required min={0} step={0.01} value={formData.priceProMonthly ?? 0} onChange={(e) => setFormData({ ...formData, priceProMonthly: parseFloat(e.target.value) })} className="input-field pl-8" />
                        </div>
                      </FormField>
                      <FormField label="Pro Annuale" required>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                          <input type="number" required min={0} step={0.01} value={formData.priceProYearly ?? 0} onChange={(e) => setFormData({ ...formData, priceProYearly: parseFloat(e.target.value) })} className="input-field pl-8" />
                        </div>
                      </FormField>
                      <FormField label="Addon Mensile" hint="Opzionale">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                          <input type="number" min={0} step={0.01} value={formData.priceAddonMonthly ?? ''} onChange={(e) => setFormData({ ...formData, priceAddonMonthly: e.target.value ? parseFloat(e.target.value) : null })} className="input-field pl-8" placeholder="-" />
                        </div>
                      </FormField>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Giorni Trial">
                      <input type="number" min={0} value={formData.trialDays ?? 30} onChange={(e) => setFormData({ ...formData, trialDays: parseInt(e.target.value) })} className="input-field" />
                    </FormField>
                    <FormField label="Ordine">
                      <input type="number" min={0} value={formData.sortOrder ?? 0} onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })} className="input-field" />
                    </FormField>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex-1 flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <input type="checkbox" checked={formData.hasFreeTier === true} onChange={(e) => setFormData({ ...formData, hasFreeTier: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                      <div><p className="font-medium text-gray-700">Ha piano Free</p></div>
                    </label>
                    <label className="flex-1 flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <input type="checkbox" checked={formData.isActive !== false} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <div><p className="font-medium text-gray-700">Servizio attivo</p></div>
                    </label>
                  </div>
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

function DetailRow({ icon: Icon, label, value, copyable }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!copyable || !value || value === '-') return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      {copyable ? (
        <button
          onClick={handleCopy}
          className="text-sm font-medium text-gray-900 ml-auto truncate hover:text-amber-600 transition-colors cursor-pointer flex items-center gap-1"
          title="Clicca per copiare"
        >
          <span className="truncate max-w-[180px] font-mono text-xs">{value}</span>
          {copied && <Check className="w-3 h-3 text-green-500" />}
        </button>
      ) : (
        <span className="text-sm font-medium text-gray-900 ml-auto truncate">{value}</span>
      )}
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

  // Gestisce features sia come array di stringhe che come oggetto
  const getDisplayFeatures = () => {
    if (!plan.features) return [];
    if (Array.isArray(plan.features)) {
      // Filtra solo stringhe valide
      return plan.features.filter(f => typeof f === 'string');
    }
    if (typeof plan.features === 'object') {
      // Converte oggetto in array di chiavi per visualizzazione
      return Object.keys(plan.features).map(key => `${key}: ${JSON.stringify(plan.features[key])}`);
    }
    return [];
  };
  const displayFeatures = getDisplayFeatures();

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
        {displayFeatures.length > 0 && (
          <ul className="text-sm text-gray-600 space-y-1 mt-3 pt-3 border-t">
            {displayFeatures.slice(0, compact ? 3 : 6).map((f, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{String(f)}</span>
              </li>
            ))}
            {displayFeatures.length > (compact ? 3 : 6) && (
              <li className="text-gray-400 text-xs">+{displayFeatures.length - (compact ? 3 : 6)} altre...</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
