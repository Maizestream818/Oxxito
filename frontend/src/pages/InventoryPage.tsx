const inventoryRows = [
  ['SUC-01', 'PROD-001', 'Bebidas Coca-Cola 001', '504', '20'],
  ['SUC-01', 'PROD-002', 'Botanas Pepsi 002', '498', '20'],
  ['SUC-02', 'PROD-003', 'Lácteos Bimbo 003', '515', '20'],
  ['SUC-03', 'PROD-004', 'Panadería Sabritas 004', '489', '20']
];

export default function InventoryPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <h2>Inventario</h2>
          <p>Existencias por sucursal</p>
        </div>
        <button className="secondary-button" type="button">
          SUC-01
        </button>
      </div>

      <article className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Sucursal</th>
              <th>Producto</th>
              <th>Nombre</th>
              <th>Stock</th>
              <th>Mínimo</th>
            </tr>
          </thead>
          <tbody>
            {inventoryRows.map(([branch, productId, name, stock, minimum]) => (
              <tr key={`${branch}-${productId}`}>
                <td>{branch}</td>
                <td>{productId}</td>
                <td>{name}</td>
                <td>{stock}</td>
                <td>{minimum}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </>
  );
}
