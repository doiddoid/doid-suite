import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Star,
  FileText,
  UtensilsCrossed,
  Monitor,
  Shield,
  BookOpen,
  Sparkles,
  ExternalLink,
  Loader2,
  Plus
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useActivities } from '../../hooks/useActivities';

// Colori fissi per avatar (derivati deterministicamente dal nome)
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

// Service icons and colors mapping
const serviceConfig = {
  review: { icon: Star, color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
  page: { icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-50' },
  menu: { icon: UtensilsCrossed, color: 'text-green-500', bgColor: 'bg-green-50' },
  display: { icon: Monitor, color: 'text-purple-500', bgColor: 'bg-purple-50' }
};

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { user } = useAuth();
  const { currentActivity, activities, switchActivity, getServicesDashboard, accessService } = useActivities();

  const [activeServices, setActiveServices] = useState([]);
  const [accessingService, setAccessingService] = useState(null);
  const [allServicesMap, setAllServicesMap] = useState({});

  // Euristica tipo account: ≥2 attività = agenzia
  // TODO: sostituire con campo esplicito da Supabase (es. user.is_agency) quando disponibile
  const isAgency = activities.length >= 2;

  // Load active services when activity changes
  useEffect(() => {
    const loadActiveServices = async () => {
      if (!currentActivity?.id) {
        setActiveServices([]);
        return;
      }

      try {
        const result = await getServicesDashboard(currentActivity.id);
        if (result.success) {
          const active = result.data.filter(s =>
            s.subscription?.status === 'active' || s.subscription?.status === 'trial' || s.subscription?.status === 'free'
          );
          setActiveServices(active);

          // Cache all services per activity for status dots
          setAllServicesMap(prev => ({
            ...prev,
            [currentActivity.id]: result.data
          }));
        }
      } catch (err) {
        console.error('Error loading services:', err);
      }
    };

    loadActiveServices();
  }, [currentActivity?.id, getServicesDashboard]);

  // Load services for all activities (for agency status dots)
  useEffect(() => {
    if (!isAgency) return;

    const loadAllActivitiesServices = async () => {
      for (const activity of activities) {
        if (allServicesMap[activity.id]) continue;
        try {
          const result = await getServicesDashboard(activity.id);
          if (result.success) {
            setAllServicesMap(prev => ({ ...prev, [activity.id]: result.data }));
          }
        } catch (err) {
          // silently skip
        }
      }
    };

    loadAllActivitiesServices();
  }, [isAgency, activities, getServicesDashboard]);

  // Calcola colore pallino stato per un'attività (solo agenzia)
  const getStatusDotColor = (activityId) => {
    const services = allServicesMap[activityId];
    if (!services) return 'bg-gray-300';

    const activeOnes = services.filter(s =>
      s.subscription?.status === 'active' || s.subscription?.status === 'trial' || s.subscription?.status === 'free'
    );

    if (activeOnes.length === 0) return 'bg-red-400';

    const hasTrialOrFree = activeOnes.some(s =>
      s.subscription?.status === 'trial' || s.subscription?.status === 'free'
    );
    if (hasTrialOrFree) return 'bg-amber-400';

    return 'bg-green-400';
  };

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const mainNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Gestisci attività', path: '/activities', icon: Settings }
  ];

  const adminNavItem = { name: 'Pannello Admin', path: '/admin', icon: Shield };

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    return (
      <Link
        to={item.path}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
          ${active
            ? 'bg-teal-50 text-teal-700 font-medium'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }
          ${collapsed ? 'justify-center' : ''}
        `}
        title={collapsed ? item.name : undefined}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-teal-600' : ''}`} />
        {!collapsed && <span className="truncate">{item.name}</span>}
        {active && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500" />}
      </Link>
    );
  };

  const handleAccessService = async (serviceCode) => {
    if (accessingService) return;
    setAccessingService(serviceCode);
    try {
      const result = await accessService(serviceCode);
      if (!result.success) {
        console.error('Error accessing service:', result.error);
      }
    } finally {
      setAccessingService(null);
    }
  };

  const ServiceNavItem = ({ service }) => {
    const config = serviceConfig[service.service.code] || { icon: Star, color: 'text-gray-500' };
    const Icon = config.icon;
    const isTrialStatus = service.subscription?.status === 'trial';
    const isLoading = accessingService === service.service.code;

    return (
      <button
        onClick={() => handleAccessService(service.service.code)}
        disabled={isLoading}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
          text-gray-600 hover:bg-teal-50 hover:text-teal-700
          ${collapsed ? 'justify-center' : ''}
          ${isLoading ? 'opacity-70 cursor-wait' : 'cursor-pointer'}
        `}
        title={collapsed ? `Accedi a ${service.service.name}` : undefined}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin text-teal-500" />
        ) : (
          <Icon className={`w-5 h-5 flex-shrink-0 ${config.color}`} />
        )}
        {!collapsed && (
          <>
            <span className="truncate flex-1 text-left">{service.service.name}</span>
            <span className={`
              text-[10px] font-semibold px-1.5 py-0.5 rounded
              ${isTrialStatus ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}
            `}>
              {isTrialStatus ? 'TRIAL' : 'PRO'}
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-teal-500 transition-colors" />
          </>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200
        transition-all duration-300 ease-in-out flex flex-col
        ${collapsed ? 'w-[72px]' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div className={`h-16 flex items-center border-b border-gray-100 ${collapsed ? 'justify-center px-2' : 'px-4'}`}>
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg text-slate-500 font-normal">DOID</span>
              <span className="text-lg text-slate-900 font-bold">Suite</span>
            </div>
          )}
        </Link>
      </div>

      {/* Client/Activity List */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-gray-100 max-h-[280px] overflow-y-auto">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 px-1">
            {isAgency ? 'Clienti' : 'Le tue attività'}
          </p>
          <div className="space-y-0.5">
            {activities.map((activity) => {
              const selected = activity.id === currentActivity?.id;
              const avatarColor = getAvatarColor(activity.name || '');
              return (
                <button
                  key={activity.id}
                  onClick={() => switchActivity(activity)}
                  className={`
                    w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left
                    ${selected
                      ? 'bg-teal-50 font-medium'
                      : 'hover:bg-gray-50'
                    }
                  `}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-lg ${avatarColor.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`text-xs font-bold ${avatarColor.text}`}>
                      {getInitials(activity.name)}
                    </span>
                  </div>
                  {/* Name */}
                  <span className={`text-sm truncate flex-1 ${selected ? 'text-teal-700' : 'text-gray-700'}`}>
                    {activity.name}
                  </span>
                  {/* Status dot (solo agenzia) */}
                  {isAgency && (
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusDotColor(activity.id)}`} />
                  )}
                </button>
              );
            })}
          </div>
          {/* Aggiungi */}
          <Link
            to="/activities/new"
            className="flex items-center gap-2.5 px-2.5 py-2 mt-1 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-all"
          >
            <div className="w-8 h-8 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-sm">
              {isAgency ? '+ Aggiungi cliente' : '+ Aggiungi sede'}
            </span>
          </Link>
        </div>
      )}

      {/* Collapsed: show current activity avatar */}
      {collapsed && currentActivity && (
        <div className="px-2 py-3 border-b border-gray-100">
          <div
            className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center ${getAvatarColor(currentActivity.name || '').bg}`}
            title={currentActivity.name}
          >
            <span className={`font-bold text-sm ${getAvatarColor(currentActivity.name || '').text}`}>
              {getInitials(currentActivity.name)}
            </span>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Principale
            </p>
          )}
          {mainNavItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </div>

        {/* Active Services */}
        {activeServices.length > 0 && (
          <div className="mt-6 space-y-1">
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                I tuoi servizi
              </p>
            )}
            {activeServices.map((service) => (
              <ServiceNavItem key={service.service.code} service={service} />
            ))}
          </div>
        )}

        <div className="my-4 border-t border-gray-100" />

        <div className="space-y-1">
          <NavItem item={{ name: 'Impostazioni', path: '/settings', icon: Settings }} />
          <NavItem item={{ name: 'Guida', path: '/guida', icon: BookOpen }} />
        </div>

        {/* Admin Section */}
        {user?.isSuperAdmin && (
          <div className="mt-6 space-y-1">
            {!collapsed && (
              <div className="mx-1 mb-2 px-2 py-1.5 bg-amber-50 rounded-lg">
                <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
                  Amministrazione
                </p>
              </div>
            )}
            <div className={`${!collapsed ? 'bg-amber-50/50 rounded-lg p-1' : ''}`}>
              <Link
                to={adminNavItem.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                  ${isActive(adminNavItem.path)
                    ? 'bg-amber-100 text-amber-800 font-medium'
                    : 'text-amber-700 hover:bg-amber-100'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? adminNavItem.name : undefined}
              >
                <adminNavItem.icon className={`w-5 h-5 flex-shrink-0 ${isActive(adminNavItem.path) ? 'text-amber-700' : 'text-amber-600'}`} />
                {!collapsed && <span className="truncate">{adminNavItem.name}</span>}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className={`
          absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full
          flex items-center justify-center shadow-sm hover:shadow-md hover:bg-gray-50
          transition-all duration-200 z-50
        `}
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
        )}
      </button>
    </aside>
  );
}
