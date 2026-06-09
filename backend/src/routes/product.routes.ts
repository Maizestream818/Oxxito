import { Router } from 'express';
import {
  createProductController,
  deactivateProductController,
  getProductByIdController,
  getProducts,
  updateProductController
} from '../controllers/product.controller.js';
import { authenticateToken, requireRoles } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * Rutas REST para consultar y administrar el indice global de productos.
 */
router.get('/productos', authenticateToken, requireRoles('admin', 'gerente', 'cajero'), getProducts);
router.get('/productos/:productoId', authenticateToken, requireRoles('admin', 'gerente', 'cajero'), getProductByIdController);
router.post('/productos', authenticateToken, requireRoles('admin'), createProductController);
router.put('/productos/:productoId', authenticateToken, requireRoles('admin'), updateProductController);
router.delete('/productos/:productoId', authenticateToken, requireRoles('admin'), deactivateProductController);

export default router;
