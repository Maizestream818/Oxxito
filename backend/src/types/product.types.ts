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

export type CreateProductRequestBody = {
  producto_id: string;
  codigo_barras: string;
  nombre: string;
  categoria: string;
  marca: string;
  precio: number;
};

export type UpdateProductRequestBody = {
  codigo_barras?: string;
  nombre?: string;
  categoria?: string;
  marca?: string;
  precio?: number;
  activo?: boolean;
};

export type ProductListQuery = {
  q?: string;
  categoria?: string;
  marca?: string;
  activo?: string;
  page?: string;
  limit?: string;
};
