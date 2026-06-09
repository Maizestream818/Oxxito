import { request } from './apiClient';
import { ApiOkResponse, ListData, Product } from '../types/api.types';

export async function getProducts(token: string, limit = 20): Promise<Product[]> {
  const response = await request<ApiOkResponse<ListData<Product>>>(`/productos?limit=${limit}`, {}, token);

  return response.data.items;
}
