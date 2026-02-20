import { HashRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import ProductsPage from './pages/ProductsPage';
import SalesPage from './pages/SalesPage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import CustomersPage from './pages/CustomersPage';
import SettingsPage from './pages/SettingsPage';
import { getCurrentUser, logoutUser } from './services/api';
import './App.css';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactElement, adminOnly?: boolean }) {
  const user = getCurrentUser();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/sales" replace />; // Redirect cashiers to sales
  }

  return children;
}

import { ShiftManager } from './components/ShiftManager';

// ... existing imports ...

function Layout({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();

  const onLogout = () => {
    logoutUser();
    window.location.reload();
  };

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <nav className="bg-white shadow p-4 flex gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <h1 className="text-xl font-bold mr-4">POS System</h1>
          {user.role === 'admin' && (
            <>
              <Link to="/" className="text-blue-600 hover:underline">Dashboard</Link>
              <Link to="/products" className="text-blue-600 hover:underline">Products</Link>
              <Link to="/customers" className="text-blue-600 hover:underline">Customers</Link>
              <Link to="/users" className="text-blue-600 hover:underline">Users</Link>
              <Link to="/settings" className="text-blue-600 hover:underline">Settings</Link>
            </>
          )}
          <Link to="/sales" className="text-blue-600 hover:underline">New Sale</Link>
          <Link to="/history" className="text-blue-600 hover:underline">History</Link>
        </div>
        <div className="flex items-center gap-4">
          {user.role === 'cashier' && <ShiftManager />}
          <span className="text-sm text-gray-600">User: {user.username} ({user.role})</span>
          <button onClick={onLogout} className="text-red-600 hover:underline">Logout</button>
        </div>
      </nav>

      <main className="p-4">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={
          <ProtectedRoute adminOnly>
            <Layout><DashboardPage /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/products" element={
          <ProtectedRoute adminOnly>
            <Layout><ProductsPage /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/users" element={
          <ProtectedRoute adminOnly>
            <Layout><UsersPage /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/customers" element={
          <ProtectedRoute adminOnly>
            <Layout><CustomersPage /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute adminOnly>
            <Layout><SettingsPage /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/sales" element={
          <ProtectedRoute>
            <Layout><SalesPage /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/history" element={
          <ProtectedRoute>
            <Layout><SalesHistoryPage /></Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
