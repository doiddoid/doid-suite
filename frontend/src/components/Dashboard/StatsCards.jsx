import { Zap, TrendingUp, Clock, CreditCard } from 'lucide-react';

export default function StatsCards({ stats }) {
  if (!stats) return null;

  const cards = [
    {
      title: 'Servizi Attivi',
      value: stats.activeServices,
      total: stats.totalServices,
      icon: Zap,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'In Prova',
      value: stats.trialServices,
      icon: Clock,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Spesa Mensile',
      value: `€${stats.monthlySpend.toFixed(2)}`,
      icon: CreditCard,
      color: 'bg-primary-500',
      bgColor: 'bg-primary-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {cards.map((card, index) => (
        <div key={index} className="card p-5">
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
              <card.icon className={`w-6 h-6 text-${card.color.replace('bg-', '')}`} style={{ color: card.color.includes('green') ? '#22c55e' : card.color.includes('amber') ? '#f59e0b' : '#0ea5e9' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
