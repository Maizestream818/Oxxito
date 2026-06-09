import { elasticClient } from '../config/elasticClient.js';
import { InventoryItem, InventoryListQuery, UpdateInventoryRequestBody } from '../types/inventory.types.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

type InventoryServiceErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND';

type InventoryDocument = {
  id: string;
  item: InventoryItem;
};

type InventoryListResult = {
  items: InventoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

export class InventoryServiceError extends Error {
  constructor(
    public readonly code: InventoryServiceErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'InventoryServiceError';
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
    throw new InventoryServiceError('VALIDATION_ERROR', `${fieldName} es requerido`);
  }

  return value.trim();
}

function ensureNonNegativeNumber(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new InventoryServiceError('VALIDATION_ERROR', `${fieldName} debe ser mayor o igual a 0`);
  }

  return value;
}

function ensureOptionalNonNegativeNumber(value: unknown, fieldName: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  return ensureNonNegativeNumber(value, fieldName);
}

function parseInteger(value: string | undefined, defaultValue: number, fieldName: string): number {
  if (value === undefined || value.trim() === '') {
    return defaultValue;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    throw new InventoryServiceError('VALIDATION_ERROR', `${fieldName} debe ser un numero entero`);
  }

  return parsed;
}

function normalizePagination(query: InventoryListQuery): { page: number; limit: number } {
  const requestedPage = parseInteger(query.page, DEFAULT_PAGE, 'page');
  const requestedLimit = parseInteger(query.limit, DEFAULT_LIMIT, 'limit');

  return {
    page: Math.max(1, requestedPage),
    limit: Math.min(MAX_LIMIT, Math.max(1, requestedLimit))
  };
}

function parseStockBajo(value: string | undefined): boolean {
  if (value === undefined || value.trim() === '' || value === 'false') {
    return false;
  }

  if (value === 'true') {
    return true;
  }

  throw new InventoryServiceError('VALIDATION_ERROR', 'stock_bajo debe ser true o false');
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

function getExpectedInventoryId(sucursalId: string, productoId: string): string {
  return `INV-${sucursalId}-${productoId}`;
}

function validateUpdateData(data: UpdateInventoryRequestBody): UpdateInventoryRequestBody {
  const rawData = data as Record<string, unknown>;

  if (rawData.sucursal_id !== undefined || rawData.producto_id !== undefined || rawData.inventario_id !== undefined) {
    throw new InventoryServiceError('VALIDATION_ERROR', 'No se permite cambiar identificadores del inventario');
  }

  return {
    stock: ensureOptionalNonNegativeNumber(data.stock, 'stock'),
    stock_minimo: ensureOptionalNonNegativeNumber(data.stock_minimo, 'stock_minimo')
  };
}

function removeUndefinedFields(data: UpdateInventoryRequestBody): UpdateInventoryRequestBody {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

async function findInventoryDocument(sucursalId: string, productoId: string): Promise<InventoryDocument | null> {
  const normalizedSucursalId = ensureNonEmptyString(sucursalId, 'sucursalId');
  const normalizedProductoId = ensureNonEmptyString(productoId, 'productoId');
  const index = getInventoryIndexBySucursalId(normalizedSucursalId);
  const expectedId = getExpectedInventoryId(normalizedSucursalId, normalizedProductoId);

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
        producto_id: normalizedProductoId
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

/**
 * Convierte el identificador SUC-XX al indice fragmentado de inventario correspondiente.
 */
export function getInventoryIndexBySucursalId(sucursalId: string): string {
  const normalizedSucursalId = ensureNonEmptyString(sucursalId, 'sucursalId');
  const match = /^SUC-(0[1-9]|10)$/.exec(normalizedSucursalId);

  if (!match) {
    throw new InventoryServiceError('VALIDATION_ERROR', 'sucursalId debe tener formato SUC-01 a SUC-10');
  }

  return `inventario_sucursal_${match[1]}`;
}

export async function listInventoryBySucursal(
  sucursalId: string,
  query: InventoryListQuery
): Promise<InventoryListResult> {
  const index = getInventoryIndexBySucursalId(sucursalId);
  const { page, limit } = normalizePagination(query);
  const filter: Record<string, unknown>[] = [];

  if (query.producto_id?.trim()) {
    filter.push({
      term: {
        producto_id: query.producto_id.trim()
      }
    });
  }

  if (parseStockBajo(query.stock_bajo)) {
    filter.push({
      script: {
        script: {
          source:
            "doc['stock'].size() != 0 && doc['stock_minimo'].size() != 0 && doc['stock'].value <= doc['stock_minimo'].value"
        }
      }
    });
  }

  const response = await elasticClient.search<InventoryItem>({
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
    sort: [{ producto_id: { order: 'asc' } }]
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

export async function getInventoryItem(sucursalId: string, productoId: string): Promise<InventoryItem> {
  const document = await findInventoryDocument(sucursalId, productoId);

  if (!document) {
    throw new InventoryServiceError('NOT_FOUND', 'Inventario no encontrado');
  }

  return document.item;
}

export async function updateInventoryItem(
  sucursalId: string,
  productoId: string,
  data: UpdateInventoryRequestBody
): Promise<InventoryItem> {
  const document = await findInventoryDocument(sucursalId, productoId);

  if (!document) {
    throw new InventoryServiceError('NOT_FOUND', 'Inventario no encontrado');
  }

  const validData = removeUndefinedFields(validateUpdateData(data));

  if (Object.keys(validData).length === 0) {
    throw new InventoryServiceError('VALIDATION_ERROR', 'No hay campos validos para actualizar');
  }

  const updatedAt = new Date().toISOString();
  const doc = {
    ...validData,
    updated_at: updatedAt
  };
  const updatedItem: InventoryItem = {
    ...document.item,
    ...doc
  };

  await elasticClient.update({
    index: getInventoryIndexBySucursalId(sucursalId),
    id: document.id,
    doc,
    refresh: true
  });

  return updatedItem;
}
