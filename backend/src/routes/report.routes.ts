import { Router } from 'express';
import {
  getBranchSalesSummaryController,
  getCashiersByBranchController,
  getPaymentMethodsByBranchController,
  getSalesComparisonReportController,
  getSalesReportByBranchesController,
  getTopProductsByBranchController
} from '../controllers/report.controller.js';
import { authenticateToken, requireRoles, requireSucursalAccess } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * Rutas administrativas de reportes de ventas.
 */
router.get('/reportes/ventas/sucursales', authenticateToken, requireRoles('admin'), getSalesReportByBranchesController);
router.get('/reportes/ventas/comparativo', authenticateToken, requireRoles('admin'), getSalesComparisonReportController);

router.get(
  '/reportes/ventas/sucursal/:sucursalId/resumen',
  authenticateToken,
  requireRoles('admin', 'gerente'),
  requireSucursalAccess,
  getBranchSalesSummaryController
);

router.get(
  '/reportes/ventas/sucursal/:sucursalId/productos-mas-vendidos',
  authenticateToken,
  requireRoles('admin', 'gerente'),
  requireSucursalAccess,
  getTopProductsByBranchController
);

router.get(
  '/reportes/ventas/sucursal/:sucursalId/metodos-pago',
  authenticateToken,
  requireRoles('admin', 'gerente'),
  requireSucursalAccess,
  getPaymentMethodsByBranchController
);

router.get(
  '/reportes/ventas/sucursal/:sucursalId/cajeros',
  authenticateToken,
  requireRoles('admin', 'gerente'),
  requireSucursalAccess,
  getCashiersByBranchController
);

export default router;
