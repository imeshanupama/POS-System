import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ProductsPage from './pages/ProductsPage';
import SalesPage from './pages/SalesPage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import DashboardPage from './pages/DashboardPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 font-sans">
        <nav className="bg-white shadow p-4 flex gap-4 items-center">
          <h1 className="text-xl font-bold mr-4">POS System</h1>
          <Link to="/" className="text-blue-600 hover:underline">Dashboard</Link>
          <Link to="/products" className="text-blue-600 hover:underline">Products</Link>
          <Link to="/sales" className="text-blue-600 hover:underline">New Sale</Link>
          <Link to="/history" className="text-blue-600 hover:underline">History</Link>
        </nav>

        <main className="p-4">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/history" element={<SalesHistoryPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
