export type InventoryItem = {
  inventario_id: string;
  sucursal_id: string;
  producto_id: string;
  producto_nombre: string;
  categoria: string;
  stock: number;
  stock_minimo: number;
  precio: number;
  updated_at: string;
};

export type UpdateInventoryRequestBody = {
  stock?: number;
  stock_minimo?: number;
};

export type InventoryListQuery = {
  producto_id?: string;
  stock_bajo?: string;
  page?: string;
  limit?: string;
};
