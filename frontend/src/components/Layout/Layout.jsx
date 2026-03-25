import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, AlertTriangle, ShieldAlert } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../hooks/useAuth';

export default function Layout() {
  const navigate = useNavigate();
  const { requirePasswordChange, migratedFrom } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Persist sidebar state in localStorage
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const [impersonation, setImpersonation] = useState(null);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Check for impersonation on mount
  useEffect(() => {
    const impersonationData = localStorage.getItem('impersonationActive');
    if (impersonationData) {
      try {
        const data = JSON.parse(impersonationData);
        if (data.active) {
          setImpersonation(data);
        }
      } catch (e) {
        // Invalid data, remove it
        localStorage.removeItem('impersonationActive');
      }
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const exitImpersonation = () => {
    // Restore admin tokens
    const adminTokensBackup = localStorage.getItem('adminTokensBackup');
    if (adminTokensBackup) {
      try {
        const tokens = JSON.parse(adminTokensBackup);
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
      } catch (e) {
        console.error('Error restoring admin tokens:', e);
      }
    }

    // Clear impersonation data
    localStorage.removeItem('impersonationActive');
    localStorage.removeItem('adminTokensBackup');

    // Redirect to admin panel
    window.location.href = '/admin';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Impersonation Banner */}
      {impersonation && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">
              Stai visualizzando come: <strong>{impersonation.targetUser}</strong>
              {impersonation.targetOrg && <span> ({impersonation.targetOrg})</span>}
            </span>
          </div>
          <button
            onClick={exitImpersonation}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-lg font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Torna ad Admin
          </button>
        </div>
      )}

      {/* Password Change Required Banner */}
      {requirePasswordChange && (
        <div className={`fixed left-0 right-0 z-50 bg-red-500 text-white px-4 py-2 flex items-center justify-between shadow-lg ${impersonation ? 'top-[44px]' : 'top-0'}`}>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            <span className="font-medium">
              Cambio password obbligatorio{migratedFrom ? ` — account migrato da ${migratedFrom}` : ''}. Per sicurezza, aggiorna la tua password.
            </span>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            Cambia password
          </button>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      {/* Header */}
      <Header sidebarCollapsed={sidebarCollapsed} bannerOffset={impersonation && requirePasswordChange ? 88 : impersonation || requirePasswordChange ? 44 : 0} />

      {/* Main Content */}
      <main
        className={`
          min-h-screen transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'pl-[72px]' : 'pl-64'}
          ${impersonation && requirePasswordChange ? 'pt-[148px]' : impersonation || requirePasswordChange ? 'pt-[104px]' : 'pt-16'}
        `}
      >
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
