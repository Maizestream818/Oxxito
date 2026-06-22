import { elasticClient } from '../config/elasticClient.js';
import { AuthenticatedUser } from '../types/auth.types.js';
import { InventoryItem } from '../types/inventory.types.js';
import { Product } from '../types/product.types.js';
import { CreateSaleRequestBody, Sale, SaleListQuery, SaleProduct } from '../types/sale.types.js';

const IVA_RATE = 0.16;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const VALID_PAYMENT_METHODS = ['efectivo', 'tarjeta', 'transferencia', 'vales'] as const;

type PaymentMethod = (typeof VALID_PAYMENT_METHODS)[number];
type SaleServiceErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'WRITE_ERROR';

type InventoryDocument = {
  id: string;
  item: InventoryItem;
};

type SucursalDocument = {
  sucursal_id: string;
  nombre: string;
};

type PreparedSaleProduct = {
  product: Product;
  inventoryDocument: InventoryDocument;
  cantidad: number;
};

type DiscountedSaleProduct = PreparedSaleProduct & {
  item: InventoryItem;
  stock_anterior: number;
  stock_nuevo: number;
};

type ValidatedSaleProduct = {
  producto_id: string;
  cantidad: number;
};

type SaleMovement = {
  movimiento_id: string;
  sucursal_id: string;
  producto_id: string;
  tipo: 'VENTA';
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  motivo: string;
  venta_id: string;
  fecha: string;
};

type SaleListResult = {
  items: Sale[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

export class SaleServiceError extends Error {
  constructor(
    public readonly code: SaleServiceErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'SaleServiceError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNotFoundError(error: unknown): boolean {
  if (!isRecord(error) || !isRecord(error.meta)) {
    return false;
  }

  return error.meta.statusCode === 404;
}

function getErrorText(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  try {
    return JSON.stringify(error);
  } catch (_jsonError: unknown) {
    return '';
  }
}

function isInsufficientStockError(error: unknown): boolean {
  return getErrorText(error).includes('STOCK_INSUFICIENTE');
}

function ensureNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new SaleServiceError('VALIDATION_ERROR', `${fieldName} es requerido`);
  }

  return value.trim();
}

function ensurePositiveInteger(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new SaleServiceError('VALIDATION_ERROR', `${fieldName} debe ser un entero mayor que 0`);
  }

  return value;
}

function ensurePaymentMethod(value: unknown): PaymentMethod {
  const metodoPago = ensureNonEmptyString(value, 'metodo_pago');

  if (!VALID_PAYMENT_METHODS.includes(metodoPago as PaymentMethod)) {
    throw new SaleServiceError('VALIDATION_ERROR', 'metodo_pago debe ser efectivo, tarjeta, transferencia o vales');
  }

  return metodoPago as PaymentMethod;
}

function parseInteger(value: string | undefined, defaultValue: number, fieldName: string): number {
  if (value === undefined || value.trim() === '') {
    return defaultValue;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    throw new SaleServiceError('VALIDATION_ERROR', `${fieldName} debe ser un numero entero`);
  }

  return parsed;
}

function normalizePagination(query: SaleListQuery): { page: number; limit: number } {
  const requestedPage = parseInteger(query.page, DEFAULT_PAGE, 'page');
  const requestedLimit = parseInteger(query.limit, DEFAULT_LIMIT, 'limit');

  return {
    page: Math.max(1, requestedPage),
    limit: Math.min(MAX_LIMIT, Math.max(1, requestedLimit))
  };
}

function ensureOptionalDate(value: string | undefined, fieldName: string): string | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }

  const normalizedValue = value.trim();

  if (Number.isNaN(Date.parse(normalizedValue))) {
    throw new SaleServiceError('VALIDATION_ERROR', `${fieldName} debe ser una fecha valida`);
  }

  return normalizedValue;
}

function getTotalHits(total: unknown): number {
  if (typeof total === 'number') {
    return total;
  }

  if (isRecord(total) && typeof total.value === 'number') {
    return total.value;
  }

  return 0;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function padNumber(value: number, length: number): string {
  return String(value).padStart(length, '0');
}

function getSucursalNumber(sucursalId: string): string {
  const normalizedSucursalId = ensureNonEmptyString(sucursalId, 'sucursalId');
  const match = /^SUC-(0[1-9]|10)$/.exec(normalizedSucursalId);

  if (!match) {
    throw new SaleServiceError('VALIDATION_ERROR', 'sucursalId debe tener formato SUC-01 a SUC-10');
  }

  return match[1];
}

function getExpectedInventoryId(sucursalId: string, productoId: string): string {
  return `INV-${sucursalId}-${productoId}`;
}

function normalizeSaleProducts(data: CreateSaleRequestBody): ValidatedSaleProduct[] {
  if (!Array.isArray(data.productos) || data.productos.length === 0) {
    throw new SaleServiceError('VALIDATION_ERROR', 'productos debe ser un arreglo no vacio');
  }

  const productsById = new Map<string, number>();

  for (const product of data.productos) {
    const productoId = ensureNonEmptyString(product.producto_id, 'producto_id');
    const cantidad = ensurePositiveInteger(product.cantidad, 'cantidad');
    const currentQuantity = productsById.get(productoId) ?? 0;

    productsById.set(productoId, currentQuantity + cantidad);
  }

  return [...productsById.entries()].map(([productoId, cantidad]) => ({
    producto_id: productoId,
    cantidad
  }));
}

async function getSucursalNombre(sucursalId: string): Promise<string> {
  try {
    const response = await elasticClient.get<SucursalDocument>({
      index: 'sucursales',
      id: sucursalId
    });

    return response._source?.nombre ?? sucursalId;
  } catch (error: unknown) {
    if (isNotFoundError(error)) {
      return sucursalId;
    }

    throw error;
  }
}

async function findSaleById(sucursalId: string, ventaId: string): Promise<Sale | null> {
  const index = getSalesIndexBySucursalId(sucursalId);
  const normalizedVentaId = ensureNonEmptyString(ventaId, 'ventaId');

  try {
    const response = await elasticClient.get<Sale>({
      index,
      id: normalizedVentaId
    });

    if (response._source) {
      return response._source;
    }
  } catch (error: unknown) {
    if (!isNotFoundError(error)) {
      throw error;
    }
  }

  const response = await elasticClient.search<Sale>({
    index,
    size: 1,
    query: {
      term: {
        venta_id: normalizedVentaId
      }
    }
  });

  return response.hits.hits[0]?._source ?? null;
}

async function findProductById(productoId: string): Promise<Product | null> {
  const normalizedProductoId = ensureNonEmptyString(productoId, 'producto_id');

  try {
    const response = await elasticClient.get<Product>({
      index: 'productos',
      id: normalizedProductoId
    });

    if (response._source) {
      return response._source;
    }
  } catch (error: unknown) {
    if (!isNotFoundError(error)) {
      throw error;
    }
  }

  const response = await elasticClient.search<Product>({
    index: 'productos',
    size: 1,
    query: {
      term: {
        producto_id: normalizedProductoId
      }
    }
  });

  return response.hits.hits[0]?._source ?? null;
}

async function findInventoryDocument(sucursalId: string, productoId: string): Promise<InventoryDocument | null> {
  const index = getInventoryIndexBySucursalId(sucursalId);
  const expectedId = getExpectedInventoryId(sucursalId, productoId);

  try {
    const response = await elasticClient.get<InventoryItem>({
      index,
      id: expectedId
    });

    if (response._source) {
      return {
        id: response._id ?? expectedId,
        item: response._source
      };
    }
  } catch (error: unknown) {
    if (!isNotFoundError(error)) {
      throw error;
    }
  }

  const response = await elasticClient.search<InventoryItem>({
    index,
    size: 1,
    query: {
      term: {
        producto_id: productoId
      }
    }
  });
  const hit = response.hits.hits[0];

  if (!hit?._source) {
    return null;
  }

  return {
    id: hit._id ?? expectedId,
    item: hit._source
  };
}

async function discountInventoryStock(
  inventoryIndex: string,
  inventoryDocument: InventoryDocument,
  cantidad: number
): Promise<InventoryItem> {
  try {
    const response = await elasticClient.update<InventoryItem, Partial<InventoryItem>, InventoryItem>({
      index: inventoryIndex,
      id: inventoryDocument.id,
      retry_on_conflict: 3,
      refresh: true,
      _source: true,
      script: {
        lang: 'painless',
        source: `
          if (ctx._source.stock == null || ctx._source.stock < params.cantidad) {
            throw new IllegalArgumentException('STOCK_INSUFICIENTE');
          }
          ctx._source.stock = ctx._source.stock - params.cantidad;
          if (ctx._source.stock < 0) {
            throw new IllegalArgumentException('STOCK_INSUFICIENTE');
          }
          ctx._source.updated_at = params.updated_at;
        `,
        params: {
          cantidad,
          updated_at: new Date().toISOString()
        }
      }
    });
    const updatedItem = response.get?._source;

    if (!updatedItem) {
      throw new SaleServiceError('WRITE_ERROR', `No se pudo confirmar descuento para ${inventoryDocument.item.producto_id}`);
    }

    return updatedItem;
  } catch (error: unknown) {
    if (isInsufficientStockError(error)) {
      throw new SaleServiceError('VALIDATION_ERROR', `Stock insuficiente para ${inventoryDocument.item.producto_id}`);
    }

    if (isNotFoundError(error)) {
      throw new SaleServiceError('NOT_FOUND', `Inventario no encontrado para ${inventoryDocument.item.producto_id}`);
    }

    throw error;
  }
}

async function restoreInventoryStock(
  inventoryIndex: string,
  discountedProduct: DiscountedSaleProduct
): Promise<void> {
  await elasticClient.update({
    index: inventoryIndex,
    id: discountedProduct.inventoryDocument.id,
    retry_on_conflict: 3,
    refresh: true,
    script: {
      lang: 'painless',
      source: `
        ctx._source.stock = (ctx._source.stock == null ? 0 : ctx._source.stock) + params.cantidad;
        ctx._source.updated_at = params.updated_at;
      `,
      params: {
        cantidad: discountedProduct.cantidad,
        updated_at: new Date().toISOString()
      }
    }
  });
}

async function restoreDiscountedInventory(
  inventoryIndex: string,
  discountedProducts: DiscountedSaleProduct[]
): Promise<string[]> {
  const errors: string[] = [];

  for (const discountedProduct of discountedProducts) {
    try {
      await restoreInventoryStock(inventoryIndex, discountedProduct);
    } catch (error: unknown) {
      errors.push(`${discountedProduct.item.producto_id}: ${getErrorText(error)}`);
    }
  }

  return errors;
}

export function getSalesIndexBySucursalId(sucursalId: string): string {
  return `ventas_sucursal_${getSucursalNumber(sucursalId)}`;
}

export function getInventoryIndexBySucursalId(sucursalId: string): string {
  return `inventario_sucursal_${getSucursalNumber(sucursalId)}`;
}

export function getInventoryMovementsIndexBySucursalId(sucursalId: string): string {
  return `movimientos_inventario_sucursal_${getSucursalNumber(sucursalId)}`;
}

/**
 * Lista ventas de una sucursal con filtros sobre los campos reales del indice.
 */
export async function listSalesBySucursal(sucursalId: string, query: SaleListQuery): Promise<SaleListResult> {
  const index = getSalesIndexBySucursalId(sucursalId);
  const { page, limit } = normalizePagination(query);
  const filter: Record<string, unknown>[] = [];
  const fechaInicio = ensureOptionalDate(query.fecha_inicio, 'fecha_inicio');
  const fechaFin = ensureOptionalDate(query.fecha_fin, 'fecha_fin');

  if (fechaInicio || fechaFin) {
    filter.push({
      range: {
        fecha: {
          ...(fechaInicio ? { gte: fechaInicio } : {}),
          ...(fechaFin ? { lte: fechaFin } : {})
        }
      }
    });
  }

  if (query.metodo_pago?.trim()) {
    filter.push({
      term: {
        metodo_pago: query.metodo_pago.trim()
      }
    });
  }

  if (query.cajero_id?.trim()) {
    filter.push({
      term: {
        cajero_id: query.cajero_id.trim()
      }
    });
  }

  if (query.cliente_id?.trim()) {
    filter.push({
      term: {
        cliente_id: query.cliente_id.trim()
      }
    });
  }

  const response = await elasticClient.search<Sale>({
    index,
    from: (page - 1) * limit,
    size: limit,
    query:
      filter.length > 0
        ? {
            bool: {
              filter
            }
          }
        : {
            match_all: {}
          },
    sort: [{ fecha: { order: 'desc' } }]
  });

  return {
    items: response.hits.hits.flatMap((hit) => (hit._source ? [hit._source] : [])),
    pagination: {
      page,
      limit,
      total: getTotalHits(response.hits.total)
    }
  };
}

export async function getSaleById(sucursalId: string, ventaId: string): Promise<Sale> {
  const sale = await findSaleById(sucursalId, ventaId);

  if (!sale) {
    throw new SaleServiceError('NOT_FOUND', 'Venta no encontrada');
  }

  return sale;
}

/**
 * Registra una venta, descuenta inventario y crea movimientos de salida por venta.
 */
export async function createSale(
  sucursalId: string,
  user: AuthenticatedUser,
  data: CreateSaleRequestBody
): Promise<Sale> {
  const normalizedSucursalId = ensureNonEmptyString(sucursalId, 'sucursalId');
  const metodoPago = ensurePaymentMethod(data.metodo_pago);
  const clienteId = data.cliente_id?.trim() || undefined;
  const saleProductsRequest = normalizeSaleProducts(data);
  const salesIndex = getSalesIndexBySucursalId(normalizedSucursalId);
  const inventoryIndex = getInventoryIndexBySucursalId(normalizedSucursalId);
  const movementsIndex = getInventoryMovementsIndexBySucursalId(normalizedSucursalId);
  const preparedProducts: PreparedSaleProduct[] = [];

  for (const product of saleProductsRequest) {
    const catalogProduct = await findProductById(product.producto_id);

    if (!catalogProduct) {
      throw new SaleServiceError('NOT_FOUND', `Producto no encontrado: ${product.producto_id}`);
    }

    if (!catalogProduct.activo) {
      throw new SaleServiceError('VALIDATION_ERROR', `Producto inactivo: ${product.producto_id}`);
    }

    const inventoryDocument = await findInventoryDocument(normalizedSucursalId, product.producto_id);

    if (!inventoryDocument) {
      throw new SaleServiceError('NOT_FOUND', `Inventario no encontrado para ${product.producto_id}`);
    }

    // Prevalidacion para errores obvios; el update script de Elasticsearch es la autoridad final.
    if (inventoryDocument.item.stock < product.cantidad) {
      throw new SaleServiceError('VALIDATION_ERROR', `Stock insuficiente para ${product.producto_id}`);
    }

    preparedProducts.push({
      product: catalogProduct,
      inventoryDocument,
      cantidad: product.cantidad
    });
  }

  const discountedProducts: DiscountedSaleProduct[] = [];

  try {
    for (const preparedProduct of preparedProducts) {
      const updatedItem = await discountInventoryStock(
        inventoryIndex,
        preparedProduct.inventoryDocument,
        preparedProduct.cantidad
      );

      discountedProducts.push({
        ...preparedProduct,
        item: updatedItem,
        stock_anterior: updatedItem.stock + preparedProduct.cantidad,
        stock_nuevo: updatedItem.stock
      });
    }
  } catch (error: unknown) {
    const rollbackErrors = await restoreDiscountedInventory(inventoryIndex, discountedProducts);

    if (rollbackErrors.length > 0) {
      throw new SaleServiceError('WRITE_ERROR', 'Venta no completada y no se pudo revertir todo el descuento de inventario');
    }

    if (error instanceof SaleServiceError) {
      throw error;
    }

    throw new SaleServiceError('WRITE_ERROR', 'Venta no completada por error al descontar inventario');
  }

  const now = new Date().toISOString();
  const ventaId = `VENTA-${normalizedSucursalId}-${Date.now()}`;
  const productos: SaleProduct[] = discountedProducts.map((discountedProduct) => {
    const subtotal = roundMoney(discountedProduct.cantidad * discountedProduct.item.precio);

    return {
      producto_id: discountedProduct.item.producto_id,
      nombre: discountedProduct.product.nombre,
      categoria: discountedProduct.product.categoria,
      cantidad: discountedProduct.cantidad,
      precio_unitario: discountedProduct.item.precio,
      subtotal
    };
  });
  const subtotal = roundMoney(productos.reduce((total, product) => total + product.subtotal, 0));
  const iva = roundMoney(subtotal * IVA_RATE);
  const total = roundMoney(subtotal + iva);
  const sale: Sale = {
    venta_id: ventaId,
    sucursal_id: normalizedSucursalId,
    sucursal_nombre: await getSucursalNombre(normalizedSucursalId),
    cajero_id: user.usuario_id,
    cajero_nombre: user.nombre || user.username,
    cliente_id: clienteId,
    fecha: now,
    metodo_pago: metodoPago,
    subtotal,
    iva,
    total,
    productos
  };

  try {
    await elasticClient.index({
      index: salesIndex,
      id: ventaId,
      document: sale,
      refresh: true
    });

    for (const [index, discountedProduct] of discountedProducts.entries()) {
      const movement: SaleMovement = {
        movimiento_id: `MOV-${ventaId}-${padNumber(index + 1, 3)}`,
        sucursal_id: normalizedSucursalId,
        producto_id: discountedProduct.item.producto_id,
        tipo: 'VENTA',
        cantidad: discountedProduct.cantidad,
        stock_anterior: discountedProduct.stock_anterior,
        stock_nuevo: discountedProduct.stock_nuevo,
        motivo: `Venta registrada ${ventaId}`,
        venta_id: ventaId,
        fecha: now
      };

      await elasticClient.index({
        index: movementsIndex,
        id: movement.movimiento_id,
        document: movement,
        refresh: true
      });
    }
  } catch (_error: unknown) {
    // Elasticsearch no ofrece transacciones ACID multi-documento; se protege el stock por documento
    // con update script atomico y se devuelve un error controlado si falla una escritura posterior.
    throw new SaleServiceError('WRITE_ERROR', 'Inventario descontado, pero no se pudo completar el registro de venta');
  }

  return sale;
}
