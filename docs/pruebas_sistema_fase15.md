# Oxxito - Pruebas del sistema Fase 15

## Objetivo

Validar de forma integral el sistema Oxxito: backend, frontend, Elasticsearch, autenticacion, seguridad por roles, productos, inventario, ventas y reportes.

## Fecha de ejecucion

2026-06-09 12:50:08 -06:00

## Componentes probados

- Git y limpieza del workspace.
- Elasticsearch local en `http://localhost:9200`.
- Backend en `http://localhost:3000/api`.
- Frontend Vite en `http://localhost:5173`.
- Autenticacion JWT.
- Seguridad por roles y acceso por sucursal.
- Productos.
- Inventario.
- Ventas.
- Registro de venta con afectacion de inventario y movimientos.
- Reportes de ventas.

## Resultados de pruebas

| Prueba | Resultado esperado | Resultado obtenido | Estado |
| --- | --- | --- | --- |
| `git status --short` inicial | Sin archivos pendientes no esperados | Sin salida | Aprobado |
| `git clean -nd` inicial | Sin archivos no rastreados no esperados | Sin salida | Aprobado |
| `GET http://localhost:9200` | Cluster disponible | Cluster `oxxito-cluster`, Elasticsearch `8.15.3` | Aprobado |
| `GET /_cluster/health?pretty` | Cluster saludable | `green` | Aprobado |
| `GET /_cat/nodes?v` | 3 nodos | 3 nodos (`es01`, `es02`, `es03`) | Aprobado |
| `GET /_cat/indices?v` | Indices principales existentes | 34 indices requeridos encontrados; sin faltantes | Aprobado |
| `npm.cmd run build` en backend | Compilacion correcta | `tsc` finalizo con codigo 0 | Aprobado |
| Backend dev activo | API disponible en puerto 3000 | `/api/health` respondio 200 | Aprobado |
| `GET /api/health` | 200 | 200 | Aprobado |
| `GET /api/elastic/health` | 200 | 200 | Aprobado |
| Login `admin / 123456` | 200 con token | 200 | Aprobado |
| Login `gerente01 / 123456` | 200 con token | 200 | Aprobado |
| Login `cajero001 / 123456` | 200 con token | 200 | Aprobado |
| `GET /api/auth/me` con token admin | 200 | 200 | Aprobado |
| `GET /api/auth/me` sin token | 401 | 401 | Aprobado |
| `GET /api/security/admin` con admin | 200 | 200 | Aprobado |
| `GET /api/security/admin` con gerente01 | 403 | 403 | Aprobado |
| `GET /api/productos?limit=5` con admin | 200 con productos reales | 200, 5 productos | Aprobado |
| `GET /api/productos/PROD-001` con admin | 200 | 200 | Aprobado |
| `GET /api/productos?limit=5` con gerente01 | 200 | 200 | Aprobado |
| `GET /api/inventario/SUC-01?limit=5` con admin | 200 | 200, 5 registros | Aprobado |
| `GET /api/inventario/SUC-01/PROD-002` con admin | 200 | 200, stock inicial 500 antes de la prueba de venta | Aprobado |
| `GET /api/inventario/SUC-01?limit=5` con gerente01 | 200 | 200 | Aprobado |
| `GET /api/inventario/SUC-02?limit=5` con gerente01 | 403 | 403 | Aprobado |
| `GET /api/inventario/SUC-01?limit=5` con cajero001 | 200 | 200 | Aprobado |
| `PUT /api/inventario/SUC-01/PROD-002` con cajero001 | 403 | 403 | Aprobado |
| `GET /api/ventas/SUC-01?limit=5` con admin | 200 | 200, 5 ventas | Aprobado |
| `GET /api/ventas/SUC-01?limit=5` con gerente01 | 200 | 200 | Aprobado |
| `GET /api/ventas/SUC-02?limit=5` con gerente01 | 403 | 403 | Aprobado |
| `GET /api/ventas/SUC-01?limit=5` con cajero001 | 200 | 200 | Aprobado |
| `GET /api/ventas/SUC-01/VENTA-SUC-01-1781028812816` con admin | 200 | 200 | Aprobado |
| `GET /api/ventas/SUC-01/VENTA-INEXISTENTE` con admin | 404 | 404 | Aprobado |
| Registrar venta `PROD-002` cantidad 1 con cajero001 | 201 | 201, venta `VENTA-SUC-01-1781030775132` | Aprobado |
| Stock `SUC-01/PROD-002` despues de venta | Baja en 1 | 500 -> 499 | Aprobado |
| Contador `ventas_sucursal_01` | Aumenta en 1 | 205 -> 206 | Aprobado |
| Contador `movimientos_inventario_sucursal_01` | Aumenta en 1 | 505 -> 506 | Aprobado |
| `GET /api/reportes/ventas/sucursales` con admin | 200 | 200, 10 sucursales | Aprobado |
| `GET /api/reportes/ventas/comparativo` con admin | 200 | 200, 10 sucursales | Aprobado |
| `GET /api/reportes/ventas/sucursal/SUC-01/resumen` con admin | 200 | 200 | Aprobado |
| `GET /api/reportes/ventas/sucursal/SUC-01/productos-mas-vendidos` con admin | 200 | 200, 10 productos | Aprobado |
| `GET /api/reportes/ventas/sucursal/SUC-01/metodos-pago` con admin | 200 | 200, 4 metodos | Aprobado |
| `GET /api/reportes/ventas/sucursal/SUC-01/cajeros` con admin | 200 | 200, 19 cajeros | Aprobado |
| `GET /api/reportes/ventas/sucursal/SUC-01/resumen` con gerente01 | 200 | 200 | Aprobado |
| `GET /api/reportes/ventas/sucursal/SUC-02/resumen` con gerente01 | 403 | 403 | Aprobado |
| `GET /api/reportes/ventas/sucursales` con gerente01 | 403 | 403 | Aprobado |
| `GET /api/reportes/ventas/sucursal/SUC-01/resumen` con cajero001 | 403 | 403 | Aprobado |
| Filtro de fechas en resumen SUC-01 | 200 | 200 | Aprobado |
| `npm.cmd install` en frontend | Dependencias instaladas | `up to date` | Aprobado |
| `npm.cmd run build` en frontend | Build correcto | Paso correctamente fuera del sandbox; el primer intento fallo por restriccion local de acceso de esbuild/Vite | Aprobado |
| Frontend dev en `http://localhost:5173` | Vite responde 200 | 200, proceso iniciado en segundo plano | Aprobado |
| Validacion visual interactiva en navegador | Login y navegacion visual completa | No ejecutada; el runtime de navegador de la sesion no inicio correctamente | Pendiente |

## Observaciones

- No se hicieron correcciones de codigo durante esta fase.
- La unica prueba que modifico datos fue la venta solicitada para `SUC-01` y `PROD-002`; se verifico el descuento de stock y el incremento de contadores.
- No se borraron indices ni datos.
- No se regeneraron datos masivos.
- No se modificaron Docker, scripts de datos, `backend/.env` ni configuracion de backend.
- La validacion visual de navegador queda pendiente porque la automatizacion de navegador disponible no pudo iniciar en esta sesion. La disponibilidad del frontend se valido por build y respuesta HTTP 200.

## Conclusion

La validacion por comandos y peticiones HTTP resulto aprobada para Elasticsearch, backend, autenticacion, seguridad por roles, productos, inventario, ventas, registro de venta, reportes y frontend build/dev. Queda pendiente la verificacion visual interactiva del flujo completo en navegador.
