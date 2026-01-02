import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { LogOut, AlertTriangle } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
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

      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      {/* Header */}
      <Header sidebarCollapsed={sidebarCollapsed} />

      {/* Main Content */}
      <main
        className={`
          min-h-screen transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'pl-[72px]' : 'pl-64'}
          ${impersonation ? 'pt-[104px]' : 'pt-16'}
        `}
      >
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
