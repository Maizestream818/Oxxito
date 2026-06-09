import { Router } from 'express';
import {
  getAdminSecurityTest,
  getCajeroSecurityTest,
  getGerenteSecurityTest,
  getSucursalSecurityTest
} from '../controllers/security.controller.js';
import { authenticateToken, requireRoles, requireSucursalAccess } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * Rutas tecnicas para validar las reglas de seguridad JWT, rol y sucursal.
 */
router.get('/security/admin', authenticateToken, requireRoles('admin'), getAdminSecurityTest);
router.get('/security/gerente', authenticateToken, requireRoles('admin', 'gerente'), getGerenteSecurityTest);
router.get('/security/cajero', authenticateToken, requireRoles('admin', 'gerente', 'cajero'), getCajeroSecurityTest);
router.get('/security/sucursal/:sucursalId', authenticateToken, requireSucursalAccess, getSucursalSecurityTest);

export default router;
