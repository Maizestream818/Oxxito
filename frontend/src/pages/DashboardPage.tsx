const metrics = [
  { label: 'Ventas del día', value: '$24,850', trend: '12.4% arriba' },
  { label: 'Productos activos', value: '200', trend: 'Catálogo base' },
  { label: 'Inventario bajo', value: '18', trend: 'Prioridad media' },
  { label: 'Sucursales', value: '10', trend: 'Operando' }
];

const branchRows = [
  ['SUC-01', 'Oxxito Centro', '$8,420', 'Activo'],
  ['SUC-02', 'Oxxito Norte', '$6,310', 'Activo'],
  ['SUC-03', 'Oxxito Sur', '$5,940', 'Activo'],
  ['SUC-04', 'Oxxito Oriente', '$4,180', 'Activo']
];

export default function DashboardPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <h2>Resumen operativo</h2>
          <p>Corte general de operación</p>
        </div>
        <button className="secondary-button" type="button">
          Hoy
        </button>
      </div>

      <section className="summary-grid">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <span className="metric-label">{metric.label}</span>
            <strong className="metric-value">{metric.value}</strong>
            <span className="metric-trend">{metric.trend}</span>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="table-card">
          <div className="table-header">
            <h3>Sucursales destacadas</h3>
            <span className="table-muted">Turno matutino</span>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Sucursal</th>
                <th>Ventas</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {branchRows.map(([id, name, sales, status]) => (
                <tr key={id}>
                  <td>{id}</td>
                  <td>{name}</td>
                  <td>{sales}</td>
                  <td>
                    <span className="status-pill">{status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="placeholder-panel">
          <div className="placeholder-header">
            <h3>Actividad reciente</h3>
            <span className="table-muted">4 eventos</span>
          </div>
          <ul className="placeholder-list">
            <li>
              <span>Venta registrada</span>
              <strong>SUC-01</strong>
            </li>
            <li>
              <span>Inventario actualizado</span>
              <strong>SUC-03</strong>
            </li>
            <li>
              <span>Reporte generado</span>
              <strong>Admin</strong>
            </li>
            <li>
              <span>Producto desactivado</span>
              <strong>PROD-999</strong>
            </li>
          </ul>
        </article>
      </section>
    </>
  );
}
