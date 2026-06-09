export type ReportDateQuery = {
  fecha_inicio?: string;
  fecha_fin?: string;
};

export type SucursalSalesReport = {
  sucursal_id: string;
  total_ventas: number;
  total_ingresos: number;
  subtotal: number;
  iva: number;
};

export type PaymentMethodReport = {
  metodo_pago: string;
  total_ventas: number;
  total_ingresos: number;
};

export type TopProductReport = {
  producto_id: string;
  nombre: string;
  cantidad_vendida: number;
  total_ingresos: number;
};

export type CashierSalesReport = {
  cajero_id: string;
  cajero_nombre: string;
  total_ventas: number;
  total_ingresos: number;
};

export type BranchSummaryReport = {
  sucursal_id: string;
  total_ventas: number;
  subtotal: number;
  iva: number;
  total_ingresos: number;
  ticket_promedio: number;
};
