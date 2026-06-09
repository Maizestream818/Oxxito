import { useEffect, useState } from 'react';
import { getInventory } from '../services/inventoryService';
import { getProducts } from '../services/productService';
import { getBranchSummary } from '../services/reportService';
import { getSales } from '../services/saleService';
import { AuthUser, BranchSummaryReport, InventoryItem, Product, Sale } from '../types/api.types';

type DashboardPageProps = {
  token: string;
  user: AuthUser;
};

type DashboardState = {
  products: Product[];
  inventory: InventoryItem[];
  sales: Sale[];
  summary: BranchSummaryReport | null;
};

const emptyState: DashboardState = {
  products: [],
  inventory: [],
  sales: [],
  summary: null
};

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(value);
}

function getOperationalSucursal(user: AuthUser): string {
  return user.rol === 'admin' ? 'SUC-01' : user.sucursal_id;
}

export default function DashboardPage({ token, user }: DashboardPageProps) {
  const [data, setData] = useState<DashboardState>(emptyState);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sucursalId = getOperationalSucursal(user);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError(null);

      try {
        const [products, inventory, sales, summary] = await Promise.all([
          getProducts(token, 100),
          getInventory(token, sucursalId, 100),
          getSales(token, sucursalId, 20),
          user.rol === 'cajero' ? Promise.resolve(null) : getBranchSummary(token, sucursalId)
        ]);

        if (isMounted) {
          setData({ products, inventory, sales, summary });
        }
      } catch (requestError: unknown) {
        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : 'No se pudo cargar el dashboard');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [sucursalId, token, user.rol]);

  const visibleSales = data.sales.slice(0, 5);
  const totalVentas = data.summary?.total_ventas ?? data.sales.length;
  const totalIngresos =
    data.summary?.total_ingresos ?? data.sales.reduce((total, sale) => total + sale.total, 0);

  const metrics = [
    {
      label: 'Total ventas',
      value: String(totalVentas),
      trend: sucursalId
    },
    {
      label: 'Total ingresos',
      value: formatMoney(totalIngresos),
      trend: 'Sucursal actual'
    },
    {
      label: 'Productos cargados',
      value: String(data.products.filter((product) => product.activo).length),
      trend: 'Activos'
    },
    {
      label: 'Registros de inventario',
      value: String(data.inventory.length),
      trend: 'Vista limitada'
    }
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <h2>Resumen operativo</h2>
          <p>Datos reales de {sucursalId}</p>
        </div>
        <button className="secondary-button" type="button">
          Hoy
        </button>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {isLoading ? <div className="loading-state">Cargando dashboard...</div> : null}

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
            <h3>Ventas recientes</h3>
            <span className="table-muted">{visibleSales.length} registros</span>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Venta</th>
                <th>Cajero</th>
                <th>Método</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {visibleSales.map((sale) => (
                <tr key={sale.venta_id}>
                  <td>{sale.venta_id}</td>
                  <td>{sale.cajero_nombre}</td>
                  <td>{sale.metodo_pago}</td>
                  <td>{formatMoney(sale.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="placeholder-panel">
          <div className="placeholder-header">
            <h3>Inventario observado</h3>
            <span className="table-muted">{data.inventory.length} productos</span>
          </div>
          <ul className="placeholder-list">
            {data.inventory.slice(0, 5).map((item) => (
              <li key={item.inventario_id}>
                <span>{item.producto_nombre}</span>
                <strong>{item.stock}</strong>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </>
  );
}
