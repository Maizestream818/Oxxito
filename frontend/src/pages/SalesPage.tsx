const saleRows = [
  ['VENTA-SUC-01-001', 'SUC-01', 'Efectivo', '$126.30', '2026-01-01'],
  ['VENTA-SUC-01-002', 'SUC-01', 'Tarjeta', '$88.75', '2026-01-01'],
  ['VENTA-SUC-02-001', 'SUC-02', 'Vales', '$214.20', '2026-01-01'],
  ['VENTA-SUC-03-001', 'SUC-03', 'Transferencia', '$68.40', '2026-01-01']
];

export default function SalesPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <h2>Ventas</h2>
          <p>Historial por sucursal</p>
        </div>
        <button className="secondary-button" type="button">
          Exportar
        </button>
      </div>

      <article className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Venta</th>
              <th>Sucursal</th>
              <th>Método</th>
              <th>Total</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {saleRows.map(([saleId, branch, method, total, date]) => (
              <tr key={saleId}>
                <td>{saleId}</td>
                <td>{branch}</td>
                <td>{method}</td>
                <td>{total}</td>
                <td>{date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </>
  );
}
