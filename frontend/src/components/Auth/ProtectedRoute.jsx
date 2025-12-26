import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useActivities } from '../../hooks/useActivities';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, requireActivity = false }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { activities, currentActivity, loading: activitiesLoading } = useActivities();
  const location = useLocation();

  // Loading auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Non autenticato -> login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Loading attività
  if (activitiesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Caricamento attività...</p>
        </div>
      </div>
    );
  }

  // Se richiede attività e non ce n'è nessuna -> crea attività
  // Ma solo se non siamo già sulla pagina di creazione attività
  if (requireActivity && activities.length === 0 && !location.pathname.startsWith('/activities')) {
    return <Navigate to="/activities/new" state={{ from: location }} replace />;
  }

  return children;
}
