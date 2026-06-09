import { elasticClient } from '../config/elasticClient.js';
import { AuthenticatedUser } from '../types/auth.types.js';
import { InventoryItem } from '../types/inventory.types.js';
import { CreateSaleRequestBody, Sale, SaleProduct } from '../types/sale.types.js';

const IVA_RATE = 0.16;

type SaleServiceErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND';

type InventoryDocument = {
  id: string;
  item: InventoryItem;
};

type SucursalDocument = {
  sucursal_id: string;
  nombre: string;
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
 * Registra una venta, descuenta inventario y crea movimientos de salida por venta.
 */
export async function createSale(
  sucursalId: string,
  user: AuthenticatedUser,
  data: CreateSaleRequestBody
): Promise<Sale> {
  const normalizedSucursalId = ensureNonEmptyString(sucursalId, 'sucursalId');
  const metodoPago = ensureNonEmptyString(data.metodo_pago, 'metodo_pago');
  const clienteId = data.cliente_id?.trim() || undefined;
  const saleProductsRequest = normalizeSaleProducts(data);
  const salesIndex = getSalesIndexBySucursalId(normalizedSucursalId);
  const inventoryIndex = getInventoryIndexBySucursalId(normalizedSucursalId);
  const movementsIndex = getInventoryMovementsIndexBySucursalId(normalizedSucursalId);
  const inventoryDocuments: Array<InventoryDocument & { cantidad: number }> = [];

  for (const product of saleProductsRequest) {
    const inventoryDocument = await findInventoryDocument(normalizedSucursalId, product.producto_id);

    if (!inventoryDocument) {
      throw new SaleServiceError('NOT_FOUND', `Inventario no encontrado para ${product.producto_id}`);
    }

    if (inventoryDocument.item.stock < product.cantidad) {
      throw new SaleServiceError('VALIDATION_ERROR', `Stock insuficiente para ${product.producto_id}`);
    }

    inventoryDocuments.push({
      ...inventoryDocument,
      cantidad: product.cantidad
    });
  }

  const now = new Date().toISOString();
  const ventaId = `VENTA-${normalizedSucursalId}-${Date.now()}`;
  const productos: SaleProduct[] = inventoryDocuments.map((inventoryDocument) => {
    const subtotal = roundMoney(inventoryDocument.cantidad * inventoryDocument.item.precio);

    return {
      producto_id: inventoryDocument.item.producto_id,
      nombre: inventoryDocument.item.producto_nombre,
      categoria: inventoryDocument.item.categoria,
      cantidad: inventoryDocument.cantidad,
      precio_unitario: inventoryDocument.item.precio,
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

  await elasticClient.index({
    index: salesIndex,
    id: ventaId,
    document: sale,
    refresh: true
  });

  for (const [index, inventoryDocument] of inventoryDocuments.entries()) {
    const stockAnterior = inventoryDocument.item.stock;
    const stockNuevo = stockAnterior - inventoryDocument.cantidad;
    const updatedAt = new Date().toISOString();
    const movement: SaleMovement = {
      movimiento_id: `MOV-${ventaId}-${padNumber(index + 1, 3)}`,
      sucursal_id: normalizedSucursalId,
      producto_id: inventoryDocument.item.producto_id,
      tipo: 'VENTA',
      cantidad: inventoryDocument.cantidad,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      motivo: `Venta registrada ${ventaId}`,
      venta_id: ventaId,
      fecha: now
    };

    await elasticClient.update({
      index: inventoryIndex,
      id: inventoryDocument.id,
      doc: {
        stock: stockNuevo,
        updated_at: updatedAt
      },
      refresh: true
    });

    await elasticClient.index({
      index: movementsIndex,
      id: movement.movimiento_id,
      document: movement,
      refresh: true
    });
  }

  return sale;
}
