import { Request, Response } from 'express';

/**
 * Controladores tecnicos para validar autenticacion y autorizacion.
 */
export function getAdminSecurityTest(req: Request, res: Response): void {
  res.status(200).json({
    status: 'ok',
    message: 'Acceso admin autorizado',
    user: req.user
  });
}

export function getGerenteSecurityTest(req: Request, res: Response): void {
  res.status(200).json({
    status: 'ok',
    message: 'Acceso gerente autorizado',
    user: req.user
  });
}

export function getCajeroSecurityTest(req: Request, res: Response): void {
  res.status(200).json({
    status: 'ok',
    message: 'Acceso cajero autorizado',
    user: req.user
  });
}

export function getSucursalSecurityTest(req: Request, res: Response): void {
  res.status(200).json({
    status: 'ok',
    message: 'Acceso a sucursal autorizado',
    user: req.user
  });
}
