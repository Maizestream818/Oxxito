import { useEffect, useState } from 'react';
import { getSales } from '../services/saleService';
import { AuthUser, Sale } from '../types/api.types';

type SalesPageProps = {
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

export default function SalesPage({ token, user }: SalesPageProps) {
  const [selectedBranch, setSelectedBranch] = useState(user.rol === 'admin' ? 'SUC-01' : user.sucursal_id);
  const [sales, setSales] = useState<Sale[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSales() {
      setIsLoading(true);
      setError(null);

      try {
        const nextSales = await getSales(token, selectedBranch, 20);

        if (isMounted) {
          setSales(nextSales);
        }
      } catch (requestError: unknown) {
        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar ventas');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSales();

    return () => {
      isMounted = false;
    };
  }, [selectedBranch, token]);

  return (
    <>
      <div className="page-heading">
        <div>
          <h2>Ventas</h2>
          <p>Historial real por sucursal</p>
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
          <h3>Ventas recientes</h3>
          <span className="table-muted">{isLoading ? 'Cargando...' : `${sales.length} registros`}</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Venta</th>
              <th>Fecha</th>
              <th>Cajero</th>
              <th>Método</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.venta_id}>
                <td>{sale.venta_id}</td>
                <td>{formatDate(sale.fecha)}</td>
                <td>{sale.cajero_nombre}</td>
                <td>{sale.metodo_pago}</td>
                <td>{formatMoney(sale.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </>
  );
}
