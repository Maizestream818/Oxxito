import { request } from './apiClient';
import { ApiOkResponse, ListData, Sale } from '../types/api.types';

type CreateSalePayload = {
  metodo_pago: string;
  productos: Array<{
    producto_id: string;
    cantidad: number;
  }>;
};

export async function getSales(token: string, sucursalId: string, limit = 20): Promise<Sale[]> {
  const response = await request<ApiOkResponse<ListData<Sale>>>(`/ventas/${sucursalId}?limit=${limit}`, {}, token);

  return response.data.items;
}

export async function createSale(token: string, sucursalId: string, payload: CreateSalePayload): Promise<Sale> {
  const response = await request<ApiOkResponse<Sale>>(
    `/ventas/${sucursalId}`,
    {
      method: 'POST',
      body: payload
    },
    token
  );

  return response.data;
}
