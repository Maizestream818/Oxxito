import { NavigationItem, NavigationKey } from '../types/navigation.types';

type SidebarProps = {
  activePage: NavigationKey;
  items: NavigationItem[];
  onNavigate: (page: NavigationKey) => void;
};

export default function Sidebar({ activePage, items, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">OX</span>
        <div>
          <strong>Oxxito</strong>
          <span>Administración</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Navegación principal">
        {items.map((item) => (
          <button
            className={`sidebar-button${activePage === item.key ? ' active' : ''}`}
            key={item.key}
            onClick={() => onNavigate(item.key)}
            type="button"
          >
            <span className="nav-indicator" aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">Sistema distribuido de ventas</div>
    </aside>
  );
}
