import { request } from './apiClient';
import {
  ApiOkResponse,
  BranchSalesReport,
  BranchSummaryReport,
  CashierSalesReport,
  PaymentMethodReport,
  TopProductReport
} from '../types/api.types';

export async function getGlobalBranchReport(token: string): Promise<BranchSalesReport[]> {
  const response = await request<ApiOkResponse<BranchSalesReport[]>>('/reportes/ventas/sucursales', {}, token);

  return response.data;
}

export async function getBranchSummary(token: string, sucursalId: string): Promise<BranchSummaryReport> {
  const response = await request<ApiOkResponse<BranchSummaryReport>>(
    `/reportes/ventas/sucursal/${sucursalId}/resumen`,
    {},
    token
  );

  return response.data;
}

export async function getTopProducts(token: string, sucursalId: string): Promise<TopProductReport[]> {
  const response = await request<ApiOkResponse<TopProductReport[]>>(
    `/reportes/ventas/sucursal/${sucursalId}/productos-mas-vendidos`,
    {},
    token
  );

  return response.data;
}

export async function getPaymentMethods(token: string, sucursalId: string): Promise<PaymentMethodReport[]> {
  const response = await request<ApiOkResponse<PaymentMethodReport[]>>(
    `/reportes/ventas/sucursal/${sucursalId}/metodos-pago`,
    {},
    token
  );

  return response.data;
}

export async function getCashiers(token: string, sucursalId: string): Promise<CashierSalesReport[]> {
  const response = await request<ApiOkResponse<CashierSalesReport[]>>(
    `/reportes/ventas/sucursal/${sucursalId}/cajeros`,
    {},
    token
  );

  return response.data;
}
