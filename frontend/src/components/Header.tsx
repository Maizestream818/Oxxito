import { AuthUser } from '../types/api.types';

type HeaderProps = {
  onLogout: () => void;
  title: string;
  user: AuthUser;
};

export default function Header({ onLogout, title, user }: HeaderProps) {
  const initials = user.nombre
    ? user.nombre
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : user.username.slice(0, 2).toUpperCase();

  return (
    <header className="header">
      <div className="header-title">
        <span>Oxxito</span>
        <h1>{title}</h1>
      </div>

      <div className="header-actions">
        <div className="user-chip">
          <span className="user-avatar">{initials}</span>
          <div>
            <strong>{user.nombre || user.username}</strong>
            <span>{user.rol} · {user.sucursal_id}</span>
          </div>
        </div>
        <button className="logout-button" onClick={onLogout} type="button">
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
