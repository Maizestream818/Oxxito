import { request } from './apiClient';
import { ApiOkResponse, InventoryItem, ListData } from '../types/api.types';

export async function getInventoryPage(
  token: string,
  sucursalId: string,
  limit = 20,
  page = 1
): Promise<ListData<InventoryItem>> {
  const response = await request<ApiOkResponse<ListData<InventoryItem>>>(
    `/inventario/${sucursalId}?limit=${limit}&page=${page}`,
    {},
    token
  );

  return response.data;
}

export async function getInventory(token: string, sucursalId: string, limit = 20): Promise<InventoryItem[]> {
  const response = await getInventoryPage(token, sucursalId, limit);

  return response.items;
}
