import { Request, Response } from 'express';
import { createSale, SaleServiceError } from '../services/sale.service.js';
import { CreateSaleRequestBody } from '../types/sale.types.js';

function getRouteParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
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
    message: 'Error inesperado al registrar venta'
  });
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
