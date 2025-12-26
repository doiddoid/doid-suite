import { useState, useEffect } from 'react';
import { User, Building2, CreditCard, Users, Loader2, Save, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const tabs = [
  { id: 'profile', name: 'Profilo', icon: User },
  { id: 'organization', name: 'Organizzazione', icon: Building2 },
  { id: 'team', name: 'Team', icon: Users },
  { id: 'billing', name: 'Fatturazione', icon: CreditCard },
];

export default function Settings() {
  const { user, currentOrganization, refreshUser } = useAuth();
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

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState([]);

  // Load organization data
  useEffect(() => {
    if (currentOrganization) {
      loadOrganizationData();
    }
  }, [currentOrganization]);

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

      // Load subscriptions
      const subsResponse = await api.getSubscriptions(currentOrganization.id);
      if (subsResponse.success) {
        setSubscriptions(subsResponse.data);
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
        return (
          <div className="space-y-6">
            <h3 className="font-medium text-gray-900">Abbonamenti attivi</h3>
            {subscriptions.length === 0 ? (
              <p className="text-gray-500">Nessun abbonamento attivo</p>
            ) : (
              <div className="space-y-3">
                {subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {sub.plan?.service?.name} - {sub.plan?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {sub.billingCycle === 'yearly' ? 'Annuale' : 'Mensile'} •{' '}
                        €{sub.billingCycle === 'yearly' ? sub.plan?.priceYearly : sub.plan?.priceMonthly}/
                        {sub.billingCycle === 'yearly' ? 'anno' : 'mese'}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        sub.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : sub.status === 'trial'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {sub.status === 'active' ? 'Attivo' : sub.status === 'trial' ? 'Prova' : sub.status}
                    </span>
                  </div>
                ))}
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
