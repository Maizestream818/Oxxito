export type CreateSaleProductRequest = {
  producto_id: string;
  cantidad: number;
};

export type CreateSaleRequestBody = {
  cliente_id?: string;
  metodo_pago: string;
  productos: CreateSaleProductRequest[];
};

export type SaleProduct = {
  producto_id: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
};

export type Sale = {
  venta_id: string;
  sucursal_id: string;
  sucursal_nombre: string;
  cajero_id: string;
  cajero_nombre: string;
  cliente_id?: string;
  fecha: string;
  metodo_pago: string;
  subtotal: number;
  iva: number;
  total: number;
  productos: SaleProduct[];
};

export type SaleListQuery = {
  fecha_inicio?: string;
  fecha_fin?: string;
  metodo_pago?: string;
  cajero_id?: string;
  cliente_id?: string;
  page?: string;
  limit?: string;
};
