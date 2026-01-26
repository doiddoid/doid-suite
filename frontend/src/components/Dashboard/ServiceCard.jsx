import { useState } from 'react';
import { Star, FileText, UtensilsCrossed, Monitor, ExternalLink, Loader2, Play, RefreshCw, CreditCard, Clock, Info, Settings } from 'lucide-react';
import StatusBadge from './StatusBadge';

// Servizi attualmente non disponibili (presto disponibili)
const UNAVAILABLE_SERVICES = ['display_suite'];

// URL delle landing page per i servizi
const SERVICE_LANDING_URLS = {
  smart_review: 'https://review.doid.it',
  smart_page: 'https://page.doid.it',
  menu_digitale: 'https://menu.doid.it',
  display_suite: null,
};

// Mappa icone per i servizi
const iconMap = {
  Star,
  FileText,
  UtensilsCrossed,
  Monitor,
  smart_review: Star,
  smart_page: FileText,
  menu_digitale: UtensilsCrossed,
  display_suite: Monitor,
};

/**
 * ServiceCard - Card per singolo servizio DOID
 *
 * Props:
 * - service: { code, name, description, icon, color }
 * - subscription: { status, plan, trialEndsAt, currentPeriodEnd } | null
 * - isActive: boolean
 * - canAccess: boolean
 * - hasLinkedAccount: boolean - se esiste un account collegato nel servizio esterno
 * - onAccess: () => void
 * - onActivateTrial: () => void
 * - onChoosePlan: () => void
 * - onConfigure: () => void - per configurare/collegare account servizio
 */
export default function ServiceCard({
  service,
  subscription,
  isActive,
  canAccess,
  hasLinkedAccount = true,
  onAccess,
  onActivateTrial,
  onChoosePlan,
  onConfigure
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
  // Trial scaduto: status è 'trial' ma isActive è false (data scaduta)
  const isTrialExpired = subscription?.status === 'trial' && !isActive;

  // Gestisce click sul pulsante principale
  const handleAction = async () => {
    setLoading(true);
    try {
      if (canAccess && onAccess) {
        await onAccess();
      } else if (isActive && !hasLinkedAccount && onConfigure) {
        // Abbonamento attivo ma nessun account collegato - configura
        await onConfigure();
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

  // Verifica se il servizio è disponibile
  const isServiceUnavailable = UNAVAILABLE_SERVICES.includes(service.code);
  const landingUrl = SERVICE_LANDING_URLS[service.code];

  // Determina label e stile del pulsante
  const getButtonConfig = () => {
    // Servizi non disponibili (Menu Digitale, Display Suite)
    if (isServiceUnavailable) {
      return {
        label: 'Presto disponibile',
        icon: Clock,
        className: 'bg-gray-100 text-gray-500 cursor-not-allowed',
        disabled: true
      };
    }

    // Servizio attivo - mostra Accedi
    if (canAccess) {
      return {
        label: 'Accedi',
        icon: ExternalLink,
        className: 'hover:opacity-80 font-semibold',
        style: getAccessButtonStyle()
      };
    }

    // Abbonamento attivo ma nessun account collegato - mostra Configura
    if (isActive && !hasLinkedAccount) {
      return {
        label: 'Configura',
        icon: Settings,
        className: 'bg-primary-600 text-white hover:bg-primary-700'
      };
    }

    // Nessuna subscription - mostra Attiva Trial o Scopri di più
    if (!subscription) {
      return {
        label: 'Attiva Trial',
        icon: Play,
        className: 'bg-primary-600 text-white hover:bg-primary-700',
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
        {subscription && (
          <StatusBadge
            status={isTrialExpired ? 'expired' : subscription.status}
            trialDaysLeft={trialDaysLeft}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {service.name}
        </h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
          {service.description}
        </p>

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
