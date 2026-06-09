import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';
import elasticRoutes from './routes/elastic.routes.js';
import authRoutes from './routes/auth.routes.js';

const app = express();

/**
 * Middleware para permitir solicitudes desde el frontend.
 */
app.use(cors());

/**
 * Middleware para recibir y procesar datos en formato JSON.
 */
app.use(express.json());

/**
 * Rutas principales de la API.
 */
app.use('/api', healthRoutes);
app.use('/api', elasticRoutes);
app.use('/api', authRoutes);

/**
 * Ruta base para confirmar que la API existe.
 */
app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'API de Oxxito funcionando'
  });
});

export default app;
