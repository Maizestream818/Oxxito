import { Router } from 'express';
import { getElasticHealth } from '../controllers/elastic.controller.js';

const router = Router();

/**
 * Ruta para verificar la conexión con Elasticsearch.
 */
router.get('/elastic/health', getElasticHealth);

export default router;
