type HeaderProps = {
  onLogout: () => void;
  title: string;
};

export default function Header({ onLogout, title }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-title">
        <span>Oxxito</span>
        <h1>{title}</h1>
      </div>

      <div className="header-actions">
        <div className="user-chip">
          <span className="user-avatar">AD</span>
          Admin
        </div>
        <button className="logout-button" onClick={onLogout} type="button">
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
