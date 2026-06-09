import { Router } from 'express';
import { createSaleController } from '../controllers/sale.controller.js';
import { authenticateToken, requireRoles, requireSucursalAccess } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * Ruta para registrar ventas por sucursal con validacion de stock.
 */
router.post(
  '/ventas/:sucursalId',
  authenticateToken,
  requireRoles('admin', 'gerente', 'cajero'),
  requireSucursalAccess,
  createSaleController
);

export default router;
