import { useState, useEffect } from 'react';
import { User, Building2, CreditCard, Users, Loader2, Save, Trash2, ExternalLink, Calendar, Clock, Lock, Eye, EyeOff, Mail, Receipt, Download, ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useActivities } from '../hooks/useActivities';
import api from '../services/api';
import activitiesApi from '../services/activitiesApi';

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
    // Billing fields
    businessName: '',
    fiscalCode: '',
    address: '',
    postalCode: '',
    city: '',
    province: '',
    country: 'Italia',
    sdiCode: '',
    pec: '',
    usePec: false,
  });

  // Team state
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState({ email: '', role: 'user' });

  // Services with subscription status (activity-based)
  const [services, setServices] = useState([]);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Billing state
  const [payments, setPayments] = useState([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [paymentsPage, setPaymentsPage] = useState(0);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [billingProfile, setBillingProfile] = useState(null);
  const [useOrgDataForBilling, setUseOrgDataForBilling] = useState(true);

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
        const data = orgResponse.data;
        setOrganization({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          vatNumber: data.vatNumber || '',
          // Billing fields
          businessName: data.businessName || '',
          fiscalCode: data.fiscalCode || '',
          address: data.address || '',
          postalCode: data.postalCode || '',
          city: data.city || '',
          province: data.province || '',
          country: data.country || 'Italia',
          sdiCode: data.sdiCode || '',
          pec: data.pec || '',
          usePec: data.usePec || false,
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

  // Password validation
  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'La password deve essere di almeno 8 caratteri';
    }
    if (!/\d/.test(password)) {
      return 'La password deve contenere almeno un numero';
    }
    return null;
  };

  // Handle password change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Le password non coincidono' });
      return;
    }

    // Validate password strength
    const validationError = validatePassword(passwordData.newPassword);
    if (validationError) {
      setPasswordMessage({ type: 'error', text: validationError });
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await api.updatePassword(passwordData.newPassword);
      if (response.success) {
        setPasswordMessage({ type: 'success', text: 'Password aggiornata con successo' });
        setPasswordData({ newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: error.message || 'Errore nell\'aggiornamento della password' });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle forgot password (send reset email)
  const handleForgotPassword = async () => {
    if (!user?.email) return;

    setPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' });

    try {
      const response = await api.forgotPassword(user.email);
      if (response.success) {
        setResetEmailSent(true);
        setPasswordMessage({ type: 'success', text: 'Email di reset inviata! Controlla la tua casella di posta.' });
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: error.message || 'Errore nell\'invio dell\'email' });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Load payments for activity
  const loadPayments = async (page = 0) => {
    if (!currentActivity?.id) return;

    setPaymentsLoading(true);
    try {
      const response = await activitiesApi.getPayments(currentActivity.id, 10, page * 10);
      if (response.success) {
        setPayments(response.data.payments);
        setPaymentsTotal(response.data.total);
        setPaymentsPage(page);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setPaymentsLoading(false);
    }
  };

  // Load billing profile
  const loadBillingProfile = async () => {
    try {
      const response = await activitiesApi.getBillingProfile();
      if (response.success && response.data.billingProfile) {
        setBillingProfile(response.data.billingProfile);
        setUseOrgDataForBilling(false);
      }
    } catch (error) {
      console.error('Error loading billing profile:', error);
    }
  };

  // Load payments and billing profile when billing tab is active
  useEffect(() => {
    if (activeTab === 'billing' && currentActivity?.id) {
      loadPayments(0);
      loadBillingProfile();
    }
  }, [activeTab, currentActivity]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-8">
            {/* Profile Info */}
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

            {/* Security Section */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex items-center gap-2 mb-6">
                <Lock className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900">Sicurezza</h3>
              </div>

              {/* Password Message */}
              {passwordMessage.text && (
                <div
                  className={`mb-4 p-3 rounded-lg text-sm ${
                    passwordMessage.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {passwordMessage.text}
                </div>
              )}

              {/* Change Password Form */}
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="label">Nuova password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Minimo 8 caratteri, almeno 1 numero"
                      className="input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Conferma nuova password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Ripeti la nuova password"
                    className="input"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="submit"
                    disabled={passwordLoading || !passwordData.newPassword || !passwordData.confirmPassword}
                    className="btn-primary"
                  >
                    {passwordLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Aggiorna password
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Forgot Password Link */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={passwordLoading || resetEmailSent}
                  className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 disabled:text-gray-400"
                >
                  <Mail className="w-4 h-4" />
                  {resetEmailSent
                    ? 'Email di reset inviata'
                    : 'Hai dimenticato la password? Invia email di reset'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'organization':
        // Italian provinces list
        const provinces = [
          'AG', 'AL', 'AN', 'AO', 'AR', 'AP', 'AT', 'AV', 'BA', 'BT', 'BL', 'BN', 'BG', 'BI', 'BO', 'BZ', 'BS', 'BR',
          'CA', 'CL', 'CB', 'CE', 'CT', 'CZ', 'CH', 'CO', 'CS', 'CR', 'KR', 'CN', 'EN', 'FM', 'FE', 'FI', 'FG', 'FC',
          'FR', 'GE', 'GO', 'GR', 'IM', 'IS', 'SP', 'AQ', 'LT', 'LE', 'LC', 'LI', 'LO', 'LU', 'MC', 'MN', 'MS', 'MT',
          'ME', 'MI', 'MO', 'MB', 'NA', 'NO', 'NU', 'OR', 'PD', 'PA', 'PR', 'PV', 'PG', 'PU', 'PE', 'PC', 'PI', 'PT',
          'PN', 'PZ', 'PO', 'RG', 'RA', 'RC', 'RE', 'RI', 'RN', 'RM', 'RO', 'SA', 'SS', 'SV', 'SI', 'SR', 'SO', 'SU',
          'TA', 'TE', 'TR', 'TO', 'TP', 'TN', 'TV', 'TS', 'UD', 'VA', 'VE', 'VB', 'VC', 'VR', 'VV', 'VI', 'VT'
        ];

        return (
          <div className="space-y-8">
            {/* Dati Azienda */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Dati Azienda</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Nome organizzazione *</label>
                  <input
                    type="text"
                    value={organization.name}
                    onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Ragione sociale</label>
                  <input
                    type="text"
                    value={organization.businessName}
                    onChange={(e) => setOrganization({ ...organization, businessName: e.target.value })}
                    placeholder="Se diversa dal nome organizzazione"
                    className="input"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Codice Fiscale</label>
                    <input
                      type="text"
                      value={organization.fiscalCode}
                      onChange={(e) => setOrganization({ ...organization, fiscalCode: e.target.value.toUpperCase() })}
                      placeholder="16 caratteri"
                      maxLength={16}
                      className="input font-mono"
                    />
                  </div>
                  <div>
                    <label className="label">Partita IVA</label>
                    <input
                      type="text"
                      value={organization.vatNumber}
                      onChange={(e) => setOrganization({ ...organization, vatNumber: e.target.value.replace(/\D/g, '') })}
                      placeholder="11 cifre"
                      maxLength={11}
                      className="input font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Indirizzo */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Indirizzo</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Via / Indirizzo</label>
                  <input
                    type="text"
                    value={organization.address}
                    onChange={(e) => setOrganization({ ...organization, address: e.target.value })}
                    placeholder="Via Roma, 1"
                    className="input"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="label">CAP</label>
                    <input
                      type="text"
                      value={organization.postalCode}
                      onChange={(e) => setOrganization({ ...organization, postalCode: e.target.value.replace(/\D/g, '') })}
                      placeholder="00000"
                      maxLength={5}
                      className="input font-mono"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="label">Città</label>
                    <input
                      type="text"
                      value={organization.city}
                      onChange={(e) => setOrganization({ ...organization, city: e.target.value })}
                      placeholder="Milano"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Provincia</label>
                    <select
                      value={organization.province}
                      onChange={(e) => setOrganization({ ...organization, province: e.target.value })}
                      className="input"
                    >
                      <option value="">--</option>
                      {provinces.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Nazione</label>
                  <input
                    type="text"
                    value={organization.country}
                    onChange={(e) => setOrganization({ ...organization, country: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Fatturazione Elettronica */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Fatturazione Elettronica</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="usePec"
                    checked={organization.usePec}
                    onChange={(e) => setOrganization({ ...organization, usePec: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="usePec" className="text-sm text-gray-700">
                    Usa PEC invece di Codice SDI
                  </label>
                </div>

                {!organization.usePec ? (
                  <div>
                    <label className="label">Codice SDI (Codice Destinatario)</label>
                    <input
                      type="text"
                      value={organization.sdiCode}
                      onChange={(e) => setOrganization({ ...organization, sdiCode: e.target.value.toUpperCase() })}
                      placeholder="7 caratteri (es: M5UXCR1)"
                      maxLength={7}
                      className="input font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Codice univoco per la ricezione delle fatture elettroniche
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="label">PEC (Posta Elettronica Certificata)</label>
                    <input
                      type="email"
                      value={organization.pec}
                      onChange={(e) => setOrganization({ ...organization, pec: e.target.value })}
                      placeholder="azienda@pec.it"
                      className="input"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Indirizzo PEC per la ricezione delle fatture elettroniche
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Contatti */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contatti</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={organization.email}
                    onChange={(e) => setOrganization({ ...organization, email: e.target.value })}
                    placeholder="info@azienda.it"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Telefono</label>
                  <input
                    type="tel"
                    value={organization.phone}
                    onChange={(e) => setOrganization({ ...organization, phone: e.target.value })}
                    placeholder="+39 02 1234567"
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="border-t border-gray-200 pt-6">
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

            {/* Dati Fatturazione */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Dati Fatturazione</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="useOrgData"
                    checked={useOrgDataForBilling}
                    onChange={(e) => setUseOrgDataForBilling(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="useOrgData" className="text-sm text-gray-700">
                    Usa dati organizzazione per fatturazione
                  </label>
                </div>

                {useOrgDataForBilling ? (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Ragione sociale:</span> {organization.businessName || organization.name || '-'}</p>
                    <p><span className="font-medium">P.IVA:</span> {organization.vatNumber || '-'}</p>
                    <p><span className="font-medium">Indirizzo:</span> {organization.address ? `${organization.address}, ${organization.postalCode} ${organization.city} (${organization.province})` : '-'}</p>
                    <p><span className="font-medium">SDI/PEC:</span> {organization.usePec ? organization.pec : organization.sdiCode || '-'}</p>
                    <button
                      onClick={() => setActiveTab('organization')}
                      className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                    >
                      Modifica dati organizzazione →
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 space-y-1">
                    {billingProfile ? (
                      <>
                        <p><span className="font-medium">Ragione sociale:</span> {billingProfile.companyName || '-'}</p>
                        <p><span className="font-medium">P.IVA:</span> {billingProfile.vatNumber || '-'}</p>
                        <p><span className="font-medium">C.F.:</span> {billingProfile.fiscalCode || '-'}</p>
                        <p><span className="font-medium">Indirizzo:</span> {billingProfile.addressLine1 ? `${billingProfile.addressLine1}, ${billingProfile.postalCode} ${billingProfile.city}` : '-'}</p>
                        <p><span className="font-medium">SDI/PEC:</span> {billingProfile.pecEmail || billingProfile.sdiCode || '-'}</p>
                      </>
                    ) : (
                      <p className="text-gray-500 italic">Nessun profilo di fatturazione configurato</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Storico Pagamenti/Fatture */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="w-5 h-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">Storico Pagamenti</h3>
              </div>

              {paymentsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : payments.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">Nessun pagamento registrato</p>
              ) : (
                <>
                  {/* Payments table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-2 font-medium text-gray-600">Data</th>
                          <th className="text-left py-3 px-2 font-medium text-gray-600">Descrizione</th>
                          <th className="text-right py-3 px-2 font-medium text-gray-600">Importo</th>
                          <th className="text-center py-3 px-2 font-medium text-gray-600">Stato</th>
                          <th className="text-center py-3 px-2 font-medium text-gray-600"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment) => (
                          <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-2 text-gray-600">
                              {new Date(payment.date).toLocaleDateString('it-IT')}
                            </td>
                            <td className="py-3 px-2 text-gray-900">{payment.description}</td>
                            <td className="py-3 px-2 text-right font-medium text-gray-900">
                              €{payment.amount?.toFixed(2)}
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                                payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                                payment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {payment.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                                {payment.status === 'pending' && <AlertCircle className="w-3 h-3" />}
                                {payment.status === 'failed' && <XCircle className="w-3 h-3" />}
                                {payment.status === 'completed' ? 'Pagato' :
                                 payment.status === 'pending' ? 'In attesa' :
                                 payment.status === 'failed' ? 'Fallito' :
                                 payment.status}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              {payment.status === 'completed' && (
                                <button
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                  title="Scarica fattura"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {paymentsTotal > 10 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-500">
                        {paymentsPage * 10 + 1}-{Math.min((paymentsPage + 1) * 10, paymentsTotal)} di {paymentsTotal}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadPayments(paymentsPage - 1)}
                          disabled={paymentsPage === 0}
                          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => loadPayments(paymentsPage + 1)}
                          disabled={(paymentsPage + 1) * 10 >= paymentsTotal}
                          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
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
