# Oxxito

Oxxito es un sistema academico de ventas para una cadena de tiendas de conveniencia tipo Oxxo. El proyecto fue desarrollado para Base de Datos Distribuidas y demuestra una aplicacion web con frontend, backend, autenticacion, reglas por rol/sucursal y datos distribuidos en Elasticsearch.

## Tecnologias

- Frontend: React + Vite + TypeScript.
- Backend: Node.js + Express + TypeScript.
- Base de datos distribuida: Elasticsearch.
- Visualizacion tecnica: Kibana.
- Infraestructura local: Docker Compose.
- Autenticacion: JWT.

## Arquitectura General

El frontend consume una API REST del backend. El backend valida usuarios, roles, sucursales y reglas de negocio antes de consultar o modificar Elasticsearch.

El cluster local de Elasticsearch se levanta con 3 nodos (`es01`, `es02`, `es03`) y Kibana. Los indices se dividen en:

- Indices globales:
  - `sucursales`
  - `usuarios`
  - `productos`
  - `clientes`
- Indices fragmentados por sucursal:
  - `ventas_sucursal_01` a `ventas_sucursal_10`
  - `inventario_sucursal_01` a `inventario_sucursal_10`
  - `movimientos_inventario_sucursal_01` a `movimientos_inventario_sucursal_10`

La fragmentacion por sucursal permite defender el diseno como base de datos distribuida para la rubrica. Elasticsearch distribuye shards y replicas entre los 3 nodos definidos en Docker Compose.

## Reglas de Negocio Relevantes

- Un producto pertenece al catalogo global, pero el stock existe por sucursal.
- Una venta solo puede registrar productos que:
  - existen en el catalogo global;
  - estan activos;
  - existen en el inventario de la sucursal;
  - tienen stock suficiente.
- Las cantidades de venta deben ser enteras positivas.
- Los metodos de pago permitidos son:
  - `efectivo`
  - `tarjeta`
  - `transferencia`
  - `vales`
- El descuento de inventario se realiza con un `update script` atomico de Elasticsearch para evitar stock negativo.
- Cada venta genera movimientos de inventario.
- `stock` y `stock_minimo` deben ser enteros no negativos.
- Elasticsearch no ofrece transacciones ACID multi-documento. Para este proyecto se usa control atomico por documento en inventario y manejo controlado de errores si falla una escritura posterior.

## Roles

- `admin`: puede consultar y operar globalmente.
- `gerente`: opera sobre su sucursal.
- `cajero`: registra ventas de su sucursal y consulta datos permitidos, pero no administra inventario ni reportes administrativos.

## Requisitos Previos

- Git.
- Node.js.
- Docker Desktop.

## Instalacion y Ejecucion

1. Clonar el repositorio.

```bash
git clone <url-del-repositorio>
cd Oxxito
```

2. Levantar Elasticsearch y Kibana.

```bash
cd elastic
docker compose up -d
```

3. Instalar dependencias del backend.

```bash
cd ../backend
npm.cmd install
```

4. Copiar variables de entorno del backend.

```bash
copy .env.example .env
```

5. Crear indices de Elasticsearch.

```bash
npm.cmd run elastic:create-indices
```

6. Cargar datos masivos.

```bash
npm.cmd run elastic:seed
```

7. Ejecutar backend.

```bash
npm.cmd run dev
```

8. Instalar dependencias del frontend.

```bash
cd ../frontend
npm.cmd install
```

9. Ejecutar frontend.

```bash
npm.cmd run dev
```

## Usuarios Demo

- Admin: `admin / 123456`
- Gerente: `gerente01 / 123456`
- Cajero: `cajero001 / 123456`

## URLs Locales

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000/api`
- Elasticsearch: `http://localhost:9200`
- Kibana: `http://localhost:5601`

El frontend usa `VITE_API_BASE_URL` si existe. Si no se define, usa como fallback `http://localhost:3000/api`.

## Comandos de Verificacion

Backend:

```bash
cd backend
npm.cmd run build
```

Frontend:

```bash
cd frontend
npm.cmd run build
```

Estado de Elasticsearch:

```bash
curl http://localhost:9200/_cluster/health?pretty
```

## Archivos No Versionados

No se suben al repositorio:

- `node_modules/`
- `dist/`
- `backend/.env`
- archivos `.env` locales
- datos internos de Elasticsearch
- logs

La base de datos puede reconstruirse con:

```bash
cd backend
npm.cmd run elastic:create-indices
npm.cmd run elastic:seed
```

## Modulos del Sistema

- Login real con JWT.
- Productos.
- Inventario por sucursal.
- Registro de ventas.
- Consulta de ventas.
- Reportes de ventas.
- Frontend conectado al backend.
- Restriccion de acceso por rol y sucursal.

## Notas para Presentacion

Para una demostracion academica, el flujo recomendado es:

1. Levantar el cluster y mostrar 3 nodos en Elasticsearch/Kibana.
2. Iniciar backend y frontend.
3. Entrar con `admin`.
4. Mostrar productos, inventario y reportes.
5. Entrar con `gerente01` y demostrar restriccion por sucursal.
6. Entrar con `cajero001` y registrar una venta.
7. Verificar que el stock baja y que las ventas/reportes se actualizan.
