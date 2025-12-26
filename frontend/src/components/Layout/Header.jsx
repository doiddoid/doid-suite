import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  User,
  HelpCircle,
  Moon,
  Sun
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ActivitySelector } from '../Activities';

export default function Header({ sidebarCollapsed }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={`
        fixed top-0 right-0 z-30 h-16 bg-white border-b border-gray-200
        transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'left-[72px]' : 'left-64'}
      `}
    >
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Left side - Search & Activity Selector */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca..."
                className="w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                  placeholder-gray-400 transition-all"
              />
            </div>
          </div>

          {/* Activity Selector */}
          <div className="hidden lg:block">
            <ActivitySelector />
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Help */}
          <button
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Aiuto"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Notifiche</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Nessuna nuova notifica
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 mx-2" />

          {/* User Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white font-medium text-sm">
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 leading-tight">
                  {user?.fullName || 'Utente'}
                </p>
                <p className="text-xs text-gray-500 leading-tight">
                  {user?.isSuperAdmin ? 'Super Admin' : 'Account'}
                </p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in">
                {/* User Info */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{user?.fullName}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setUserDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4 mr-3 text-gray-400" />
                    Il mio profilo
                  </button>
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setUserDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-3 text-gray-400" />
                    Impostazioni
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Esci
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
