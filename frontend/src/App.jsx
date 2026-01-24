
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
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
    return <Navigate to="/menu" replace />;
  }

  if (requireStaff && !(isAdmin || user?.role === 'staff' || user?.role === 'kitchen')) {
    return <Navigate to="/menu" replace />;
  }

  // Check if user has one of the allowed roles
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role) && !isAdmin) {
    return <Navigate to="/menu" replace />;
  }

  return children;
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
      <Route path="/" element={<Navigate to="/menu" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-brand-dark">
            <Navbar />
            <AppRoutes />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
