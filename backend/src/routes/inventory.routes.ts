import { Router } from 'express';
import {
  getInventoryBySucursal,
  getInventoryItemByProduct,
  updateInventoryItemController
} from '../controllers/inventory.controller.js';
import { authenticateToken, requireRoles, requireSucursalAccess } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * Rutas REST para inventario fragmentado por sucursal.
 */
router.get(
  '/inventario/:sucursalId',
  authenticateToken,
  requireRoles('admin', 'gerente', 'cajero'),
  requireSucursalAccess,
  getInventoryBySucursal
);

router.get(
  '/inventario/:sucursalId/:productoId',
  authenticateToken,
  requireRoles('admin', 'gerente', 'cajero'),
  requireSucursalAccess,
  getInventoryItemByProduct
);

router.put(
  '/inventario/:sucursalId/:productoId',
  authenticateToken,
  requireRoles('admin', 'gerente'),
  requireSucursalAccess,
  updateInventoryItemController
);

export default router;
