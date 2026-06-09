import { useEffect, useState } from 'react';
import {
  getBranchSummary,
  getGlobalBranchReport,
  getPaymentMethods,
  getTopProducts
} from '../services/reportService';
import {
  AuthUser,
  BranchSalesReport,
  BranchSummaryReport,
  PaymentMethodReport,
  TopProductReport
} from '../types/api.types';

type ReportsPageProps = {
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

export default function ReportsPage({ token, user }: ReportsPageProps) {
  const [selectedBranch, setSelectedBranch] = useState(user.rol === 'admin' ? 'SUC-01' : user.sucursal_id);
  const [globalReport, setGlobalReport] = useState<BranchSalesReport[]>([]);
  const [summary, setSummary] = useState<BranchSummaryReport | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductReport[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user.rol === 'cajero') {
      return;
    }

    let isMounted = true;

    async function loadReports() {
      setIsLoading(true);
      setError(null);

      try {
        const [summaryData, topProductsData, paymentMethodsData, globalData] = await Promise.all([
          getBranchSummary(token, selectedBranch),
          getTopProducts(token, selectedBranch),
          getPaymentMethods(token, selectedBranch),
          user.rol === 'admin' ? getGlobalBranchReport(token) : Promise.resolve([])
        ]);

        if (isMounted) {
          setSummary(summaryData);
          setTopProducts(topProductsData);
          setPaymentMethods(paymentMethodsData);
          setGlobalReport(globalData);
        }
      } catch (requestError: unknown) {
        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar reportes');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      isMounted = false;
    };
  }, [selectedBranch, token, user.rol]);

  if (user.rol === 'cajero') {
    return (
      <article className="placeholder-panel permission-panel">
        <h2>No tiene permisos para consultar reportes</h2>
        <p>Los reportes administrativos están disponibles para admin y gerente.</p>
      </article>
    );
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h2>Reportes</h2>
          <p>Indicadores comerciales reales</p>
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
      {isLoading ? <div className="loading-state">Cargando reportes...</div> : null}

      <section className="summary-grid">
        <article className="metric-card">
          <span className="metric-label">Ventas</span>
          <strong className="metric-value">{summary?.total_ventas ?? 0}</strong>
          <span className="metric-trend">{selectedBranch}</span>
        </article>
        <article className="metric-card">
          <span className="metric-label">Ingresos</span>
          <strong className="metric-value">{formatMoney(summary?.total_ingresos ?? 0)}</strong>
          <span className="metric-trend">Total</span>
        </article>
        <article className="metric-card">
          <span className="metric-label">Ticket promedio</span>
          <strong className="metric-value">{formatMoney(summary?.ticket_promedio ?? 0)}</strong>
          <span className="metric-trend">Por venta</span>
        </article>
        <article className="metric-card">
          <span className="metric-label">IVA</span>
          <strong className="metric-value">{formatMoney(summary?.iva ?? 0)}</strong>
          <span className="metric-trend">Acumulado</span>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="table-card">
          <div className="table-header">
            <h3>Productos más vendidos</h3>
            <span className="table-muted">Top 10</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Nombre</th>
                <th>Cantidad</th>
                <th>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product) => (
                <tr key={product.producto_id}>
                  <td>{product.producto_id}</td>
                  <td>{product.nombre}</td>
                  <td>{product.cantidad_vendida}</td>
                  <td>{formatMoney(product.total_ingresos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="table-card">
          <div className="table-header">
            <h3>Métodos de pago</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Método</th>
                <th>Ventas</th>
                <th>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {paymentMethods.map((method) => (
                <tr key={method.metodo_pago}>
                  <td>{method.metodo_pago}</td>
                  <td>{method.total_ventas}</td>
                  <td>{formatMoney(method.total_ingresos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>

      {user.rol === 'admin' ? (
        <article className="table-card report-section">
          <div className="table-header">
            <h3>Reporte global por sucursal</h3>
            <span className="table-muted">{globalReport.length} sucursales</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Sucursal</th>
                <th>Ventas</th>
                <th>Subtotal</th>
                <th>IVA</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {globalReport.map((branch) => (
                <tr key={branch.sucursal_id}>
                  <td>{branch.sucursal_id}</td>
                  <td>{branch.total_ventas}</td>
                  <td>{formatMoney(branch.subtotal)}</td>
                  <td>{formatMoney(branch.iva)}</td>
                  <td>{formatMoney(branch.total_ingresos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      ) : null}
    </>
  );
}
