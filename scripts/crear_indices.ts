import { elasticClient } from '../backend/src/config/elasticClient.js';

type IndexMappings = {
  properties: Record<string, unknown>;
};

type IndexDefinition = {
  name: string;
  mappings: IndexMappings;
};

type IndexResult = {
  name: string;
  status: 'created' | 'skipped' | 'error';
  error?: string;
};

const INDEX_SETTINGS = {
  number_of_shards: 3,
  number_of_replicas: 1
};

const textWithKeyword = {
  type: 'text',
  fields: {
    keyword: {
      type: 'keyword'
    }
  }
};

const sucursalesMappings: IndexMappings = {
  properties: {
    sucursal_id: { type: 'keyword' },
    nombre: textWithKeyword,
    ciudad: { type: 'keyword' },
    estado: { type: 'keyword' },
    direccion: { type: 'text' },
    activa: { type: 'boolean' },
    created_at: { type: 'date' }
  }
};

const usuariosMappings: IndexMappings = {
  properties: {
    usuario_id: { type: 'keyword' },
    nombre: textWithKeyword,
    username: { type: 'keyword' },
    password_hash: { type: 'keyword' },
    rol: { type: 'keyword' },
    sucursal_id: { type: 'keyword' },
    activo: { type: 'boolean' },
    created_at: { type: 'date' }
  }
};

const productosMappings: IndexMappings = {
  properties: {
    producto_id: { type: 'keyword' },
    codigo_barras: { type: 'keyword' },
    nombre: textWithKeyword,
    categoria: { type: 'keyword' },
    marca: { type: 'keyword' },
    precio: { type: 'double' },
    activo: { type: 'boolean' },
    created_at: { type: 'date' }
  }
};

const clientesMappings: IndexMappings = {
  properties: {
    cliente_id: { type: 'keyword' },
    nombre: textWithKeyword,
    telefono: { type: 'keyword' },
    email: { type: 'keyword' },
    created_at: { type: 'date' }
  }
};

const ventasMappings: IndexMappings = {
  properties: {
    venta_id: { type: 'keyword' },
    sucursal_id: { type: 'keyword' },
    sucursal_nombre: { type: 'keyword' },
    cajero_id: { type: 'keyword' },
    cajero_nombre: textWithKeyword,
    cliente_id: { type: 'keyword' },
    fecha: { type: 'date' },
    metodo_pago: { type: 'keyword' },
    subtotal: { type: 'double' },
    iva: { type: 'double' },
    total: { type: 'double' },
    productos: {
      type: 'nested',
      properties: {
        producto_id: { type: 'keyword' },
        nombre: textWithKeyword,
        categoria: { type: 'keyword' },
        cantidad: { type: 'integer' },
        precio_unitario: { type: 'double' },
        subtotal: { type: 'double' }
      }
    }
  }
};

const inventarioMappings: IndexMappings = {
  properties: {
    inventario_id: { type: 'keyword' },
    sucursal_id: { type: 'keyword' },
    producto_id: { type: 'keyword' },
    producto_nombre: textWithKeyword,
    categoria: { type: 'keyword' },
    stock: { type: 'integer' },
    stock_minimo: { type: 'integer' },
    precio: { type: 'double' },
    updated_at: { type: 'date' }
  }
};

const movimientosInventarioMappings: IndexMappings = {
  properties: {
    movimiento_id: { type: 'keyword' },
    sucursal_id: { type: 'keyword' },
    producto_id: { type: 'keyword' },
    tipo: { type: 'keyword' },
    cantidad: { type: 'integer' },
    stock_anterior: { type: 'integer' },
    stock_nuevo: { type: 'integer' },
    motivo: { type: 'text' },
    venta_id: { type: 'keyword' },
    fecha: { type: 'date' }
  }
};

/**
 * Genera los identificadores de sucursal usados para los indices fragmentados.
 */
function generarNumerosSucursal(): string[] {
  return Array.from({ length: 10 }, (_, index) => String(index + 1).padStart(2, '0'));
}

function buildIndexDefinitions(): IndexDefinition[] {
  const globalIndices: IndexDefinition[] = [
    { name: 'sucursales', mappings: sucursalesMappings },
    { name: 'usuarios', mappings: usuariosMappings },
    { name: 'productos', mappings: productosMappings },
    { name: 'clientes', mappings: clientesMappings }
  ];

  const branchIndices = generarNumerosSucursal().flatMap((branchNumber) => [
    { name: `ventas_sucursal_${branchNumber}`, mappings: ventasMappings },
    { name: `inventario_sucursal_${branchNumber}`, mappings: inventarioMappings },
    { name: `movimientos_inventario_sucursal_${branchNumber}`, mappings: movimientosInventarioMappings }
  ]);

  return [...globalIndices, ...branchIndices];
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Error desconocido al crear el indice';
}

/**
 * Crea un indice solo cuando no existe, manteniendo la ejecucion idempotente.
 */
async function crearIndiceSiNoExiste(indexDefinition: IndexDefinition): Promise<IndexResult> {
  try {
    const exists = await elasticClient.indices.exists({ index: indexDefinition.name });

    if (exists) {
      console.log(`[omitido] El indice "${indexDefinition.name}" ya existe.`);

      return {
        name: indexDefinition.name,
        status: 'skipped'
      };
    }

    await elasticClient.indices.create({
      index: indexDefinition.name,
      settings: INDEX_SETTINGS,
      mappings: indexDefinition.mappings
    });

    console.log(`[creado] El indice "${indexDefinition.name}" fue creado correctamente.`);

    return {
      name: indexDefinition.name,
      status: 'created'
    };
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    console.error(`[error] No se pudo procesar el indice "${indexDefinition.name}": ${message}`);

    return {
      name: indexDefinition.name,
      status: 'error',
      error: message
    };
  }
}

function printSummary(results: IndexResult[]): void {
  const created = results.filter((result) => result.status === 'created');
  const skipped = results.filter((result) => result.status === 'skipped');
  const errors = results.filter((result) => result.status === 'error');

  console.log('\nResumen de indices de Elasticsearch');
  console.log(`Total de indices procesados: ${results.length}`);
  console.log(`Indices creados: ${created.length}`);
  console.log(`Indices omitidos: ${skipped.length}`);
  console.log(`Errores: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\nDetalle de errores:');

    for (const result of errors) {
      console.log(`- ${result.name}: ${result.error}`);
    }
  }
}

async function main(): Promise<void> {
  const indexDefinitions = buildIndexDefinitions();
  const results: IndexResult[] = [];

  for (const indexDefinition of indexDefinitions) {
    const result = await crearIndiceSiNoExiste(indexDefinition);
    results.push(result);
  }

  printSummary(results);

  if (results.some((result) => result.status === 'error')) {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(`[error] Fallo inesperado al crear indices: ${getErrorMessage(error)}`);
  process.exit(1);
});
