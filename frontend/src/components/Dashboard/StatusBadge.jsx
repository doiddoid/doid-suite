/**
 * StatusBadge - Badge per visualizzare lo stato dell'abbonamento/servizio
 * Supporta gli stati del modello "Servizi Indipendenti":
 * - inactive: Non attivo (grigio)
 * - free: Versione gratuita attiva (verde)
 * - trial: Periodo di prova (blu)
 * - active/pro: Abbonamento PRO attivo (viola)
 * - expired: Scaduto (arancione)
 * - cancelled: Cancellato (rosso)
 */

export default function StatusBadge({ status, trialDaysLeft, className = '' }) {
  const styles = {
    inactive: 'bg-gray-100 text-gray-500',
    free: 'bg-green-100 text-green-700',
    trial: 'bg-blue-100 text-blue-700',
    active: 'bg-purple-100 text-purple-700',
    pro: 'bg-purple-100 text-purple-700',
    expired: 'bg-orange-100 text-orange-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  const getLabel = () => {
    switch (status) {
      case 'inactive':
        return 'Non attivo';
      case 'free':
        return 'FREE';
      case 'trial':
        return trialDaysLeft !== undefined ? `TRIAL • ${trialDaysLeft}g` : 'TRIAL';
      case 'active':
      case 'pro':
        return 'PRO';
      case 'expired':
        return 'SCADUTO';
      case 'cancelled':
        return 'CANCELLATO';
      default:
        return 'Non attivo';
    }
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || styles.inactive} ${className}`}>
      {getLabel()}
    </span>
  );
}
