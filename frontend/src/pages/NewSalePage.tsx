export default function NewSalePage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <h2>Nueva venta</h2>
          <p>Registro de operación en caja</p>
        </div>
        <button className="primary-button" type="button">
          Registrar venta
        </button>
      </div>

      <section className="placeholder-grid">
        <article className="placeholder-panel">
          <div className="placeholder-header">
            <h3>Datos de venta</h3>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Sucursal</span>
              <select>
                <option>SUC-01</option>
                <option>SUC-02</option>
                <option>SUC-03</option>
              </select>
            </label>
            <label className="field">
              <span>Método de pago</span>
              <select>
                <option>Efectivo</option>
                <option>Tarjeta</option>
                <option>Transferencia</option>
              </select>
            </label>
          </div>
        </article>

        <article className="placeholder-panel">
          <div className="placeholder-header">
            <h3>Productos</h3>
            <button className="secondary-button" type="button">
              Agregar
            </button>
          </div>
          <ul className="placeholder-list">
            <li>
              <span>PROD-002</span>
              <strong>$13.50</strong>
            </li>
            <li>
              <span>PROD-018</span>
              <strong>$41.50</strong>
            </li>
          </ul>
          <div className="sale-total">
            <span>Total</span>
            <strong>$55.00</strong>
          </div>
        </article>
      </section>
    </>
  );
}
