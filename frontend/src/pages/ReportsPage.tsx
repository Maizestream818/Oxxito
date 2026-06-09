const reportCards = [
  ['Ventas por sucursal', '$84,920', '10 sucursales'],
  ['Ticket promedio', '$128.40', 'Periodo actual'],
  ['Productos más vendidos', '10', 'Top operativo'],
  ['Métodos de pago', '4', 'Distribución']
];

export default function ReportsPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <h2>Reportes</h2>
          <p>Indicadores comerciales</p>
        </div>
        <button className="secondary-button" type="button">
          Este mes
        </button>
      </div>

      <section className="summary-grid">
        {reportCards.map(([label, value, trend]) => (
          <article className="metric-card" key={label}>
            <span className="metric-label">{label}</span>
            <strong className="metric-value">{value}</strong>
            <span className="metric-trend">{trend}</span>
          </article>
        ))}
      </section>

      <article className="placeholder-panel" style={{ marginTop: '16px' }}>
        <div className="placeholder-header">
          <h3>Comparativo de sucursales</h3>
          <span className="table-muted">Ingresos estimados</span>
        </div>
        <ul className="placeholder-list">
          <li>
            <span>Oxxito Centro</span>
            <strong>$18,240</strong>
          </li>
          <li>
            <span>Oxxito Norte</span>
            <strong>$16,880</strong>
          </li>
          <li>
            <span>Oxxito Sur</span>
            <strong>$14,510</strong>
          </li>
        </ul>
      </article>
    </>
  );
}
