import { Router } from 'express';
import { postLogin } from '../controllers/auth.controller.js';

const router = Router();

/**
 * Ruta publica para autenticacion basica con JWT.
 */
router.post('/auth/login', postLogin);

export default router;
