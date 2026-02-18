/**
 * StatusBadge - Badge per lo stato abbonamento nella pagina "I Miei Servizi"
 *
 * Props:
 * - status: 'pro' | 'trial' | 'free' | 'expired' | 'inactive'
 * - billing: 'monthly' | 'yearly'
 * - trialEnds: Date string per calcolare giorni rimanenti
 */
export default function StatusBadge({ status, billing, trialEnds }) {
  // Calcola giorni rimanenti per trial
  const getTrialDaysLeft = () => {
    if (status !== 'trial' || !trialEnds) return null;
    const end = new Date(trialEnds);
    const now = new Date();
    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  const trialDaysLeft = getTrialDaysLeft();

  // Configurazione stili e label per ogni stato
  const getConfig = () => {
    switch (status) {
      case 'pro':
      case 'active':
        if (billing === 'yearly') {
          return {
            label: 'PRO ANNUALE',
            bgColor: '#059669',
            textColor: '#FFFFFF'
          };
        }
        return {
          label: 'PRO MENSILE',
          bgColor: '#059669',
          textColor: '#FFFFFF'
        };

      case 'trial':
        return {
          label: trialDaysLeft !== null ? `TRIAL • ${trialDaysLeft}g` : 'TRIAL',
          bgColor: '#D97706',
          textColor: '#FFFFFF'
        };

      case 'free':
        return {
          label: 'FREE',
          bgColor: '#6B7280',
          textColor: '#FFFFFF'
        };

      case 'expired':
      case 'cancelled':
        return {
          label: 'SCADUTO',
          bgColor: '#DC2626',
          textColor: '#FFFFFF'
        };

      case 'inactive':
      default:
        return {
          label: 'NON ATTIVO',
          bgColor: '#D1D5DB',
          textColor: '#6B7280'
        };
    }
  };

  const config = getConfig();

  return (
    <span
      className="text-[10px] font-bold px-2.5 py-0.5 rounded-md tracking-wide whitespace-nowrap"
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor
      }}
    >
      {config.label}
    </span>
  );
}
