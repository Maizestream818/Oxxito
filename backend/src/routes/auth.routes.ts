import { Router } from 'express';
import { getCurrentUser, postLogin } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * Ruta publica para autenticacion basica con JWT.
 */
router.post('/auth/login', postLogin);
router.get('/auth/me', authenticateToken, getCurrentUser);

export default router;
