import { Request, Response } from 'express';
import { createSale, getSaleById, listSalesBySucursal, SaleServiceError } from '../services/sale.service.js';
import { CreateSaleRequestBody, SaleListQuery } from '../types/sale.types.js';

function getRouteParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

function getSingleQueryValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }

  return undefined;
}

function normalizeSaleListQuery(query: Request['query']): SaleListQuery {
  return {
    fecha_inicio: getSingleQueryValue(query.fecha_inicio),
    fecha_fin: getSingleQueryValue(query.fecha_fin),
    metodo_pago: getSingleQueryValue(query.metodo_pago),
    cajero_id: getSingleQueryValue(query.cajero_id),
    cliente_id: getSingleQueryValue(query.cliente_id),
    page: getSingleQueryValue(query.page),
    limit: getSingleQueryValue(query.limit)
  };
}

function handleSaleError(error: unknown, res: Response): void {
  if (error instanceof SaleServiceError) {
    const statusByCode: Record<SaleServiceError['code'], number> = {
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
    message: 'Error inesperado al procesar ventas'
  });
}

export async function getSalesBySucursalController(req: Request, res: Response): Promise<void> {
  try {
    const data = await listSalesBySucursal(
      getRouteParam(req.params.sucursalId),
      normalizeSaleListQuery(req.query)
    );

    res.status(200).json({
      status: 'ok',
      data
    });
  } catch (error: unknown) {
    handleSaleError(error, res);
  }
}

export async function getSaleByIdController(req: Request, res: Response): Promise<void> {
  try {
    const data = await getSaleById(getRouteParam(req.params.sucursalId), getRouteParam(req.params.ventaId));

    res.status(200).json({
      status: 'ok',
      data
    });
  } catch (error: unknown) {
    handleSaleError(error, res);
  }
}

export async function createSaleController(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Token requerido'
      });

      return;
    }

    const sale = await createSale(
      getRouteParam(req.params.sucursalId),
      req.user,
      req.body as CreateSaleRequestBody
    );

    res.status(201).json({
      status: 'ok',
      data: sale
    });
  } catch (error: unknown) {
    handleSaleError(error, res);
  }
}
