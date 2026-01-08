import { useState, useEffect } from 'react';
import { User, Building2, CreditCard, Users, Loader2, Save, Trash2, ExternalLink, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useActivities } from '../hooks/useActivities';
import api from '../services/api';

const tabs = [
  { id: 'profile', name: 'Profilo', icon: User },
  { id: 'organization', name: 'Organizzazione', icon: Building2 },
  { id: 'team', name: 'Team', icon: Users },
  { id: 'billing', name: 'Fatturazione', icon: CreditCard },
];

export default function Settings() {
  const { user, currentOrganization, refreshUser } = useAuth();
  const { currentActivity, getServicesDashboard } = useActivities();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Profile state
  const [profile, setProfile] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
  });

  // Organization state
  const [organization, setOrganization] = useState({
    name: '',
    email: '',
    phone: '',
    vatNumber: '',
  });

  // Team state
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState({ email: '', role: 'user' });

  // Services with subscription status (activity-based)
  const [services, setServices] = useState([]);

  // Load organization data and services
  useEffect(() => {
    if (currentOrganization) {
      loadOrganizationData();
    }
  }, [currentOrganization, currentActivity]);

  const loadOrganizationData = async () => {
    if (!currentOrganization?.id) return;

    try {
      // Load organization details
      const orgResponse = await api.getOrganization(currentOrganization.id);
      if (orgResponse.success) {
        setOrganization({
          name: orgResponse.data.name || '',
          email: orgResponse.data.email || '',
          phone: orgResponse.data.phone || '',
          vatNumber: orgResponse.data.vatNumber || '',
        });
      }

      // Load members
      const membersResponse = await api.getOrganizationMembers(currentOrganization.id);
      if (membersResponse.success) {
        setMembers(membersResponse.data);
      }

      // Load services with subscription status (activity-based)
      if (currentActivity?.id) {
        const servicesResponse = await getServicesDashboard(currentActivity.id);
        if (servicesResponse.success) {
          setServices(servicesResponse.data);
        }
      }
    } catch (error) {
      console.error('Error loading organization data:', error);
    }
  };

  const handleSaveOrganization = async () => {
    if (!currentOrganization?.id) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.updateOrganization(currentOrganization.id, organization);
      if (response.success) {
        setMessage({ type: 'success', text: 'Organizzazione aggiornata con successo' });
        refreshUser();
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!currentOrganization?.id || !newMember.email) return;

    setLoading(true);
    try {
      const response = await api.addOrganizationMember(currentOrganization.id, newMember);
      if (response.success) {
        setMembers([...members, response.data]);
        setNewMember({ email: '', role: 'user' });
        setMessage({ type: 'success', text: 'Membro aggiunto con successo' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!currentOrganization?.id) return;
    if (!confirm('Sei sicuro di voler rimuovere questo membro?')) return;

    try {
      await api.removeOrganizationMember(currentOrganization.id, memberId);
      setMembers(members.filter(m => m.id !== memberId));
      setMessage({ type: 'success', text: 'Membro rimosso' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <label className="label">Nome completo</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="input bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                L'email non può essere modificata
              </p>
            </div>
          </div>
        );

      case 'organization':
        return (
          <div className="space-y-6">
            <div>
              <label className="label">Nome organizzazione</label>
              <input
                type="text"
                value={organization.name}
                onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={organization.email}
                onChange={(e) => setOrganization({ ...organization, email: e.target.value })}
                className="input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Telefono</label>
                <input
                  type="tel"
                  value={organization.phone}
                  onChange={(e) => setOrganization({ ...organization, phone: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Partita IVA</label>
                <input
                  type="text"
                  value={organization.vatNumber}
                  onChange={(e) => setOrganization({ ...organization, vatNumber: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            <button
              onClick={handleSaveOrganization}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salva modifiche
                </>
              )}
            </button>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-6">
            {/* Add member form */}
            <form onSubmit={handleAddMember} className="flex gap-3">
              <input
                type="email"
                placeholder="Email del nuovo membro"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                className="input flex-1"
              />
              <select
                value={newMember.role}
                onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                className="input w-32"
              >
                <option value="user">Utente</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit" disabled={loading} className="btn-primary">
                Aggiungi
              </button>
            </form>

            {/* Members list */}
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.fullName || member.email}
                    </p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 capitalize">{member.role}</span>
                    {member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'billing':
        // Helper function to calculate days remaining
        const getDaysRemaining = (expiresAt) => {
          if (!expiresAt) return null;
          const now = new Date();
          const expires = new Date(expiresAt);
          const diffTime = expires - now;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays > 0 ? diffDays : 0;
        };

        // Helper function to format date
        const formatDate = (dateStr) => {
          if (!dateStr) return '-';
          return new Date(dateStr).toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
        };

        // Helper function to get plan display name
        const getPlanDisplayName = (serviceData) => {
          if (!serviceData.subscription) return 'FREE';
          const { status, plan } = serviceData.subscription;
          if (status === 'trial') return 'PRO - TRIAL';
          if (status === 'active' && plan?.code === 'pro') return 'PRO';
          if (plan?.name) return plan.name.toUpperCase();
          return 'FREE';
        };

        // Filter services with active subscriptions (trial or active)
        const activeServices = services.filter(s => s.isActive && s.subscription);
        const inactiveServices = services.filter(s => !s.isActive || !s.subscription);

        return (
          <div className="space-y-6">
            {/* Activity info */}
            {currentActivity && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Fatturazione per l'attività:</p>
                <p className="font-medium text-gray-900">{currentActivity.name}</p>
              </div>
            )}

            {/* Active subscriptions */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Servizi attivi</h3>
              {activeServices.length === 0 ? (
                <p className="text-gray-500">Nessun servizio attivo</p>
              ) : (
                <div className="space-y-3">
                  {activeServices.map((serviceData) => {
                    const { service, subscription } = serviceData;
                    const daysRemaining = getDaysRemaining(subscription?.expiresAt || subscription?.trialEndsAt);
                    const isTrial = subscription?.status === 'trial';
                    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7;

                    return (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <p className="font-medium text-gray-900">{service.name}</p>
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                isTrial
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {getPlanDisplayName(serviceData)}
                            </span>
                          </div>

                          {/* Trial info with days remaining */}
                          {isTrial && daysRemaining !== null && (
                            <div className={`flex items-center gap-1 mt-1 text-sm ${
                              isExpiringSoon ? 'text-red-600' : 'text-amber-600'
                            }`}>
                              <Clock className="w-4 h-4" />
                              <span>
                                {daysRemaining === 0
                                  ? 'Scade oggi!'
                                  : `${daysRemaining} giorni rimanenti`}
                              </span>
                            </div>
                          )}

                          {/* Expiry/renewal date */}
                          <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {isTrial ? 'Scadenza trial: ' : 'Rinnovo: '}
                              {formatDate(subscription?.expiresAt || subscription?.trialEndsAt || subscription?.currentPeriodEnd)}
                            </span>
                          </div>

                          {/* Pricing info for active subscriptions */}
                          {subscription?.status === 'active' && subscription?.plan && (
                            <p className="text-sm text-gray-500 mt-1">
                              €{subscription.billingCycle === 'yearly'
                                ? subscription.plan.priceYearly
                                : subscription.plan.priceMonthly}/
                              {subscription.billingCycle === 'yearly' ? 'anno' : 'mese'}
                            </p>
                          )}

                          {/* Inherited from package */}
                          {subscription?.inherited && (
                            <p className="text-xs text-blue-600 mt-1">
                              Incluso nel pacchetto: {subscription.packageName}
                            </p>
                          )}
                        </div>

                        {/* Action button */}
                        <button
                          onClick={() => window.location.href = `/dashboard?service=${service.code}`}
                          className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1"
                        >
                          Gestisci
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Available services (not active) */}
            {inactiveServices.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Servizi disponibili</h3>
                <div className="space-y-3">
                  {inactiveServices.map((serviceData) => {
                    const { service } = serviceData;
                    return (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <div>
                          <p className="font-medium text-gray-700">{service.name}</p>
                          <p className="text-sm text-gray-500">{service.description}</p>
                        </div>
                        <button
                          onClick={() => window.location.href = `/dashboard?service=${service.code}`}
                          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                        >
                          Attiva
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Impostazioni</h1>

      {/* Message */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Tabs */}
        <div className="md:w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-3" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 card p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
