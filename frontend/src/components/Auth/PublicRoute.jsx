import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';

/**
 * PublicRoute - Wrapper per route pubbliche (landing, login, register)
 * Se l'utente è già autenticato, reindirizza alla dashboard
 */
export default function PublicRoute({ children, redirectTo = '/dashboard' }) {
  const { isAuthenticated, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Utente autenticato -> redirect
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
