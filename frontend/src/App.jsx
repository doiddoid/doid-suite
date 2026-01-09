import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ActivityProvider } from './hooks/useActivities';
import { ProtectedRoute } from './components/Auth';
import { Layout } from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import NewOrganization from './pages/NewOrganization';
import Activities from './pages/Activities';
import NewActivity from './pages/NewActivity';
import ActivitySettings from './pages/ActivitySettings';
import Admin from './pages/Admin';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ActivityProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/change-password" element={<ChangePassword />} />

            {/* Protected routes with Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/organizations/new" element={<NewOrganization />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/activities/new" element={<NewActivity />} />
              <Route path="/activities/:id/settings" element={<ActivitySettings />} />
              <Route path="/admin" element={<Admin />} />
            </Route>

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ActivityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
