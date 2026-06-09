import Header from './Header';
import Sidebar from './Sidebar';
import { NavigationItem, NavigationKey } from '../types/navigation.types';

type LayoutProps = {
  activePage: NavigationKey;
  children: unknown;
  currentTitle: string;
  navigationItems: NavigationItem[];
  onLogout: () => void;
  onNavigate: (page: NavigationKey) => void;
};

export default function Layout({
  activePage,
  children,
  currentTitle,
  navigationItems,
  onLogout,
  onNavigate
}: LayoutProps) {
  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} items={navigationItems} onNavigate={onNavigate} />
      <main className="main-area">
        <Header title={currentTitle} onLogout={onLogout} />
        <section className="content">{children}</section>
      </main>
    </div>
  );
}
