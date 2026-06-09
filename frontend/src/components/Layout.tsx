import Header from './Header';
import { AuthUser } from '../types/api.types';
import Sidebar from './Sidebar';
import { NavigationItem, NavigationKey } from '../types/navigation.types';

type LayoutProps = {
  activePage: NavigationKey;
  children: unknown;
  currentTitle: string;
  navigationItems: NavigationItem[];
  user: AuthUser;
  onLogout: () => void;
  onNavigate: (page: NavigationKey) => void;
};

export default function Layout({
  activePage,
  children,
  currentTitle,
  navigationItems,
  user,
  onLogout,
  onNavigate
}: LayoutProps) {
  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} items={navigationItems} onNavigate={onNavigate} />
      <main className="main-area">
        <Header title={currentTitle} user={user} onLogout={onLogout} />
        <section className="content">{children}</section>
      </main>
    </div>
  );
}
