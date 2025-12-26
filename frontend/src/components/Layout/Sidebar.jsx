import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Star,
  FileText,
  UtensilsCrossed,
  Monitor,
  Users,
  CreditCard,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useActivities } from '../../hooks/useActivities';

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { user } = useAuth();
  const { currentActivity } = useActivities();

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

  const serviceNavItems = [
    {
      name: 'Smart Review',
      path: '/services/smart-review',
      icon: Star,
      color: 'text-yellow-500'
    },
    {
      name: 'Smart Page',
      path: '/services/smart-page',
      icon: FileText,
      color: 'text-blue-500'
    },
    {
      name: 'Menu Digitale',
      path: '/services/menu',
      icon: UtensilsCrossed,
      color: 'text-green-500'
    },
    {
      name: 'Display Suite',
      path: '/services/display',
      icon: Monitor,
      color: 'text-purple-500'
    }
  ];

  const bottomNavItems = [
    {
      name: 'Impostazioni',
      path: '/settings',
      icon: Settings
    }
  ];

  if (user?.isSuperAdmin) {
    bottomNavItems.unshift({
      name: 'Admin',
      path: '/admin',
      icon: Shield,
      highlight: true
    });
  }

  const NavItem = ({ item, showLabel = true }) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    return (
      <Link
        to={item.path}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
          ${active
            ? 'bg-primary-50 text-primary-700 font-medium'
            : item.highlight
              ? 'text-indigo-600 hover:bg-indigo-50'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }
          ${collapsed ? 'justify-center' : ''}
        `}
        title={collapsed ? item.name : undefined}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 ${item.color || ''} ${active ? 'text-primary-600' : ''}`} />
        {showLabel && !collapsed && (
          <span className="truncate">{item.name}</span>
        )}
        {active && !collapsed && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
        )}
      </Link>
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
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900 leading-tight">DOID</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider -mt-0.5">Suite</span>
            </div>
          )}
        </Link>
      </div>

      {/* Current Activity Badge */}
      {currentActivity && (
        <div className={`px-3 py-3 border-b border-gray-100 ${collapsed ? 'hidden' : ''}`}>
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Attività corrente</p>
            <p className="text-sm font-medium text-gray-900 truncate">{currentActivity.name}</p>
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

        {/* Services Section */}
        <div className="mt-6 space-y-1">
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Servizi
            </p>
          )}
          {serviceNavItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-100 px-3 py-3 space-y-1">
        {bottomNavItems.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
      </div>

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
