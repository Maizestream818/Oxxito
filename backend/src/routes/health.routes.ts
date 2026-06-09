import { Router } from 'express';
import { getHealthStatus } from '../controllers/health.controller.js';

const router = Router();

/**
 * Ruta de verificación del backend.
 * Permite confirmar que el servidor está activo.
 */
router.get('/health', getHealthStatus);

export default router;
