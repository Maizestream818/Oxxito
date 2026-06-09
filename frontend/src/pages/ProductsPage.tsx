const products = [
  ['PROD-001', 'Bebidas Coca-Cola 001', 'Bebidas', '$11.75', 'Activo'],
  ['PROD-002', 'Botanas Pepsi 002', 'Botanas', '$13.50', 'Activo'],
  ['PROD-003', 'Lácteos Bimbo 003', 'Lácteos', '$15.25', 'Activo'],
  ['PROD-004', 'Panadería Sabritas 004', 'Panadería', '$17.00', 'Activo']
];

export default function ProductsPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <h2>Productos</h2>
          <p>Catálogo global</p>
        </div>
        <button className="primary-button" type="button">
          Nuevo producto
        </button>
      </div>

      <article className="table-card">
        <div className="table-header">
          <input className="search-input" placeholder="Buscar producto" type="search" />
          <button className="secondary-button" type="button">
            Filtrar
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {products.map(([id, name, category, price, status]) => (
              <tr key={id}>
                <td>{id}</td>
                <td>{name}</td>
                <td>{category}</td>
                <td>{price}</td>
                <td>
                  <span className="status-pill">{status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </>
  );
}
