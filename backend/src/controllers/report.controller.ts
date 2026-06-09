import { Request, Response } from 'express';
import {
  getBranchSalesSummary,
  getCashiersByBranch,
  getPaymentMethodsByBranch,
  getSalesComparisonReport,
  getSalesReportByBranches,
  getTopProductsByBranch,
  ReportServiceError
} from '../services/report.service.js';
import { ReportDateQuery } from '../types/report.types.js';

function getSingleQueryValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }

  return undefined;
}

function normalizeReportDateQuery(query: Request['query']): ReportDateQuery {
  return {
    fecha_inicio: getSingleQueryValue(query.fecha_inicio),
    fecha_fin: getSingleQueryValue(query.fecha_fin)
  };
}

function getRouteParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

function handleReportError(error: unknown, res: Response): void {
  if (error instanceof ReportServiceError) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });

    return;
  }

  res.status(500).json({
    status: 'error',
    message: 'Error inesperado al generar reporte'
  });
}

export async function getSalesReportByBranchesController(req: Request, res: Response): Promise<void> {
  try {
    const data = await getSalesReportByBranches(normalizeReportDateQuery(req.query));

    res.status(200).json({
      status: 'ok',
      data
    });
  } catch (error: unknown) {
    handleReportError(error, res);
  }
}

export async function getSalesComparisonReportController(req: Request, res: Response): Promise<void> {
  try {
    const data = await getSalesComparisonReport(normalizeReportDateQuery(req.query));

    res.status(200).json({
      status: 'ok',
      data
    });
  } catch (error: unknown) {
    handleReportError(error, res);
  }
}

export async function getBranchSalesSummaryController(req: Request, res: Response): Promise<void> {
  try {
    const data = await getBranchSalesSummary(getRouteParam(req.params.sucursalId), normalizeReportDateQuery(req.query));

    res.status(200).json({
      status: 'ok',
      data
    });
  } catch (error: unknown) {
    handleReportError(error, res);
  }
}

export async function getTopProductsByBranchController(req: Request, res: Response): Promise<void> {
  try {
    const data = await getTopProductsByBranch(getRouteParam(req.params.sucursalId), normalizeReportDateQuery(req.query));

    res.status(200).json({
      status: 'ok',
      data
    });
  } catch (error: unknown) {
    handleReportError(error, res);
  }
}

export async function getPaymentMethodsByBranchController(req: Request, res: Response): Promise<void> {
  try {
    const data = await getPaymentMethodsByBranch(
      getRouteParam(req.params.sucursalId),
      normalizeReportDateQuery(req.query)
    );

    res.status(200).json({
      status: 'ok',
      data
    });
  } catch (error: unknown) {
    handleReportError(error, res);
  }
}

export async function getCashiersByBranchController(req: Request, res: Response): Promise<void> {
  try {
    const data = await getCashiersByBranch(getRouteParam(req.params.sucursalId), normalizeReportDateQuery(req.query));

    res.status(200).json({
      status: 'ok',
      data
    });
  } catch (error: unknown) {
    handleReportError(error, res);
  }
}
