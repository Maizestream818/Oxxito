# Oxxito - Pruebas del sistema y endurecimiento de logica

## Objetivo

Validar de forma integral el sistema Oxxito: backend, frontend, Elasticsearch, autenticacion, seguridad por roles, productos, inventario, ventas, reportes y reglas de negocio despues del endurecimiento de logica.

## Alcance

Esta documentacion registra pruebas de sistema para una entrega academica de Base de Datos Distribuidas. Las pruebas cubren:

- Git y limpieza del workspace.
- Elasticsearch local en `http://localhost:9200`.
- Cluster con 3 nodos Elasticsearch y Kibana.
- Backend en `http://localhost:3000/api`.
- Frontend Vite en `http://localhost:5173`.
- Autenticacion JWT.
- Seguridad por roles y acceso por sucursal.
- Productos.
- Inventario.
- Ventas.
- Registro de venta con afectacion de inventario y movimientos.
- Reportes de ventas.
- Validaciones de negocio incorporadas despues de la Fase 15.

## Cambios de logica documentados

Despues de la validacion inicial de Fase 15 se realizaron ajustes de logica de negocio y frontend. El sistema actual incluye:

- Validacion de producto existente antes de registrar venta.
- Validacion de producto activo.
- Validacion de existencia de inventario del producto en la sucursal.
- Validacion de stock suficiente.
- Validacion de cantidad entera positiva.
- Validacion de metodos de pago permitidos:
  - `efectivo`
  - `tarjeta`
  - `transferencia`
  - `vales`
- Descuento de inventario mediante `update script` atomico de Elasticsearch para evitar stock negativo.
- Registro de movimiento de inventario por producto vendido.
- `/api/auth/me` devuelve el nombre correcto del usuario autenticado.
- `stock` y `stock_minimo` se validan como enteros no negativos.
- Nueva venta en frontend usa inventario vendible de la sucursal seleccionada.
- Dashboard evita etiquetas de totales falsos o ambiguos.
- Frontend permite `VITE_API_BASE_URL` y mantiene fallback local a `http://localhost:3000/api`.

## Limitacion tecnica conocida

Elasticsearch no ofrece transacciones ACID multi-documento. Por eso, el sistema protege el inventario con control atomico por documento usando `update script`. Si una escritura posterior al descuento falla, el backend devuelve un error controlado. Para el alcance academico, esta solucion es suficiente y defendible porque evita sobreventa y stock negativo en el documento de inventario.

## Resultados de pruebas

Los valores puntuales de stock y conteos son resultados observados durante ejecuciones de prueba. No deben interpretarse como estado permanente de la base, porque registrar ventas modifica inventario, ventas y movimientos.

| Prueba | Resultado esperado | Resultado observado | Estado |
| --- | --- | --- | --- |
| `git status --short` | Identificar cambios pendientes | Ejecutado antes/despues de documentacion | Aprobado |
| `git clean -nd` | Solo reporte, sin borrar archivos | Reporte no destructivo | Aprobado |
| `GET http://localhost:9200` | Cluster disponible | Elasticsearch responde | Aprobado |
| `GET /_cluster/health?pretty` | Cluster saludable | 3 nodos, estado `green` en validacion reciente | Aprobado |
| `GET /_cat/nodes?v` | 3 nodos | `es01`, `es02`, `es03` | Aprobado |
| Indices globales | Existen `sucursales`, `usuarios`, `productos`, `clientes` | Existentes | Aprobado |
| Indices por sucursal | Existen ventas, inventario y movimientos de `01` a `10` | Existentes | Aprobado |
| `npm.cmd run build` en backend | Compilacion correcta | `tsc` finalizo con codigo 0 | Aprobado |
| `npm.cmd run build` en frontend | Build correcto | `tsc --noEmit && vite build` finalizo con codigo 0 | Aprobado |
| `GET /api/health` | 200 | 200 | Aprobado |
| `GET /api/elastic/health` | 200 | 200 | Aprobado |
| Login `admin / 123456` | 200 con token | 200 | Aprobado |
| Login `gerente01 / 123456` | 200 con token | 200 | Aprobado |
| Login `cajero001 / 123456` | 200 con token | 200 | Aprobado |
| `GET /api/auth/me` con token admin | 200 y nombre no vacio | 200, nombre correcto | Aprobado |
| `GET /api/auth/me` sin token | 401 | 401 | Aprobado |
| `GET /api/security/admin` con admin | 200 | 200 | Aprobado |
| `GET /api/security/admin` con gerente | 403 | 403 | Aprobado |
| `GET /api/productos?limit=3` con admin | 200 con productos reales | 200 | Aprobado |
| `GET /api/inventario/SUC-01/PROD-002` con admin | 200 con inventario real | 200 | Aprobado |
| `GET /api/inventario/SUC-02?limit=1` con gerente01 | 403 | 403 | Aprobado |
| `PUT /api/inventario/SUC-01/PROD-002` con cajero | 403 | 403 | Aprobado |
| `PUT /api/inventario/SUC-01/PROD-002` con stock decimal | 400 | 400 | Aprobado |
| `GET /api/ventas/SUC-01?limit=3` con admin | 200 | 200 | Aprobado |
| Registrar venta valida con `PROD-002`, cantidad `1`, pago `efectivo` | 201 | 201 | Aprobado |
| Stock despues de venta valida | Baja en 1 | Baja en 1 en ejecucion observada | Aprobado |
| Registrar venta con metodo de pago `bitcoin` | 400 | 400 | Aprobado |
| Registrar venta con cantidad decimal `1.5` | 400 | 400 | Aprobado |
| Registrar venta sin producto en inventario | Error controlado | Validado por logica backend | Aprobado |
| Registrar venta con producto inactivo | Error controlado | Validado por logica backend | Aprobado |
| `GET /api/reportes/ventas/sucursales` con admin | 200 | 200 | Aprobado |
| `GET /api/reportes/ventas/comparativo` con admin | 200 | 200 | Aprobado |
| `GET /api/reportes/ventas/sucursal/SUC-01/resumen` con admin | 200 | 200 | Aprobado |
| `GET /api/reportes/ventas/sucursal/SUC-01/productos-mas-vendidos` con admin | 200 | 200 | Aprobado |
| `GET /api/reportes/ventas/sucursal/SUC-01/metodos-pago` con admin | 200 | 200 | Aprobado |
| `GET /api/reportes/ventas/sucursal/SUC-01/cajeros` con admin | 200 | 200 | Aprobado |
| `GET /api/reportes/ventas/sucursal/SUC-01/resumen` con gerente01 | 200 | 200 | Aprobado |
| `GET /api/reportes/ventas/sucursal/SUC-02/resumen` con gerente01 | 403 | 403 | Aprobado |
| `GET /api/reportes/ventas/sucursales` con gerente01 | 403 | 403 | Aprobado |
| `GET /api/reportes/ventas/sucursal/SUC-01/resumen` con cajero001 | 403 | 403 | Aprobado |
| Frontend dev en `http://localhost:5173` | Responde 200 | 200 | Aprobado |

## Datos masivos observados

Los scripts de carga generan datos suficientes para cubrir la rubrica:

- 10 sucursales.
- 200 usuarios.
- Al menos 200 productos.
- 200 clientes.
- Inventario por sucursal.
- Ventas por sucursal.
- Movimientos de inventario por sucursal.

La base puede reconstruirse con:

```bash
cd backend
npm.cmd run elastic:create-indices
npm.cmd run elastic:seed
```

## Seguridad validada

- Login con JWT operativo.
- `/api/auth/me` requiere token y devuelve usuario autenticado con nombre.
- Rutas protegidas usan middleware de autenticacion.
- Rutas por sucursal usan validacion de acceso por sucursal.
- Admin puede consultar globalmente.
- Gerente queda restringido a su sucursal.
- Cajero puede operar ventas de su sucursal, pero no actualizar inventario ni consultar reportes administrativos.
- Acceso sin token devuelve 401.
- Acceso a sucursal no autorizada devuelve 403.

## Observaciones

- Las pruebas de venta modifican datos reales: agregan ventas, descuentan inventario y crean movimientos. Por eso los stocks y conteos cambian entre ejecuciones.
- No se deben borrar indices ni regenerar datos durante una revision, salvo que se quiera reconstruir la base desde cero para una demo limpia.
- `backend/.env`, `node_modules`, `dist`, logs y datos internos de Elasticsearch no deben subirse al repositorio.
- La validacion visual completa en navegador puede hacerse manualmente durante la presentacion entrando al frontend y navegando por Login, Dashboard, Productos, Inventario, Nueva venta, Ventas y Reportes.

## Conclusion

El sistema compila y los flujos principales de autenticacion, seguridad por rol/sucursal, productos, inventario, ventas, movimientos y reportes funcionan para una entrega academica. La logica de venta fue endurecida para evitar sobreventa y stock negativo mediante actualizacion atomica por documento en Elasticsearch. La principal limitacion tecnica documentada es la ausencia de transacciones ACID multi-documento en Elasticsearch, mitigada para este proyecto con control atomico sobre inventario y errores controlados.
