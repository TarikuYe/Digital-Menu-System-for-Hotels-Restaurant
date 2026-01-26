import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MenuPage from './pages/MenuPage.jsx';
import OrderPage from './pages/OrderPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import KitchenDashboard from './pages/KitchenDashboard.jsx';
import ManagerDashboard from './pages/ManagerDashboard.jsx';
import CashierDashboard from './pages/CashierDashboard.jsx';
import WaiterDashboard from './pages/WaiterDashboard.jsx';
import GuestEntry from './pages/GuestEntry.jsx';
import Navbar from './components/Common/Navbar.jsx';
import { getRoleDashboard } from './utils/roleRedirect.js';

const PrivateRoute = ({ children, requireAdmin = false, requireStaff = false, allowedRoles = [] }) => {
  const { isAuthenticated, isAdmin, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark">
        <div className="text-xl text-gold animate-pulse font-display">Authenticating...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    // Redirect to user's own dashboard instead of menu
    const userDashboard = getRoleDashboard(user);
    return <Navigate to={userDashboard} replace />;
  }

  if (requireStaff && !(isAdmin || user?.role === 'staff' || user?.role === 'kitchen')) {
    const userDashboard = getRoleDashboard(user);
    return <Navigate to={userDashboard} replace />;
  }

  // Check if user has one of the allowed roles
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role) && !isAdmin) {
    // Redirect to user's own dashboard
    const userDashboard = getRoleDashboard(user);
    return <Navigate to={userDashboard} replace />;
  }

  return children;
};

// Component to handle root route redirection
const RootRedirect = () => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    const dashboard = getRoleDashboard(user);
    return <Navigate to={dashboard} replace />;
  }

  return <Navigate to="/menu" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route
        path="/orders"
        element={
          <PrivateRoute>
            <OrderPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute requireAdmin={true}>
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/manager"
        element={
          <PrivateRoute allowedRoles={['manager', 'admin']}>
            <ManagerDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/kitchen"
        element={
          <PrivateRoute allowedRoles={['kitchen', 'manager', 'staff']}>
            <KitchenDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/cashier"
        element={
          <PrivateRoute allowedRoles={['cashier', 'manager', 'admin']}>
            <CashierDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/waiter"
        element={
          <PrivateRoute allowedRoles={['staff', 'manager', 'admin']}>
            <WaiterDashboard />
          </PrivateRoute>
        }
      />
      <Route path="/scan/:token" element={<GuestEntry />} />
      <Route path="/" element={<RootRedirect />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen bg-brand-dark">
              <Navbar />
              <AppRoutes />
            </div>
          </Router>
        </CartProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;

