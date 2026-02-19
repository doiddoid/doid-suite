import { useState } from 'react';
import { Star, FileText, UtensilsCrossed, Monitor, ExternalLink, Loader2, Play, RefreshCw, CreditCard, Info, Settings, Bot, Users, MessageSquare, Check, Key, Building2, Store, Package, Mail, Shield, Zap, Activity, Layers, Calendar } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { CONTACT_REQUIRED_SERVICE_CODES } from '../../config/services';

// URL delle landing page per i servizi
const SERVICE_LANDING_URLS = {
  review: 'https://review.doid.it',
  page: 'https://page.doid.it',
  menu: 'https://menu.doid.it',
  display: null,
  agent_ai: null,
  connect: null,
};

// Mappa icone per i servizi (nome icona dal DB -> componente)
// Supporta formati: kebab-case (file-text), lowercase (filetext), PascalCase (FileText)
const iconMap = {
  // Kebab-case (come salvati nel DB da AVAILABLE_ICONS)
  'star': Star,
  'file-text': FileText,
  'utensils-crossed': UtensilsCrossed,
  'monitor': Monitor,
  'key': Key,
  'bot': Bot,
  'users': Users,
  'building': Building2,
  'store': Store,
  'package': Package,
  'mail': Mail,
  'credit-card': CreditCard,
  'shield': Shield,
  'zap': Zap,
  'activity': Activity,
  'layers': Layers,
  'message-square': MessageSquare,
  // Fallback per codici servizio
  review: Star,
  page: FileText,
  menu: UtensilsCrossed,
  display: Monitor,
  agent_ai: Bot,
  connect: Users,
};

/**
 * ServiceCard - Card per singolo servizio DOID
 *
 * Props:
 * - service: { code, name, description, tagline, benefits, icon, color, type }
 * - subscription: { status, plan, trialEndsAt, currentPeriodEnd } | null
 * - isActive: boolean
 * - canAccess: boolean
 * - hasLinkedAccount: boolean - se esiste un account collegato nel servizio esterno
 * - onAccess: () => void
 * - onActivateTrial: () => void
 * - onChoosePlan: () => void
 * - onConfigure: () => void - per configurare/collegare account servizio
 * - onRequestInfo: () => void - per servizi contact_required
 * - discount: number - percentuale sconto (0, 10, 20)
 */
export default function ServiceCard({
  service,
  subscription,
  isActive,
  canAccess,
  hasLinkedAccount = true,
  discount = 0,
  onAccess,
  onActivateTrial,
  onChoosePlan,
  onConfigure,
  onRequestInfo
}) {
  const [loading, setLoading] = useState(false);

  // Determina l'icona da usare
  const Icon = iconMap[service.icon] || iconMap[service.code] || Star;

  // Calcola giorni rimanenti per trial
  const getTrialDaysLeft = () => {
    if (subscription?.status !== 'trial' || !subscription?.trialEndsAt) return null;
    const trialEnd = new Date(subscription.trialEndsAt);
    const now = new Date();
    const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  const trialDaysLeft = getTrialDaysLeft();
  const isTrialExpiring = trialDaysLeft !== null && trialDaysLeft <= 3 && trialDaysLeft > 0;

  // Calcola info rinnovo/scadenza per il badge
  const getRenewalInfo = () => {
    if (!subscription) return null;

    const { status, trialEndsAt, currentPeriodEnd, plan } = subscription;

    // Non mostrare per piani free o stati terminali
    if (plan?.code === 'free' || status === 'expired' || status === 'canceled' || status === 'suspended') {
      return null;
    }

    let date = null;
    let isRenewal = false; // true = rinnovo, false = scadenza

    if (status === 'trial' && trialEndsAt) {
      date = new Date(trialEndsAt);
      isRenewal = false; // Trial non si rinnova automaticamente
    } else if (status === 'active' && currentPeriodEnd) {
      date = new Date(currentPeriodEnd);
      isRenewal = true; // Abbonamento attivo si rinnova
    }

    if (!date || isNaN(date.getTime())) return null;

    const now = new Date();
    const daysUntil = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

    // Non mostrare se già scaduto
    if (daysUntil < 0) return null;

    // Formatta la data in GG/MM/AAAA
    const formattedDate = date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    return {
      date: formattedDate,
      isRenewal,
      isUrgent: daysUntil <= 7,
      daysUntil
    };
  };

  const renewalInfo = getRenewalInfo();
  // Trial scaduto: status è 'trial' ma isActive è false (data scaduta)
  const isTrialExpired = subscription?.status === 'trial' && !isActive;

  // Gestisce click sul pulsante principale
  const handleAction = async () => {
    // Servizi contact_required - apri modal contatto
    if (isContactRequired && onRequestInfo) {
      onRequestInfo();
      return;
    }

    setLoading(true);
    try {
      if (canAccess && onAccess) {
        await onAccess();
      } else if (isActive && !hasLinkedAccount && onAccess) {
        // Abbonamento attivo ma nessun account collegato - accedi per configurare
        await onAccess();
      } else if (!subscription && onActivateTrial) {
        await onActivateTrial();
      } else if ((subscription?.status === 'expired' || subscription?.status === 'canceled' || subscription?.status === 'suspended' || isTrialExpired) && onChoosePlan) {
        // Trial scaduto, abbonamento scaduto, cancellato o sospeso - scegli piano per riattivare
        await onChoosePlan();
      } else if (isTrialExpiring && onChoosePlan) {
        await onChoosePlan();
      } else if (subscription?.status === 'past_due' && onAccess) {
        // past_due: tenta accesso (superadmin può accedere via bypass backend)
        await onAccess();
      } else if (subscription && hasLinkedAccount && onAccess) {
        // Fallback: se c'è subscription e account collegato, tenta accesso
        await onAccess();
      }
    } finally {
      setLoading(false);
    }
  };

  // Stile per pulsante "Accedi" colorato in base al servizio
  const getAccessButtonStyle = () => {
    const color = service.color || '#6366f1';
    const bgLight = service.bgLight || `${color}15`;
    return {
      backgroundColor: bgLight,
      color: color,
      border: `1px solid ${color}40`,
    };
  };

  // Verifica se il servizio richiede contatto
  const isContactRequired = CONTACT_REQUIRED_SERVICE_CODES.includes(service.code) || service.type === 'contact_required';
  const landingUrl = SERVICE_LANDING_URLS[service.code];

  // Determina label e stile del pulsante
  const getButtonConfig = () => {
    // Servizio attivo - mostra Accedi (anche per contact_required con subscription attiva)
    if (canAccess) {
      return {
        label: 'Accedi',
        icon: ExternalLink,
        className: 'hover:opacity-80 font-semibold',
        style: getAccessButtonStyle()
      };
    }

    // Abbonamento attivo ma nessun account collegato - mostra Accedi (per configurare)
    if (isActive && !hasLinkedAccount) {
      return {
        label: 'Accedi',
        icon: ExternalLink,
        className: 'hover:opacity-80 font-semibold',
        style: getAccessButtonStyle()
      };
    }

    // Servizi che richiedono contatto (Display Suite, Smart Agent AI, Smart Connect)
    // Solo se NON hanno subscription attiva
    if (isContactRequired && !subscription) {
      return {
        label: 'Richiedi Info',
        icon: MessageSquare,
        className: 'hover:opacity-90 font-semibold',
        style: getAccessButtonStyle(),
        isContactAction: true
      };
    }

    // Nessuna subscription - mostra Attiva Trial o Scopri di più
    if (!subscription) {
      return {
        label: 'Attiva Trial',
        icon: Play,
        className: 'hover:opacity-80 font-semibold',
        style: getAccessButtonStyle(),
        secondaryAction: landingUrl ? {
          label: 'Scopri di più',
          icon: Info,
          url: landingUrl
        } : null
      };
    }

    // Trial scaduto - mostra Attiva Piano
    if (isTrialExpired) {
      return {
        label: 'Attiva Piano',
        icon: CreditCard,
        className: 'bg-amber-500 text-white hover:bg-amber-600'
      };
    }

    // Abbonamento scaduto o cancellato - mostra Rinnova
    if (subscription.status === 'expired' || subscription.status === 'canceled') {
      return {
        label: 'Rinnova',
        icon: RefreshCw,
        className: 'bg-amber-500 text-white hover:bg-amber-600'
      };
    }

    // Abbonamento sospeso - mostra Riattiva
    if (subscription.status === 'suspended') {
      return {
        label: 'Riattiva',
        icon: RefreshCw,
        className: 'bg-yellow-500 text-white hover:bg-yellow-600'
      };
    }

    // Trial in scadenza - mostra Scegli Piano
    if (isTrialExpiring) {
      return {
        label: 'Scegli Piano',
        icon: CreditCard,
        className: 'bg-primary-600 text-white hover:bg-primary-700'
      };
    }

    return {
      label: 'Gestisci',
      icon: ExternalLink,
      className: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    };
  };

  const buttonConfig = getButtonConfig();
  const ButtonIcon = buttonConfig.icon;

  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col h-full"
      style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: service.borderColor || '#e5e7eb' }}
    >
      {/* Header con icona e badge */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: service.bgLight || `${service.color || '#6366f1'}20` }}
        >
          <Icon
            className="w-6 h-6"
            style={{ color: service.color || '#6366f1' }}
          />
        </div>
        <div className="flex flex-col items-end gap-1">
          {/* Badge sconto */}
          {discount > 0 && !isActive && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
              -{discount}%
            </span>
          )}
          {/* Status badge */}
          {subscription && (
            <StatusBadge
              status={isTrialExpired ? 'expired' : subscription.status}
              trialDaysLeft={trialDaysLeft}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {service.name}
        </h3>
        {service.tagline && (
          <p className="text-xs font-medium mb-2" style={{ color: service.color }}>
            {service.tagline}
          </p>
        )}
        <p className="text-sm text-gray-600 mb-3">
          {service.description}
        </p>

        {/* Benefits per tutti i servizi */}
        {service.benefits && service.benefits.length > 0 && (
          <ul className="space-y-1 mb-3">
            {service.benefits.slice(0, 3).map((benefit, index) => (
              <li key={index} className="flex items-start text-xs text-gray-500">
                <Check className="w-3 h-3 mr-1.5 mt-0.5 flex-shrink-0" style={{ color: service.color }} />
                {benefit}
              </li>
            ))}
          </ul>
        )}

        {/* Piano info */}
        {subscription?.plan && (
          <div className="mb-4">
            <p className="text-xs text-gray-400">
              Piano: <span className="font-medium">{subscription.plan.name}</span>
              {subscription.status === 'trial' && !isTrialExpired && (
                <span className="ml-1 text-emerald-600 font-medium">- Trial</span>
              )}
              {isTrialExpired && (
                <span className="ml-1 text-red-600 font-medium">- Trial scaduto</span>
              )}
            </p>
            {/* Badge rinnovo/scadenza */}
            {renewalInfo && (
              <div className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                renewalInfo.isUrgent
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-teal-100 text-teal-700'
              }`}>
                <Calendar className="w-3 h-3" />
                <span>
                  {renewalInfo.isRenewal ? 'Prossimo rinnovo' : 'Scadenza'}: {renewalInfo.date}
                </span>
              </div>
            )}
            {subscription.status === 'trial' && trialDaysLeft !== null && !isTrialExpired && (
              <p className={`text-xs mt-1 ${trialDaysLeft <= 7 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {trialDaysLeft > 1 ? (
                  <>{trialDaysLeft} giorni rimanenti</>
                ) : trialDaysLeft === 1 ? (
                  <>Ultimo giorno!</>
                ) : (
                  <>Scade oggi</>
                )}
              </p>
            )}
            {isTrialExpired && (
              <p className="text-xs mt-1 text-red-600">
                Il periodo di prova è terminato. Attiva un piano per continuare.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleAction}
          disabled={loading || buttonConfig.disabled}
          className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${buttonConfig.className} disabled:opacity-50 disabled:cursor-not-allowed`}
          style={buttonConfig.style}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>{buttonConfig.label}</span>
              <ButtonIcon className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Pulsante secondario "Scopri di più" */}
        {buttonConfig.secondaryAction && (
          <a
            href={buttonConfig.secondaryAction.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
          >
            <span>{buttonConfig.secondaryAction.label}</span>
            <buttonConfig.secondaryAction.icon className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}
