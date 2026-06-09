import { elasticClient } from '../config/elasticClient.js';
import {
  BranchSummaryReport,
  CashierSalesReport,
  PaymentMethodReport,
  ReportDateQuery,
  SucursalSalesReport,
  TopProductReport
} from '../types/report.types.js';

type ReportServiceErrorCode = 'VALIDATION_ERROR';

type EsRecord = Record<string, unknown>;

type Bucket = EsRecord & {
  key?: unknown;
  doc_count?: unknown;
};

export class ReportServiceError extends Error {
  constructor(
    public readonly code: ReportServiceErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'ReportServiceError';
  }
}

function isRecord(value: unknown): value is EsRecord {
  return typeof value === 'object' && value !== null;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function getSucursalNumber(sucursalId: string): string {
  const normalizedSucursalId = sucursalId.trim();
  const match = /^SUC-(0[1-9]|10)$/.exec(normalizedSucursalId);

  if (!match) {
    throw new ReportServiceError('VALIDATION_ERROR', 'sucursalId debe tener formato SUC-01 a SUC-10');
  }

  return match[1];
}

function getBucketKey(bucket: Bucket): string {
  return typeof bucket.key === 'string' || typeof bucket.key === 'number' ? String(bucket.key) : '';
}

function getDocCount(bucket: Bucket): number {
  return typeof bucket.doc_count === 'number' ? bucket.doc_count : 0;
}

function getMetricValue(value: unknown): number {
  if (!isRecord(value)) {
    return 0;
  }

  return typeof value.value === 'number' ? value.value : 0;
}

function getAggregation(aggregations: unknown, name: string): unknown {
  if (!isRecord(aggregations)) {
    return undefined;
  }

  return aggregations[name];
}

function getBuckets(value: unknown): Bucket[] {
  if (!isRecord(value) || !Array.isArray(value.buckets)) {
    return [];
  }

  return value.buckets.filter(isRecord);
}

function getTopHitSource(value: unknown): EsRecord | undefined {
  if (!isRecord(value) || !isRecord(value.hits) || !Array.isArray(value.hits.hits)) {
    return undefined;
  }

  const firstHit = value.hits.hits[0];

  if (!isRecord(firstHit) || !isRecord(firstHit._source)) {
    return undefined;
  }

  return firstHit._source;
}

function ensureOptionalDate(value: string | undefined, fieldName: string): string | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }

  const normalizedValue = value.trim();

  if (Number.isNaN(Date.parse(normalizedValue))) {
    throw new ReportServiceError('VALIDATION_ERROR', `${fieldName} debe ser una fecha valida`);
  }

  return normalizedValue;
}

function buildDateQuery(query: ReportDateQuery): Record<string, unknown> {
  const fechaInicio = ensureOptionalDate(query.fecha_inicio, 'fecha_inicio');
  const fechaFin = ensureOptionalDate(query.fecha_fin, 'fecha_fin');

  if (!fechaInicio && !fechaFin) {
    return {
      match_all: {}
    };
  }

  return {
    bool: {
      filter: [
        {
          range: {
            fecha: {
              ...(fechaInicio ? { gte: fechaInicio } : {}),
              ...(fechaFin ? { lte: fechaFin } : {})
            }
          }
        }
      ]
    }
  };
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

function buildEmptyBranchReports(): SucursalSalesReport[] {
  return Array.from({ length: 10 }, (_, index) => {
    const sucursalNumber = String(index + 1).padStart(2, '0');

    return {
      sucursal_id: `SUC-${sucursalNumber}`,
      total_ventas: 0,
      total_ingresos: 0,
      subtotal: 0,
      iva: 0
    };
  });
}

export function getSalesIndexBySucursalId(sucursalId: string): string {
  return `ventas_sucursal_${getSucursalNumber(sucursalId)}`;
}

export function getAllSalesIndices(): string[] {
  return Array.from({ length: 10 }, (_, index) => `ventas_sucursal_${String(index + 1).padStart(2, '0')}`);
}

/**
 * Reporte global de ventas agrupado por sucursal.
 */
export async function getSalesReportByBranches(query: ReportDateQuery): Promise<SucursalSalesReport[]> {
  const response = await elasticClient.search({
    index: getAllSalesIndices(),
    size: 0,
    query: buildDateQuery(query),
    aggs: {
      sucursales: {
        terms: {
          field: 'sucursal_id',
          size: 10,
          order: {
            total_ingresos: 'desc'
          }
        },
        aggs: {
          subtotal: { sum: { field: 'subtotal' } },
          iva: { sum: { field: 'iva' } },
          total_ingresos: { sum: { field: 'total' } }
        }
      }
    }
  });
  const buckets = getBuckets(getAggregation(response.aggregations, 'sucursales'));

  return buckets.map((bucket) => ({
    sucursal_id: getBucketKey(bucket),
    total_ventas: getDocCount(bucket),
    subtotal: roundMoney(getMetricValue(bucket.subtotal)),
    iva: roundMoney(getMetricValue(bucket.iva)),
    total_ingresos: roundMoney(getMetricValue(bucket.total_ingresos))
  }));
}

export async function getSalesComparisonReport(query: ReportDateQuery): Promise<SucursalSalesReport[]> {
  const reports = await getSalesReportByBranches(query);
  const reportsBySucursal = new Map(reports.map((report) => [report.sucursal_id, report]));

  return buildEmptyBranchReports()
    .map((emptyReport) => reportsBySucursal.get(emptyReport.sucursal_id) ?? emptyReport)
    .sort((left, right) => right.total_ingresos - left.total_ingresos);
}

export async function getBranchSalesSummary(
  sucursalId: string,
  query: ReportDateQuery
): Promise<BranchSummaryReport> {
  const response = await elasticClient.search({
    index: getSalesIndexBySucursalId(sucursalId),
    size: 0,
    query: buildDateQuery(query),
    aggs: {
      subtotal: { sum: { field: 'subtotal' } },
      iva: { sum: { field: 'iva' } },
      total_ingresos: { sum: { field: 'total' } }
    }
  });
  const totalVentas = getTotalHits(response.hits.total);
  const totalIngresos = roundMoney(getMetricValue(getAggregation(response.aggregations, 'total_ingresos')));

  return {
    sucursal_id: sucursalId,
    total_ventas: totalVentas,
    subtotal: roundMoney(getMetricValue(getAggregation(response.aggregations, 'subtotal'))),
    iva: roundMoney(getMetricValue(getAggregation(response.aggregations, 'iva'))),
    total_ingresos: totalIngresos,
    ticket_promedio: totalVentas > 0 ? roundMoney(totalIngresos / totalVentas) : 0
  };
}

export async function getTopProductsByBranch(
  sucursalId: string,
  query: ReportDateQuery
): Promise<TopProductReport[]> {
  const response = await elasticClient.search({
    index: getSalesIndexBySucursalId(sucursalId),
    size: 0,
    query: buildDateQuery(query),
    aggs: {
      productos_nested: {
        nested: {
          path: 'productos'
        },
        aggs: {
          productos: {
            terms: {
              field: 'productos.producto_id',
              size: 10,
              order: {
                cantidad_vendida: 'desc'
              }
            },
            aggs: {
              nombres: { terms: { field: 'productos.nombre.keyword', size: 1 } },
              cantidad_vendida: { sum: { field: 'productos.cantidad' } },
              total_ingresos: { sum: { field: 'productos.subtotal' } }
            }
          }
        }
      }
    }
  });
  const nestedAggregation = getAggregation(response.aggregations, 'productos_nested');
  const productBuckets = getBuckets(getAggregation(nestedAggregation, 'productos'));

  return productBuckets.map((bucket) => {
    const nameBucket = getBuckets(bucket.nombres)[0];

    return {
      producto_id: getBucketKey(bucket),
      nombre: nameBucket ? getBucketKey(nameBucket) : '',
      cantidad_vendida: getMetricValue(bucket.cantidad_vendida),
      total_ingresos: roundMoney(getMetricValue(bucket.total_ingresos))
    };
  });
}

export async function getPaymentMethodsByBranch(
  sucursalId: string,
  query: ReportDateQuery
): Promise<PaymentMethodReport[]> {
  const response = await elasticClient.search({
    index: getSalesIndexBySucursalId(sucursalId),
    size: 0,
    query: buildDateQuery(query),
    aggs: {
      metodos_pago: {
        terms: {
          field: 'metodo_pago',
          size: 20,
          order: {
            total_ingresos: 'desc'
          }
        },
        aggs: {
          total_ingresos: { sum: { field: 'total' } }
        }
      }
    }
  });

  return getBuckets(getAggregation(response.aggregations, 'metodos_pago')).map((bucket) => ({
    metodo_pago: getBucketKey(bucket),
    total_ventas: getDocCount(bucket),
    total_ingresos: roundMoney(getMetricValue(bucket.total_ingresos))
  }));
}

export async function getCashiersByBranch(
  sucursalId: string,
  query: ReportDateQuery
): Promise<CashierSalesReport[]> {
  const response = await elasticClient.search({
    index: getSalesIndexBySucursalId(sucursalId),
    size: 0,
    query: buildDateQuery(query),
    aggs: {
      cajeros: {
        terms: {
          field: 'cajero_id',
          size: 100,
          order: {
            total_ingresos: 'desc'
          }
        },
        aggs: {
          total_ingresos: { sum: { field: 'total' } },
          muestra: { top_hits: { size: 1, _source: ['cajero_nombre'] } }
        }
      }
    }
  });

  return getBuckets(getAggregation(response.aggregations, 'cajeros')).map((bucket) => {
    const source = getTopHitSource(bucket.muestra);
    const cajeroNombre = typeof source?.cajero_nombre === 'string' ? source.cajero_nombre : '';

    return {
      cajero_id: getBucketKey(bucket),
      cajero_nombre: cajeroNombre,
      total_ventas: getDocCount(bucket),
      total_ingresos: roundMoney(getMetricValue(bucket.total_ingresos))
    };
  });
}
