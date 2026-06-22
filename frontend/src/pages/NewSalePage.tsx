import { useEffect, useState } from 'react';
import { getInventoryPage } from '../services/inventoryService';
import { createSale } from '../services/saleService';
import { AuthUser, InventoryItem, Sale } from '../types/api.types';

type NewSalePageProps = {
  token: string;
  user: AuthUser;
};

type CartItem = {
  producto_id: string;
  nombre: string;
  cantidad: number;
  stock: number;
  precio: number;
};

const branchOptions = Array.from({ length: 10 }, (_, index) => `SUC-${String(index + 1).padStart(2, '0')}`);

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(value);
}

async function getSellableInventory(token: string, sucursalId: string): Promise<InventoryItem[]> {
  const limit = 100;
  const items: InventoryItem[] = [];
  let page = 1;

  while (true) {
    const response = await getInventoryPage(token, sucursalId, limit, page);

    items.push(...response.items);

    if (items.length >= response.pagination.total || response.items.length === 0) {
      break;
    }

    page += 1;
  }

  return items.filter((item) => item.stock > 0);
}

export default function NewSalePage({ token, user }: NewSalePageProps) {
  const [selectedBranch, setSelectedBranch] = useState(user.rol === 'admin' ? 'SUC-01' : user.sucursal_id);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [createdSale, setCreatedSale] = useState<Sale | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadInventory() {
      setIsLoadingInventory(true);
      setError(null);

      try {
        const nextInventory = await getSellableInventory(token, selectedBranch);

        if (isMounted) {
          setInventoryItems(nextInventory);
          setSelectedProductId(nextInventory[0]?.producto_id ?? '');
        }
      } catch (requestError: unknown) {
        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : 'No se pudo cargar inventario vendible');
        }
      } finally {
        if (isMounted) {
          setIsLoadingInventory(false);
        }
      }
    }

    loadInventory();

    return () => {
      isMounted = false;
    };
  }, [selectedBranch, token]);

  function getCartQuantity(productoId: string): number {
    return cart.find((item) => item.producto_id === productoId)?.cantidad ?? 0;
  }

  function handleAddProduct() {
    setError(null);
    setSuccess(null);

    const parsedQuantity = Number(quantity);
    const inventoryItem = inventoryItems.find((item) => item.producto_id === selectedProductId);

    if (!inventoryItem) {
      setError('Selecciona un producto valido');
      return;
    }

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setError('La cantidad debe ser un entero mayor que 0');
      return;
    }

    const availableStock = inventoryItem.stock - getCartQuantity(inventoryItem.producto_id);

    if (parsedQuantity > availableStock) {
      setError(`La cantidad supera el stock visible disponible (${availableStock})`);
      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.producto_id === inventoryItem.producto_id);

      if (existingItem) {
        return currentCart.map((item) =>
          item.producto_id === inventoryItem.producto_id
            ? { ...item, cantidad: item.cantidad + parsedQuantity }
            : item
        );
      }

      return [
        ...currentCart,
        {
          producto_id: inventoryItem.producto_id,
          nombre: inventoryItem.producto_nombre,
          cantidad: parsedQuantity,
          stock: inventoryItem.stock,
          precio: inventoryItem.precio
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
        <button className="primary-button" disabled={isSubmitting || cart.length === 0} onClick={handleCreateSale} type="button">
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
                  onChange={(event: { target: { value: string } }) => {
                    setSelectedBranch(event.target.value);
                    setCart([]);
                    setCreatedSale(null);
                    setSuccess(null);
                    setQuantity('1');
                  }}
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
                disabled={isLoadingInventory || inventoryItems.length === 0}
                onChange={(event: { target: { value: string } }) => setSelectedProductId(event.target.value)}
                value={selectedProductId}
              >
                {inventoryItems.map((item) => (
                  <option key={item.inventario_id} value={item.producto_id}>
                    {item.producto_id} · {item.producto_nombre} · stock {item.stock} · {formatMoney(item.precio)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Cantidad</span>
              <input
                min="1"
                max={inventoryItems.find((item) => item.producto_id === selectedProductId)?.stock ?? 1}
                onChange={(event: { target: { value: string } }) => setQuantity(event.target.value)}
                type="number"
                value={quantity}
              />
            </label>
          </div>
          <button
            className="secondary-button form-action"
            disabled={isLoadingInventory || inventoryItems.length === 0}
            onClick={handleAddProduct}
            type="button"
          >
            Agregar producto
          </button>
          {inventoryItems.length === 0 && !isLoadingInventory ? (
            <div className="empty-state">No hay inventario con stock disponible para esta sucursal.</div>
          ) : null}
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
                <strong>
                  {item.cantidad} / {item.stock} · {formatMoney(item.precio)}
                </strong>
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
