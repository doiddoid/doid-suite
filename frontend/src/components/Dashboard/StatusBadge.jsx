/**
 * StatusBadge - Badge per visualizzare lo stato dell'abbonamento
 */

export default function StatusBadge({ status, trialDaysLeft, className = '' }) {
  const styles = {
    active: 'bg-green-100 text-green-700',
    trial: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-600',
    inactive: 'bg-gray-100 text-gray-500'
  };

  const getLabel = () => {
    switch (status) {
      case 'active':
        return 'Attivo';
      case 'trial':
        return trialDaysLeft !== undefined ? `Trial • ${trialDaysLeft}g` : 'Trial';
      case 'expired':
        return 'Scaduto';
      case 'cancelled':
        return 'Cancellato';
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
