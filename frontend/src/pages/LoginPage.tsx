import { useState } from 'react';
import { login } from '../services/authService';
import { AuthUser } from '../types/api.types';

type LoginPageProps = {
  onLogin: (token: string, user: AuthUser) => void;
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await login(username, password);
      onLogin(response.token, response.user);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo iniciar sesion');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-brand">
          <span className="brand-mark">OX</span>
          <h1>Oxxito</h1>
          <p>Sistema distribuido de ventas</p>
        </div>

        <h2>Iniciar sesión</h2>
        <p>Acceso administrativo</p>

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          <label className="field">
            <span>Usuario</span>
            <input
              autoComplete="username"
              name="username"
              onChange={(event: { target: { value: string } }) => setUsername(event.target.value)}
              placeholder="admin"
              type="text"
              value={username}
            />
          </label>

          <label className="field">
            <span>Contraseña</span>
            <input
              autoComplete="current-password"
              name="password"
              onChange={(event: { target: { value: string } }) => setPassword(event.target.value)}
              placeholder="123456"
              type="password"
              value={password}
            />
          </label>

          {error ? <div className="alert alert-error">{error}</div> : null}

          <button className="primary-button" disabled={isLoading} type="submit">
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>

      <section className="login-side" aria-label="Resumen operativo">
        <div className="login-summary">
          <h2>Ventas, inventario y reportes por sucursal</h2>
          <p>Panel administrativo base para operación distribuida.</p>

          <div className="login-summary-grid">
            <div className="login-summary-card">
              <strong>10</strong>
              <span>Sucursales</span>
            </div>
            <div className="login-summary-card">
              <strong>200</strong>
              <span>Productos</span>
            </div>
            <div className="login-summary-card">
              <strong>JWT</strong>
              <span>Seguridad</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
