export type ApiOkResponse<T> = {
  status: 'ok';
  data: T;
};

export type ApiErrorResponse = {
  status: 'error';
  message: string;
};

export type AuthUser = {
  usuario_id: string;
  nombre: string;
  username: string;
  rol: string;
  sucursal_id: string;
};

export type LoginResponse = {
  status: 'ok';
  message: string;
  token: string;
  user: AuthUser;
};

export type Product = {
  producto_id: string;
  codigo_barras: string;
  nombre: string;
  categoria: string;
  marca: string;
  precio: number;
  activo: boolean;
  created_at: string;
};

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

export type BranchSalesReport = {
  sucursal_id: string;
  total_ventas: number;
  total_ingresos: number;
  subtotal: number;
  iva: number;
};

export type BranchSummaryReport = {
  sucursal_id: string;
  total_ventas: number;
  subtotal: number;
  iva: number;
  total_ingresos: number;
  ticket_promedio: number;
};

export type TopProductReport = {
  producto_id: string;
  nombre: string;
  cantidad_vendida: number;
  total_ingresos: number;
};

export type PaymentMethodReport = {
  metodo_pago: string;
  total_ventas: number;
  total_ingresos: number;
};

export type CashierSalesReport = {
  cajero_id: string;
  cajero_nombre: string;
  total_ventas: number;
  total_ingresos: number;
};

export type ListData<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};
