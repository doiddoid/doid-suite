import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Building2, Check, Plus } from 'lucide-react';
import { useActivities } from '../../hooks/useActivities';

export default function ActivitySelector({ className = '' }) {
  const { activities, currentActivity, switchActivity, loading } = useActivities();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitch = (activity) => {
    switchActivity(activity);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 px-3 py-2 ${className}`}>
        <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
        <span className="text-sm text-gray-500">Caricamento...</span>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Link
        to="/activities/new"
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors ${className}`}
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm font-medium">Crea attività</span>
      </Link>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Building2 className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700 max-w-[150px] truncate">
          {currentActivity?.name || 'Seleziona attività'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-fade-in">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase">Le tue attività</p>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {activities.map((activity) => (
              <button
                key={activity.id}
                onClick={() => handleSwitch(activity)}
                className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between group ${
                  currentActivity?.id === activity.id ? 'bg-primary-50' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    currentActivity?.id === activity.id ? 'text-primary-700' : 'text-gray-700'
                  }`}>
                    {activity.name}
                  </p>
                  {activity.email && (
                    <p className="text-xs text-gray-400 truncate">{activity.email}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activity.role === 'owner'
                      ? 'bg-amber-100 text-amber-700'
                      : activity.role === 'admin'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {activity.role === 'owner' ? 'Proprietario' : activity.role === 'admin' ? 'Admin' : 'Utente'}
                  </span>
                  {currentActivity?.id === activity.id && (
                    <Check className="w-4 h-4 text-primary-600" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-100 mt-1 pt-1">
            <Link
              to="/activities/new"
              className="flex items-center px-4 py-2.5 text-sm text-primary-600 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuova attività
            </Link>
            <Link
              to="/activities"
              className="flex items-center px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <Building2 className="w-4 h-4 mr-2" />
              Gestisci attività
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
