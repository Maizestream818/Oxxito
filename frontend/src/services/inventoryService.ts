import { request } from './apiClient';
import { ApiOkResponse, InventoryItem, ListData } from '../types/api.types';

export async function getInventory(token: string, sucursalId: string, limit = 20): Promise<InventoryItem[]> {
  const response = await request<ApiOkResponse<ListData<InventoryItem>>>(
    `/inventario/${sucursalId}?limit=${limit}`,
    {},
    token
  );

  return response.data.items;
}
