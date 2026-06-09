import { useState } from 'react';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import LoginPage from './pages/LoginPage';
import NewSalePage from './pages/NewSalePage';
import ProductsPage from './pages/ProductsPage';
import ReportsPage from './pages/ReportsPage';
import SalesPage from './pages/SalesPage';
import { NavigationItem, NavigationKey } from './types/navigation.types';

const navigationItems: NavigationItem[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'products', label: 'Productos' },
  { key: 'inventory', label: 'Inventario' },
  { key: 'new-sale', label: 'Nueva venta' },
  { key: 'sales', label: 'Ventas' },
  { key: 'reports', label: 'Reportes' }
];

const pageTitles: Record<NavigationKey, string> = {
  dashboard: 'Dashboard',
  products: 'Productos',
  inventory: 'Inventario',
  'new-sale': 'Nueva venta',
  sales: 'Ventas',
  reports: 'Reportes'
};

function renderPage(activePage: NavigationKey) {
  switch (activePage) {
    case 'products':
      return <ProductsPage />;
    case 'inventory':
      return <InventoryPage />;
    case 'new-sale':
      return <NewSalePage />;
    case 'sales':
      return <SalesPage />;
    case 'reports':
      return <ReportsPage />;
    case 'dashboard':
    default:
      return <DashboardPage />;
  }
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState<NavigationKey>('dashboard');

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <Layout
      activePage={activePage}
      currentTitle={pageTitles[activePage]}
      navigationItems={navigationItems}
      onLogout={() => {
        setActivePage('dashboard');
        setIsAuthenticated(false);
      }}
      onNavigate={setActivePage}
    >
      {renderPage(activePage)}
    </Layout>
  );
}
