import { Zap, Clock, CreditCard, Calendar } from 'lucide-react';

/**
 * DashboardStats - Statistiche rapide della dashboard
 *
 * Props:
 * - stats: { activeServices, totalServices, trialServices, monthlySpend, nextExpiry }
 */
export default function DashboardStats({ stats }) {
  if (!stats) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Nessuna';
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  };

  const cards = [
    {
      title: 'Servizi Attivi',
      value: stats.activeServices || 0,
      total: stats.totalServices,
      icon: Zap,
      iconColor: '#22c55e',
      bgColor: 'bg-green-50',
    },
    {
      title: 'In Trial',
      value: stats.trialServices || 0,
      icon: Clock,
      iconColor: '#f59e0b',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Spesa Mensile',
      value: `€${(stats.monthlySpend || 0).toFixed(2)}`,
      icon: CreditCard,
      iconColor: '#3b82f6',
      bgColor: 'bg-blue-50',
    },
  ];

  // Aggiungi prossima scadenza se presente
  if (stats.nextExpiry) {
    cards.push({
      title: 'Prossima Scadenza',
      value: formatDate(stats.nextExpiry),
      icon: Calendar,
      iconColor: '#ef4444',
      bgColor: 'bg-red-50',
    });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">
                {card.value}
                {card.total !== undefined && (
                  <span className="text-sm font-normal text-gray-400">
                    {' '}/ {card.total}
                  </span>
                )}
              </p>
            </div>
            <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center`}>
              <card.icon
                className="w-6 h-6"
                style={{ color: card.iconColor }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
