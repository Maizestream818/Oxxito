import { Request, Response } from 'express';
import {
  createProduct,
  deactivateProduct,
  getProductById,
  listProducts,
  ProductServiceError,
  updateProduct
} from '../services/product.service.js';
import { CreateProductRequestBody, ProductListQuery, UpdateProductRequestBody } from '../types/product.types.js';

function getSingleQueryValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }

  return undefined;
}

function normalizeProductListQuery(query: Request['query']): ProductListQuery {
  return {
    q: getSingleQueryValue(query.q),
    categoria: getSingleQueryValue(query.categoria),
    marca: getSingleQueryValue(query.marca),
    activo: getSingleQueryValue(query.activo),
    page: getSingleQueryValue(query.page),
    limit: getSingleQueryValue(query.limit)
  };
}

function getRouteParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

function handleProductError(error: unknown, res: Response): void {
  if (error instanceof ProductServiceError) {
    const statusByCode: Record<ProductServiceError['code'], number> = {
      VALIDATION_ERROR: 400,
      NOT_FOUND: 404,
      CONFLICT: 409
    };

    res.status(statusByCode[error.code]).json({
      status: 'error',
      message: error.message
    });

    return;
  }

  res.status(500).json({
    status: 'error',
    message: 'Error inesperado al procesar productos'
  });
}

export async function getProducts(req: Request, res: Response): Promise<void> {
  try {
    const data = await listProducts(normalizeProductListQuery(req.query));

    res.status(200).json({
      status: 'ok',
      data
    });
  } catch (error: unknown) {
    handleProductError(error, res);
  }
}

export async function getProductByIdController(req: Request, res: Response): Promise<void> {
  try {
    const product = await getProductById(getRouteParam(req.params.productoId));

    if (!product) {
      res.status(404).json({
        status: 'error',
        message: 'Producto no encontrado'
      });

      return;
    }

    res.status(200).json({
      status: 'ok',
      data: product
    });
  } catch (error: unknown) {
    handleProductError(error, res);
  }
}

export async function createProductController(req: Request, res: Response): Promise<void> {
  try {
    const product = await createProduct(req.body as CreateProductRequestBody);

    res.status(201).json({
      status: 'ok',
      data: product
    });
  } catch (error: unknown) {
    handleProductError(error, res);
  }
}

export async function updateProductController(req: Request, res: Response): Promise<void> {
  try {
    const product = await updateProduct(getRouteParam(req.params.productoId), req.body as UpdateProductRequestBody);

    res.status(200).json({
      status: 'ok',
      data: product
    });
  } catch (error: unknown) {
    handleProductError(error, res);
  }
}

export async function deactivateProductController(req: Request, res: Response): Promise<void> {
  try {
    const product = await deactivateProduct(getRouteParam(req.params.productoId));

    res.status(200).json({
      status: 'ok',
      data: product
    });
  } catch (error: unknown) {
    handleProductError(error, res);
  }
}
