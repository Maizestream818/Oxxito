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

El cluster local de Elasticsearch se levanta con 3 nodos (`es01`, `es02`, `es03`) y Kibana. Los indices se dividen en dos grupos:

Indices globales:

- `sucursales`
- `usuarios`
- `productos`
- `clientes`

Indices fragmentados por sucursal:

- `ventas_sucursal_01` a `ventas_sucursal_10`
- `inventario_sucursal_01` a `inventario_sucursal_10`
- `movimientos_inventario_sucursal_01` a `movimientos_inventario_sucursal_10`

La fragmentacion por sucursal permite defender el diseno como base de datos distribuida para la rubrica. Elasticsearch distribuye shards y replicas entre los 3 nodos definidos en Docker Compose.

## Reglas de Negocio Relevantes

- Un producto pertenece al catalogo global, pero el stock existe por sucursal.

Para registrar una venta, cada producto debe cumplir estas reglas:

- El producto existe en el catalogo global.
- El producto esta activo.
- El producto existe en el inventario de la sucursal.
- El producto tiene stock suficiente.

Ademas:

- Las cantidades de venta deben ser enteras positivas.
- El descuento de inventario se realiza con un `update script` atomico de Elasticsearch para evitar stock negativo.
- Cada venta genera movimientos de inventario.
- `stock` y `stock_minimo` deben ser enteros no negativos.
- Elasticsearch no ofrece transacciones ACID multi-documento. Para este proyecto se usa control atomico por documento en inventario y manejo controlado de errores si falla una escritura posterior.

Metodos de pago permitidos:

- `efectivo`
- `tarjeta`
- `transferencia`
- `vales`

## Roles

- `admin`: puede consultar y operar globalmente.
- `gerente`: opera sobre su sucursal.
- `cajero`: registra ventas de su sucursal y consulta datos permitidos, pero no administra inventario ni reportes administrativos.

## Requisitos Previos

- Git.
- Node.js.
- Docker Desktop.

## Puertos Utilizados

| Servicio | Puerto | URL |
| --- | ---: | --- |
| Frontend | 5173 | [http://localhost:5173](http://localhost:5173/) |
| Backend API | 3000 | [http://localhost:3000/api](http://localhost:3000/api) |
| Elasticsearch | 9200 | [http://localhost:9200](http://localhost:9200/) |
| Kibana | 5601 | [http://localhost:5601](http://localhost:5601/) |

## Instalacion y Ejecucion

El sistema se ejecuta usando tres terminales separadas. Cuando el backend o el frontend se ejecutan con `npm.cmd run dev`, esa terminal queda ocupada mientras el servicio sigue activo.

Despues de clonar el repositorio, abre cada terminal en la carpeta raiz del proyecto `Oxxito`.

- Terminal 1: Elasticsearch y Kibana.
- Terminal 2: Backend.
- Terminal 3: Frontend.

1. Clonar el repositorio.

```bash
git clone https://github.com/Maizestream818/Oxxito.git
cd Oxxito
```

2. Terminal 1: levantar Elasticsearch y Kibana.

Antes de levantar Elasticsearch y Kibana, Docker Desktop debe estar abierto y ejecutandose.

```bash
cd elastic
docker compose up -d
```

3. Terminal 2: preparar y ejecutar el backend.

Instalar dependencias:

```bash
cd backend
npm.cmd install
```

Copiar variables de entorno del backend:

```bash
copy .env.example .env
```

Crear indices de Elasticsearch durante la primera instalacion para preparar la base de datos:

```bash
npm.cmd run elastic:create-indices
```

Cargar datos masivos durante la primera instalacion para preparar la base de datos:

```bash
npm.cmd run elastic:seed
```

Ejecutar backend:

```bash
npm.cmd run dev
```

4. Terminal 3: preparar y ejecutar el frontend.

Instalar dependencias:

```bash
cd frontend
npm.cmd install
```

Ejecutar frontend:

```bash
npm.cmd run dev
```

5. Abrir en el navegador:

[http://localhost:5173](http://localhost:5173/)

Kibana se incluye para inspeccionar el cluster e indices de Elasticsearch, pero la aplicacion web principal se usa desde [http://localhost:5173](http://localhost:5173/).

## Ejecucion Posterior

Si el proyecto ya fue instalado, los indices ya fueron creados y los datos ya fueron cargados, no es necesario ejecutar otra vez:

```bash
npm.cmd run elastic:create-indices
npm.cmd run elastic:seed
```

Para volver a encender el sistema:

1. Terminal 1: levantar Elasticsearch y Kibana.

```bash
cd elastic
docker compose up -d
```

2. Terminal 2: ejecutar backend.

```bash
cd backend
npm.cmd run dev
```

3. Terminal 3: ejecutar frontend.

```bash
cd frontend
npm.cmd run dev
```

4. Abrir la interfaz web:

[http://localhost:5173](http://localhost:5173/)

## Apagado Seguro

Para apagar backend y frontend, presionar `Ctrl + C` en sus terminales.

Para apagar Elasticsearch y Kibana sin borrar datos:

```bash
cd elastic
docker compose stop
```

No se recomienda usar `docker compose down -v` porque puede borrar volumenes/datos.

## Verificacion Rapida

Backend:

```bash
curl.exe http://localhost:3000/api/health
```

Elasticsearch:

```bash
curl.exe "http://localhost:9200/_cluster/health?pretty"
```

Frontend:

Abrir en el navegador:

[http://localhost:5173](http://localhost:5173/)

## Usuarios Demo

- Admin: `admin / 123456`
- Gerente: `gerente01 / 123456`
- Cajero: `cajero001 / 123456`

## Modulos del Sistema

- Login real con JWT.
- Productos.
- Inventario por sucursal.
- Registro de ventas.
- Consulta de ventas.
- Reportes de ventas.
- Frontend conectado al backend.
- Restriccion de acceso por rol y sucursal.
