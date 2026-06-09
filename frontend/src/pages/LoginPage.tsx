type LoginPageProps = {
  onLogin: () => void;
};

export default function LoginPage({ onLogin }: LoginPageProps) {
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
          onSubmit={(event: { preventDefault: () => void }) => {
            event.preventDefault();
            onLogin();
          }}
        >
          <label className="field">
            <span>Usuario</span>
            <input autoComplete="username" name="username" placeholder="admin" type="text" />
          </label>

          <label className="field">
            <span>Contraseña</span>
            <input autoComplete="current-password" name="password" placeholder="123456" type="password" />
          </label>

          <button className="primary-button" type="submit">
            Entrar
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
