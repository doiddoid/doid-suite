import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Star,
  FileText,
  UtensilsCrossed,
  Monitor,
  Shield,
  HelpCircle,
  Sparkles,
  Check
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useActivities } from '../../hooks/useActivities';

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { user } = useAuth();
  const { currentActivity, activities, switchActivity, getServicesDashboard } = useActivities();

  const [activeServices, setActiveServices] = useState([]);
  const [activityDropdownOpen, setActivityDropdownOpen] = useState(false);

  // Service icons and colors mapping
  const serviceConfig = {
    smart_review: { icon: Star, color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
    smart_page: { icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-50' },
    menu_digitale: { icon: UtensilsCrossed, color: 'text-green-500', bgColor: 'bg-green-50' },
    display_suite: { icon: Monitor, color: 'text-purple-500', bgColor: 'bg-purple-50' }
  };

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
          // Filter only active or trial services
          const active = result.data.filter(s =>
            s.subscription?.status === 'active' || s.subscription?.status === 'trial'
          );
          setActiveServices(active);
        }
      } catch (err) {
        console.error('Error loading services:', err);
      }
    };

    loadActiveServices();
  }, [currentActivity?.id, getServicesDashboard]);

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const mainNavItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'Attività',
      path: '/activities',
      icon: Building2
    }
  ];

  // Single admin link - the Admin page has internal tabs
  const adminNavItem = {
    name: 'Pannello Admin',
    path: '/admin',
    icon: Shield
  };

  const NavItem = ({ item, showLabel = true }) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    return (
      <Link
        to={item.path}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
          ${active
            ? 'bg-teal-50 text-teal-700 font-medium'
            : item.highlight
              ? 'text-amber-700 hover:bg-amber-50'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }
          ${collapsed ? 'justify-center' : ''}
        `}
        title={collapsed ? item.name : undefined}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 ${item.color || ''} ${active ? 'text-teal-600' : ''}`} />
        {showLabel && !collapsed && (
          <span className="truncate">{item.name}</span>
        )}
        {active && !collapsed && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500" />
        )}
      </Link>
    );
  };

  const ServiceNavItem = ({ service }) => {
    const config = serviceConfig[service.service.code] || { icon: Star, color: 'text-gray-500' };
    const Icon = config.icon;
    const isTrialStatus = service.subscription?.status === 'trial';

    return (
      <Link
        to={`/services/${service.service.code.replace('_', '-')}`}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
          text-gray-600 hover:bg-gray-100 hover:text-gray-900
          ${collapsed ? 'justify-center' : ''}
        `}
        title={collapsed ? service.service.name : undefined}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 ${config.color}`} />
        {!collapsed && (
          <>
            <span className="truncate flex-1">{service.service.name}</span>
            <span className={`
              text-[10px] font-semibold px-1.5 py-0.5 rounded
              ${isTrialStatus
                ? 'bg-blue-100 text-blue-700'
                : 'bg-amber-100 text-amber-700'
              }
            `}>
              {isTrialStatus ? 'TRIAL' : 'PRO'}
            </span>
          </>
        )}
      </Link>
    );
  };

  const handleSwitchActivity = (activity) => {
    switchActivity(activity);
    setActivityDropdownOpen(false);
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200
        transition-all duration-300 ease-in-out flex flex-col
        ${collapsed ? 'w-[72px]' : 'w-64'}
      `}
    >
      {/* Logo - NEW DESIGN */}
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

      {/* Activity Switcher */}
      {!collapsed && currentActivity && (
        <div className="px-3 py-3 border-b border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 px-1">
            Attività corrente
          </p>
          <div className="relative">
            <button
              onClick={() => setActivityDropdownOpen(!activityDropdownOpen)}
              className="w-full flex items-center justify-between gap-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 rounded-lg px-3 py-2.5 transition-all"
            >
              <span className="text-sm font-medium text-gray-900 truncate">
                {currentActivity.name}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${activityDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Activity Dropdown */}
            {activityDropdownOpen && activities.length > 1 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-60 overflow-y-auto">
                {activities.map((activity) => (
                  <button
                    key={activity.id}
                    onClick={() => handleSwitchActivity(activity)}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                      ${activity.id === currentActivity.id
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    {activity.id === currentActivity.id && (
                      <Check className="w-4 h-4 text-teal-600" />
                    )}
                    <span className={activity.id === currentActivity.id ? '' : 'ml-6'}>
                      {activity.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapsed Activity Badge */}
      {collapsed && currentActivity && (
        <div className="px-2 py-3 border-b border-gray-100">
          <div
            className="w-10 h-10 mx-auto bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center"
            title={currentActivity.name}
          >
            <span className="text-white font-bold text-sm">
              {currentActivity.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Main Section */}
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

        {/* Active Services Section - Only if user has active services */}
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

        {/* Divider before bottom items */}
        <div className="my-4 border-t border-gray-100" />

        {/* Settings & Support */}
        <div className="space-y-1">
          <NavItem item={{ name: 'Impostazioni', path: '/settings', icon: Settings }} />
          <NavItem item={{ name: 'Supporto', path: '/support', icon: HelpCircle }} />
        </div>

        {/* Admin Section - Only for superadmin */}
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
