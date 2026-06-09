import { useEffect, useState } from 'react';
import { getProducts } from '../services/productService';
import { createSale } from '../services/saleService';
import { AuthUser, Product, Sale } from '../types/api.types';

type NewSalePageProps = {
  token: string;
  user: AuthUser;
};

type CartItem = {
  producto_id: string;
  nombre: string;
  cantidad: number;
};

const branchOptions = Array.from({ length: 10 }, (_, index) => `SUC-${String(index + 1).padStart(2, '0')}`);

export default function NewSalePage({ token, user }: NewSalePageProps) {
  const [selectedBranch, setSelectedBranch] = useState(user.rol === 'admin' ? 'SUC-01' : user.sucursal_id);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [createdSale, setCreatedSale] = useState<Sale | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoadingProducts(true);
      setError(null);

      try {
        const nextProducts = await getProducts(token, 100);

        if (isMounted) {
          setProducts(nextProducts);
          setSelectedProductId(nextProducts[0]?.producto_id ?? '');
        }
      } catch (requestError: unknown) {
        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar productos');
        }
      } finally {
        if (isMounted) {
          setIsLoadingProducts(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [token]);

  function handleAddProduct() {
    setError(null);
    setSuccess(null);

    const parsedQuantity = Number(quantity);
    const product = products.find((item) => item.producto_id === selectedProductId);

    if (!product) {
      setError('Selecciona un producto valido');
      return;
    }

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setError('La cantidad debe ser un entero mayor que 0');
      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.producto_id === product.producto_id);

      if (existingItem) {
        return currentCart.map((item) =>
          item.producto_id === product.producto_id
            ? { ...item, cantidad: item.cantidad + parsedQuantity }
            : item
        );
      }

      return [
        ...currentCart,
        {
          producto_id: product.producto_id,
          nombre: product.nombre,
          cantidad: parsedQuantity
        }
      ];
    });
    setQuantity('1');
  }

  async function handleCreateSale() {
    setError(null);
    setSuccess(null);
    setCreatedSale(null);

    if (cart.length === 0) {
      setError('Agrega al menos un producto');
      return;
    }

    setIsSubmitting(true);

    try {
      const sale = await createSale(token, selectedBranch, {
        metodo_pago: paymentMethod,
        productos: cart.map((item) => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad
        }))
      });

      setCreatedSale(sale);
      setSuccess(`Venta registrada correctamente: ${sale.venta_id}`);
      setCart([]);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo registrar la venta');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h2>Nueva venta</h2>
          <p>Registro real de operación en caja</p>
        </div>
        <button className="primary-button" disabled={isSubmitting} onClick={handleCreateSale} type="button">
          {isSubmitting ? 'Registrando...' : 'Registrar venta'}
        </button>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <section className="placeholder-grid">
        <article className="placeholder-panel">
          <div className="placeholder-header">
            <h3>Datos de venta</h3>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Sucursal</span>
              {user.rol === 'admin' ? (
                <select
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
                <input readOnly value={selectedBranch} />
              )}
            </label>
            <label className="field">
              <span>Método de pago</span>
              <select
                onChange={(event: { target: { value: string } }) => setPaymentMethod(event.target.value)}
                value={paymentMethod}
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
                <option value="vales">Vales</option>
              </select>
            </label>
            <label className="field">
              <span>Producto</span>
              <select
                disabled={isLoadingProducts}
                onChange={(event: { target: { value: string } }) => setSelectedProductId(event.target.value)}
                value={selectedProductId}
              >
                {products.map((product) => (
                  <option key={product.producto_id} value={product.producto_id}>
                    {product.producto_id} · {product.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Cantidad</span>
              <input
                min="1"
                onChange={(event: { target: { value: string } }) => setQuantity(event.target.value)}
                type="number"
                value={quantity}
              />
            </label>
          </div>
          <button className="secondary-button form-action" onClick={handleAddProduct} type="button">
            Agregar producto
          </button>
        </article>

        <article className="placeholder-panel">
          <div className="placeholder-header">
            <h3>Productos de la venta</h3>
            <span className="table-muted">{cart.length} líneas</span>
          </div>
          <ul className="placeholder-list">
            {cart.map((item) => (
              <li key={item.producto_id}>
                <span>
                  {item.producto_id} · {item.nombre}
                </span>
                <strong>{item.cantidad}</strong>
              </li>
            ))}
          </ul>
          {cart.length === 0 ? <div className="empty-state">Aún no hay productos agregados.</div> : null}
          {createdSale ? (
            <div className="sale-total">
              <span>Última venta</span>
              <strong>${createdSale.total.toFixed(2)}</strong>
            </div>
          ) : null}
        </article>
      </section>
    </>
  );
}
