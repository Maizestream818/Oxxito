import { createHash } from 'node:crypto';
import { elasticClient } from '../backend/src/config/elasticClient.js';

type Sucursal = {
  sucursal_id: string;
  nombre: string;
  ciudad: string;
  estado: string;
  direccion: string;
  activa: boolean;
  created_at: string;
};

type Usuario = {
  usuario_id: string;
  nombre: string;
  username: string;
  password_hash: string;
  rol: 'admin' | 'gerente' | 'cajero';
  sucursal_id: string;
  activo: boolean;
  created_at: string;
};

type Producto = {
  producto_id: string;
  codigo_barras: string;
  nombre: string;
  categoria: string;
  marca: string;
  precio: number;
  activo: boolean;
  created_at: string;
};

type Cliente = {
  cliente_id: string;
  nombre: string;
  telefono: string;
  email: string;
  created_at: string;
};

type Inventario = {
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

type ProductoVendido = {
  producto_id: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
};

type Venta = {
  venta_id: string;
  sucursal_id: string;
  sucursal_nombre: string;
  cajero_id: string;
  cajero_nombre: string;
  cliente_id: string;
  fecha: string;
  metodo_pago: string;
  subtotal: number;
  iva: number;
  total: number;
  productos: ProductoVendido[];
};

type MovimientoInventario = {
  movimiento_id: string;
  sucursal_id: string;
  producto_id: string;
  tipo: 'VENTA';
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  motivo: string;
  venta_id: string;
  fecha: string;
};

type BulkDocument = {
  index: string;
  id: string;
  document: Record<string, unknown>;
};

type BulkItemResponse = {
  index?: {
    error?: unknown;
    status?: number;
  };
};

type DatosTransaccionales = {
  inventarios: Inventario[];
  ventas: Venta[];
  movimientos: MovimientoInventario[];
};

const CREATED_AT = '2026-01-01T00:00:00.000Z';
const UPDATED_AT = '2026-06-01T00:00:00.000Z';
const IVA_RATE = 0.16;
const BULK_BATCH_SIZE = 500;

const CATEGORIAS = [
  'Bebidas',
  'Botanas',
  'Lácteos',
  'Panadería',
  'Abarrotes',
  'Limpieza',
  'Higiene',
  'Dulces',
  'Congelados',
  'Farmacia'
];

const MARCAS = [
  'Coca-Cola',
  'Pepsi',
  'Bimbo',
  'Sabritas',
  'Gamesa',
  'Lala',
  'Alpura',
  'Nestlé',
  'La Costeña',
  'Genérica'
];

const METODOS_PAGO = ['efectivo', 'tarjeta', 'transferencia', 'vales'];

const NOMBRES_SUCURSALES = [
  'Oxxito Centro',
  'Oxxito Norte',
  'Oxxito Sur',
  'Oxxito Oriente',
  'Oxxito Poniente',
  'Oxxito Universidad',
  'Oxxito Industrial',
  'Oxxito Las Américas',
  'Oxxito San Marcos',
  'Oxxito Villas'
];

const NOMBRES_PERSONA = [
  'Ana',
  'Luis',
  'Maria',
  'Carlos',
  'Sofia',
  'Jorge',
  'Laura',
  'Miguel',
  'Valeria',
  'Diego'
];

const APELLIDOS_PERSONA = [
  'Garcia',
  'Lopez',
  'Martinez',
  'Hernandez',
  'Gonzalez',
  'Perez',
  'Rodriguez',
  'Sanchez',
  'Ramirez',
  'Torres'
];

function padNumber(value: number, length: number): string {
  return String(value).padStart(length, '0');
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function generarNumerosSucursal(): string[] {
  return Array.from({ length: 10 }, (_, index) => padNumber(index + 1, 2));
}

function generarPasswordHash(): string {
  return createHash('sha256').update('123456').digest('hex');
}

function generarFechaVenta(sucursalNumero: number, ventaNumero: number): string {
  const baseDate = Date.UTC(2026, 0, 1, 8, 0, 0);
  const offsetMinutes = (sucursalNumero - 1) * 240 + ventaNumero * 7;

  return new Date(baseDate + offsetMinutes * 60_000).toISOString();
}

function obtenerIndicesRequeridos(): string[] {
  const indicesGlobales = ['sucursales', 'usuarios', 'productos', 'clientes'];
  const indicesPorSucursal = generarNumerosSucursal().flatMap((sucursalNumero) => [
    `inventario_sucursal_${sucursalNumero}`,
    `ventas_sucursal_${sucursalNumero}`,
    `movimientos_inventario_sucursal_${sucursalNumero}`
  ]);

  return [...indicesGlobales, ...indicesPorSucursal];
}

async function verificarIndicesRequeridos(): Promise<string[]> {
  const indicesFaltantes: string[] = [];

  for (const index of obtenerIndicesRequeridos()) {
    const exists = await elasticClient.indices.exists({ index });

    if (!exists) {
      indicesFaltantes.push(index);
    }
  }

  return indicesFaltantes;
}

function generarSucursales(): Sucursal[] {
  return NOMBRES_SUCURSALES.map((nombre, index) => {
    const sucursalNumero = index + 1;
    const sucursalId = `SUC-${padNumber(sucursalNumero, 2)}`;

    return {
      sucursal_id: sucursalId,
      nombre,
      ciudad: 'Aguascalientes',
      estado: 'Aguascalientes',
      direccion: `Av. Oxxito ${sucursalNumero} #${100 + sucursalNumero}, Colonia Operativa`,
      activa: true,
      created_at: CREATED_AT
    };
  });
}

function generarProductos(): Producto[] {
  return Array.from({ length: 200 }, (_, index) => {
    const productoNumero = index + 1;
    const categoria = CATEGORIAS[index % CATEGORIAS.length];
    const marca = MARCAS[(index + Math.floor(index / CATEGORIAS.length)) % MARCAS.length];

    return {
      producto_id: `PROD-${padNumber(productoNumero, 3)}`,
      codigo_barras: `750${padNumber(productoNumero, 10)}`,
      nombre: `${categoria} ${marca} ${padNumber(productoNumero, 3)}`,
      categoria,
      marca,
      precio: roundMoney(10 + (productoNumero % 50) * 1.75 + Math.floor(productoNumero / 20) * 0.65),
      activo: true,
      created_at: CREATED_AT
    };
  });
}

function generarClientes(): Cliente[] {
  return Array.from({ length: 200 }, (_, index) => {
    const clienteNumero = index + 1;
    const nombre = NOMBRES_PERSONA[index % NOMBRES_PERSONA.length];
    const apellidoPaterno = APELLIDOS_PERSONA[Math.floor(index / 10) % APELLIDOS_PERSONA.length];
    const apellidoMaterno = APELLIDOS_PERSONA[(index + 3) % APELLIDOS_PERSONA.length];

    return {
      cliente_id: `CLI-${padNumber(clienteNumero, 3)}`,
      nombre: `${nombre} ${apellidoPaterno} ${apellidoMaterno}`,
      telefono: `449${padNumber(clienteNumero, 7)}`,
      email: `cliente${padNumber(clienteNumero, 3)}@oxxito.local`,
      created_at: CREATED_AT
    };
  });
}

function generarUsuarios(): Usuario[] {
  const passwordHash = generarPasswordHash();
  const usuarios: Usuario[] = [
    {
      usuario_id: 'USR-001',
      nombre: 'Administrador General',
      username: 'admin',
      password_hash: passwordHash,
      rol: 'admin',
      sucursal_id: 'GLOBAL',
      activo: true,
      created_at: CREATED_AT
    }
  ];

  for (const sucursalNumero of generarNumerosSucursal()) {
    const usuarioNumero = Number(sucursalNumero) + 1;

    usuarios.push({
      usuario_id: `USR-${padNumber(usuarioNumero, 3)}`,
      nombre: `Gerente Sucursal ${sucursalNumero}`,
      username: `gerente${sucursalNumero}`,
      password_hash: passwordHash,
      rol: 'gerente',
      sucursal_id: `SUC-${sucursalNumero}`,
      activo: true,
      created_at: CREATED_AT
    });
  }

  for (let cajeroNumero = 1; cajeroNumero <= 189; cajeroNumero += 1) {
    const usuarioNumero = cajeroNumero + 11;
    const sucursalNumero = padNumber(((cajeroNumero - 1) % 10) + 1, 2);

    usuarios.push({
      usuario_id: `USR-${padNumber(usuarioNumero, 3)}`,
      nombre: `Cajero ${padNumber(cajeroNumero, 3)}`,
      username: `cajero${padNumber(cajeroNumero, 3)}`,
      password_hash: passwordHash,
      rol: 'cajero',
      sucursal_id: `SUC-${sucursalNumero}`,
      activo: true,
      created_at: CREATED_AT
    });
  }

  return usuarios;
}

function obtenerStockInicial(productoNumero: number, sucursalNumero: number): number {
  return 500 + sucursalNumero * 5 + (productoNumero % 25);
}

function seleccionarProducto(productos: Producto[], sucursalNumero: number, ventaNumero: number, lineaNumero: number): Producto {
  const productIndex = ((ventaNumero - 1) * 7 + lineaNumero * 37 + sucursalNumero * 11) % productos.length;

  return productos[productIndex];
}

function agruparCajerosPorSucursal(usuarios: Usuario[]): Map<string, Usuario[]> {
  const cajerosPorSucursal = new Map<string, Usuario[]>();

  for (const usuario of usuarios) {
    if (usuario.rol !== 'cajero') {
      continue;
    }

    const cajeros = cajerosPorSucursal.get(usuario.sucursal_id) ?? [];
    cajeros.push(usuario);
    cajerosPorSucursal.set(usuario.sucursal_id, cajeros);
  }

  return cajerosPorSucursal;
}

function generarDatosTransaccionales(
  sucursales: Sucursal[],
  productos: Producto[],
  clientes: Cliente[],
  usuarios: Usuario[]
): DatosTransaccionales {
  const inventarios: Inventario[] = [];
  const ventas: Venta[] = [];
  const movimientos: MovimientoInventario[] = [];
  const cajerosPorSucursal = agruparCajerosPorSucursal(usuarios);

  for (const sucursal of sucursales) {
    const sucursalNumero = Number(sucursal.sucursal_id.replace('SUC-', ''));
    const stocks = new Map<string, number>();
    const cajeros = cajerosPorSucursal.get(sucursal.sucursal_id) ?? [];
    let movimientoNumero = 1;

    for (const producto of productos) {
      const productoNumero = Number(producto.producto_id.replace('PROD-', ''));
      stocks.set(producto.producto_id, obtenerStockInicial(productoNumero, sucursalNumero));
    }

    for (let ventaNumero = 1; ventaNumero <= 200; ventaNumero += 1) {
      const ventaId = `VTA-${sucursal.sucursal_id}-${padNumber(ventaNumero, 3)}`;
      const fecha = generarFechaVenta(sucursalNumero, ventaNumero);
      const cajero = cajeros[(ventaNumero - 1) % cajeros.length];
      const cliente = clientes[((sucursalNumero - 1) * 20 + ventaNumero - 1) % clientes.length];
      const productosVendidos: ProductoVendido[] = [];
      const totalLineas = ((ventaNumero - 1) % 4) + 1;

      for (let lineaNumero = 1; lineaNumero <= totalLineas; lineaNumero += 1) {
        const producto = seleccionarProducto(productos, sucursalNumero, ventaNumero, lineaNumero);
        const cantidad = ((sucursalNumero + ventaNumero + lineaNumero) % 3) + 1;
        const subtotalLinea = roundMoney(producto.precio * cantidad);
        const stockAnterior = stocks.get(producto.producto_id) ?? 0;
        const stockNuevo = stockAnterior - cantidad;

        stocks.set(producto.producto_id, stockNuevo);

        productosVendidos.push({
          producto_id: producto.producto_id,
          nombre: producto.nombre,
          categoria: producto.categoria,
          cantidad,
          precio_unitario: producto.precio,
          subtotal: subtotalLinea
        });

        movimientos.push({
          movimiento_id: `MOV-${sucursal.sucursal_id}-${padNumber(movimientoNumero, 3)}`,
          sucursal_id: sucursal.sucursal_id,
          producto_id: producto.producto_id,
          tipo: 'VENTA',
          cantidad,
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          motivo: `Venta registrada ${ventaId}`,
          venta_id: ventaId,
          fecha
        });

        movimientoNumero += 1;
      }

      const subtotal = roundMoney(productosVendidos.reduce((total, producto) => total + producto.subtotal, 0));
      const iva = roundMoney(subtotal * IVA_RATE);
      const total = roundMoney(subtotal + iva);

      ventas.push({
        venta_id: ventaId,
        sucursal_id: sucursal.sucursal_id,
        sucursal_nombre: sucursal.nombre,
        cajero_id: cajero.usuario_id,
        cajero_nombre: cajero.nombre,
        cliente_id: cliente.cliente_id,
        fecha,
        metodo_pago: METODOS_PAGO[(ventaNumero + sucursalNumero) % METODOS_PAGO.length],
        subtotal,
        iva,
        total,
        productos: productosVendidos
      });
    }

    for (const producto of productos) {
      inventarios.push({
        inventario_id: `INV-${sucursal.sucursal_id}-${producto.producto_id}`,
        sucursal_id: sucursal.sucursal_id,
        producto_id: producto.producto_id,
        producto_nombre: producto.nombre,
        categoria: producto.categoria,
        stock: stocks.get(producto.producto_id) ?? 0,
        stock_minimo: 20,
        precio: producto.precio,
        updated_at: UPDATED_AT
      });
    }
  }

  return { inventarios, ventas, movimientos };
}

function toBulkDocuments(index: string, idField: string, documents: Record<string, unknown>[]): BulkDocument[] {
  return documents.map((document) => ({
    index,
    id: String(document[idField]),
    document
  }));
}

function toBulkDocumentsByIndex(
  indexPrefix: string,
  idField: string,
  documents: Record<string, unknown>[]
): BulkDocument[] {
  return documents.map((document) => {
    const sucursalId = String(document.sucursal_id);
    const sucursalNumero = sucursalId.replace('SUC-', '');

    return {
      index: `${indexPrefix}_${sucursalNumero}`,
      id: String(document[idField]),
      document
    };
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Error desconocido';
}

async function ejecutarBulk(nombreOperacion: string, documents: BulkDocument[]): Promise<string[]> {
  const errors: string[] = [];

  for (let index = 0; index < documents.length; index += BULK_BATCH_SIZE) {
    const chunk = documents.slice(index, index + BULK_BATCH_SIZE);
    const operations = chunk.flatMap((document) => [
      {
        index: {
          _index: document.index,
          _id: document.id
        }
      },
      document.document
    ]);

    try {
      const response = await elasticClient.bulk({
        refresh: true,
        operations
      });

      if (!response.errors) {
        continue;
      }

      const items = (response.items ?? []) as BulkItemResponse[];

      for (const [itemIndex, item] of items.entries()) {
        if (!item.index?.error) {
          continue;
        }

        const failedDocument = chunk[itemIndex];
        errors.push(
          `${nombreOperacion} ${failedDocument.index}/${failedDocument.id}: ${JSON.stringify(item.index.error)}`
        );
      }
    } catch (error: unknown) {
      errors.push(`${nombreOperacion} lote ${Math.floor(index / BULK_BATCH_SIZE) + 1}: ${getErrorMessage(error)}`);
    }
  }

  return errors;
}

function imprimirResumen(summary: {
  sucursales: number;
  usuarios: number;
  productos: number;
  clientes: number;
  inventarios: number;
  ventas: number;
  movimientos: number;
  errores: string[];
}): void {
  console.log('\nResumen de carga masiva de datos');
  console.log(`Sucursales cargadas: ${summary.sucursales}`);
  console.log(`Usuarios cargados: ${summary.usuarios}`);
  console.log(`Productos cargados: ${summary.productos}`);
  console.log(`Clientes cargados: ${summary.clientes}`);
  console.log(`Inventarios cargados: ${summary.inventarios}`);
  console.log(`Ventas cargadas: ${summary.ventas}`);
  console.log(`Movimientos cargados: ${summary.movimientos}`);
  console.log(`Errores: ${summary.errores.length}`);

  if (summary.errores.length > 0) {
    console.log('\nDetalle de errores:');

    for (const error of summary.errores) {
      console.log(`- ${error}`);
    }
  }
}

async function main(): Promise<void> {
  try {
    const indicesFaltantes = await verificarIndicesRequeridos();

    if (indicesFaltantes.length > 0) {
      console.error('No se puede cargar datos porque faltan indices de Elasticsearch:');

      for (const index of indicesFaltantes) {
        console.error(`- ${index}`);
      }

      console.error('\nEjecuta primero: npm run elastic:create-indices');
      process.exit(1);
    }

    const sucursales = generarSucursales();
    const productos = generarProductos();
    const clientes = generarClientes();
    const usuarios = generarUsuarios();
    const { inventarios, ventas, movimientos } = generarDatosTransaccionales(
      sucursales,
      productos,
      clientes,
      usuarios
    );

    const errores = [
      ...(await ejecutarBulk('sucursales', toBulkDocuments('sucursales', 'sucursal_id', sucursales))),
      ...(await ejecutarBulk('usuarios', toBulkDocuments('usuarios', 'usuario_id', usuarios))),
      ...(await ejecutarBulk('productos', toBulkDocuments('productos', 'producto_id', productos))),
      ...(await ejecutarBulk('clientes', toBulkDocuments('clientes', 'cliente_id', clientes))),
      ...(await ejecutarBulk(
        'inventarios',
        toBulkDocumentsByIndex('inventario_sucursal', 'inventario_id', inventarios)
      )),
      ...(await ejecutarBulk('ventas', toBulkDocumentsByIndex('ventas_sucursal', 'venta_id', ventas))),
      ...(await ejecutarBulk(
        'movimientos',
        toBulkDocumentsByIndex('movimientos_inventario_sucursal', 'movimiento_id', movimientos)
      ))
    ];

    imprimirResumen({
      sucursales: sucursales.length,
      usuarios: usuarios.length,
      productos: productos.length,
      clientes: clientes.length,
      inventarios: inventarios.length,
      ventas: ventas.length,
      movimientos: movimientos.length,
      errores
    });

    if (errores.length > 0) {
      process.exit(1);
    }
  } catch (error: unknown) {
    console.error(`[error] Fallo inesperado al cargar datos: ${getErrorMessage(error)}`);
    process.exit(1);
  }
}

main();
