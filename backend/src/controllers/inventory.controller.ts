import { Request, Response } from 'express';
import {
  getInventoryItem,
  InventoryServiceError,
  listInventoryBySucursal,
  updateInventoryItem
} from '../services/inventory.service.js';
import { InventoryListQuery, UpdateInventoryRequestBody } from '../types/inventory.types.js';

function getSingleQueryValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }

  return undefined;
}

function normalizeInventoryListQuery(query: Request['query']): InventoryListQuery {
  return {
    producto_id: getSingleQueryValue(query.producto_id),
    stock_bajo: getSingleQueryValue(query.stock_bajo),
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

function handleInventoryError(error: unknown, res: Response): void {
  if (error instanceof InventoryServiceError) {
    const statusByCode: Record<InventoryServiceError['code'], number> = {
      VALIDATION_ERROR: 400,
      NOT_FOUND: 404
    };

    res.status(statusByCode[error.code]).json({
      status: 'error',
      message: error.message
    });

    return;
  }

  res.status(500).json({
    status: 'error',
    message: 'Error inesperado al procesar inventario'
  });
}

export async function getInventoryBySucursal(req: Request, res: Response): Promise<void> {
  try {
    const data = await listInventoryBySucursal(
      getRouteParam(req.params.sucursalId),
      normalizeInventoryListQuery(req.query)
    );

    res.status(200).json({
      status: 'ok',
      data
    });
  } catch (error: unknown) {
    handleInventoryError(error, res);
  }
}

export async function getInventoryItemByProduct(req: Request, res: Response): Promise<void> {
  try {
    const data = await getInventoryItem(getRouteParam(req.params.sucursalId), getRouteParam(req.params.productoId));

    res.status(200).json({
      status: 'ok',
      data
    });
  } catch (error: unknown) {
    handleInventoryError(error, res);
  }
}

export async function updateInventoryItemController(req: Request, res: Response): Promise<void> {
  try {
    const data = await updateInventoryItem(
      getRouteParam(req.params.sucursalId),
      getRouteParam(req.params.productoId),
      req.body as UpdateInventoryRequestBody
    );

    res.status(200).json({
      status: 'ok',
      data
    });
  } catch (error: unknown) {
    handleInventoryError(error, res);
  }
}
