import { Gift, Settings } from 'lucide-react';
import StatusBadge from './StatusBadge';

/**
 * ElementRow - Riga singolo elemento (subscription) nella pagina "I Miei Servizi"
 *
 * Props:
 * - element: { subscription_id, activity_name, activity_id, status, billing_cycle,
 *              is_addon, trial_ends_at, current_period_end, cancel_at_period_end, price }
 * - serviceColor: colore primario del servizio (es. '#F59E0B')
 * - serviceDark: colore dark del servizio (es. '#D97706')
 * - onAction: (element, actionType) => void
 *   actionType: 'upgrade_annual' | 'activate_pro' | 'manage'
 */
export default function ElementRow({ element, serviceColor, serviceDark, onAction }) {
  const {
    activity_name,
    status,
    billing_cycle,
    is_addon,
    trial_ends_at,
    current_period_end,
    price
  } = element;

  const isPro = status === 'pro' || status === 'active';
  const isTrial = status === 'trial';
  const isFree = status === 'free';
  const isMonthly = billing_cycle === 'monthly';

  // Colore pallino indicatore
  const getDotColor = () => {
    if (isPro) return '#059669'; // verde
    if (isTrial) return '#D97706'; // ambra
    return '#9CA3AF'; // grigio
  };

  // Sottotitolo basato sullo stato
  const getSubtitle = () => {
    if (isPro && current_period_end) {
      const date = new Date(current_period_end);
      return `Rinnovo: ${date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    if (isTrial && trial_ends_at) {
      const date = new Date(trial_ends_at);
      return `Scadenza: ${date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    if (isFree) {
      return 'Funzionalità base';
    }
    return '';
  };

  // Formatta prezzo
  const formatPrice = (amount) => {
    if (!amount || amount === 0) return null;
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Stile bordo basato sullo stato
  const getBorderStyle = () => {
    if (isPro) {
      return { borderColor: `${serviceColor}40` };
    }
    return { borderColor: '#E5E7EB' };
  };

  return (
    <div
      className="flex items-center justify-between p-3.5 bg-white rounded-xl border"
      style={getBorderStyle()}
    >
      {/* SINISTRA: Info elemento */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Pallino colorato */}
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: getDotColor() }}
        />

        {/* Nome e sottotitolo */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 truncate">
              {activity_name}
            </span>
            {is_addon && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide"
                style={{
                  backgroundColor: `${serviceColor}20`,
                  color: serviceDark || serviceColor
                }}
              >
                ADD-ON
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">
            {getSubtitle()}
          </p>
        </div>
      </div>

      {/* CENTRO: Status e prezzo */}
      <div className="flex items-center gap-3 px-4">
        <StatusBadge
          status={status}
          billing={billing_cycle}
          trialEnds={trial_ends_at}
        />
        {isPro && price > 0 && (
          <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
            {formatPrice(price)}/mese
          </span>
        )}
      </div>

      {/* DESTRA: Bottoni azione */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Bottone Upgrade Annuale - solo per PRO mensile */}
        {isPro && isMonthly && (
          <button
            onClick={() => onAction?.(element, 'upgrade_annual')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
            }}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Annuale</span>
          </button>
        )}

        {/* Bottone Attiva PRO - per FREE o TRIAL */}
        {(isFree || isTrial) && (
          <button
            onClick={() => onAction?.(element, 'activate_pro')}
            className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-all hover:opacity-90"
            style={{ backgroundColor: serviceColor }}
          >
            Attiva PRO
          </button>
        )}

        {/* Bottone Gestisci - sempre visibile */}
        <button
          onClick={() => onAction?.(element, 'manage')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all hover:bg-gray-50"
          style={{
            color: serviceColor,
            borderColor: `${serviceColor}40`
          }}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Gestisci</span>
        </button>
      </div>
    </div>
  );
}
