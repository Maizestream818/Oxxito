import { useEffect, useState } from 'react';
import { getInventory } from '../services/inventoryService';
import { AuthUser, InventoryItem } from '../types/api.types';

type InventoryPageProps = {
  token: string;
  user: AuthUser;
};

const branchOptions = Array.from({ length: 10 }, (_, index) => `SUC-${String(index + 1).padStart(2, '0')}`);

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(value);
}

export default function InventoryPage({ token, user }: InventoryPageProps) {
  const [selectedBranch, setSelectedBranch] = useState(user.rol === 'admin' ? 'SUC-01' : user.sucursal_id);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadInventory() {
      setIsLoading(true);
      setError(null);

      try {
        const inventory = await getInventory(token, selectedBranch, 20);

        if (isMounted) {
          setItems(inventory);
        }
      } catch (requestError: unknown) {
        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : 'No se pudo cargar inventario');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInventory();

    return () => {
      isMounted = false;
    };
  }, [selectedBranch, token]);

  return (
    <>
      <div className="page-heading">
        <div>
          <h2>Inventario</h2>
          <p>Existencias reales por sucursal</p>
        </div>
        {user.rol === 'admin' ? (
          <select
            className="select-control"
            onChange={(event: { target: { value: string } }) => setSelectedBranch(event.target.value)}
            value={selectedBranch}
          >
            {branchOptions.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        ) : (
          <button className="secondary-button" type="button">
            {selectedBranch}
          </button>
        )}
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <article className="table-card">
        <div className="table-header">
          <h3>{selectedBranch}</h3>
          <span className="table-muted">{isLoading ? 'Cargando...' : `${items.length} registros`}</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Mínimo</th>
              <th>Precio</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.inventario_id}>
                <td>{item.producto_id}</td>
                <td>{item.producto_nombre}</td>
                <td>{item.categoria}</td>
                <td>{item.stock}</td>
                <td>{item.stock_minimo}</td>
                <td>{formatMoney(item.precio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </>
  );
}
