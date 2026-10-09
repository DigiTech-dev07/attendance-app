import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EventProvider } from './context/EventContext';

// Pages
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import DashboardPage from './pages/DashboardPage';
import CarRegistrationPage from './pages/CarRegistrationPage';
import BusRegistrationPage from './pages/BusRegistrationPage';
import TripTrackingPage from './pages/TripTrackingPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

// Protected Route Guard
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sunshine border-3 border-black animate-spin"></div>
          <span className="font-black text-xs uppercase tracking-wider text-ink">
            Loading DG Tech Offsite...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Admin Route Guard
function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF7]">
        <div className="w-12 h-12 rounded-2xl bg-coral border-3 border-black animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

// Root Route Decider
function RootRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
}

export function App() {
  return (
    <AuthProvider>
      <EventProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<RootRoute />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Employee Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/register/car"
              element={
                <ProtectedRoute>
                  <CarRegistrationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/register/bus"
              element={
                <ProtectedRoute>
                  <BusRegistrationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trip/:direction"
              element={
                <ProtectedRoute>
                  <TripTrackingPage />
                </ProtectedRoute>
              }
            />

            {/* Admin / CTO Protected Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboardPage />
                </AdminRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </EventProvider>
    </AuthProvider>
  );
}

export default App;
