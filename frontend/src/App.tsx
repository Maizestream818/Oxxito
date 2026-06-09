import { useState } from 'react';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import LoginPage from './pages/LoginPage';
import NewSalePage from './pages/NewSalePage';
import ProductsPage from './pages/ProductsPage';
import ReportsPage from './pages/ReportsPage';
import SalesPage from './pages/SalesPage';
import { AuthUser } from './types/api.types';
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

function renderPage(activePage: NavigationKey, token: string, user: AuthUser) {
  switch (activePage) {
    case 'products':
      return <ProductsPage token={token} />;
    case 'inventory':
      return <InventoryPage token={token} user={user} />;
    case 'new-sale':
      return <NewSalePage token={token} user={user} />;
    case 'sales':
      return <SalesPage token={token} user={user} />;
    case 'reports':
      return <ReportsPage token={token} user={user} />;
    case 'dashboard':
    default:
      return <DashboardPage token={token} user={user} />;
  }
}

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activePage, setActivePage] = useState<NavigationKey>('dashboard');

  if (!token || !user) {
    return (
      <LoginPage
        onLogin={(nextToken, nextUser) => {
          setToken(nextToken);
          setUser(nextUser);
        }}
      />
    );
  }

  return (
    <Layout
      activePage={activePage}
      currentTitle={pageTitles[activePage]}
      navigationItems={navigationItems}
      user={user}
      onLogout={() => {
        setActivePage('dashboard');
        setToken(null);
        setUser(null);
      }}
      onNavigate={setActivePage}
    >
      {renderPage(activePage, token, user)}
    </Layout>
  );
}
