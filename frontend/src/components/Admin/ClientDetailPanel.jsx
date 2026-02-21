import { useState, useEffect } from 'react';
import {
  X, Building2, Key, Mail, Phone, Hash, MapPin,
  Calendar, AlertCircle, Edit2, Check, Clock, Zap,
  Star, Loader2, RefreshCw, Trash2, LogIn, Store,
  UserPlus, Link2, Unlink2, Briefcase, User, ExternalLink
} from 'lucide-react';
import api from '../../services/api';

// Emoji per i servizi (usati nelle card come da mockup)
const SERVICE_EMOJI = {
  review: '⭐', page: '📄', menu: '🍽️', display: '🖥️',
  agent: '🤖', connect: '🔗'
};

// ─── Badge stato servizio ──────────────────────────────────
const ServiceStatusBadge = ({ status, small }) => {
  const map = {
    pro: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', label: 'PRO', Icon: Zap },
    active: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', label: 'PRO', Icon: Zap },
    trial: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', label: 'TRIAL', Icon: Clock },
    free: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', label: 'FREE', Icon: Check },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200', label: 'INATTIVO', Icon: null },
    expired: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'SCADUTO', Icon: AlertCircle },
    past_due: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', label: 'IN ATTESA', Icon: AlertCircle },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'CANCELLATO', Icon: X },
    suspended: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', label: 'SOSPESO', Icon: Clock },
  };
  const s = map[status] || map.inactive;
  return (
    <span className={`inline-flex items-center gap-1 ${small ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'} rounded-md font-bold border ${s.bg} ${s.text} ${s.border} tracking-wide`}>
      {s.Icon && <s.Icon className={small ? 'w-2.5 h-2.5' : 'w-3 h-3'} />}
      {s.label}
    </span>
  );
};

// ─── Badge metodo pagamento ────────────────────────────────
const PaymentBadge = ({ method }) => {
  if (!method) return null;
  const isStripe = method === 'stripe';
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${
      isStripe ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
    }`}>
      {isStripe ? '💳 Stripe' : '🏦 Bonifico'}
    </span>
  );
};

export default function ClientDetailPanel({
  selectedItem,
  itemDetails,
  loadingDetails,
  activityServices,
  onClose,
  onOpenServiceStatus,
  onOpenOrgAssign,
  onOpenCredentials,
  onOpenMembers,
  onFetchActivityServices,
  SERVICE_ICONS,
  getStatusBadge,
  onImpersonate,
  impersonating,
  onOpenEdit,
  onRefreshDetails,
}) {
  const [activeTab, setActiveTab] = useState('servizi');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  // Reset tab e edit mode quando cambia l'item selezionato
  useEffect(() => {
    if (selectedItem) {
      setActiveTab('servizi');
      setEditMode(false);
    }
  }, [selectedItem?.id, selectedItem?.type]);

  // Popola editData quando arrivano i dettagli
  useEffect(() => {
    if (itemDetails) {
      setEditData({
        name: itemDetails.name || selectedItem?.name || '',
        email: itemDetails.email || selectedItem?.email || '',
        phone: itemDetails.phone || selectedItem?.phone || '',
        vatNumber: itemDetails.vatNumber || '',
        address: itemDetails.address || '',
      });
    }
  }, [itemDetails]);

  if (!selectedItem) return null;

  const isOrg = selectedItem.type === 'organization';
  const isAgency = isOrg && selectedItem.accountType === 'agency';
  const name = itemDetails?.name || selectedItem.name || '';
  const email = itemDetails?.email || selectedItem.email || '';
  const phone = itemDetails?.phone || selectedItem.phone || '';
  const members = itemDetails?.members || [];
  const activities = itemDetails?.activities || [];
  const organization = itemDetails?.organization || selectedItem.organization || null;

  // ─── Raccolta servizi ─────────────────────────────────────
  const getServices = () => {
    if (isOrg) {
      // Per organizzazioni, raccogliamo i servizi da tutte le attività
      const allServices = [];
      activities.forEach(act => {
        const cached = activityServices[act.id];
        if (cached) {
          cached.forEach(svc => {
            allServices.push({ ...svc, activityId: act.id, activityName: act.name });
          });
        } else if (act.services) {
          act.services.forEach(svc => {
            allServices.push({ ...svc, activityId: act.id, activityName: act.name });
          });
        }
      });
      return allServices;
    } else {
      // Per attività, usa i servizi cached o dagli abbonamenti
      const cached = activityServices[selectedItem.id];
      if (cached) {
        return cached.map(svc => ({ ...svc, activityId: selectedItem.id, activityName: name }));
      }
      // Fallback: costruisci dai subscriptions
      const subscriptions = itemDetails?.subscriptions || [];
      return subscriptions.map(sub => ({
        service: sub.plan?.service,
        subscription: sub,
        effectiveStatus: sub.status,
        isActive: ['active', 'trial', 'free', 'pro', 'past_due'].includes(sub.status),
        daysRemaining: null,
        activityId: selectedItem.id,
        activityName: name,
      }));
    }
  };

  const allServices = getServices();
  const activeServices = allServices.filter(s => s.isActive || s.effectiveStatus === 'expired');
  const expiredServices = allServices.filter(s => s.effectiveStatus === 'expired');
  const urgentTrials = allServices.filter(s => s.effectiveStatus === 'trial' && s.daysRemaining !== null && s.daysRemaining <= 7);

  // ─── Auto-fetch servizi per le attività ───────────────────
  useEffect(() => {
    if (isOrg && activities.length > 0) {
      activities.forEach(act => {
        if (!activityServices[act.id]) {
          onFetchActivityServices(act.id);
        }
      });
    } else if (!isOrg && !activityServices[selectedItem.id]) {
      onFetchActivityServices(selectedItem.id);
    }
  }, [selectedItem?.id, activities.length]);

  // ─── Tab config ───────────────────────────────────────────
  const tabs = [
    { key: 'servizi', label: 'Servizi', count: activeServices.length },
    { key: 'dati', label: 'Dati' },
    { key: 'membri', label: 'Membri', count: members.length },
    ...(isAgency ? [{ key: 'clienti', label: 'Clienti gestiti', count: activities.length }] : []),
  ];

  // ─── Helpers ──────────────────────────────────────────────
  const getOwner = () => members.find(m => m.role === 'owner');

  const handleSaveData = async () => {
    setSaving(true);
    try {
      const endpoint = isOrg
        ? `/admin/organizations/${selectedItem.id}`
        : `/admin/activities/${selectedItem.id}`;
      const response = await api.request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(editData),
      });
      if (response.success) {
        setEditMode(false);
        if (onRefreshDetails) onRefreshDetails();
      }
    } catch (err) {
      console.error('Error saving data:', err);
    }
    setSaving(false);
  };

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">

      {/* ═══ HEADER CLIENTE ═══ */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50/80 px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className={`w-11 h-11 rounded-[10px] flex items-center justify-center text-white font-extrabold text-base ${
              isAgency
                ? 'bg-gradient-to-br from-purple-500 to-purple-700'
                : 'bg-gradient-to-br from-teal-500 to-teal-700'
            }`}>
              {isAgency ? <Briefcase className="w-5 h-5" /> : name.charAt(0).toUpperCase()}
            </div>

            {/* Nome + badge + contatti */}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-gray-900">{name}</span>
                {isAgency && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700 tracking-wide">AGENZIA</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                {email && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {email}
                  </span>
                )}
                {phone && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {phone}
                  </span>
                )}
              </div>
              {/* Badge "Gestito da" per attività sotto agenzia */}
              {!isOrg && organization && (
                <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-purple-50 text-[10px] font-semibold text-purple-700">
                  <Building2 className="w-3 h-3" /> Gestito da {organization.name}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            {/* Impersonate (solo org) */}
            {isOrg && (
              <button
                onClick={() => onImpersonate('organization', selectedItem.id)}
                disabled={impersonating}
                className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                title="Accedi come owner"
              >
                {impersonating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              </button>
            )}
            {/* Organizzazione */}
            <button
              onClick={() => {
                if (isOrg) {
                  // Per org, apri con la prima attività
                  const firstAct = activities[0];
                  if (firstAct) {
                    onOpenOrgAssign({
                      activityId: firstAct.id,
                      activityName: firstAct.name,
                      currentOrganization: { id: selectedItem.id, name: selectedItem.name, accountType: selectedItem.accountType }
                    });
                  }
                } else {
                  onOpenOrgAssign({
                    activityId: selectedItem.id,
                    activityName: name,
                    currentOrganization: organization
                  });
                }
              }}
              className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-purple-600 hover:border-purple-300 transition-colors"
              title="Organizzazione"
            >
              <Building2 className="w-4 h-4" />
            </button>
            {/* Credenziali */}
            <button
              onClick={() => {
                const owner = getOwner();
                if (owner) {
                  onOpenCredentials({
                    userId: owner.userId || owner.id,
                    userEmail: owner.email,
                    userName: owner.fullName
                  });
                }
              }}
              className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-amber-600 hover:border-amber-300 transition-colors"
              title="Credenziali"
            >
              <Key className="w-4 h-4" />
            </button>
            {/* Chiudi */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-red-600 hover:border-red-300 transition-colors"
              title="Chiudi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Alert bar */}
        {(expiredServices.length > 0 || urgentTrials.length > 0) && (
          <div className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
            expiredServices.length > 0
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-amber-50 border border-amber-200 text-amber-700'
          }`}>
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {expiredServices.length > 0
              ? `${expiredServices.map(s => s.service?.name || '').filter(Boolean).join(', ')} scadut${expiredServices.length > 1 ? 'i' : 'o'}`
              : `Trial in scadenza: ${urgentTrials.map(s => s.service?.name || '').filter(Boolean).join(', ')}`
            }
          </div>
        )}
      </div>

      {/* ═══ TAB BAR ═══ */}
      <div className="flex-shrink-0 flex border-b border-gray-200 px-5">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold transition-colors -mb-px ${
              activeTab === t.key
                ? 'border-b-2 border-teal-500 text-teal-600'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`px-1.5 rounded-full text-[9px] font-bold ${
                activeTab === t.key ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══ CONTENUTO TAB ═══ */}
      <div className="flex-1 overflow-auto p-5">
        {loadingDetails ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-3" />
            <p className="text-sm text-gray-400">Caricamento dettagli...</p>
          </div>
        ) : (
          <>
            {/* ─── TAB SERVIZI ─── */}
            {activeTab === 'servizi' && (
              <div>
                {/* Refresh button */}
                <div className="flex justify-end mb-3">
                  <button
                    onClick={() => {
                      if (isOrg) {
                        activities.forEach(act => onFetchActivityServices(act.id));
                      } else {
                        onFetchActivityServices(selectedItem.id);
                      }
                    }}
                    className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1 font-medium"
                  >
                    <RefreshCw className="w-3 h-3" /> Aggiorna servizi
                  </button>
                </div>

                {allServices.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Nessun servizio configurato</p>
                    <button
                      onClick={() => {
                        if (isOrg && activities[0]) {
                          onFetchActivityServices(activities[0].id);
                        } else if (!isOrg) {
                          onFetchActivityServices(selectedItem.id);
                        }
                      }}
                      className="mt-2 text-sm text-teal-600 hover:underline"
                    >
                      Carica servizi disponibili
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {allServices.map((svc, idx) => {
                      const service = svc.service;
                      if (!service) return null;
                      const ServiceIcon = SERVICE_ICONS?.[service.icon] || Star;
                      const serviceColor = service.color || service.colorPrimary || '#6366f1';
                      const status = svc.effectiveStatus || 'inactive';
                      const isActive = svc.isActive || status === 'expired';
                      const isExpired = status === 'expired';
                      const isTrial = status === 'trial';
                      const isUrgent = isTrial && svc.daysRemaining !== null && svc.daysRemaining <= 7;
                      const sub = svc.subscription;
                      const renewDate = sub?.manualRenewDate || sub?.currentPeriodEnd;
                      const payMethod = sub?.paymentMethod;
                      const emoji = SERVICE_EMOJI[service.code] || '';

                      return (
                        <div
                          key={`${svc.activityId}-${service.code || service.id}-${idx}`}
                          onClick={() => onOpenServiceStatus(
                            svc.activityId,
                            svc.activityName,
                            service,
                            sub,
                            status,
                            svc.isActive,
                            svc.daysRemaining
                          )}
                          className={`relative p-3.5 rounded-xl border cursor-pointer transition-all hover:shadow-md group ${
                            isExpired
                              ? 'border-red-200 bg-white'
                              : isUrgent
                                ? 'border-amber-200 bg-white'
                                : isActive
                                  ? 'border-gray-200 bg-white hover:border-teal-300'
                                  : 'border-gray-100 bg-gray-50/50 opacity-50'
                          }`}
                        >
                          {/* Barra superiore colorata per urgenti/scaduti */}
                          {(isUrgent || isExpired) && (
                            <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-xl ${isExpired ? 'bg-red-500' : 'bg-amber-500'}`} />
                          )}

                          {/* Header card: emoji + nome + badge stato */}
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              {emoji ? (
                                <span className="text-lg">{emoji}</span>
                              ) : (
                                <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${serviceColor}15` }}>
                                  <ServiceIcon className="w-4 h-4" style={{ color: serviceColor }} />
                                </div>
                              )}
                              <span className="font-bold text-[13px] text-gray-900">{service.name}</span>
                            </div>
                            <ServiceStatusBadge status={status} small />
                          </div>

                          {/* Data rinnovo */}
                          {isActive && renewDate && !sub?.isFreePromo && (
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {isExpired ? 'Scaduto' : 'Rinnovo'}
                              </span>
                              <span className={`text-[11px] font-semibold ${isExpired ? 'text-red-600' : 'text-gray-700'}`}>
                                {new Date(renewDate).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </span>
                            </div>
                          )}

                          {/* Trial scadenza */}
                          {isTrial && sub?.trialEndsAt && (
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Scade
                              </span>
                              <span className={`text-[11px] font-semibold ${isUrgent ? 'text-amber-600' : 'text-gray-600'}`}>
                                {new Date(sub.trialEndsAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </span>
                            </div>
                          )}

                          {/* Badge pagamento */}
                          {payMethod && <PaymentBadge method={payMethod} />}

                          {/* Progress bar trial */}
                          {isTrial && svc.daysRemaining !== null && (
                            <div className="mt-2">
                              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${isUrgent ? 'bg-amber-500' : 'bg-teal-500'}`}
                                  style={{ width: `${Math.max(5, Math.min(100, (svc.daysRemaining / 30) * 100))}%` }}
                                />
                              </div>
                              <p className={`text-[9px] mt-0.5 ${isUrgent ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                                {svc.daysRemaining}gg rimanenti
                              </p>
                            </div>
                          )}

                          {/* Nome attività (per org con multiple attività) */}
                          {isOrg && isAgency && svc.activityName && (
                            <p className="text-[9px] text-gray-400 mt-1.5 truncate border-t border-gray-100 pt-1">
                              {svc.activityName}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB DATI ─── */}
            {activeTab === 'dati' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-gray-900">Informazioni</span>
                  <button
                    onClick={() => {
                      if (editMode) {
                        setEditMode(false);
                        // Reset editData
                        setEditData({
                          name: itemDetails?.name || selectedItem?.name || '',
                          email: itemDetails?.email || selectedItem?.email || '',
                          phone: itemDetails?.phone || selectedItem?.phone || '',
                          vatNumber: itemDetails?.vatNumber || '',
                          address: itemDetails?.address || '',
                        });
                      } else {
                        setEditMode(true);
                      }
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                      editMode
                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {editMode ? <><X className="w-3 h-3" /> Annulla</> : <><Edit2 className="w-3 h-3" /> Modifica</>}
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  {[
                    { label: 'Nome', field: 'name', icon: '🏪' },
                    { label: 'Email', field: 'email', icon: '📧' },
                    { label: 'Telefono', field: 'phone', icon: '📱' },
                    ...(!isOrg ? [{ label: 'Indirizzo', field: 'address', icon: '📍' }] : []),
                    { label: 'P.IVA', field: 'vatNumber', icon: '🧾' },
                  ].map(({ label, field, icon }) => (
                    <div key={field} className="flex items-center py-2.5 border-b border-gray-100 last:border-b-0">
                      <span className="w-7 text-sm">{icon}</span>
                      <span className="w-20 text-[11px] font-semibold text-gray-400">{label}</span>
                      {editMode ? (
                        <input
                          value={editData[field] || ''}
                          onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
                          className="flex-1 px-2 py-1 rounded-md border border-gray-200 text-xs outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-200"
                        />
                      ) : (
                        <span className="text-[13px] text-gray-900 font-medium">
                          {(isOrg ? (itemDetails?.[field] || selectedItem?.[field]) : (itemDetails?.[field] || selectedItem?.[field])) || '—'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {editMode && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={handleSaveData}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-500 text-white text-xs font-semibold hover:bg-teal-600 transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Salva
                    </button>
                  </div>
                )}

                {/* Sezione Organizzazione */}
                <div className="mt-6">
                  <span className="text-sm font-bold text-gray-900 block mb-3">Organizzazione</span>
                  <div className="border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                    {isOrg ? (
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${
                          isAgency ? 'bg-gradient-to-br from-purple-500 to-purple-700' : 'bg-gradient-to-br from-teal-500 to-teal-700'
                        }`}>
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-sm">{name}</span>
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            isAgency ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
                          }`}>
                            {isAgency ? 'Agenzia' : 'Singolo'}
                          </span>
                        </div>
                      </div>
                    ) : organization ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">
                          {organization.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-sm">{organization.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Nessuna organizzazione</span>
                    )}
                    <button
                      onClick={() => {
                        if (isOrg) {
                          const firstAct = activities[0];
                          if (firstAct) {
                            onOpenOrgAssign({
                              activityId: firstAct.id,
                              activityName: firstAct.name,
                              currentOrganization: { id: selectedItem.id, name, accountType: selectedItem.accountType }
                            });
                          }
                        } else {
                          onOpenOrgAssign({
                            activityId: selectedItem.id,
                            activityName: name,
                            currentOrganization: organization
                          });
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-[11px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      {(!isOrg && organization) ? 'Cambia' : isOrg ? 'Gestisci' : 'Assegna'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB MEMBRI ─── */}
            {activeTab === 'membri' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-gray-900">Membri ({members.length})</span>
                  <button
                    onClick={() => onOpenMembers({
                      entityType: isOrg ? 'organization' : 'activity',
                      entityId: selectedItem.id,
                      entityName: name,
                      members: members,
                    })}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-500 text-white text-[11px] font-semibold hover:bg-teal-600 transition-colors"
                  >
                    <UserPlus className="w-3 h-3" /> Gestisci
                  </button>
                </div>

                {members.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Nessun membro</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div key={member.id || member.userId} className="flex items-center justify-between p-3 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                            member.role === 'owner'
                              ? 'bg-amber-100 text-amber-700'
                              : member.role === 'admin'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-500'
                          }`}>
                            {(member.fullName || member.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-gray-900">
                              {member.fullName || 'Nome non impostato'}
                            </div>
                            <div className="text-[11px] text-gray-500">{member.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            member.role === 'owner' ? 'bg-amber-100 text-amber-700' :
                            member.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                            member.role === 'manager' ? 'bg-gray-100 text-gray-600' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {member.role}
                          </span>
                          {member.lastLoginAt && (
                            <span className="text-[9px] text-gray-400">
                              {new Date(member.lastLoginAt).toLocaleDateString('it-IT')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB CLIENTI GESTITI (solo agenzie) ─── */}
            {activeTab === 'clienti' && isAgency && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-gray-900">
                    Clienti gestiti ({activities.length})
                  </span>
                  <button
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-[11px] font-semibold hover:bg-purple-700 transition-colors"
                  >
                    <Link2 className="w-3 h-3" /> Associa
                  </button>
                </div>

                {activities.length === 0 ? (
                  <div className="text-center py-12">
                    <Store className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Nessuna attività associata</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activities.map((act) => {
                      const actServices = activityServices[act.id] || act.services || [];
                      const activeActSvcs = actServices.filter(s =>
                        s.isActive || s.effectiveStatus === 'pro' || s.effectiveStatus === 'trial' || s.effectiveStatus === 'free'
                      );

                      return (
                        <div key={act.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-bold text-xs">
                              {act.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-gray-900">{act.name}</div>
                              <div className="text-[11px] text-gray-500">
                                {act.owner?.email || act.email || ''}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {activeActSvcs.slice(0, 3).map((s, i) => (
                              <ServiceStatusBadge
                                key={i}
                                status={s.effectiveStatus || 'inactive'}
                                small
                              />
                            ))}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenOrgAssign({
                                  activityId: act.id,
                                  activityName: act.name,
                                  currentOrganization: { id: selectedItem.id, name, accountType: 'agency' }
                                });
                              }}
                              className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-red-400 hover:text-red-600 hover:border-red-300 transition-colors"
                              title="Dissocia"
                            >
                              <Unlink2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
