import { elasticClient } from '../config/elasticClient.js';
import {
  CreateProductRequestBody,
  Product,
  ProductListQuery,
  UpdateProductRequestBody
} from '../types/product.types.js';

const PRODUCT_INDEX = 'productos';
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

type ProductServiceErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'CONFLICT';

type ProductDocument = {
  id: string;
  product: Product;
};

type ListProductsResult = {
  items: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

export class ProductServiceError extends Error {
  constructor(
    public readonly code: ProductServiceErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'ProductServiceError';
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
    throw new ProductServiceError('VALIDATION_ERROR', `${fieldName} es requerido`);
  }

  return value.trim();
}

function ensureOptionalNonEmptyString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return ensureNonEmptyString(value, fieldName);
}

function ensurePrice(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new ProductServiceError('VALIDATION_ERROR', 'precio debe ser mayor o igual a 0');
  }

  return value;
}

function ensureOptionalPrice(value: unknown): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  return ensurePrice(value);
}

function ensureOptionalBoolean(value: unknown, fieldName: string): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'boolean') {
    throw new ProductServiceError('VALIDATION_ERROR', `${fieldName} debe ser booleano`);
  }

  return value;
}

function parseInteger(value: string | undefined, defaultValue: number, fieldName: string): number {
  if (value === undefined || value.trim() === '') {
    return defaultValue;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    throw new ProductServiceError('VALIDATION_ERROR', `${fieldName} debe ser un numero entero`);
  }

  return parsed;
}

function normalizePagination(query: ProductListQuery): { page: number; limit: number } {
  const requestedPage = parseInteger(query.page, DEFAULT_PAGE, 'page');
  const requestedLimit = parseInteger(query.limit, DEFAULT_LIMIT, 'limit');

  return {
    page: Math.max(1, requestedPage),
    limit: Math.min(MAX_LIMIT, Math.max(1, requestedLimit))
  };
}

function parseActivo(value: string | undefined): boolean | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new ProductServiceError('VALIDATION_ERROR', 'activo debe ser true o false');
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

function validateCreateProduct(data: CreateProductRequestBody): CreateProductRequestBody {
  return {
    producto_id: ensureNonEmptyString(data.producto_id, 'producto_id'),
    codigo_barras: ensureNonEmptyString(data.codigo_barras, 'codigo_barras'),
    nombre: ensureNonEmptyString(data.nombre, 'nombre'),
    categoria: ensureNonEmptyString(data.categoria, 'categoria'),
    marca: ensureNonEmptyString(data.marca, 'marca'),
    precio: ensurePrice(data.precio)
  };
}

function validateUpdateProduct(data: UpdateProductRequestBody): UpdateProductRequestBody {
  return {
    codigo_barras: ensureOptionalNonEmptyString(data.codigo_barras, 'codigo_barras'),
    nombre: ensureOptionalNonEmptyString(data.nombre, 'nombre'),
    categoria: ensureOptionalNonEmptyString(data.categoria, 'categoria'),
    marca: ensureOptionalNonEmptyString(data.marca, 'marca'),
    precio: ensureOptionalPrice(data.precio),
    activo: ensureOptionalBoolean(data.activo, 'activo')
  };
}

function removeUndefinedFields(data: UpdateProductRequestBody): UpdateProductRequestBody {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

async function findProductDocument(productoId: string): Promise<ProductDocument | null> {
  const normalizedProductoId = ensureNonEmptyString(productoId, 'productoId');

  try {
    const response = await elasticClient.get<Product>({
      index: PRODUCT_INDEX,
      id: normalizedProductoId
    });

    if (response._source) {
      return {
        id: response._id,
        product: response._source
      };
    }
  } catch (error: unknown) {
    if (!isNotFoundError(error)) {
      throw error;
    }
  }

  const response = await elasticClient.search<Product>({
    index: PRODUCT_INDEX,
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
    id: hit._id ?? normalizedProductoId,
    product: hit._source
  };
}

/**
 * Lista productos con busqueda por nombre, filtros exactos y paginacion controlada.
 */
export async function listProducts(query: ProductListQuery): Promise<ListProductsResult> {
  const { page, limit } = normalizePagination(query);
  const must: Record<string, unknown>[] = [];
  const filter: Record<string, unknown>[] = [];
  const activo = parseActivo(query.activo);

  if (query.q?.trim()) {
    must.push({
      match: {
        nombre: query.q.trim()
      }
    });
  }

  if (query.categoria?.trim()) {
    filter.push({
      term: {
        categoria: query.categoria.trim()
      }
    });
  }

  if (query.marca?.trim()) {
    filter.push({
      term: {
        marca: query.marca.trim()
      }
    });
  }

  if (activo !== undefined) {
    filter.push({
      term: {
        activo
      }
    });
  }

  const response = await elasticClient.search<Product>({
    index: PRODUCT_INDEX,
    from: (page - 1) * limit,
    size: limit,
    query:
      must.length > 0 || filter.length > 0
        ? {
            bool: {
              must,
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

export async function getProductById(productoId: string): Promise<Product | null> {
  const document = await findProductDocument(productoId);

  return document?.product ?? null;
}

export async function createProduct(data: CreateProductRequestBody): Promise<Product> {
  const validData = validateCreateProduct(data);
  const existingProduct = await findProductDocument(validData.producto_id);

  if (existingProduct) {
    throw new ProductServiceError('CONFLICT', 'El producto ya existe');
  }

  const product: Product = {
    ...validData,
    activo: true,
    created_at: new Date().toISOString()
  };

  await elasticClient.index({
    index: PRODUCT_INDEX,
    id: product.producto_id,
    document: product,
    refresh: true
  });

  return product;
}

export async function updateProduct(productoId: string, data: UpdateProductRequestBody): Promise<Product> {
  const document = await findProductDocument(productoId);

  if (!document) {
    throw new ProductServiceError('NOT_FOUND', 'Producto no encontrado');
  }

  const validData = removeUndefinedFields(validateUpdateProduct(data));

  if (Object.keys(validData).length === 0) {
    throw new ProductServiceError('VALIDATION_ERROR', 'No hay campos validos para actualizar');
  }

  const product: Product = {
    ...document.product,
    ...validData,
    producto_id: document.product.producto_id
  };

  await elasticClient.update({
    index: PRODUCT_INDEX,
    id: document.id,
    doc: validData,
    refresh: true
  });

  return product;
}

export async function deactivateProduct(productoId: string): Promise<Product> {
  const product = await updateProduct(productoId, { activo: false });

  return product;
}
