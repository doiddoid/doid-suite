import { useState } from 'react';
import { Star, FileText, UtensilsCrossed, Monitor, ExternalLink, Loader2, Play, RefreshCw, CreditCard } from 'lucide-react';
import StatusBadge from './StatusBadge';

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
 * - onAccess: () => void
 * - onActivateTrial: () => void
 * - onChoosePlan: () => void
 */
export default function ServiceCard({
  service,
  subscription,
  isActive,
  canAccess,
  onAccess,
  onActivateTrial,
  onChoosePlan
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
  const isTrialExpiring = trialDaysLeft !== null && trialDaysLeft <= 3;

  // Gestisce click sul pulsante principale
  const handleAction = async () => {
    setLoading(true);
    try {
      if (canAccess && onAccess) {
        await onAccess();
      } else if (!subscription && onActivateTrial) {
        await onActivateTrial();
      } else if (subscription?.status === 'expired' && onChoosePlan) {
        await onChoosePlan();
      } else if (isTrialExpiring && onChoosePlan) {
        await onChoosePlan();
      }
    } finally {
      setLoading(false);
    }
  };

  // Determina label e stile del pulsante
  const getButtonConfig = () => {
    if (canAccess) {
      return {
        label: 'Accedi',
        icon: ExternalLink,
        className: 'bg-gray-900 text-white hover:bg-gray-800'
      };
    }

    if (!subscription) {
      return {
        label: 'Attiva Trial',
        icon: Play,
        className: 'bg-primary-600 text-white hover:bg-primary-700'
      };
    }

    if (subscription.status === 'expired') {
      return {
        label: 'Rinnova',
        icon: RefreshCw,
        className: 'bg-amber-500 text-white hover:bg-amber-600'
      };
    }

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
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100 flex flex-col h-full">
      {/* Header con icona e badge */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${service.color || '#6366f1'}20` }}
        >
          <Icon
            className="w-6 h-6"
            style={{ color: service.color || '#6366f1' }}
          />
        </div>
        {subscription && (
          <StatusBadge
            status={subscription.status}
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
          <p className="text-xs text-gray-400 mb-4">
            Piano: <span className="font-medium">{subscription.plan.name}</span>
          </p>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={handleAction}
        disabled={loading}
        className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${buttonConfig.className} disabled:opacity-50 disabled:cursor-not-allowed`}
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
    </div>
  );
}
