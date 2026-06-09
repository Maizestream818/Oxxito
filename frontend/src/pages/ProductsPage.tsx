import { useEffect, useState } from 'react';
import { getProducts } from '../services/productService';
import { Product } from '../types/api.types';

type ProductsPageProps = {
  token: string;
};

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(value);
}

export default function ProductsPage({ token }: ProductsPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      setError(null);

      try {
        const nextProducts = await getProducts(token, 20);

        if (isMounted) {
          setProducts(nextProducts);
        }
      } catch (requestError: unknown) {
        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar productos');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <>
      <div className="page-heading">
        <div>
          <h2>Productos</h2>
          <p>Catálogo global desde Elasticsearch</p>
        </div>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <article className="table-card">
        <div className="table-header">
          <h3>Productos cargados</h3>
          <span className="table-muted">{isLoading ? 'Cargando...' : `${products.length} registros`}</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Marca</th>
              <th>Precio</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.producto_id}>
                <td>{product.producto_id}</td>
                <td>{product.nombre}</td>
                <td>{product.categoria}</td>
                <td>{product.marca}</td>
                <td>{formatMoney(product.precio)}</td>
                <td>
                  <span className={`status-pill${product.activo ? '' : ' muted'}`}>
                    {product.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </>
  );
}
