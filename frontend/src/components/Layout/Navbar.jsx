import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, Settings, User, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ActivitySelector } from '../Activities';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <span className="text-xl font-bold text-gray-900">DOID Suite</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Activity Selector */}
            <ActivitySelector />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 animate-fade-in">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  {user?.isSuperAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center px-4 py-2 text-sm text-indigo-600 hover:bg-gray-50"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Pannello Admin
                    </Link>
                  )}
                  <Link
                    to="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Impostazioni
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Esci
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white animate-slide-up">
          <div className="px-4 py-3 space-y-3">
            {/* User Info */}
            <div className="pb-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>

            {/* Activity Selector for mobile */}
            <div className="pb-3 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-400 uppercase mb-2">Attività</p>
              <ActivitySelector className="w-full" />
            </div>

            {/* Links */}
            {user?.isSuperAdmin && (
              <Link
                to="/admin"
                className="flex items-center px-3 py-2 text-sm text-indigo-600 rounded-lg hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Shield className="w-4 h-4 mr-2" />
                Pannello Admin
              </Link>
            )}
            <Link
              to="/settings"
              className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Impostazioni
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Esci
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
