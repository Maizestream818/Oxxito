import { Router } from 'express';
import {
  createSaleController,
  getSaleByIdController,
  getSalesBySucursalController
} from '../controllers/sale.controller.js';
import { authenticateToken, requireRoles, requireSucursalAccess } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * Rutas para consultar y registrar ventas por sucursal.
 */
router.get(
  '/ventas/:sucursalId',
  authenticateToken,
  requireRoles('admin', 'gerente', 'cajero'),
  requireSucursalAccess,
  getSalesBySucursalController
);

router.get(
  '/ventas/:sucursalId/:ventaId',
  authenticateToken,
  requireRoles('admin', 'gerente', 'cajero'),
  requireSucursalAccess,
  getSaleByIdController
);

router.post(
  '/ventas/:sucursalId',
  authenticateToken,
  requireRoles('admin', 'gerente', 'cajero'),
  requireSucursalAccess,
  createSaleController
);

export default router;
