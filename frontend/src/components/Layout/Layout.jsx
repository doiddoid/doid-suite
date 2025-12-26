import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Persist sidebar state in localStorage
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      {/* Header */}
      <Header sidebarCollapsed={sidebarCollapsed} />

      {/* Main Content */}
      <main
        className={`
          pt-16 min-h-screen transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'pl-[72px]' : 'pl-64'}
        `}
      >
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
