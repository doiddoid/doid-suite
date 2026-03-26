import { Users, Star, FileText, UtensilsCrossed } from 'lucide-react';

/**
 * ClientGrid — Vista "Per servizio" (solo agenzia)
 *
 * Mostra stats row + griglia clienti con pillole servizi colorate.
 * Click su card → seleziona cliente e torna a vista "Per cliente".
 *
 * Props:
 * - activities: Activity[] — lista completa attività/clienti
 * - currentActivityId: string
 * - onSelectActivity: (id: string) => void — seleziona e torna a vista Per cliente
 * - servicesMap: { [activityId]: serviceData[] } — servizi per ogni attività
 */

// Colori avatar (stessa logica della Sidebar)
const AVATAR_COLORS = [
  { bg: 'bg-teal-100', text: 'text-teal-700' },
  { bg: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'bg-amber-100', text: 'text-amber-700' },
  { bg: 'bg-purple-100', text: 'text-purple-700' },
  { bg: 'bg-rose-100', text: 'text-rose-700' },
];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

// Config pillole servizi
const SERVICE_PILLS = [
  { code: 'review', label: 'Review', icon: Star, activeColor: 'bg-amber-100 text-amber-700', proStar: true },
  { code: 'page', label: 'Page', icon: FileText, activeColor: 'bg-blue-100 text-blue-700', proStar: true },
  { code: 'menu', label: 'Menu', icon: UtensilsCrossed, activeColor: 'bg-green-100 text-green-700', proStar: true },
];

export default function ClientGrid({
  activities = [],
  currentActivityId,
  onSelectActivity,
  servicesMap = {},
}) {
  // Calcola stats
  const totalClients = activities.length;

  const clientsWithReview = activities.filter((a) => {
    const svcs = servicesMap[a.id] || [];
    return svcs.some((s) => s.service.code === 'review' && s.isActive);
  }).length;

  const clientsWithPage = activities.filter((a) => {
    const svcs = servicesMap[a.id] || [];
    return svcs.some((s) => s.service.code === 'page' && s.isActive);
  }).length;

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Clienti totali</p>
              <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
            </div>
            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Con Review</p>
              <p className="text-2xl font-bold text-gray-900">{clientsWithReview}</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6" style={{ color: '#EF9F27' }} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Con Page</p>
              <p className="text-2xl font-bold text-gray-900">{clientsWithPage}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6" style={{ color: '#85B7EB' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {activities.map((activity) => {
          const selected = activity.id === currentActivityId;
          const avatarColor = getAvatarColor(activity.name || '');
          const svcs = servicesMap[activity.id] || [];

          return (
            <button
              key={activity.id}
              onClick={() => onSelectActivity(activity.id)}
              className={`
                flex items-center gap-4 bg-white rounded-xl px-5 py-4 text-left
                transition-all duration-200 group hover:shadow-md
                ${selected
                  ? 'border-[1.5px] border-teal-400 shadow-sm'
                  : 'border border-gray-100 hover:border-gray-200'
                }
              `}
            >
              {/* Avatar */}
              <div className={`w-11 h-11 rounded-xl ${avatarColor.bg} flex items-center justify-center flex-shrink-0`}>
                <span className={`text-sm font-bold ${avatarColor.text}`}>
                  {getInitials(activity.name)}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{activity.name}</p>
                {activity.type && (
                  <p className="text-xs text-gray-400 truncate">{activity.type}</p>
                )}
                {/* Service Pills */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  {SERVICE_PILLS.map((pill) => {
                    const svc = svcs.find((s) => s.service.code === pill.code);
                    const isActive = svc?.isActive || false;
                    const isPro = svc?.subscription?.status === 'active' && svc?.subscription?.plan?.code !== 'free';

                    return (
                      <span
                        key={pill.code}
                        className={`
                          inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded
                          ${isActive ? pill.activeColor : 'bg-gray-100 text-gray-400'}
                        `}
                      >
                        {isPro && <span className="text-[9px]">★</span>}
                        {pill.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
